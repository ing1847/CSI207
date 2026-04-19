import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [firstName, setFirstName] = useState(
    () => localStorage.getItem("firstName")
  );

  useEffect(() => {
    setFirstName(localStorage.getItem("firstName"));
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("userId");
    setFirstName(null);
    navigate("/login");
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
            <div className="user-badge">
              <div className="user-avatar">{firstName.charAt(0).toUpperCase()}</div>
              <span className="user-name">สวัสดี, {firstName}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
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