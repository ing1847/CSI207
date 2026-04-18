import { useState } from "react";

function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // แสดงข้อความ user ก่อน
    setMessages((prev) => [...prev, { role: "user", text: input }]);

    try {
      const res = await fetch("http://127.0.0.1:5000/ask", {   // 🔥 เปลี่ยนตรงนี้
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input }),
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.answer },
      ]);

    } catch (err) {
      console.error("FETCH ERROR:", err);

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ ติดต่อ backend ไม่ได้" },
      ]);
    }

    setInput("");
  };

  return (
    <div style={{ width: "400px", margin: "auto" }}>
      <h2>🌊 Marine Chatbot</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: "400px",
          overflow: "auto",
          padding: "10px",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              marginBottom: "10px",
            }}
          >
            <p>{m.text}</p>
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="พิมพ์คำถาม..."
      />
      <button onClick={sendMessage}>ส่ง</button>
    </div>
  );
}

export default Chat;