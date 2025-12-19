import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import { FaUser, FaLock, FaMoon, FaSun, FaClock, FaMapMarkerAlt } from 'react-icons/fa'; 
import Swal from 'sweetalert2'; 

// ==========================================
// 🎨 ธีมสี (Theme Config)
// ==========================================
const themes = {
  light: {
    bg: "#f8f9fa",
    text: "#333",
    cardBg: "white",
    cardBorder: "#ddd",
    gridBg: "#ddd",
    gridHeader: "#333",
    gridSubHeader: "#444",
    gridCell: "white",
    gridText: "#333",
    inputBg: "white",
    inputText: "#333",
    highlight: "#FFF3E0",
    highlightBorder: "#FF7F00",
    shadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  dark: {
    bg: "#121212",
    text: "#e0e0e0",
    cardBg: "#1e1e1e",
    cardBorder: "#333",
    gridBg: "#333",
    gridHeader: "#000",
    gridSubHeader: "#1a1a1a",
    gridCell: "#2d2d2d",
    gridText: "#e0e0e0",
    inputBg: "#2d2d2d",
    inputText: "#e0e0e0",
    highlight: "#2a1a00", // สีส้มเข้มๆ
    highlightBorder: "#b35900",
    shadow: "0 4px 10px rgba(0,0,0,0.5)"
  }
};

// ==========================================
// 🛠️ ส่วนที่ 1: ฟังก์ชัน Utility
// ==========================================
const parseSchedule = (timeStr) => {
  if (!timeStr || timeStr === "-" || timeStr === "N" || timeStr === "N/A") return [];
  const regex = /([MoTuWeThFrSaSu]{2})(\d{2})[:.](\d{2})-(\d{2})[:.](\d{2})(?:\s+([^\s]+))?/g;
  let tempMap = {}; 
  let match;
  while ((match = regex.exec(timeStr)) !== null) {
    const key = `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}`;
    if (!tempMap[key]) {
      tempMap[key] = {
        day: match[1],
        startH: parseInt(match[2]), startM: parseInt(match[3]), endH: parseInt(match[4]), endM: parseInt(match[5]),
        startTotal: parseInt(match[2]) * 60 + parseInt(match[3]),
        endTotal: parseInt(match[4]) * 60 + parseInt(match[5]),
        rooms: []
      };
    }
    if (match[6]) tempMap[key].rooms.push(match[6]);
  }
  return Object.values(tempMap).map(item => ({
    ...item,
    room: item.rooms.length > 0 ? [...new Set(item.rooms)].join(", ") : "-"
  }));
};

const checkConflict = (newCourse, currentCart) => {
  const newSchedules = parseSchedule(newCourse.time);
  for (let cartItem of currentCart) {
    const existingSchedules = parseSchedule(cartItem.time);
    for (let newSch of newSchedules) {
      for (let existSch of existingSchedules) {
        if (newSch.day === existSch.day) {
          if (newSch.startTotal < existSch.endTotal && newSch.endTotal > existSch.startTotal) {
            return {
              conflict: true,
              detail: `ชนกับวิชา: <b>${cartItem.code}</b><br>${cartItem.name}<br>วัน ${newSch.day} เวลา ${existSch.startH}:${existSch.startM.toString().padStart(2,'0')} - ${existSch.endH}:${existSch.endM.toString().padStart(2,'0')}`
            };
          }
        }
      }
    }
  }
  return { conflict: false };
};

// ----------------------------------------------------
// 🔐 LoginScreen (ฉบับแก้ใหม่: เห็น Alert ชัดเจนทุกกรณี)
// ----------------------------------------------------
const LoginScreen = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const backgroundUrl = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80";

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. 🟡 ขึ้น Loading ค้างไว้ก่อนเลย
    Swal.fire({
      title: 'กำลังตรวจสอบ...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading() }
    });

    // ⚠️ เช็ค URL ให้ชัวร์ (ห้ามมี / ปิดท้าย)
    const baseUrl = 'https://myscheduleapi.onrender.com'; 
    const endpoint = isRegister ? `${baseUrl}/api/register` : `${baseUrl}/api/login`;
    const body = { username, password }; 

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // 🔥 ดักจับกรณี Server พัง (ส่ง HTML กลับมาแทน JSON)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server Error (Not JSON)"); // โยนไปเข้า catch ด้านล่าง
      }

      const data = await res.json();
      
      // 2. 🔴 กรณี: รหัสผิด / สมัครซ้ำ / Error จาก Backend
      if (!res.ok) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด!',
          text: data.message || "การทำรายการล้มเหลว",
          confirmButtonColor: '#d33',
          confirmButtonText: 'ลองใหม่'
        });
        return; 
      }

      // 3. 🟢 กรณี: สมัครสมาชิกสำเร็จ
      if (isRegister) {
        Swal.fire({
          icon: 'success',
          title: 'สมัครสมาชิกเรียบร้อย!',
          text: 'กรุณาล็อกอินเพื่อเข้าใช้งาน',
          confirmButtonColor: '#28a745',
          confirmButtonText: 'ตกลง'
        });
        setIsRegister(false);
        setPassword(""); // เคลียร์รหัสผ่าน
        return;
      }

      // 4. 🟢 กรณี: ล็อกอินสำเร็จ (User ขอให้เด้งบอกก่อนเข้า)
      // ใช้ await เพื่อรอให้ User เห็น Alert ก่อน 1.5 วิ แล้วค่อยไปต่อ
      await Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        text: `ยินดีต้อนรับคุณ ${data.user.username}`,
        timer: 1500,
        showConfirmButton: false
      });

      // จังหวะนี้ค่อยเปลี่ยนหน้า
      onLogin(data.user, data.token);

    } catch (err) {
      console.error(err);
      // 5. 🔌 กรณี: เน็ตหลุด / Server ยังไม่ตื่น / Backend พัง
      Swal.fire({
        icon: 'error',
        title: 'ติดต่อ Server ไม่ได้',
        text: 'Server อาจจะกำลังโหลด (รอ 1 นาที) หรือลองเช็กอินเทอร์เน็ต',
        confirmButtonColor: '#d33'
      });
    }
  };

  const styles = {
    container: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center", fontFamily: "'Poppins', sans-serif", zIndex: 9999 },
    glassBox: { background: "rgba(255, 255, 255, 0.05)", borderRadius: "16px", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", backdropFilter: "blur(8.5px)", WebkitBackdropFilter: "blur(8.5px)", border: "1px solid rgba(255, 255, 255, 0.2)", padding: "40px", width: "380px", textAlign: "center", color: "white" },
    inputContainer: { position: "relative", marginBottom: "20px" },
    inputIcon: { position: "absolute", top: "50%", left: "15px", transform: "translateY(-50%)", color: "white", fontSize: "14px" },
    input: { width: "100%", padding: "12px 15px 12px 45px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.3)", background: "transparent", color: "white", outline: "none", fontSize: "14px", boxSizing: "border-box" },
    options: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "25px", color: "white" },
    button: { width: "100%", padding: "12px", borderRadius: "30px", border: "none", background: "white", color: "#333", fontWeight: "bold", fontSize: "16px", cursor: "pointer", transition: "0.3s", marginBottom: "15px" },
    switchMode: { fontSize: "13px", color: "rgba(255,255,255,0.8)", marginTop: "10px" },
    link: { color: "white", fontWeight: "bold", cursor: "pointer", marginLeft: "5px", textDecoration: "none" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassBox}>
        <h2 style={{ marginBottom: "30px", fontWeight: "bold" }}>{isRegister ? "Register" : "Login"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputContainer}><FaUser style={styles.inputIcon} /><input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={styles.input} /></div>
          <div style={styles.inputContainer}><FaLock style={styles.inputIcon} /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} /></div>
          {!isRegister && (<div style={styles.options}><label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}><input type="checkbox" style={{ marginRight: "5px" }} /> Remember me</label><span style={{ cursor: "pointer" }}>Forgot Password?</span></div>)}
          <button type="submit" style={styles.button}>{isRegister ? "Register" : "Login"}</button>
        </form>
        <p style={styles.switchMode}>{isRegister ? "Already have an account?" : "Don't have an account?"} <span onClick={() => setIsRegister(!isRegister)} style={styles.link}>{isRegister ? "Login" : "Register"}</span></p>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 ส่วนที่ 3: App หลัก
// ==========================================
function App() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [cart, setCart] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark"); // 🌗 โหลดธีมเก่า
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // 📱 เช็กขนาดจอ
  const scheduleRef = useRef(null);

  const theme = isDarkMode ? themes.dark : themes.light; // เลือกชุดสีตามโหมด

  // Listener สำหรับเช็กขนาดจอ (เมื่อย่อ/ขยายหน้าต่าง)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // บันทึกธีมลงเครื่อง
  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.body.style.backgroundColor = theme.bg; // เปลี่ยนสีพื้นหลัง body จริงๆ
  }, [isDarkMode, theme]);

  useEffect(() => {
    fetch('https://myscheduleapi.onrender.com/api/courses').then(res => res.json()).then(rawCourses => {
        const cleanCourses = rawCourses.map(c => ({ _id: c._id, code: c.code || c.Code || c.CODE || "N/A", name: c.name || c.Name || c.NAME || "Unknown Course", credit: parseInt(c.credit || c.Credit || c.CREDIT || 0), time: c.time || c.Time || c.TIME || "-" }));
        setCourses(cleanCourses);
      }).catch(err => console.error("Error loading courses:", err));
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    setCart(userData.mySchedule || []);
    localStorage.setItem("userToken", token);
  };

  const handleLogout = () => {
    Swal.fire({ icon: 'success', title: 'ออกจากระบบแล้ว', timer: 1500, showConfirmButton: false });
    setUser(null);
    setCart([]);
    localStorage.removeItem("userToken");
  };

  useEffect(() => {
    if (user && cart.length >= 0) {
      fetch('https://myscheduleapi.onrender.com/api/save-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, cart: cart })
      }).then(() => {}).catch(err => console.error("Save failed", err));
    }
  }, [cart, user]);

  const totalCredits = cart.reduce((sum, course) => sum + course.credit, 0);
  const getSection = (course) => { const sameSubject = courses.filter(c => c.code === course.code); return sameSubject.findIndex(c => c._id === course._id) + 1; };
  
  const addToCart = (course) => {
    if (cart.find(item => item._id === course._id)) return;
    if (cart.find(item => item.code === course.code)) { 
        Swal.fire({ icon: 'warning', title: 'วิชาซ้ำ!', text: `คุณได้ลงวิชา ${course.code} ไปแล้ว`, confirmButtonColor: '#ffc107', confirmButtonText: 'โอเค' });
        return; 
    }
    if (totalCredits + course.credit > 22) { 
        Swal.fire({ icon: 'error', title: 'หน่วยกิตเกิน!', text: `ตอนนี้มี ${totalCredits} หน่วยกิตแล้ว (Max 22)`, confirmButtonColor: '#d33' });
        return; 
    }
    const conflict = checkConflict(course, cart);
    if (conflict.conflict) { 
        Swal.fire({ icon: 'error', title: 'ไม่สามารถเพิ่มข้อมูลได้!', html: `รายวิชาซ้ำซ้อน<br/>${conflict.detail.replace('⛔ เวลาชนกับวิชา:', 'กับวิชา')}`, confirmButtonText: 'OK', confirmButtonColor: '#3085d6', background: '#fff' });
        return; 
    }
    setCart([...cart, course]);
    Swal.fire({ icon: 'success', title: 'เพิ่มรายวิชาสำเร็จ', text: `${course.code} ${course.name}`, timer: 1500, showConfirmButton: false });
  };

  const removeFromCart = (courseId) => {
      Swal.fire({ title: 'ยืนยันการลบ?', text: "ต้องการลบรายวิชานี้ออกจากตาราง?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'ลบเลย!', cancelButtonText: 'ยกเลิก' }).then((result) => {
          if (result.isConfirmed) {
              setCart(cart.filter(item => item._id !== courseId));
              Swal.fire({ title: 'ลบสำเร็จ!', icon: 'success', timer: 1000, showConfirmButton: false });
          }
      })
  }

  const handleSaveImage = async () => { 
      const element = scheduleRef.current; if (!element) return; 
      Swal.fire({ title: 'กำลังสร้างรูปภาพ...', html: 'กรุณารอสักครู่', timerProgressBar: true, didOpen: () => { Swal.showLoading() } });
      const originalOverflowX = element.style.overflowX; const originalMaxWidth = element.style.maxWidth; const originalWidth = element.style.width; element.style.overflowX = 'visible'; element.style.maxWidth = 'none'; element.style.width = 'fit-content'; 
      try { 
          const tempCanvas = await html2canvas(element, { scale: 3, backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff", windowWidth: element.scrollWidth, width: element.scrollWidth, height: element.scrollHeight }); 
          const image = tempCanvas.toDataURL("image/png", 1.0); 
          const link = document.createElement("a"); link.href = image; link.download = `myschedule_${user?.username}.png`; link.click(); 
          Swal.fire({ icon: 'success', title: 'บันทึกรูปสำเร็จ!', timer: 1500, showConfirmButton: false });
      } catch (error) { 
          console.error(error); 
          Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'เกิดข้อผิดพลาดในการสร้างรูป' });
      } finally { 
          element.style.overflowX = originalOverflowX; element.style.maxWidth = originalMaxWidth; element.style.width = originalWidth; 
      } 
  };

  const filteredCourses = courses.filter(c => c.code.toLowerCase().includes(searchText.toLowerCase()) || c.name.toLowerCase().includes(searchText.toLowerCase()));
  let creditStatusColor = totalCredits < 8 ? "#ffc107" : totalCredits === 22 ? "#dc3545" : "#28a745";
  let creditStatusText = totalCredits < 8 ? "⚠️ น้อยกว่า 8" : totalCredits === 22 ? "⛔ เต็มพิกัด" : "✅ ปกติ";

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto", background: theme.bg, color: theme.text, minHeight: "100vh", transition: "0.3s" }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap: "wrap", gap: "10px"}}>
        <div><h1 style={{ color: theme.text, margin:0 }}>Planer by Yom1nr</h1><p style={{ color: theme.text, opacity: 0.7, margin: "5px 0 0 0" }}>Welcome, <b>{user.username}</b></p></div>
        <div style={{display:"flex", gap:"10px", alignItems:"center"}}>
           {/* ปุ่มสลับธีม */}
           <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: "transparent", border: `1px solid ${theme.cardBorder}`, color: theme.text, padding: "10px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", display:"flex", alignItems:"center", justifyContent:"center", width: "45px", height: "45px" }}>
             {isDarkMode ? <FaSun color="#ffc107" /> : <FaMoon color="#6c757d" />}
           </button>

          <div style={{ padding: "10px 20px", borderRadius: "8px", background: creditStatusColor, color: totalCredits < 8 ? "#333" : "white", fontWeight: "bold", textAlign: "right", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}><div style={{fontSize:"18px"}}>Total: {totalCredits}</div></div>
          {/* ซ่อนปุ่ม Save ในมือถือเพราะ Grid มันหายไป */}
          {!isMobile && <button onClick={handleSaveImage} style={{ background: "#007bff", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", height: "58px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>📷 Save</button>}
          <button onClick={handleLogout} style={{ background: "#6c757d", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", height: "58px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>🚪 Logout</button>
        </div>
      </div>
      
      {/* 📱 เงื่อนไข: ถ้าเป็นมือถือ (isMobile) ให้โชว์ MobileScheduleList ถ้าไม่ใช่ ให้โชว์ Grid */}
      {isMobile ? (
        <MobileScheduleList cart={cart} theme={theme} />
      ) : (
        <ScheduleGrid cart={cart} getSection={getSection} captureRef={scheduleRef} theme={theme} />
      )}

      {/* กล่องรายวิชาด้านล่าง (ปรับสีตามธีม) */}
      <div style={{ background: theme.highlight, padding: "20px", borderRadius: "10px", marginBottom: "30px", border: `2px dashed ${theme.highlightBorder}` }}>
        <h3 style={{ margin: "0 0 15px 0", color: isDarkMode ? "#ffbb33" : "#E65100" }}>🎒 วิชาที่เลือก ({cart.length})</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {cart.map((c) => (
            <div key={c._id} style={{ background: theme.cardBg, color: theme.text, padding: "8px 15px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "10px", border: `1px solid ${theme.cardBorder}` }}>
              <div><span style={{ fontWeight: "bold" }}>{c.code}</span> <span style={{ fontSize:"12px", background: isDarkMode ? "#444" : "#eee", padding:"2px 5px", borderRadius:"4px" }}>{c.credit} Cr.</span></div>
              <span style={{ fontSize:"12px", opacity: 0.7 }}>Sec {getSection(c)}</span>
              <button onClick={() => removeFromCart(c._id)} style={{ background: "#ff4d4d", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer" }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <input type="text" placeholder="🔎 ค้นหา..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "20px", fontSize: "16px", border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", background: theme.inputBg, color: theme.inputText }} />
      
      {/* ตารางค้นหา (Table) */}
      <div style={{ height: "400px", overflowY: "auto", border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", background: theme.cardBg }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: theme.text }}>
          <thead style={{ position: "sticky", top: 0, background: "#FF7F00", color: "white" }}><tr><th style={{padding:"12px"}}>รหัส</th><th style={{padding:"12px"}}>ชื่อ</th><th style={{padding:"12px"}}>หน่วยกิต</th><th style={{padding:"12px"}}>Sec</th><th style={{padding:"12px"}}>เวลา</th><th style={{padding:"12px"}}></th></tr></thead>
          <tbody>
            {filteredCourses.slice(0, 100).map((c) => (
              <tr key={c._id} style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
                <td style={{ padding: "12px", fontWeight:"bold", color: isDarkMode ? "#ffbb33" : "#E65100" }}>{c.code}</td>
                <td style={{ padding: "12px" }}>{c.name}</td>
                <td style={{ padding: "12px", textAlign:"center", fontWeight:"bold" }}>{c.credit}</td>
                <td style={{ padding: "12px", textAlign:"center", fontWeight:"bold" }}>{getSection(c)}</td>
                <td style={{ padding: "12px", fontSize:"13px", opacity: 0.8 }}>{c.time}</td>
                <td style={{ padding: "12px", textAlign:"center" }}><button onClick={() => addToCart(c)} style={{ background: "#28a745", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}>+</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;