const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'employee' }
});
const User = mongoose.model('User', userSchema);

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  workMode: String,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  startDate: Date,
  endDate: Date,
  reason: String,
  status: { type: String, default: 'Pending' }
});
const Leave = mongoose.model('Leave', leaveSchema);

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
  const today = new Date();
  today.setHours(0,0,0,0);
  const present = await Attendance.countDocuments({ type: 'IN', timestamp: { $gte: today } });
  res.json({ present });
});

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

app.post('/api/auth/register-demo', async (req, res) => {
  try {
    const existUser = await User.findOne({ email: 'john@demo.com' });
    if (existUser) return res.json({ success: true, message: 'User exists', userId: existUser._id });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));
