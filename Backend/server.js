const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const session = require('express-session')
require('dotenv').config()

const app = express()

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true)
  },
  credentials: true
}))
app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err))

// ─── Models ───────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: { type: String, default: null },
  googleId: String,
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  title: { type: String, default: 'บทสนทนาใหม่' },
  messages: [
    {
      role: { type: String, enum: ['user', 'bot'] },
      text: String,
    }
  ],
}, { timestamps: true })

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema)

// ─── Auth Middleware ───────────────────────────────────────────────────────────

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// ─── Passport / Google OAuth ───────────────────────────────────────────────────

passport.serializeUser((user, done) => {
  done(null, user._id.toString())
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value })
    if (!user) {
      user = await User.create({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        password: null,
        googleId: profile.id
      })
    } else {
      user.googleId = profile.id
      user.firstName = profile.name.givenName
      user.lastName = profile.name.familyName
      user = await user.save()
    }
    return done(null, user)
  } catch (err) {
    return done(err, null)
  }
}))

// ─── Auth Routes ───────────────────────────────────────────────────────────────

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`
  }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const firstName = encodeURIComponent(req.user.firstName)
    const userId = req.user._id.toString()
    res.redirect(`${frontendUrl}/login?token=${token}&firstName=${firstName}&userId=${userId}`)
  }
)

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
    if (!user.password) return res.status(401).json({ error: 'บัญชีนี้ใช้ Google login เท่านั้น' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' })
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, firstName: user.firstName, userId: user._id.toString() })
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' })
  }
})

// ─── History Routes ────────────────────────────────────────────────────────────

// GET รายการ sessions ทั้งหมดของ user
app.get('/history/:userId', authMiddleware, async (req, res) => {
  try {
    const sessions = await ChatHistory.find(
      { userId: req.params.userId },
      'sessionId title updatedAt'
    ).sort({ updatedAt: -1 })
    res.json(sessions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST บันทึก / อัปเดต session
app.post('/history/save', authMiddleware, async (req, res) => {
  try {
    const { sessionId, messages } = req.body
    if (!sessionId || !messages?.length) {
      return res.status(400).json({ error: 'sessionId และ messages จำเป็นต้องมี' })
    }
    const firstUserMsg = messages.find(m => m.role === 'user')
    const title = firstUserMsg
      ? firstUserMsg.text.slice(0, 40)
      : 'บทสนทนาใหม่'

    const history = await ChatHistory.findOneAndUpdate(
      { sessionId },
      { userId: req.userId, sessionId, messages, title },
      { upsert: true, new: true }
    )
    res.json({ ok: true, sessionId: history.sessionId, title: history.title })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET ดึงข้อความใน session เดียว
app.get('/history/session/:sid', authMiddleware, async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ sessionId: req.params.sid })
    if (!history) return res.status(404).json({ error: 'ไม่พบ session' })
    res.json({ messages: history.messages })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE ลบ session
app.delete('/history/session/:sid', authMiddleware, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ sessionId: req.params.sid })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Error Handler ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err)
  res.status(500).json({ error: err.message })
})

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
})