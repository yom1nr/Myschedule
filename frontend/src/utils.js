// utils.js

export const parseSchedule = (timeStr) => {
  if (!timeStr || timeStr === "-" || timeStr === "N" || timeStr === "N/A") return [];
  const regex = /([MoTuWeThFrSaSu]{2})(\d{2})[:.](\d{2})-(\d{2})[:.](\d{2})(?:\s+([^\s]+))?/g;
  let tempMap = {}; 
  let match;
  while ((match = regex.exec(timeStr)) !== null) {
    const key = `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}`;
    if (!tempMap[key]) {
      tempMap[key] = {
        day: match[1], startH: parseInt(match[2]), startM: parseInt(match[3]), endH: parseInt(match[4]), endM: parseInt(match[5]),
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

export const checkConflict = (newCourse, currentCart) => {
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

export const themes = {
  light: {
    bg: "#f4f6f9", text: "#333", gridBg: "#ddd", gridHeader: "#333", gridSubHeader: "#444", gridCell: "white"
  },
  dark: {
    bg: "#121212", text: "#e0e0e0", gridBg: "#333", gridHeader: "#000", gridSubHeader: "#1a1a1a", gridCell: "#2d2d2d"
  }
};