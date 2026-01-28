import React from 'react';
import { parseSchedule } from '../utils';
import { FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const ScheduleGrid = ({ cart, getSection, captureRef, theme, isMobile }) => {
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const fullDays = { 'Mo': 'วันจันทร์', 'Tu': 'วันอังคาร', 'We': 'วันพุธ', 'Th': 'วันพฤหัสบดี', 'Fr': 'วันศุกร์', 'Sa': 'วันเสาร์', 'Su': 'วันอาทิตย์' };

  // --- Mobile View ---
  if (isMobile) {
    const scheduleByDay = {};
    cart.forEach(course => {
      parseSchedule(course.time).forEach(sch => {
        if (!scheduleByDay[sch.day]) scheduleByDay[sch.day] = [];
        scheduleByDay[sch.day].push({ ...sch, course });
      });
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
        {days.map(day => {
          if (!scheduleByDay[day]) return null;
          return (
            <div key={day} className="card">
              <h3 style={{ margin: "0 0 10px 0", color: "#FF7F00", borderBottom: `1px solid #ddd`, paddingBottom: "5px" }}>{fullDays[day]}</h3>
              {scheduleByDay[day].sort((a,b) => a.startTotal - b.startTotal).map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                  <div style={{ background: "#007bff", width: "4px", borderRadius: "2px" }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold" }}>{item.course.code}</div>
                    <div style={{ fontSize: "14px", opacity: 0.8 }}>{item.course.name}</div>
                    <div style={{ display: "flex", gap: "15px", marginTop: "5px", fontSize: "12px", opacity: 0.7 }}>
                      <span style={{display:'flex', alignItems:'center', gap:4}}><FaClock /> {item.startH}:{item.startM.toString().padStart(2,'0')} - {item.endH}:{item.endM.toString().padStart(2,'0')}</span>
                      <span style={{display:'flex', alignItems:'center', gap:4}}><FaMapMarkerAlt /> {item.room}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        {cart.length === 0 && <div className="card" style={{textAlign:"center"}}>ยังไม่มีรายวิชา</div>}
      </div>
    );
  }

  // --- PC Grid View ---
  const allSchedules = cart.flatMap(course => parseSchedule(course.time));
  let minStart = 8, maxEnd = 18;
  if (allSchedules.length > 0) {
    minStart = Math.min(...allSchedules.map(s => s.startH), 8);
    maxEnd = Math.max(...allSchedules.map(s => s.endH), 18);
  }
  const totalHours = maxEnd - minStart + 1;
  const timeHeaders = Array.from({ length: totalHours }, (_, i) => minStart + i);

  return (
    <div ref={captureRef} className="card" style={{ padding: 10, overflowX: 'auto' }}>
      <div style={{ 
        display: "grid", gap: "1px", background: theme.gridBg, border: `1px solid ${theme.gridBg}`, 
        gridTemplateColumns: `80px repeat(${totalHours * 2}, 1fr)`, gridTemplateRows: "50px repeat(7, 60px)", minWidth: "800px" 
      }}>
        <div style={{ background: theme.gridHeader, color: "white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold" }}>Day / Time</div>
        {timeHeaders.map(t => (<div key={t} style={{ gridColumn: "span 2", background: theme.gridSubHeader, color: "white", display:"flex", alignItems:"center", justifyContent:"center", fontSize: "12px" }}>{t}:00 - {t + 1}:00</div>))}
        
        {days.map((day, rowIndex) => (
          <React.Fragment key={day}>
            <div style={{ background: "#FF7F00", color: "white", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gridRow: rowIndex + 2 }}>{day}</div>
            {Array.from({ length: totalHours * 2 }).map((_, colIndex) => (
              <div key={`${day}-${colIndex}`} style={{ background: theme.gridCell, gridRow: rowIndex + 2 }}></div>
            ))}
          </React.Fragment>
        ))}

        {cart.map((course, index) => {
          const colors = ["#FF5733", "#28A745", "#007BFF", "#E83E8C", "#17A2B8", "#FD7E14"];
          return parseSchedule(course.time).map((sch, i) => {
            const rowStart = days.indexOf(sch.day) + 2;
            const colStart = ((sch.startH - minStart) * 2 + (sch.startM >= 30 ? 1 : 0)) + 2;
            const colEnd = ((sch.endH - minStart) * 2 + (sch.endM >= 30 ? 1 : 0)) + 2;
            if (rowStart < 2 || colStart < 2) return null;
            return (
              <div key={`${course.code}-${i}`} style={{ 
                gridRow: rowStart, gridColumn: `${colStart} / ${colEnd}`, 
                background: colors[index % colors.length], color: "white", margin: "1px", borderRadius: "4px", 
                padding: "2px", fontSize: "10px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", cursor: "pointer",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
              }} title={`${course.name}`}>
                <b>{course.code}</b>
                <span>Sec {getSection(course)}</span>
                <span>{sch.room}</span>
              </div>
            )
          });
        })}
      </div>
    </div>
  );
};

export default ScheduleGrid;