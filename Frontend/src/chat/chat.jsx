import { useState } from "react";

function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);

    const res = await fetch("http://localhost:5000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: input }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "bot", text: data.answer },
    ]);

    setInput("");
  };

  return (
    <div style={{ width: "400px", margin: "auto" }}>
      <h2>🌊 Marine Chatbot</h2>

      <div style={{ border: "1px solid #ccc", height: "400px", overflow: "auto", padding: "10px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left" }}>
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