import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import { FaUser, FaSignOutAlt, FaMoon, FaSun, FaCamera, FaPlus, FaTimes } from 'react-icons/fa';

// Import CSS และ Component ที่แยกไว้
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

  // 🔄 1. ระบบจำ Login (Persistent Login)
  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    const storedToken = localStorage.getItem("userToken");
    
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setCart(parsedUser.mySchedule || []);
    }
  }, []);

  // 📱 2. เช็คขนาดหน้าจอ (Mobile Detection)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🌗 3. ธีมมืด/สว่าง
  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  }, [isDarkMode, theme]);

// 📡 4. โหลดรายวิชา (แก้ตรงนี้)
useEffect(() => {
  fetch('https://myscheduleapi.onrender.com/api/courses')
    .then(res => res.json())
    .then(data => {
      let clean = (Array.isArray(data) ? data : []).map(c => ({
        _id: c._id, 
        code: c.code || "N/A", 
        name: c.name || "Unknown", 
        credit: parseInt(c.credit || 0), 
        time: c.time || "-" 
      }));

      // 🔥 เพิ่มโค้ดส่วนนี้: เรียงลำดับข้อมูลให้ถูกต้อง (Sort)
      clean.sort((a, b) => {
        // 1. เรียงตามรหัสวิชา (ก-ฮ, A-Z)
        if (a.code !== b.code) {
            return a.code.localeCompare(b.code);
        }
        // 2. ถ้ารหัสเหมือนกัน ให้เรียงตามเวลา (เช้า -> เย็น)
        return a.time.localeCompare(b.time);
      });

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
      cancelButtonText: 'ยกเลิก',
      background: '#222', color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        setUser(null);
        setCart([]);
        localStorage.removeItem("userToken");
        localStorage.removeItem("userProfile");
      }
    });
  };

  const addToCart = (course) => {
    if (!user) return setShowLoginModal(true);
    if (cart.find(c => c.code === course.code)) return Swal.fire({ icon: 'warning', title: 'วิชานี้ลงไปแล้ว', background: '#222', color: '#fff' });
    
    const totalCredits = cart.reduce((sum, c) => sum + c.credit, 0);
    if (totalCredits + course.credit > 22) return Swal.fire({ icon: 'error', title: 'หน่วยกิตเกิน 22', background: '#222', color: '#fff' });
    
    const check = checkConflict(course, cart);
    if (check.conflict) return Swal.fire({ icon: 'error', title: 'เวลาชน!', html: check.detail, background: '#222', color: '#fff' });
    
    setCart([...cart, course]);
    Swal.fire({ icon: 'success', title: 'เพิ่มสำเร็จ', timer: 1000, showConfirmButton: false, background: '#222', color: '#fff' });
  };

  const removeFromCart = (id) => {
    if (!user) return setShowLoginModal(true);
    Swal.fire({ title: 'ลบรายวิชา?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', background: '#222', color: '#fff' }).then((r) => {
      if (r.isConfirmed) setCart(cart.filter(c => c._id !== id));
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
  }, [cart]); 

  const handleSaveImage = async () => {
    if (!user) return setShowLoginModal(true);
    const element = scheduleRef.current;
    if(!element) return;
    
    // บังคับขยายตารางเพื่อถ่ายรูป
    const originalStyle = { overflow: element.style.overflow, width: element.style.width, maxWidth: element.style.maxWidth };
    element.style.overflow = 'visible'; 
    element.style.width = 'fit-content';
    element.style.maxWidth = 'none';
    
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: isDarkMode ? "#1e1e1e" : "#fff", useCORS: true });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `schedule_${user.username}.png`;
      link.click();
      Swal.fire({ icon: 'success', title: 'บันทึกรูปภาพแล้ว', timer: 1500, showConfirmButton: false, background: '#222', color: '#fff' });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'ลองใหม่อีกครั้ง', background: '#222', color: '#fff' });
    } finally {
      element.style.overflow = originalStyle.overflow; 
      element.style.width = originalStyle.width;
      element.style.maxWidth = originalStyle.maxWidth;
    }
  };

  const getSection = (course) => courses.filter(c => c.code === course.code).findIndex(c => c._id === course._id) + 1;
  const filtered = courses.filter(c => c.code.toLowerCase().includes(searchText.toLowerCase()) || c.name.toLowerCase().includes(searchText.toLowerCase()));
  const totalCredits = cart.reduce((sum, c) => sum + c.credit, 0);

  return (
    <div className="app-container">
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, background: "linear-gradient(to right, #FF7F00, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Planer by Yom1nr
          </h1>
          <p style={{ margin: "5px 0", opacity: 0.7, fontSize: "0.9rem" }}>
            {user ? `👋 ${user.username}` : "Guest Mode (ข้อมูลไม่ถูกบันทึก)"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn btn-secondary btn-icon" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <FaSun color="#FFD700" /> : <FaMoon />}
          </button>
          
          {!isMobile && (
            <div style={{ padding: "10px 15px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
               Credits: <span style={{ color: totalCredits > 22 ? "red" : "#FF7F00", fontWeight: "bold" }}>{totalCredits}</span>
            </div>
          )}

          {!isMobile && <button className="btn btn-primary" onClick={handleSaveImage}><FaCamera /> Save</button>}
          
          {user ? (
            <button className="btn btn-danger" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}><FaUser /> Login</button>
          )}
        </div>
      </header>

      {/* 🟢 Mobile Only: ปุ่ม Save รูป & Credit อยู่บรรทัดใหม่ */}
      {isMobile && (
         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, gap: 10 }}>
            <div style={{ flex:1, padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", textAlign:"center", border: "1px solid rgba(255,255,255,0.1)" }}>
               Credits: <span style={{ color: totalCredits > 22 ? "red" : "#FF7F00", fontWeight: "bold" }}>{totalCredits}</span>
            </div>
            <button className="btn btn-primary" style={{flex:1}} onClick={handleSaveImage}><FaCamera /> Save</button>
         </div>
      )}

      {/* 🟢 Main Schedule Display */}
      {/* PC: Grid ใหญ่ */}
      <div className="desktop-only">
         <ScheduleGrid cart={cart} getSection={getSection} captureRef={scheduleRef} theme={theme} isMobile={false} />
      </div>

      {/* Mobile: Grid แบบ List เรียงวัน */}
      {isMobile && cart.length > 0 && (
        <div ref={scheduleRef} style={{background: theme.bg, padding: 10, borderRadius: 10}}> 
           {/* Wrap ด้วย div ref เพื่อให้ capture รูปในมือถือได้ */}
           <h3 style={{color: "var(--primary)", marginTop:0}}>ตารางเรียนของฉัน</h3>
           <ScheduleGrid cart={cart} getSection={getSection} captureRef={null} theme={theme} isMobile={true} />
        </div>
      )}

      {/* Mobile: แสดงข้อความถ้ายังไม่เลือกวิชา */}
      {isMobile && cart.length === 0 && (
        <div style={{textAlign:"center", padding:"30px", opacity:0.6}}>
           ยังไม่มีรายวิชาในตาราง
        </div>
      )}

      {/* Chips รายวิชาที่เลือก (แสดงเฉพาะ PC) */}
      {!isMobile && cart.length > 0 && (
        <div className="card" style={{ marginBottom: 30, borderLeft: "5px solid var(--primary)" }}>
          <h4 style={{ margin: "0 0 15px 0" }}>วิชาที่เลือก ({cart.length})</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {cart.map(c => (
              <div key={c._id} style={{ background: "rgba(255,255,255,0.1)", padding: "8px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: 8 }}>
                <b>{c.code}</b> 
                <span style={{ opacity: 0.7 }}>Sec {getSection(c)}</span>
                <FaTimes style={{ cursor: "pointer", color: "#ff4d4d" }} onClick={() => removeFromCart(c._id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="input-group">
         <input 
           type="text" 
           className="search-input" 
           placeholder="🔎 ค้นหาวิชา (รหัส, ชื่อ)..." 
           value={searchText} 
           onChange={e => setSearchText(e.target.value)} 
         />
      </div>

      {/* 🟢 Course List Display */}
      
      {/* 1. Mobile View (Card List) */}
      <div className="mobile-only mobile-course-list">
        {filtered.slice(0, 50).map(c => (
          <div key={c._id} className="course-card">
            <div className="course-header">
              <span className="course-code">{c.code}</span>
              <span className="course-credit">{c.credit} Cr.</span>
            </div>
            <div className="course-name">{c.name}</div>
            <div className="course-time">🕒 {c.time}</div>
            <div className="course-time" style={{marginTop:5}}>🎓 Sec {getSection(c)}</div>
            
            {/* ปุ่มลบ (ถ้ามีในตาราง) / ปุ่มเพิ่ม (ถ้ายังไม่มี) */}
            {cart.find(item => item._id === c._id) ? (
               <button className="add-btn-mobile" style={{background:"#dc3545", boxShadow:"0 4px 12px rgba(220, 53, 69, 0.5)"}} onClick={() => removeFromCart(c._id)}>
                  <FaTimes />
               </button>
            ) : (
               <button className="add-btn-mobile" onClick={() => addToCart(c)}>
                  <FaPlus />
               </button>
            )}
          </div>
        ))}
      </div>

      {/* 2. PC View (Table) */}
      <div className="desktop-only course-table-container card" style={{ padding: 0 }}>
        <table className="modern-table">
          <thead>
            <tr>
              <th style={{width: '15%'}}>รหัส</th>
              <th style={{width: '35%'}}>ชื่อวิชา</th>
              <th style={{textAlign:"center"}}>หน่วยกิต</th>
              <th style={{textAlign:"center"}}>Sec</th>
              <th>เวลา</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map(c => {
               const isInCart = cart.find(item => item._id === c._id);
               return (
              <tr key={c._id}>
                <td style={{ fontWeight: "bold", color: "var(--primary)" }}>{c.code}</td>
                <td>{c.name}</td>
                <td style={{ textAlign: "center" }}>{c.credit}</td>
                <td style={{ textAlign: "center" }}>{getSection(c)}</td>
                <td style={{ fontSize: "13px", opacity: 0.8 }}>{c.time}</td>
                <td style={{ textAlign: "center" }}>
                   {isInCart ? (
                     <button className="btn btn-danger" style={{ padding: "6px 12px", width: "auto" }} onClick={() => removeFromCart(c._id)}>
                        ลบ
                     </button>
                   ) : (
                     <button className="btn btn-success" style={{ padding: "6px 12px", width: "auto" }} onClick={() => addToCart(c)}>
                        <FaPlus /> เพิ่ม
                     </button>
                   )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;