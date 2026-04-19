import { useNavigate } from "react-router-dom";
import "./ChatSelect.css";

const topics = [
  { icon: "🏖️", label: "เที่ยวทะเล", desc: "แนะนำชายหาด เกาะ และกิจกรรมทางน้ำ", value: "เที่ยวทะเล" },
  { icon: "🏨", label: "ที่พัก", desc: "โรงแรม รีสอร์ท และที่พักสุดคุ้ม", value: "ที่พัก" },
  { icon: "🍜", label: "ร้านอาหาร", desc: "อาหารอร่อย ร้านเด็ด และของกิน", value: "ร้านอาหาร" },
  { icon: "🗺️", label: "วางแผนทริป", desc: "วางแผนเส้นทางและตารางเดินทาง", value: "วางแผนทริป" },
  { icon: "🤿", label: "กิจกรรม", desc: "ดำน้ำ ล่องแพ และกิจกรรมผจญภัย", value: "กิจกรรม" },
  { icon: "💰", label: "งบประมาณ", desc: "ท่องเที่ยวให้คุ้มค่าในทุกงบ", value: "งบประมาณ" },
];

function ChatSelect() {
  const navigate = useNavigate();
  const firstName = localStorage.getItem("firstName");

  const handleSelect = (topic) => {
    navigate("/chat", { state: { topic } });
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
          <div key={t.value} className="topic-card" onClick={() => handleSelect(t.value)}>
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