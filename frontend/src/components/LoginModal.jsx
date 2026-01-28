import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { FaUser, FaLock, FaTimes } from 'react-icons/fa';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    Swal.showLoading();

    const baseUrl = 'https://myscheduleapi.onrender.com';
    const endpoint = isRegister ? `${baseUrl}/api/register` : `${baseUrl}/api/login`;
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed");

      if (isRegister) {
        Swal.fire('Success', 'สมัครสมาชิกเรียบร้อย กรุณาล็อกอิน', 'success');
        setIsRegister(false);
        setPassword("");
      } else {
        Swal.fire({ icon: 'success', title: `ยินดีต้อนรับ ${data.user.username}`, timer: 1500, showConfirmButton: false });
        // ส่ง user และ token กลับไปที่ App
        onLogin(data.user, data.token);
      }
    } catch (err) {
      Swal.fire('Error', err.message || 'Connection Error', 'error');
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999,
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className="card" style={{ width: "350px", position: "relative", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 15, right: 15, background: "none", border: "none", fontSize: "18px", color: "inherit", cursor: "pointer" }}><FaTimes /></button>
        <h2 style={{ marginBottom: 20 }}>{isRegister ? "Create Account" : "Welcome Back"}</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15, position: "relative" }}>
            <FaUser style={{ position: "absolute", top: 14, left: 15, opacity: 0.5 }} />
            <input className="search-input" style={{ paddingLeft: 40 }} type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 20, position: "relative" }}>
            <FaLock style={{ position: "absolute", top: 14, left: 15, opacity: 0.5 }} />
            <input className="search-input" style={{ paddingLeft: 40 }} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: "14px", opacity: 0.8 }}>
          {isRegister ? "Already a member?" : "New here?"} 
          <span onClick={() => setIsRegister(!isRegister)} style={{ color: "var(--primary)", fontWeight: "bold", cursor: "pointer", marginLeft: 5 }}>
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;