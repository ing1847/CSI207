from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

# RAG
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from transformers import pipeline
from langchain_community.llms import HuggingFacePipeline

app = Flask(__name__)
CORS(app)

# 📊 โหลดข้อมูล
df = pd.read_excel("data.xlsx")

# 🔎 เตรียม RAG
documents = []
for _, row in df.iterrows():
    text = f"""
    จังหวัด: {row['จังหวัด']}
    สถานที่: {row['Beach']}
    กิจกรรม: {row['Activiy']}
    ค่าใช้จ่าย: {row['Avg_Cost_THB (1day)']} บาท
    ปะการังมีชีวิต: {row['% ปะการังมีชีวิต']}%
    """
    documents.append(text)

embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = FAISS.from_texts(documents, embedding)

# 🤖 LLM
pipe = pipeline(
    "text-generation",
    model="google/flan-t5-small",
    max_new_tokens=100,
    temperature=0.3
)
llm = HuggingFacePipeline(pipeline=pipe)

# 🎯 Hybrid Logic
def answer_question(query):
    q = query.lower()

    # 💰 ราคาถูก
    if "ถูก" in q:
        df_clean = df[df["Avg_Cost_THB (1day)"] > 0]
        cheapest = df_clean.loc[df_clean["Avg_Cost_THB (1day)"].idxmin()]

        return f"📍 {cheapest['จังหวัด']} - {cheapest['Beach']} ({cheapest['Avg_Cost_THB (1day)']} บาท)"

    # 🪸 ดีที่สุด
    if "เหมาะ" in q or "ดีที่สุด" in q:
        best = df.loc[df["% ปะการังมีชีวิต"].idxmax()]

        return f"📍 {best['จังหวัด']} - {best['Beach']} (ปะการัง {best['% ปะการังมีชีวิต']}%)"

    # 📍 จังหวัดมีอะไรบ้าง
    if "จังหวัด" in q and "มีที่ไหน" in q:
        province = q.replace("จังหวัด", "").replace("มีที่ไหนบ้าง", "").strip()

        results = df[df["จังหวัด"].str.contains(province, na=False)]

        if len(results) == 0:
            return "ไม่พบข้อมูล"

        places = ", ".join(results["Beach"].tolist())

        return f"📍 จังหวัด {province}: {places}"

    # 🤖 RAG
    docs = db.similarity_search(query, k=3)
    context = "\n".join([d.page_content for d in docs])

    prompt = f"""
    {context}

    คำถาม: {query}
    ตอบสั้นๆ:
    """

    answer = llm.invoke(prompt)

    return answer.strip()


@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    query = data["question"]

    answer = answer_question(query)

    return jsonify({"answer": answer})


if __name__ == "__main__":
    app.run(debug=True)