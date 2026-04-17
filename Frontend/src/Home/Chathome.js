import React, { useState, useEffect, useRef } from "react";
import "./Chathome.css";

export default function Chathome() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input },
      { role: "assistant", content: generateResponse(input) }
    ];

    setMessages(newMessages);
    setInput("");
  };

  const generateResponse = (text) => {
    const input = text.toLowerCase();

    if (input.includes("ปะการัง")) {
      return "🪸 ปะการังเป็นสิ่งมีชีวิตสำคัญในทะเล และเป็นบ้านของสัตว์น้ำมากมาย";
    }
    if (input.includes("เที่ยว")) {
      return "🌴 แนะนำ: เกาะเต่า • สิมิลัน • กระบี่";
    }

    return "ลองถามเกี่ยวกับทะเลไทย หรือปะการังดูนะ 😊";
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="ai-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>🌊 Travel AI</h2>
        <button className="new-chat" onClick={() => setMessages([])}>
          + New Chat
        </button>
      </div>

      {/* Main */}
      <div className="main">
        {messages.length === 0 ? (
          <div className="home">
            <h1>🌊 Travel AI Assistant</h1>
            <p>ผู้ช่วย AI แนะนำปะการัง และการท่องเที่ยวทะเลไทย</p>

            <div className="suggestions">
              <button onClick={() => setInput("จังหวัดไหนเหมาะกับการดำน้ำมากที่สุด")}>
                 จังหวัดไหนเหมาะกับการดำน้ำมากที่สุด
              </button>
              <button onClick={() => setInput("ทะเลไทยที่ไหนน่าเที่ยวบ้าง")}>
                ทะเลไทยที่ไหนน่าเที่ยวบ้าง
              </button>
              <button onClick={() => setInput("แนะนำ Activity ในทะเลไทย")}>
                แนะนำ Activity ในทะเลไทย
              </button>
            </div>

            <div className="input-box">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>➤</button>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-area">
              <div className="chat-card">
                {messages.map((msg, index) => (
                  <div key={index} className={`msg ${msg.role}`}>
                    <div className="msg-content">{msg.content}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="input-box">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>➤</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}