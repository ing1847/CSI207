import { useNavigate } from 'react-router-dom'
import './AuthLayout.css'

function AuthLayout({ children }) {
  const navigate = useNavigate()

  return (
    <div className="wrap">
      <div className="card">
        <div className="logo" onClick={() => navigate('/')}>
          <div className="logo-icon">🪸</div>
          <div className="logo-text">
            <strong>ปาการัง</strong>
            <span>ที่ท่องเทียวปาการัง</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout