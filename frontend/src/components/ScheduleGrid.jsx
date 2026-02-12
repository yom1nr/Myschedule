import React from 'react';
import { parseSchedule } from '../utils';
import { FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const ScheduleGrid = ({ cart, getSection, captureRef, theme, isMobile }) => {
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const fullDays = { 'Mo': 'วันจันทร์', 'Tu': 'วันอังคาร', 'We': 'วันพุธ', 'Th': 'วันพฤหัสบดี', 'Fr': 'วันศุกร์', 'Sa': 'วันเสาร์', 'Su': 'วันอาทิตย์' };
  const shortDays = { 'Mo': 'จันทร์', 'Tu': 'อังคาร', 'We': 'พุธ', 'Th': 'พฤหัส', 'Fr': 'ศุกร์', 'Sa': 'เสาร์', 'Su': 'อาทิตย์' };

  // 🎨 Pastel gradient course colors
  const courseColors = [
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', solid: '#7c6bc4' },
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', solid: '#3ef0a5' },
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', solid: '#f48fac' },
    { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', solid: '#c4a4de' },
    { bg: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', solid: '#e09cc0' },
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', solid: '#28cfff' },
    { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', solid: '#f075b4' },
    { bg: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)', solid: '#89bcd5' },
    { bg: 'linear-gradient(135deg, #c3cfe2 0%, #f5f7fa 100%)', solid: '#dce3ed' },
    { bg: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', solid: '#e7eccd' },
  ];

  // --- Mobile View ---
  if (isMobile) {
    const scheduleByDay = {};
    cart.forEach(course => {
      parseSchedule(course.time).forEach(sch => {
        if (!scheduleByDay[sch.day]) scheduleByDay[sch.day] = [];
        scheduleByDay[sch.day].push({ ...sch, course, colorIndex: cart.indexOf(course) });
      });
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        {days.map(day => {
          if (!scheduleByDay[day]) return null;
          return (
            <div key={day} style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#FF7F00", fontSize: "0.95rem", fontWeight: 600 }}>{fullDays[day]}</h3>
              {scheduleByDay[day].sort((a,b) => a.startTotal - b.startTotal).map((item, idx) => {
                const color = courseColors[item.colorIndex % courseColors.length];
                return (
                  <div key={idx} style={{
                    display: "flex", gap: "12px", marginBottom: idx < scheduleByDay[day].length - 1 ? "12px" : 0,
                    padding: "10px 12px", borderRadius: "12px",
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{ background: color.solid, width: "4px", borderRadius: "4px", flexShrink: 0 }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.course.code}</div>
                      <div style={{ fontSize: "0.82rem", opacity: 0.7, marginTop: 2 }}>{item.course.name}</div>
                      <div style={{ display: "flex", gap: "15px", marginTop: "6px", fontSize: "0.75rem", opacity: 0.55 }}>
                        <span style={{display:'flex', alignItems:'center', gap:4}}><FaClock /> {item.startH}:{item.startM.toString().padStart(2,'0')} - {item.endH}:{item.endM.toString().padStart(2,'0')}</span>
                        <span style={{display:'flex', alignItems:'center', gap:4}}><FaMapMarkerAlt /> {item.room}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        })}
        {cart.length === 0 && <div style={{textAlign:"center", padding: 30, opacity: 0.5}}>ยังไม่มีรายวิชา</div>}
      </div>
    );
  }

  // --- PC Grid View ---
  const allSchedules = cart.flatMap(course => parseSchedule(course.time));

  let minStart, maxEnd;
  if (allSchedules.length > 0) {
    minStart = Math.min(...allSchedules.map(s => s.startH));
    maxEnd = Math.max(...allSchedules.map(s => s.endH + (s.endM > 0 ? 1 : 0)));
  } else {
    minStart = 8;
    maxEnd = 18;
  }
  const totalHours = maxEnd - minStart;
  const timeHeaders = Array.from({ length: totalHours }, (_, i) => minStart + i);

  // Filter days that actually have classes (or show Mon-Fri if empty)
  const activeDays = allSchedules.length > 0
    ? days.filter(d => allSchedules.some(s => s.day === d))
    : days.slice(0, 5);

  // Helper: convert time to fractional column position (1 col = 1 hour)
  const timeToCol = (h, m) => {
    return (h - minStart) + (m / 60);
  };

  return (
    <div ref={captureRef} style={{
      borderRadius: '20px',
      padding: '20px',
      background: 'var(--card-bg)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Title */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px', paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>📅</span>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', opacity: 0.9 }}>ตารางเรียน</span>
        </div>
        {cart.length > 0 && (
          <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>
            {cart.length} วิชา • {cart.reduce((s,c) => s + c.credit, 0)} หน่วยกิต
          </span>
        )}
      </div>

      {/* Grid Table — 1 column per hour, fits 100% width */}
      <div style={{
        display: "grid",
        gap: "2px",
        background: 'transparent',
        gridTemplateColumns: `70px repeat(${totalHours}, 1fr)`,
        gridTemplateRows: `40px repeat(${activeDays.length}, 68px)`,
        width: '100%'
      }}>
        {/* Top-left corner */}
        <div style={{
          background: 'rgba(255,127,0,0.15)',
          borderRadius: '12px 0 0 0',
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.7rem", opacity: 0.6,
          color: '#FF7F00'
        }}>
          เวลา ⟶
        </div>

        {/* Time headers — 1 per hour */}
        {timeHeaders.map((t, idx) => (
          <div key={t} style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: idx === timeHeaders.length - 1 ? '0 12px 0 0' : '0',
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.3px'
          }}>
            {t}:00-{t + 1}:00
          </div>
        ))}

        {/* Day rows + empty cells */}
        {activeDays.map((day, rowIndex) => (
          <React.Fragment key={day}>
            {/* Day label */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,127,0,0.2) 0%, rgba(255,127,0,0.08) 100%)',
              color: "#FF7F00",
              fontWeight: 700,
              fontSize: "0.78rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              gridRow: rowIndex + 2,
              borderRadius: rowIndex === activeDays.length - 1 ? '0 0 0 12px' : '0',
              letterSpacing: '0.5px'
            }}>
              {shortDays[day]}
            </div>

            {/* 1 empty cell per hour */}
            {Array.from({ length: totalHours }).map((_, colIndex) => (
              <div key={`${day}-${colIndex}`} style={{
                background: colIndex % 2 === 0
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(255,255,255,0.015)',
                gridRow: rowIndex + 2,
                gridColumn: colIndex + 2,
                borderRight: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                borderRadius: (rowIndex === activeDays.length - 1 && colIndex === totalHours - 1) ? '0 0 12px 0' : '0',
              }}></div>
            ))}
          </React.Fragment>
        ))}

        {/* Course blocks — positioned using percentage-based subgrid */}
        {cart.map((course, index) => {
          const color = courseColors[index % courseColors.length];
          return parseSchedule(course.time).map((sch, i) => {
            const dayIdx = activeDays.indexOf(sch.day);
            if (dayIdx === -1) return null;
            const rowStart = dayIdx + 2;

            // Column start/end: each column = 1 hour
            // We use grid column + margins to handle sub-hour precision
            const colStartFrac = timeToCol(sch.startH, sch.startM);
            const colEndFrac = timeToCol(sch.endH, sch.endM);
            const colStart = Math.floor(colStartFrac) + 2; // grid column (1-indexed + 1 for day col)
            const colEnd = Math.ceil(colEndFrac) + 2;

            // Calculate percentage offsets within spanning cells
            const spanHours = colEnd - colStart;
            const leftOffset = ((colStartFrac - Math.floor(colStartFrac)) / spanHours) * 100;
            const rightOffset = ((Math.ceil(colEndFrac) - colEndFrac) / spanHours) * 100;

            if (rowStart < 2 || colStart < 2) return null;

            return (
              <div key={`${course.code}-${i}`} style={{
                gridRow: rowStart,
                gridColumn: `${colStart} / ${colEnd}`,
                background: color.bg,
                color: "white",
                marginTop: '3px',
                marginBottom: '3px',
                marginLeft: `calc(${leftOffset}% + 2px)`,
                marginRight: `calc(${rightOffset}% + 2px)`,
                borderRadius: "10px",
                padding: "4px 6px",
                fontSize: "0.7rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                cursor: "pointer",
                boxShadow: `0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 2
              }}
              title={`${course.name}\n${sch.startH}:${sch.startM.toString().padStart(2,'0')}-${sch.endH}:${sch.endM.toString().padStart(2,'0')}\n${sch.room}`}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)`;
                e.currentTarget.style.zIndex = '10';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`;
                e.currentTarget.style.zIndex = '2';
              }}
              >
                {/* Shine overlay */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
                  borderRadius: '10px 10px 0 0', pointerEvents: 'none'
                }} />
                <b style={{ fontSize: "0.72rem", letterSpacing: '0.3px', position: 'relative' }}>{course.code}</b>
                <span style={{ opacity: 0.85, fontSize: "0.6rem", position: 'relative' }}>Sec {getSection(course)}</span>
                <span style={{ opacity: 0.7, fontSize: "0.55rem", marginTop: '1px', position: 'relative' }}>{sch.room !== '-' ? sch.room : ''}</span>
              </div>
            )
          });
        })}
      </div>

      {/* Empty state hint */}
      {cart.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '20px 0 5px 0',
          fontSize: '0.85rem', opacity: 0.35
        }}>
          เพิ่มรายวิชาจากด้านล่างเพื่อแสดงในตาราง
        </div>
      )}
    </div>
  );
};

export default ScheduleGrid;