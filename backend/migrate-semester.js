// migrate-semester.js
// สคริปต์สำหรับ migrate ข้อมูลเก่า → เพิ่ม semester ให้ courses + แปลง user.mySchedule
// ⚠️ รันครั้งเดียว: node migrate-semester.js

require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = "mongodb+srv://yom1nr:Phatsakorn%402005yom1nr@myschedule.fcojqrd.mongodb.net/?appName=MySchedule";
const DEFAULT_SEMESTER = "3/2568";

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => { console.log('❌ DB Error:', err); process.exit(1); });

// Schema ตามโครงสร้างใหม่
const courseSchema = new mongoose.Schema({
    code: String, name: String, credit: Number, time: String, group: String,
    semester: { type: String, default: DEFAULT_SEMESTER }
});
const Course = mongoose.model('Course', courseSchema);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    mySchedule: { type: mongoose.Schema.Types.Mixed, default: {} }
});
const User = mongoose.model('User', userSchema);

const migrate = async () => {
    try {
        // 1. แปะ semester ให้ courses ที่ยังไม่มี
        const courseResult = await Course.updateMany(
            { semester: { $exists: false } },
            { $set: { semester: DEFAULT_SEMESTER } }
        );
        console.log(`📚 Courses: อัปเดต ${courseResult.modifiedCount} รายการ → semester "${DEFAULT_SEMESTER}"`);

        // 2. ย้าย user.mySchedule จาก Array → Object
        const users = await User.find();
        let migratedCount = 0;

        for (const user of users) {
            // ถ้า mySchedule เป็น Array (โครงสร้างเก่า) → แปลงเป็น Object
            if (Array.isArray(user.mySchedule)) {
                const oldSchedule = user.mySchedule;
                const newSchedule = {};
                if (oldSchedule.length > 0) {
                    newSchedule[DEFAULT_SEMESTER] = oldSchedule;
                }
                await User.updateOne(
                    { _id: user._id },
                    { $set: { mySchedule: newSchedule } }
                );
                migratedCount++;
                console.log(`  👤 ${user.username}: Array(${oldSchedule.length}) → { "${DEFAULT_SEMESTER}": [...] }`);
            }
        }

        console.log(`\n✅ Migration สำเร็จ!`);
        console.log(`   📚 Courses tagged: ${courseResult.modifiedCount}`);
        console.log(`   👤 Users migrated: ${migratedCount}`);
        process.exit();

    } catch (error) {
        console.error('❌ Migration Error:', error);
        process.exit(1);
    }
};

migrate();
