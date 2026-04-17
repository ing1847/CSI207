const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err))

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ firstName, lastName, email, password: hashed })
    res.json({ message: 'สมัครสมาชิกสำเร็จ', userId: user._id })
  } catch (err) {
    res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' })
  }
})

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'ไม่พบผู้ใช้งาน' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' })
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, firstName: user.firstName })
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' })
  }
})

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
})