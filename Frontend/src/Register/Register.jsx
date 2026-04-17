import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../AuthLayout/AuthLayout'
import './Register.css'

function getStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const widths = ['0%', '25%', '50%', '75%', '100%']
  const colors = ['#e24b4a', '#e24b4a', '#ef9f27', '#97c459', '#1d9e75']
  return { width: widths[score], color: colors[score] }
}

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const strength = getStrength(form.password)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน')
      return
    }
    console.log('Register:', form)
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <AuthLayout>
      <div className="greeting">
        <h2>เริ่มต้นการสำรวจ</h2>
        <p>สร้างบัญชีเพื่อเรียนรู้โลกปะการัง</p>
      </div>

      <div className="row-2">
        <div className="field">
          <label>ชื่อ</label>
          <input
            type="text"
            placeholder="ชื่อจริง"
            value={form.firstName}
            onChange={set('firstName')}
          />
        </div>
        <div className="field">
          <label>นามสกุล</label>
          <input
            type="text"
            placeholder="นามสกุล"
            value={form.lastName}
            onChange={set('lastName')}
          />
        </div>
      </div>

      <div className="field">
        <label>อีเมล</label>
        <input
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={set('email')}
        />
      </div>

      <div className="field">
        <label>รหัสผ่าน</label>
        <input
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
        />
        <div className="strength-bar">
          <div
            className="strength-fill"
            style={{ width: strength.width, background: strength.color }}
          />
        </div>
      </div>

      <div className="field">
        <label>ยืนยันรหัสผ่าน</label>
        <input
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
        />
      </div>

      <button className="submit-btn" onClick={handleSubmit}>
        สร้างบัญชี
      </button>

      <div className="terms">
        การสมัครสมาชิกแสดงว่าคุณยอมรับ <a>นโยบายความเป็นส่วนตัว</a>
      </div>

      <div className="footer-text">
        มีบัญชีแล้ว? <a onClick={() => navigate('/login')}>เข้าสู่ระบบ</a>
      </div>
    </AuthLayout>
  )
}

export default Register