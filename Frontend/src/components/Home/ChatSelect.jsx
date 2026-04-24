import { useNavigate } from "react-router-dom";
import "./ChatSelect.css";

const topics = [
  { icon: "🏖️", label: "เที่ยวทะเล", desc: "แนะนำชายหาด เกาะ และกิจกรรมทางน้ำ", value: "เที่ยวทะเล" },
  { icon: "🏨", label: "ที่เที่ยว", desc: "เที่ยวในงบ 5,000 บาท มีที่ไหนบ้าง", value: "ที่เที่ยว" },
  { icon: "🐠", label: "ปะการัง", desc: "อยากดูปะการัง ไปที่ไหนถึงจะเจอ", value: "ปะการัง" },
  { icon: "🗺️", label: "วางแผนทริป", desc: "ถ้าจะไปพายเรือมีที่ไหนแนะนำบ้าง", value: "วางแผนทริป" },
  { icon: "🤿", label: "กิจกรรม", desc: "อยากดำน้ำ มีที่ไหนน่าสนใจ", value: "กิจกรรม" },
  { icon: "🐠", label: "ปลา", desc: "อยากดูปลาเยอะๆ ควรไปที่ไหนดี", value: "ปลา" },
];

function ChatSelect() {
  const navigate = useNavigate();
  const firstName = localStorage.getItem("firstName");

  const handleSelect = (desc) => {
    navigate("/chat", { state: { topic: desc } });
  };

  return (
    <div className="select-page">
      <div className="select-header">
        <div className="wave-icon">🌊</div>
        <h1>สวัสดี, {firstName || "นักท่องเที่ยว"}!</h1>
        <p>วันนี้อยากให้ช่วยเรื่องอะไร?</p>
      </div>

      <div className="topic-grid">
        {topics.map((t) => (
          <div
            key={t.value}
            className="topic-card"
            onClick={() => handleSelect(t.desc)}
          >
            <div className="topic-icon">{t.icon}</div>
            <div className="topic-label">{t.label}</div>
            <div className="topic-desc">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatSelect;