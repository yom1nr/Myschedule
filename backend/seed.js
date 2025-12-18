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
const courseSchema = new mongoose.Schema({
  code: String,
  name: String,
  credit: String,
  time: String
});

const Course = mongoose.model('Course', courseSchema);

const importData = async () => {
  try {
    // 1. อ่านไฟล์ CSV
    const data = fs.readFileSync('./courses.csv', 'utf-8');
    
    // 2. แปลง CSV เป็น JSON Object
    // แยกบรรทัด -> กรองบรรทัดว่าง -> แปลงข้อมูล
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    const coursesData = lines.map(line => {
      // เทคนิค: แยกด้วย string "," (ลูกน้ำที่อยู่ระหว่างฟันหนู)
      // เพื่อป้องกันกรณีในชื่อวิชามีลูกน้ำ
      const parts = line.split('","');

      // Clean ข้อมูล: ลบฟันหนูตัวแรกสุดและตัวท้ายสุดออก
      const cleanParts = parts.map(p => p.replace(/^"|"$/g, '').trim());

      return {
        code: cleanParts[0],
        name: cleanParts[1],
        credit: cleanParts[2],
        time: cleanParts[3]
      };
    });

    // 3. ล้างของเก่าแล้วยัดของใหม่
    await Course.deleteMany();
    console.log('🧹 clear old data successfully');

    await Course.insertMany(coursesData);
    console.log(`🚛 add data successfully ${coursesData.length} วิชา!`);

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

importData();