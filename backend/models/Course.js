const mongoose = require('mongoose');

// ออกแบบหน้าตาข้อมูล "วิชาเรียน"
const CourseSchema = new mongoose.Schema({
    code: { type: String, required: true },    // รหัสวิชา (เช่น 523101)
    name: { type: String, required: true },    // ชื่อวิชา
    section: String,                           // กลุ่มเรียน
    dayTime: String,                           // วันและเวลา (เช่น MON 9:00-12:00)
    room: String,                              // ห้องเรียน
    credit: String                             // หน่วยกิต
});

// สร้างเป็น Model ชื่อ "Course" (MongoDB จะไปสร้าง Collection ชื่อ courses ให้เอง)
module.exports = mongoose.model('Course', CourseSchema);