import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="nav-left" onClick={() => navigate("/")}>
        <div className="nav-logo">🌊</div>
        <div className="nav-title">Travel AI</div>
       
      </div>

      <div className="nav-right">
        <button onClick={() => navigate("/")}>หน้าแรก</button>
        <button onClick={() => navigate("/login")}>เข้าสู่ระบบ</button>
        <button className="register-btn" onClick={() => navigate("/register")}>
          สมัครสมาชิก
        </button>
      </div>
    </div>
  );
}

export default Navbar;