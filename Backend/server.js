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
  origin: function(origin, callback) {
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

// ─── Schema ───────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  googleId: String,
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

// ─── Passport Google Strategy ─────────────────────────────
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
        password: await bcrypt.hash(Math.random().toString(36), 10),
        googleId: profile.id
      })
    }
    return done(null, user)
  } catch (err) {
    return done(err, null)
  }
}))

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id)
  done(null, user)
})

// ─── Auth Routes ──────────────────────────────────────────
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const firstName = encodeURIComponent(req.user.firstName)  // ✅ encode ชื่อ
    res.redirect(`${frontendUrl}/login?token=${token}&firstName=${firstName}`)
  }
)

// ─── API Routes ───────────────────────────────────────────
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