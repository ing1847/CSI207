import { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:5000";

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const skipSaveRef = useRef(false); // ← เพิ่ม

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (!userId) return;
    fetchSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!userId || messages.length === 0) return;
    if (skipSaveRef.current) {       // ← เพิ่ม
      skipSaveRef.current = false;
      return;
    }
    const timer = setTimeout(() => saveHistory(), 800);
    return () => clearTimeout(timer);
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/history/${userId}`, { headers });
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchSessions error:", err);
    }
  };

  const saveHistory = async () => {
    try {
      await fetch(`${API_URL}/history/save`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, messages }),
      });
      fetchSessions();
    } catch (err) {
      console.error("saveHistory error:", err);
    }
  };

  const loadSession = async (sid) => {
    try {
      const res = await fetch(`${API_URL}/history/session/${sid}`, { headers });
      const data = await res.json();
      skipSaveRef.current = true; // ← เพิ่ม
      setMessages(data.messages || []);
      setSessionId(sid);
    } catch (err) {
      console.error("loadSession error:", err);
    }
  };

  const deleteSession = async (sid, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/history/session/${sid}`, {
        method: "DELETE",
        headers,
      });
      setSessions((prev) => prev.filter((s) => s.sessionId !== sid));
      if (sid === sessionId) startNewChat();
    } catch (err) {
      console.error("deleteSession error:", err);
    }
  };

  const startNewChat = () => {
    skipSaveRef.current = true; // ← เพิ่ม
    setMessages([]);
    setSessionId(generateSessionId());
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userText }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {sidebarOpen && (
        <div style={{
          width: 240, background: "#f5f5f5", borderRight: "1px solid #ddd",
          display: "flex", flexDirection: "column", padding: "12px 8px"
        }}>
          <button onClick={startNewChat} style={{
            marginBottom: 12, padding: "8px", background: "#1976d2",
            color: "#fff", border: "none", borderRadius: 8, cursor: "pointer"
          }}>
            + บทสนทนาใหม่
          </button>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {sessions.map((s) => (
              <div key={s.sessionId} onClick={() => loadSession(s.sessionId)}
                style={{
                  padding: "8px 10px", marginBottom: 4, borderRadius: 8,
                  background: s.sessionId === sessionId ? "#dceeff" : "transparent",
                  cursor: "pointer", display: "flex",
                  justifyContent: "space-between", alignItems: "center",
                  fontSize: 13
                }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.title}
                </span>
                <button onClick={(e) => deleteSession(s.sessionId, e)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    color: "#999", fontSize: 16, padding: "0 2px" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #ddd",
          display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSidebarOpen((v) => !v)}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
            ☰
          </button>
          <h2 style={{ margin: 0, fontSize: 16 }}>🌊 Marine Chatbot</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {messages.length === 0 && (
            <p style={{ color: "#aaa", textAlign: "center", marginTop: 60 }}>
              ถามเกี่ยวกับทะเลไทยได้เลยครับ
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 10
            }}>
              <div style={{
                maxWidth: "70%", padding: "10px 14px", borderRadius: 16,
                background: m.role === "user" ? "#1976d2" : "#f0f0f0",
                color: m.role === "user" ? "#fff" : "#222",
                fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap"
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: "#999", fontSize: 13, padding: "4px 0" }}>
              กำลังคิด...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #ddd",
          display: "flex", gap: 8 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="พิมพ์คำถาม..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: 24,
              border: "1px solid #ccc", fontSize: 14, outline: "none" }}
          />
          <button onClick={sendMessage} disabled={loading}
            style={{ padding: "10px 20px", background: "#1976d2", color: "#fff",
              border: "none", borderRadius: 24, cursor: "pointer", fontSize: 14 }}>
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;