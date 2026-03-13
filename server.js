const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://attendance-frontend-seven-phi.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Connect Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log(err));

// --- Models ---
// User Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'employee' }
});
const User = mongoose.model('User', userSchema);

// Attendance Model
const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String, // IN, OUT
  workMode: String, // ONSITE, REMOTE, FIELD
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// Leave Model
const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  startDate: Date,
  endDate: Date,
  reason: String,
  status: { type: String, default: 'Pending' }
});
const Leave = mongoose.model('Leave', leaveSchema);

// --- Routes ---

// 1. Attendance Routes
app.post('/api/attendance', async (req, res) => {
  try {
    const { userId, type, workMode, latitude, longitude } = req.body;
    const newLog = new Attendance({ userId, type, workMode, latitude, longitude });
    await newLog.save();
    res.json({ success: true, message: 'Attendance recorded', data: newLog });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/attendance/:userId', async (req, res) => {
  try {
    const logs = await Attendance.find({ userId: req.params.userId }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance-stats/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const present = await Attendance.countDocuments({ type: 'IN', timestamp: { $gte: today } });
    res.json({ present });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Leave Routes
app.post('/api/leave', async (req, res) => {
  try {
    const { userId, type, startDate, endDate, reason } = req.body;
    const newLeave = new Leave({ userId, type, startDate, endDate, reason });
    await newLeave.save();
    res.json({ success: true, message: 'Leave request submitted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Demo User (สร้าง User เริ่มต้น)
app.post('/api/auth/register-demo', async (req, res) => {
  try {
    const demoUser = new User({ name: 'John Doe', email: 'john@demo.com', password: '123456', role: 'employee' });
    await demoUser.save();
    res.json({ success: true, message: 'Demo user created', userId: demoUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/demo-login', async (req, res) => {
  try {
    const user = await User.findOne({ email: 'john@demo.com' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, userId: user._id, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
