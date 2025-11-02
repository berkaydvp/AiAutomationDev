import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız')
      }

      // Save token and user info
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      }))

      // Redirect based on role - backend'den dönen isAdmin'e göre
      if (data.isAdmin) {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header-section">
            <div className="auth-logo">🤖</div>
            <h1>Hoş Geldiniz</h1>
            <p>Devam etmek için giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-section">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="ornek@email.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="auth-error-message">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner">⟳</span>
                  Giriş Yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <div className="auth-footer-section">
            <p>
              Hesabınız yok mu?{' '}
              <button 
                onClick={() => navigate('/register')}
                className="auth-link-button"
              >
                Kayıt Ol
              </button>
            </p>
          </div>
        </div>

        <div className="auth-info-card">
          <h2>🚗 Ford DB Assistant</h2>
          <p>Veritabanı sorgularınızı doğal dille yapın</p>
          <div className="auth-features">
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>Akıllı Chat Arayüzü</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔧</span>
              <span>Güçlü Araçlar</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Hızlı Yanıtlar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
