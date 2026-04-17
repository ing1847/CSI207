import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(null);

  useEffect(() => {
    const name = localStorage.getItem("firstName");
    setFirstName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    setFirstName(null);
    navigate("/");
  };

  return (
    <div className="navbar">
      <div className="nav-left" onClick={() => navigate("/")}>
        <div className="nav-logo">🌊</div>
        <div className="nav-title">Travel AI</div>
      </div>

      <div className="nav-right">
        <button onClick={() => navigate("/")}>หน้าแรก</button>
        {firstName ? (
          <>
            <span>สวัสดี, {firstName}</span>
            <button className="register-btn" onClick={handleLogout}>
              ออกจากระบบ
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/login")}>เข้าสู่ระบบ</button>
            <button className="register-btn" onClick={() => navigate("/register")}>
              สมัครสมาชิก
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;