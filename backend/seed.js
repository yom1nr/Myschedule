// D:\myschedule\backend\seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// เชื่อมต่อ MongoDB
const mongoURI = "mongodb+srv://yom1nr:Phatsakorn%402005yom1nr@myschedule.fcojqrd.mongodb.net/?appName=MySchedule";
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.log(err));

// Schema (ต้องตรงกับ Database)
// รับค่าจาก Command Line: node seed.js <SEMESTER> <FILENAME>
// ตัวอย่าง: node seed.js "1/2569" "courses_1_2569.json"
const SEMESTER = process.argv[2] || "2/2568";
const FILENAME = process.argv[3] || "courses.json";

console.log(`📌 Seeding data for Semester: ${SEMESTER} from file: ${FILENAME}`);

const courseSchema = new mongoose.Schema({
  code: String,
  name: String,
  credit: String,
  time: String,
  group: String,
  semester: { type: String, default: SEMESTER }
});

const Course = mongoose.model('Course', courseSchema);

const importData = async () => {
  try {
    // 1. อ่านไฟล์ JSON
    const data = fs.readFileSync(`./${FILENAME}`, 'utf-8');
    const coursesData = JSON.parse(data);

    // 2. เติมข้อมูล semester และ group ลงไป (ถ้า JSON ยังไม่มี)
    const finalData = coursesData.map(c => ({
      ...c,
      semester: SEMESTER
    }));

    // 3. ล้างของเก่าเฉพาะเทอมนี้ แล้วยัดของใหม่
    await Course.deleteMany({ semester: SEMESTER });
    console.log(`🧹 clear old data for ${SEMESTER} successfully`);

    await Course.insertMany(finalData);
    console.log(`🚛 add data successfully ${finalData.length} วิชา!`);

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

importData();