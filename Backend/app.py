from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import re

app = Flask(__name__)
CORS(app)

# โหลดข้อมูล
df = pd.read_excel("data.xlsx")

# ===============================
# Helper Functions
# ===============================

def format_place(row, show_cost=False, show_coral=False, show_activity=False):
    parts = [f"📍 {row['จังหวัด']} - {row['Beach']}"]
    if show_activity:
        parts.append(f"กิจกรรม: {row['Activiy']}")
    if show_cost and row['Avg_Cost_THB (1day)'] > 0:
        parts.append(f"ค่าใช้จ่าย: {row['Avg_Cost_THB (1day)']} บาท/วัน")
    if show_coral:
        parts.append(f"ปะการังมีชีวิต: {row['% ปะการังมีชีวิต']}%")
    return " | ".join(parts)

def answer_question(query):
    q = query.lower().strip()

    # -------------------------------------------------------
    # 1. จังหวัดนั้นมีที่ไหนบ้าง (ค้นหาจากชื่อจังหวัด)
    # -------------------------------------------------------
    province_pattern = re.search(
        r"(สุราษฎร์ธานี|สงขลา|ปัตตานี|นราธิวาส|ประจวบคีรีขันธ์|ชุมพร|ตราด|ระยอง|ชลบุรี|พังงา|ภูเก็ต|กระบี่|ตรัง|จันทบุรี)",
        query
    )
    if province_pattern and any(k in q for k in ["มีที่ไหน", "มีอะไร", "น่าเที่ยว", "ไปที่ไหน", "แนะนำ", "ต้องไป", "ที่แรก", "ดำน้ำ", "ราคา", "เท่าไหร่"]):
        province = province_pattern.group(1)
        results = df[df["จังหวัด"].str.strip() == province.strip()]
        if len(results) == 0:
            return f"❌ ไม่พบข้อมูลจังหวัด {province}"

        # ถ้าถามดำน้ำ + จังหวัด
        if any(k in q for k in ["ดำน้ำ"]):
            diving_kw = ["ดำน้ำ", "ดำ"]
            filtered = results[results["Activiy"].str.contains("|".join(diving_kw), na=False)]
            if len(filtered) == 0:
                filtered = results
            lines = [f"🤿 ดำน้ำใน{province}:"]
            for _, row in filtered.iterrows():
                cost_str = f" | {row['Avg_Cost_THB (1day)']} บาท/วัน" if row['Avg_Cost_THB (1day)'] > 0 else ""
                lines.append(f"  • {row['Beach']} ({row['Activiy']}){cost_str}")
            return "\n".join(lines)

        # ถ้าถามแนะนำที่แรก / ต้องไปที่ไหน
        if any(k in q for k in ["ที่แรก", "แนะนำ", "ต้องไป"]):
            best = results.loc[results["% ปะการังมีชีวิต"].idxmax()]
            return (
                f"🏆 แนะนำให้ไป {best['Beach']} ใน{province} เป็นที่แรก!\n"
                f"กิจกรรม: {best['Activiy']}\n"
                f"ปะการังมีชีวิต: {best['% ปะการังมีชีวิต']}%\n"
                f"ค่าใช้จ่าย: {best['Avg_Cost_THB (1day)']} บาท/วัน (ถ้ามี)"
            )

        # แสดงทั้งหมด
        top = results.nlargest(5, "% ปะการังมีชีวิต")
        lines = [f"🗺️ {province} มีสถานที่น่าเที่ยว {len(results)} แห่ง (แสดง Top 5):"]
        for _, row in top.iterrows():
            lines.append(f"  • {row['Beach']} — {row['Activiy']} (ปะการัง {row['% ปะการังมีชีวิต']}%)")
        return "\n".join(lines)

    # -------------------------------------------------------
    # 2. จังหวัดที่มีปะการังมากที่สุด / ดีที่สุด
    # -------------------------------------------------------
    if any(k in q for k in ["จังหวัดไหน", "จังหวัดที่"]) and any(k in q for k in ["ปะการัง", "ชมปะการัง", "ดีที่สุด"]):
        province_avg = df.groupby("จังหวัด")["% ปะการังมีชีวิต"].mean().sort_values(ascending=False)
        lines = ["🪸 จังหวัดที่มีปะการังสมบูรณ์ที่สุด (เฉลี่ย):"]
        for i, (prov, val) in enumerate(province_avg.head(5).items(), 1):
            lines.append(f"  {i}. {prov} — เฉลี่ย {val:.1f}%")
        return "\n".join(lines)

    # -------------------------------------------------------
    # 3. งบ X บาท แนะนำที่เที่ยว
    # -------------------------------------------------------
    budget_match = re.search(r"(\d[\d,]+)\s*(บาท|฿)?", q)
    if budget_match and any(k in q for k in ["งบ", "ราคา", "ไม่เกิน", "ประมาณ"]):
        budget = int(budget_match.group(1).replace(",", ""))
        affordable = df[(df["Avg_Cost_THB (1day)"] > 0) & (df["Avg_Cost_THB (1day)"] <= budget)]
        if len(affordable) == 0:
            return f"❌ ไม่พบสถานที่ที่มีค่าใช้จ่ายไม่เกิน {budget} บาท/วัน"
        top = affordable.nlargest(5, "% ปะการังมีชีวิต")
        lines = [f"💰 งบ {budget} บาท/วัน เที่ยวได้ที่นี่ (Top 5 ปะการังดีสุด):"]
        for _, row in top.iterrows():
            lines.append(f"  • {row['จังหวัด']} — {row['Beach']} ({row['Activiy']}) | {row['Avg_Cost_THB (1day)']} บาท")
        return "\n".join(lines)

    # -------------------------------------------------------
    # 4 & 5. ดำน้ำมีที่ไหนบ้าง / อยากดำน้ำ
    # -------------------------------------------------------
    if any(k in q for k in ["ดำน้ำ", "ดำน้ำลึก", "ดำน้ำตื้น", "ดำน้ำฟรีไดฟ์"]):
        if "ลึก" in q:
            keyword = "ดำน้ำลึก"
        elif "ตื้น" in q:
            keyword = "ดำน้ำตื้น"
        elif "ฟรีไดฟ์" in q:
            keyword = "ดำน้ำฟรีไดฟ์"
        else:
            keyword = "ดำน้ำ"

        # ถ้าถามกิจกรรมเฉพาะเพิ่ม (พายเรือ)
        if "พายเรือ" in q:
            filtered = df[df["Activiy"].str.contains("พายเรือ", na=False)]
            label = "🚣 พายเรือ"
        else:
            filtered = df[df["Activiy"].str.contains(keyword, na=False)]
            label = f"🤿 {keyword}"

        if len(filtered) == 0:
            return "❌ ไม่พบสถานที่ที่ตรงกับกิจกรรมนี้"
        top = filtered.nlargest(6, "% ปะการังมีชีวิต")
        lines = [f"{label} — แนะนำสถานที่:"]
        for _, row in top.iterrows():
            cost_str = f" | {row['Avg_Cost_THB (1day)']} บาท/วัน" if row['Avg_Cost_THB (1day)'] > 0 else ""
            lines.append(f"  • {row['จังหวัด']} - {row['Beach']} ({row['Activiy']}){cost_str}")
        return "\n".join(lines)

    # -------------------------------------------------------
    # 6. กรุงเทพ / ใกล้กรุงเทพ
    # -------------------------------------------------------
    if "กรุงเทพ" in q:
        near_bkk = df[df["จังหวัด"].isin(["ชลบุรี", "ระยอง", "จันทบุรี", "ตราด"])]
        top = near_bkk.nlargest(5, "% ปะการังมีชีวิต")
        lines = ["🏙️ ทะเลใกล้กรุงเทพ (ชลบุรี ระยอง จันทบุรี ตราด):"]
        for _, row in top.iterrows():
            lines.append(f"  • {row['จังหวัด']} - {row['Beach']} | {row['Activiy']} (ปะการัง {row['% ปะการังมีชีวิต']}%)")
        return "\n".join(lines)

    # -------------------------------------------------------
    # 7. ภูเก็ตกิจกรรมอะไรบ้าง
    # -------------------------------------------------------
    if "ภูเก็ต" in q and any(k in q for k in ["กิจกรรม", "ทำอะไร", "มีอะไร"]):
        phuket = df[df["จังหวัด"] == "ภูเก็ต"]
        activities = phuket["Activiy"].unique()
        lines = ["🌊 กิจกรรมในทะเลภูเก็ต:"]
        for act in activities:
            lines.append(f"  • {act}")
        return "\n".join(lines)

    # -------------------------------------------------------
    # 8. ดูปะการังชนิดนี้ไปที่ไหน (ค้นหาชนิดปะการัง)
    # -------------------------------------------------------
    coral_kw = ["ปะการังโขด", "ปะการังเขากวาง", "ปะการังดาว", "ปะการังสมอง", "ปะการังวงแหวน",
                "ปะการังเห็ด", "ปะการังช่องเล็ก", "ปะการังช่องเหลี่ยม", "ปะการังลายดอกไม้",
                "ปะการังกาแล็กซี่", "ปะการังรังผึ้ง", "ปะการังจาน", "ปะการังดอกกะหล่ำ",
                "ปะการังดอกไม้ทะเล", "ปะการังสีน้ำเงิน"]
    matched_coral = [c for c in coral_kw if c in query]
    if matched_coral or (any(k in q for k in ["ปะการัง", "ชนิดปะการัง"]) and "ดู" in q):
        if matched_coral:
            coral_name = matched_coral[0]
            results = df[df["ชนิดเด่น (ปะการัง)"].str.contains(coral_name, na=False)]
            if len(results) == 0:
                return f"❌ ไม่พบข้อมูลปะการังชนิด '{coral_name}'"
            lines = [f"🪸 สถานที่ดู{coral_name}:"]
            for _, row in results.head(5).iterrows():
                lines.append(f"  • {row['จังหวัด']} - {row['Beach']}")
            return "\n".join(lines)
        else:
            return "🪸 กรุณาระบุชนิดปะการังที่ต้องการ เช่น ปะการังโขด ปะการังเขากวาง ปะการังดาว ฯลฯ"

    # -------------------------------------------------------
    # 9. ดูปลาชนิดนี้ ไปที่ไหนดี
    # -------------------------------------------------------
    fish_kw = ["ปลาสลิดหิน", "ปลากล้วย", "ปลานกขุนทอง", "ปลากะรัง", "ปลากะพง", "ปลาบู่", "ปลากะตัก"]
    matched_fish = [f for f in fish_kw if f in query]
    if matched_fish or (any(k in q for k in ["ปลา"]) and any(k in q for k in ["ดู", "หา", "เจอ"])):
        if matched_fish:
            fish_name = matched_fish[0]
            results = df[df["ชนิดเด่น (ปลา)"].str.contains(fish_name, na=False)]
            if len(results) == 0:
                return f"❌ ไม่พบข้อมูลปลา '{fish_name}'"
            lines = [f"🐟 สถานที่ดู{fish_name}:"]
            for _, row in results.head(5).iterrows():
                lines.append(f"  • {row['จังหวัด']} - {row['Beach']}")
            return "\n".join(lines)
        else:
            return "🐟 กรุณาระบุชนิดปลาที่ต้องการ เช่น ปลาสลิดหิน ปลากล้วย ปลานกขุนทอง ฯลฯ"

    # -------------------------------------------------------
    # 10. ชมปะการังโดยไม่ต้องลงน้ำ (เรือท้องกระจก / ชมวิวบนบก)
    # -------------------------------------------------------
    if any(k in q for k in ["ไม่ต้องลงน้ำ", "ไม่ลงน้ำ", "เรือท้องกระจก", "บนบก"]):
        keywords = ["เรือท้องกระจก", "ชมวิว", "เดินเล่น", "เดินศึกษา"]
        filtered = df[df["Activiy"].str.contains("|".join(keywords), na=False)]
        lines = ["🚢 ชมปะการังแบบไม่ต้องลงน้ำ:"]
        for _, row in filtered.iterrows():
            lines.append(f"  • {row['จังหวัด']} - {row['Beach']} ({row['Activiy']})")
        return "\n".join(lines) if len(filtered) > 0 else "❌ ไม่พบข้อมูล"

    # -------------------------------------------------------
    # 11. พายเรือมีที่ไหนบ้าง
    # -------------------------------------------------------
    if any(k in q for k in ["พายเรือ", "พายคายัค", "คายัค", "ซัพบอร์ด"]):
        if "ซัพบอร์ด" in q:
            keyword = "ซัพบอร์ด"
        elif "คายัค" in q or "พายเรือ" in q:
            keyword = "พาย"
        else:
            keyword = "พาย"
        filtered = df[df["Activiy"].str.contains(keyword, na=False)]
        lines = ["🚣 สถานที่พายเรือ / คายัค:"]
        for _, row in filtered.iterrows():
            cost_str = f" | {row['Avg_Cost_THB (1day)']} บาท/วัน" if row['Avg_Cost_THB (1day)'] > 0 else ""
            lines.append(f"  • {row['จังหวัด']} - {row['Beach']} ({row['Activiy']}){cost_str}")
        return "\n".join(lines) if len(filtered) > 0 else "❌ ไม่พบข้อมูล"

    # -------------------------------------------------------
    # 12. จังหวัดที่มีปะการังเยอะสุด
    # -------------------------------------------------------
    if any(k in q for k in ["จังหวัดที่", "จังหวัดไหน"]) and any(k in q for k in ["เยอะสุด", "มากสุด", "เยอะที่สุด", "มากที่สุด", "สมบูรณ์สุด"]):
        province_avg = df.groupby("จังหวัด")["% ปะการังมีชีวิต"].mean().sort_values(ascending=False)
        best_prov = province_avg.index[0]
        best_val = province_avg.iloc[0]
        sub = df[df["จังหวัด"] == best_prov].nlargest(3, "% ปะการังมีชีวิต")
        lines = [f"🏆 จังหวัดที่มีปะการังสมบูรณ์ที่สุดคือ {best_prov} (เฉลี่ย {best_val:.1f}%)"]
        lines.append("สถานที่แนะนำ:")
        for _, row in sub.iterrows():
            lines.append(f"  • {row['Beach']} — ปะการัง {row['% ปะการังมีชีวิต']}%")
        return "\n".join(lines)

    # -------------------------------------------------------
    # ราคาถูกสุด
    # -------------------------------------------------------
    if any(k in q for k in ["ถูก", "ประหยัด", "ถูกสุด"]):
        df_clean = df[df["Avg_Cost_THB (1day)"] > 0]
        cheapest = df_clean.loc[df_clean["Avg_Cost_THB (1day)"].idxmin()]
        return (
            f"💸 ที่เที่ยวราคาถูกที่สุด:\n"
            f"  📍 {cheapest['จังหวัด']} - {cheapest['Beach']}\n"
            f"  กิจกรรม: {cheapest['Activiy']}\n"
            f"  ค่าใช้จ่าย: {cheapest['Avg_Cost_THB (1day)']} บาท/วัน"
        )

    # -------------------------------------------------------
    # ปะการังดีที่สุด (ค้นหาเดี่ยว)
    # -------------------------------------------------------
    if any(k in q for k in ["ดีที่สุด", "สวยที่สุด", "สมบูรณ์ที่สุด"]):
        best = df.loc[df["% ปะการังมีชีวิต"].idxmax()]
        return (
            f"🥇 ปะการังสมบูรณ์ที่สุดคือ:\n"
            f"  📍 {best['จังหวัด']} - {best['Beach']}\n"
            f"  กิจกรรม: {best['Activiy']}\n"
            f"  ปะการังมีชีวิต: {best['% ปะการังมีชีวิต']}%"
        )

    # -------------------------------------------------------
    # เงียบ / สงบ
    # -------------------------------------------------------
    if any(k in q for k in ["เงียบ", "สงบ"]):
        quiet_df = df[df["% ปะการังมีชีวิต"] > 60]
        if len(quiet_df) == 0:
            quiet_df = df
        place = quiet_df.sample(1).iloc[0]
        return f"🌿 บรรยากาศเงียบสงบ แนะนำ: {place['จังหวัด']} - {place['Beach']} ({place['Activiy']})"

    # -------------------------------------------------------
    # Fallback: ค้นหาจากคีย์เวิร์ดในกิจกรรม / ปะการัง
    # -------------------------------------------------------
    keywords_in_activity = [k for k in ["ตกปลา", "เจ็ตสกี", "เซิร์ฟ", "ปลูกปะการัง", "ทัวร์เรือ", "ล่องเรือ", "ดูสัตว์ทะเล", "ถ่ายภาพ"] if k in q]
    if keywords_in_activity:
        keyword = keywords_in_activity[0]
        filtered = df[df["Activiy"].str.contains(keyword, na=False)]
        if len(filtered) > 0:
            lines = [f"🌊 กิจกรรม '{keyword}' มีที่:"]
            for _, row in filtered.head(6).iterrows():
                cost_str = f" | {row['Avg_Cost_THB (1day)']} บาท/วัน" if row['Avg_Cost_THB (1day)'] > 0 else ""
                lines.append(f"  • {row['จังหวัด']} - {row['Beach']}{cost_str}")
            return "\n".join(lines)

    # -------------------------------------------------------
    # Default fallback: แสดง Top 5 ทั้งประเทศ
    # -------------------------------------------------------
    top5 = df.nlargest(5, "% ปะการังมีชีวิต")
    lines = ["🌏 ทะเลไทยน่าเที่ยว — Top 5 ปะการังสมบูรณ์:"]
    for _, row in top5.iterrows():
        lines.append(f"  • {row['จังหวัด']} - {row['Beach']} ({row['% ปะการังมีชีวิต']}%) | {row['Activiy']}")
    return "\n".join(lines)


@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    query = data.get("question", "")
    if not query:
        return jsonify({"answer": "❌ กรุณาใส่คำถาม"})
    answer = answer_question(query)
    return jsonify({"answer": answer})


if __name__ == "__main__":
    app.run(debug=True)