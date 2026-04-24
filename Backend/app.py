from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import re
import os
import warnings
warnings.filterwarnings("ignore")

from google import genai

app = Flask(__name__)
CORS(app)

# =============================
# Config
# =============================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyB5RYxtK-Prr-UXraz9eJ-7uyT8kN_v0FY")

SYSTEM_PROMPT = """คุณคือผู้เชี่ยวชาญการท่องเที่ยวทะเลไทย ตอบจากข้อมูลที่ให้เท่านั้น
- ตอบภาษาไทย สั้น กระชับ
- แนะนำไม่เกิน 3 สถานที่ พร้อมเหตุผลสั้นๆ
- ไม่ใช้ emoji และเครื่องหมายพิเศษ
- ไม่แสดงตัวเลขเปอร์เซ็นต์
- จัดเรียงเป็นข้อๆ อ่านง่าย"""

client = genai.Client(api_key=GEMINI_API_KEY)

# =============================
# โหลดข้อมูล
# =============================
df = pd.read_excel("data.xlsx")

PROVINCES = [
    "สุราษฎร์ธานี", "สงขลา", "ปัตตานี", "นราธิวาส",
    "ประจวบคีรีขันธ์", "ชุมพร", "ตราด", "ระยอง",
    "ชลบุรี", "พังงา", "ภูเก็ต", "กระบี่", "ตรัง", "จันทบุรี"
]

# =============================
# RAG Helpers
# =============================
def build_context(rows):
    lines = []
    for _, row in rows.iterrows():
        lines.append(
            f"จังหวัด: {row['จังหวัด']} | สถานที่: {row['Beach']} | "
            f"กิจกรรม: {row['Activiy']} | ราคา: {row['Avg_Cost_THB (1day)']} บาท/วัน | "
            f"สถานภาพปะการัง: {row['สถานภาพ']} | "
            f"ปะการังเด่น: {row['ชนิดเด่น (ปะการัง)']} | ปลาเด่น: {row['ชนิดเด่น (ปลา)']} | "
            f"ฤดูกาล: {row['Season']}"
        )
    return "\n".join(lines)

def ask_gemini(query, context):
    message = f"{SYSTEM_PROMPT}\n\nข้อมูล:\n{context}\n\nคำถาม: {query}"
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=message
        )
        return response.text.strip()
    except Exception as e:
        err = str(e)
        if "429" in err or "quota" in err.lower():
            return "ระบบ AI ถูกใช้งานหนักเกินไป กรุณารอสักครู่แล้วลองใหม่ครับ"
        return f"เกิดข้อผิดพลาด: {err}"

# =============================
# Hybrid Logic
# =============================
def answer_question(query):
    q = query.lower().strip()

    # 1. จังหวัด
    province_match = next((p for p in PROVINCES if p in query), None)
    if province_match:
        results = df[df["จังหวัด"].str.strip() == province_match]
        if len(results) == 0:
            return f"ไม่พบข้อมูลจังหวัด {province_match}"
        return ask_gemini(query, build_context(results))

    # 2. งบประมาณ
    budget_match = re.search(r"(\d[\d,]+)\s*(บาท|฿)?", q)
    if budget_match and any(k in q for k in ["งบ", "ราคา", "ไม่เกิน", "ประมาณ"]):
        budget = int(budget_match.group(1).replace(",", ""))
        results = df[(df["Avg_Cost_THB (1day)"] > 0) & (df["Avg_Cost_THB (1day)"] <= budget)]
        if len(results) == 0:
            return f"ไม่พบสถานที่ในงบ {budget:,} บาท/วัน"
        top = results.nlargest(8, "% ปะการังมีชีวิต")
        return ask_gemini(f"มีงบ {budget} บาท/วัน แนะนำที่เที่ยวทะเลที่ดีที่สุด", build_context(top))

    # 3. ดำน้ำ
    if any(k in q for k in ["ดำน้ำ", "สนอร์เกิล", "ฟรีไดฟ์"]):
        kw = "ดำน้ำลึก" if "ลึก" in q else "ดำน้ำตื้น" if "ตื้น" in q else "ดำน้ำ"
        results = df[df["Activiy"].str.contains(kw, na=False)]
        if len(results) == 0:
            results = df[df["Activiy"].str.contains("ดำน้ำ", na=False)]
        return ask_gemini(query, build_context(results))

    # 4. พายเรือ / คายัค / ซัพบอร์ด
    if any(k in q for k in ["พายเรือ", "คายัค", "ซัพบอร์ด"]):
        kw = "ซัพบอร์ด" if "ซัพบอร์ด" in q else "พาย"
        results = df[df["Activiy"].str.contains(kw, na=False)]
        return ask_gemini(query, build_context(results))

    # 5. ใกล้กรุงเทพ
    if "กรุงเทพ" in q:
        results = df[df["จังหวัด"].isin(["ชลบุรี", "ระยอง", "จันทบุรี", "ตราด"])]
        return ask_gemini(query, build_context(results))

    # 6. ชนิดปะการัง
    if "ปะการัง" in q and any(k in q for k in ["ดู", "หา", "เจอ", "ไปที่ไหน"]):
        words = [w for w in query.split() if len(w) > 2]
        results = df
        for w in words:
            filtered = df[df["ชนิดเด่น (ปะการัง)"].str.contains(w, na=False)]
            if len(filtered) > 0:
                results = filtered
                break
        if len(results) == len(df):
            results = df.nlargest(10, "% ปะการังมีชีวิต")
        return ask_gemini(query, build_context(results))

    # 7. ชนิดปลา
    if "ปลา" in q and any(k in q for k in ["ดู", "หา", "เจอ", "ไปที่ไหน"]):
        words = [w for w in query.split() if len(w) > 2]
        results = df
        for w in words:
            filtered = df[df["ชนิดเด่น (ปลา)"].str.contains(w, na=False)]
            if len(filtered) > 0:
                results = filtered
                break
        if len(results) == len(df):
            results = df.nlargest(10, "% ปะการังมีชีวิต")
        return ask_gemini(query, build_context(results))

    # 8. ไม่ต้องลงน้ำ
    if any(k in q for k in ["ไม่ต้องลงน้ำ", "ไม่ลงน้ำ", "เรือท้องกระจก"]):
        results = df[df["Activiy"].str.contains("เรือท้องกระจก|ชมวิว|เดินเล่น", na=False)]
        if len(results) == 0:
            results = df.nlargest(10, "% ปะการังมีชีวิต")
        return ask_gemini(query, build_context(results))

    # 9. ปะการังดีสุด / จังหวัดไหน
    if any(k in q for k in ["ดีที่สุด", "สมบูรณ์", "เยอะสุด", "มากสุด", "จังหวัดไหน"]):
        top = df.nlargest(15, "% ปะการังมีชีวิต")
        return ask_gemini(query, build_context(top))

    # 10. ราคาถูก
    if any(k in q for k in ["ถูก", "ประหยัด"]):
        results = df[df["Avg_Cost_THB (1day)"] > 0].nsmallest(15, "Avg_Cost_THB (1day)")
        return ask_gemini(query, build_context(results))

    # 11. RAG Fallback
    top20 = df.nlargest(20, "% ปะการังมีชีวิต")
    return ask_gemini(query, build_context(top20))


# =============================
# Routes
# =============================
@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    query = data.get("question", "").strip()
    if not query:
        return jsonify({"answer": "กรุณาใส่คำถาม"})
    answer = answer_question(query)
    return jsonify({"answer": answer})

@app.route("/reset", methods=["POST"])
def reset():
    return jsonify({"status": "cleared"})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "gemini-1.5-flash"})

if __name__ == "__main__":
    app.run(debug=True)