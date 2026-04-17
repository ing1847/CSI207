import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../AuthLayout/AuthLayout'
import './Login.css'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
)

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error)
      localStorage.setItem('token', data.token)
      localStorage.setItem('firstName', data.firstName)
      navigate('/chat')
    } catch {
      setError('ไม่สามารถเชื่อมต่อ server ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="greeting">
        <h2>ยินดีต้อนรับกลับ</h2>
        <p>เข้าสู่ระบบ Chatbot ปาการัง</p>
      </div>

      <div className="field">
        <label>อีเมล</label>
        <input
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div className="field">
        <label>รหัสผ่าน</label>
        <input
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
      </div>

      <div className="forgot">
        <a>ลืมรหัสผ่าน?</a>
      </div>

      {error && <div style={{ color: 'red', fontSize: '14px', marginTop: '-8px' }}>{error}</div>}

      <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>

      <div className="divider">หรือ</div>

      <button className="google-btn">
        <GoogleIcon />
        ดำเนินการต่อด้วย Google
      </button>

      <div className="footer-text">
        ยังไม่มีบัญชี? <a onClick={() => navigate('/register')}>สมัครสมาชิก</a>
      </div>
    </AuthLayout>
  )
}

export default Login