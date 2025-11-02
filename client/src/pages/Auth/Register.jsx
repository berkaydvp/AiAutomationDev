import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt başarısız')
      }

      // Save token and user info
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      }))

      // Redirect to home
      navigate('/')
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
            <h1>Hesap Oluştur</h1>
            <p>Hemen başlamak için kayıt olun</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-section">
            <div className="form-row-inline">
              <div className="form-group">
                <label htmlFor="firstName">Ad</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Adınız"
                  autoComplete="given-name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Soyad</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Soyadınız"
                  autoComplete="family-name"
                />
              </div>
            </div>

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
                minLength={6}
                autoComplete="new-password"
              />
              <small className="form-hint">En az 6 karakter olmalı</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Şifre Tekrar</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                minLength={6}
                autoComplete="new-password"
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
                  Kayıt Yapılıyor...
                </>
              ) : (
                'Kayıt Ol'
              )}
            </button>
          </form>

          <div className="auth-footer-section">
            <p>
              Zaten hesabınız var mı?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="auth-link-button"
              >
                Giriş Yap
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

export default Register
