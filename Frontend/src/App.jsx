import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./Login/Login";
import Register from "./Register/Register";
import Chathome from "./components/Home/Chathome";
import ChatSelect from "./components/Home/ChatSelect";

function App() {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Chathome />} />
        <Route path="/select" element={<ChatSelect />} />
        <Route path="/chat" element={<Chathome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Chathome />} />
      </Routes>
    </>
  );
}

export default App;