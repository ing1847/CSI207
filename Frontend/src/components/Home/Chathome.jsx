import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Chathome.css";

function Chat() {
  const location = useLocation();
  const topic = location.state?.topic || null;

  // key สำหรับ localStorage แยกตาม user
  const userId = localStorage.getItem("userId") || "guest";
  const historyKey = `chatHistory_${userId}`;

  const [input, setInput] = useState("");
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(historyKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeIndex, setActiveIndex] = useState(null);
  const [messages, setMessages] = useState(() => {
    if (topic) {
      return [{ role: "assistant", content: `สวัสดีครับ! วันนี้จะถามเรื่อง "${topic}" ได้เลยนะครับ 😊` }];
    }
    return [];
  });
  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(historyKey, JSON.stringify(history));
  }, [history, historyKey]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await res.json();
      const assistantMsg = { role: "assistant", content: data.answer };

      setMessages((prev) => {
        const updated = [...prev, assistantMsg];

        setHistory((prevHistory) => {
          if (activeIndex !== null) {
            const newHistory = [...prevHistory];
            newHistory[activeIndex] = {
              ...newHistory[activeIndex],
              messages: updated,
            };
            return newHistory;
          } else {
            const title = input.length > 30 ? input.slice(0, 30) + "..." : input;
            setActiveIndex(prevHistory.length);
            return [...prevHistory, { title, messages: updated }];
          }
        });

        return updated;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ ติดต่อ backend ไม่ได้" },
      ]);
    }

    setInput("");
  };

  const startNewChat = () => {
    if (messages.length > 0 && activeIndex === null) {
      const title =
        messages[0].content.length > 30
          ? messages[0].content.slice(0, 30) + "..."
          : messages[0].content;
      setHistory((prev) => [...prev, { title, messages }]);
    }
    setMessages([]);
    setActiveIndex(null);
  };

  const loadChat = (index) => {
    setMessages(history[index].messages);
    setActiveIndex(index);
  };

  const deleteChat = (e, index) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem(historyKey, JSON.stringify(updated));
      return updated;
    });
    if (activeIndex === index) {
      setMessages([]);
      setActiveIndex(null);
    } else if (activeIndex > index) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="ai-container">
      <div className="sidebar">
        <button className="new-chat" onClick={startNewChat}>
          + New Chat
        </button>

        {history.length > 0 && (
          <div className="history-section">
            <div className="history-label">ประวัติแชท</div>
            {history.map((chat, i) => (
              <div
                key={i}
                className={`history-item ${activeIndex === i ? "active" : ""}`}
                onClick={() => loadChat(i)}
              >
                <span className="history-icon">💬</span>
                <span className="history-title">{chat.title}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => deleteChat(e, i)}
                  title="ลบ"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="main">
        <div className="msgs">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🌊</div>
              <p>เริ่มบทสนทนาใหม่ได้เลย!</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="bubble">{m.content}</div>
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>

        <div className="input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์คำถาม..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>➤</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;