require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. เชื่อมต่อ Database ---
// (ใช้ลิงก์เดิมของคุณ ถ้าเคยแก้ตรงนี้ ให้เอาลิงก์ของคุณมาใส่นะครับ)
const mongoURI = "mongodb+srv://yom1nr:Phatsakorn%402005yom1nr@myschedule.fcojqrd.mongodb.net/?appName=MySchedule";
const JWT_SECRET = "PlanerByYom1nr_SecretKey_2025";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ DB Error:', err));

// --- 2. สร้าง Schema ---
const courseSchema = new mongoose.Schema({
  code: String, name: String, credit: Number, time: String,
  semester: { type: String, default: "3/2568" }
});
const Course = mongoose.model('Course', courseSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mySchedule: { type: mongoose.Schema.Types.Mixed, default: {} }
});
const User = mongoose.model('User', userSchema);


// --- 3. API Routes ---

app.get('/api/courses', async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = semester ? { semester } : {};
    const courses = await Course.find(filter);
    res.json(courses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🟢 API ดึงรายการภาคการศึกษาทั้งหมด
app.get('/api/semesters', async (req, res) => {
  try {
    const semesters = await Course.distinct('semester');
    res.json(semesters);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🔵 API สมัครสมาชิก (Register) -> แก้ไข: ไม่รับ studentID แล้ว
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body; // <-- รับแค่ 2 ค่า

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      mySchedule: {}
    });

    await newUser.save();
    console.log(`👤 สมาชิกใหม่: ${username}`);
    res.json({ message: "สมัครสมาชิกสำเร็จ!" });

  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🟠 API เข้าสู่ระบบ (Login) -> เหมือนเดิม
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "ไม่พบชื่อผู้ใช้นี้" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "รหัสผ่านผิด!" });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    // ส่งกลับโดยไม่มี studentID
    res.json({
      token,
      user: { id: user._id, username: user.username, mySchedule: user.mySchedule }
    });
    console.log(`🔑 Login สำเร็จ: ${username}`);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🟣 API บันทึกตารางเรียน (แยกตามภาคการศึกษา)
app.post('/api/save-schedule', async (req, res) => {
  try {
    const { username, cart, semester } = req.body;
    if (!semester) return res.status(400).json({ message: "กรุณาระบุภาคการศึกษา" });
    await User.findOneAndUpdate(
      { username },
      { $set: { [`mySchedule.${semester}`]: cart } }
    );
    res.json({ message: "บันทึกตารางเรียบร้อย!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});