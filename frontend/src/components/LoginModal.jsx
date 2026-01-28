import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { FaUser, FaLock, FaTimes, FaFingerprint } from 'react-icons/fa';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({
      title: 'Processing...',
      text: 'Please wait a moment',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#1e1e1e',
      color: '#fff'
    });

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
        Swal.fire({ icon: 'success', title: 'Registration Success!', text: 'Please login to continue.', background: '#1e1e1e', color: '#fff' });
        setIsRegister(false);
        setPassword("");
      } else {
        Swal.fire({ icon: 'success', title: `Welcome back, ${data.user.username}`, timer: 1500, showConfirmButton: false, background: '#1e1e1e', color: '#fff' });
        onLogin(data.user, data.token);
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: err.message, background: '#1e1e1e', color: '#fff' });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "1.2rem" }}><FaTimes /></button>
        
        {/* Decorative Icon */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            width: 70, height: 70, borderRadius: "50%", 
            background: "linear-gradient(135deg, #ff6b00, #ff9e00)", 
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
            boxShadow: "0 0 20px rgba(255, 107, 0, 0.4)" 
          }}>
            <FaFingerprint style={{ fontSize: "30px", color: "white" }} />
          </div>
        </div>

        <h2 className="modal-title">{isRegister ? "Create Account" : "Member Login"}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input className="search-input" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <FaUser className="input-icon" />
          </div>
          
          <div className="input-group">
            <input className="search-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <FaLock className="input-icon" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }}>
            {isRegister ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: 25, fontSize: "0.9rem", color: "#888" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"} 
          <span onClick={() => setIsRegister(!isRegister)} style={{ color: "var(--primary)", fontWeight: "bold", cursor: "pointer", marginLeft: 8, textDecoration: "underline" }}>
            {isRegister ? "Sign In" : "Register Now"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;