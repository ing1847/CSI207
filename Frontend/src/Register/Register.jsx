import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Register.css'

function getStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const widths = ['0%', '25%', '50%', '75%', '100%']
  const colors = ['#ef4444', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']
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

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="logo" onClick={() => navigate('/')}>
        
        </div>

        <div className="greeting">
          <h2>เริ่มต้นการสำรวจ</h2>
          <p>สร้างบัญชีเพื่อเรียนรู้โลกปะการัง</p>
        </div>

        <div className="row-2">
          <input placeholder="ชื่อ" onChange={e => setForm({...form, firstName: e.target.value})}/>
          <input placeholder="นามสกุล" onChange={e => setForm({...form, lastName: e.target.value})}/>
        </div>

        <div className="field">
          <label>อีเมล</label>
          <input type="email" placeholder="your@email.com"
            onChange={e => setForm({...form, email: e.target.value})}/>
        </div>

        <div className="field">
          <label>รหัสผ่าน</label>
          <input type="password"
            onChange={e => setForm({...form, password: e.target.value})}/>
          <div className="strength-bar">
            <div className="strength-fill"
              style={{ width: strength.width, background: strength.color }} />
          </div>
        </div>

        <div className="field">
          <label>ยืนยันรหัสผ่าน</label>
          <input type="password"
            onChange={e => setForm({...form, confirmPassword: e.target.value})}/>
        </div>

        <button className="submit-btn" onClick={handleSubmit}>
          สร้างบัญชี
        </button>

        <div className="footer-text">
          มีบัญชีแล้ว? <a onClick={() => navigate('/login')}>เข้าสู่ระบบ</a>
        </div>

      </div>
    </div>
  )
}

export default Register