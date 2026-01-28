import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import { FaUser, FaSignOutAlt, FaMoon, FaSun, FaCamera, FaPlus, FaTimes } from 'react-icons/fa';

// Imports from Separated Files
import './App.css';
import { checkConflict, themes } from './utils';
import LoginModal from './components/LoginModal';
import ScheduleGrid from './components/ScheduleGrid';

function App() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [cart, setCart] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const scheduleRef = useRef(null);

  const theme = isDarkMode ? themes.dark : themes.light;

  // 🔄 1. Persistent Login Logic
  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    const storedToken = localStorage.getItem("userToken");
    
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setCart(parsedUser.mySchedule || []);
    }
  }, []);

  // Responsive Check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Theme Sync
  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  }, [isDarkMode, theme]);

  // Fetch Courses
  useEffect(() => {
    fetch('https://myscheduleapi.onrender.com/api/courses')
      .then(res => res.json())
      .then(data => {
        const clean = (Array.isArray(data) ? data : []).map(c => ({
          _id: c._id, code: c.code || "N/A", name: c.name || "Unknown", credit: parseInt(c.credit || 0), time: c.time || "-"
        }));
        setCourses(clean);
      })
      .catch(console.error);
  }, []);

  // --- Handlers ---

  const handleLogin = (userData, token) => {
    setUser(userData);
    setCart(userData.mySchedule || []);
    setShowLoginModal(false);
    
    localStorage.setItem("userToken", token);
    localStorage.setItem("userProfile", JSON.stringify(userData));
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'ต้องการออกจากระบบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        setUser(null);
        setCart([]);
        localStorage.removeItem("userToken");
        localStorage.removeItem("userProfile");
      }
    });
  };

  // Sync Cart to Server
  useEffect(() => {
    if (user && cart.length >= 0) {
      fetch('https://myscheduleapi.onrender.com/api/save-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, cart: cart })
      }).catch(err => console.error("Save failed", err));
      
      const updatedUser = { ...user, mySchedule: cart };
      localStorage.setItem("userProfile", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const getSection = (course) => courses.filter(c => c.code === course.code).findIndex(c => c._id === course._id) + 1;
  const totalCredits = cart.reduce((sum, c) => sum + c.credit, 0);

  const addToCart = (course) => {
    if (!user) return setShowLoginModal(true);
    if (cart.find(c => c.code === course.code)) return Swal.fire('Warning', 'วิชานี้ลงไปแล้ว', 'warning');
    if (totalCredits + course.credit > 22) return Swal.fire('Error', 'หน่วยกิตเกิน 22', 'error');
    
    const check = checkConflict(course, cart);
    if (check.conflict) return Swal.fire({ icon: 'error', title: 'เวลาชน!', html: check.detail });
    
    setCart([...cart, course]);
    Swal.fire({ icon: 'success', title: 'เพิ่มสำเร็จ', timer: 1000, showConfirmButton: false });
  };

  const removeFromCart = (id) => {
    if (!user) return setShowLoginModal(true);
    Swal.fire({ title: 'ลบรายวิชา?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' }).then((r) => {
      if (r.isConfirmed) setCart(cart.filter(c => c._id !== id));
    });
  };

  const handleSaveImage = async () => {
    if (!user) return setShowLoginModal(true);
    const element = scheduleRef.current;
    if(!element) return;
    
    const originalStyle = { overflow: element.style.overflow, width: element.style.width };
    element.style.overflow = 'visible'; element.style.width = 'fit-content';
    
    const canvas = await html2canvas(element, { scale: 3, backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" });
    
    element.style.overflow = originalStyle.overflow; element.style.width = originalStyle.width;
    
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `schedule_${user.username}.png`;
    link.click();
  };

  const filtered = courses.filter(c => c.code.toLowerCase().includes(searchText.toLowerCase()) || c.name.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="app-container">
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 15 }}>
        <div>
          <h1 style={{ margin: 0, background: "linear-gradient(to right, #FF7F00, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Planer by Yom1nr
          </h1>
          <p style={{ margin: "5px 0", opacity: 0.7 }}>
            {user ? `👋 สวัสดี, ${user.username}` : "Guest Mode (ข้อมูลไม่ถูกบันทึก)"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn btn-secondary btn-icon" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <FaSun color="#FFD700" /> : <FaMoon />}
          </button>
          
          <div className="card" style={{ padding: "8px 15px", display: "flex", alignItems: "center", gap: 10, fontWeight: "bold" }}>
             <span style={{ fontSize: "14px", opacity: 0.7 }}>Credits</span>
             <span style={{ color: totalCredits > 22 ? "red" : totalCredits < 9 ? "#FF7F00" : "green", fontSize: "18px" }}>{totalCredits}</span>
          </div>

          {!isMobile && <button className="btn btn-primary" onClick={handleSaveImage}><FaCamera /> Save</button>}
          
          {user ? (
            <button className="btn btn-danger" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
          ) : (
            <button className="btn btn-success" onClick={() => setShowLoginModal(true)}><FaUser /> Login</button>
          )}
        </div>
      </header>

      {/* Main Schedule */}
      <ScheduleGrid cart={cart} getSection={getSection} captureRef={scheduleRef} theme={theme} isMobile={isMobile} />

      {/* Selected Courses Chips */}
      {cart.length > 0 && (
        <div className="card" style={{ marginBottom: 30, borderLeft: "5px solid var(--primary)" }}>
          <h4 style={{ margin: "0 0 15px 0" }}>วิชาที่เลือก ({cart.length})</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {cart.map(c => (
              <div key={c._id} className="tag" style={{ background: isDarkMode ? "#333" : "#e9ecef", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: "14px" }}>
                <b>{c.code}</b> 
                <span style={{ opacity: 0.7 }}>Sec {getSection(c)}</span>
                <FaTimes style={{ cursor: "pointer", color: "red" }} onClick={() => removeFromCart(c._id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & List */}
      <div style={{ marginBottom: 20 }}>
         <input 
           type="text" 
           className="search-input" 
           placeholder="🔎 ค้นหาวิชา (รหัส, ชื่อ)..." 
           value={searchText} 
           onChange={e => setSearchText(e.target.value)} 
         />
      </div>

      {/* ✅ MOBILE VIEW: แสดงแบบการ์ด (ซ่อนถ้าไม่ใช่จอมือถือ) */}
      <div className="mobile-only mobile-course-list">
        {filtered.slice(0, 50).map(c => (
          <div key={c._id} className="course-card">
            <div className="course-header">
              <span className="course-code">{c.code}</span>
              <span className="course-credit">{c.credit} Cr.</span>
            </div>
            <div className="course-name">{c.name}</div>
            <div className="course-time">
              🕒 {c.time} <span style={{marginLeft:10}}>Sec {getSection(c)}</span>
            </div>
            <button className="add-btn-mobile" onClick={() => addToCart(c)}>
              <FaPlus />
            </button>
          </div>
        ))}
      </div>

      {/* ✅ DESKTOP VIEW: แสดงแบบตาราง (ซ่อนถ้าเป็นจอมือถือ) */}
      <div className="desktop-table course-table-container card" style={{ padding: 0, marginTop: 20 }}>
        <table className="modern-table">
          <thead>
            <tr>
              <th style={{width: '15%'}}>รหัส</th>
              <th style={{width: '40%'}}>ชื่อวิชา</th>
              <th style={{textAlign:"center"}}>หน่วยกิต</th>
              <th style={{textAlign:"center"}}>Sec</th>
              <th>เวลา</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map(c => (
              <tr key={c._id}>
                <td style={{ fontWeight: "bold", color: "var(--primary)" }}>{c.code}</td>
                <td>{c.name}</td>
                <td style={{ textAlign: "center" }}>{c.credit}</td>
                <td style={{ textAlign: "center" }}>{getSection(c)}</td>
                <td style={{ fontSize: "13px", opacity: 0.8 }}>{c.time}</td>
                <td style={{ textAlign: "center" }}>
                   <button className="btn btn-success" style={{ padding: "6px 12px", width: "auto" }} onClick={() => addToCart(c)}>
                     <FaPlus /> เพิ่ม
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;