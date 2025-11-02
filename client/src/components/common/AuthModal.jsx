import { useState } from 'react'
import './AuthModal.css'

function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu')
      }

      // Save token to localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      }))

      onAuthSuccess(data)
      onClose()
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>✕</button>
        
        <div className="auth-header">
          <h2>{isLogin ? '🔐 Giriş Yap' : '📝 Kayıt Ol'}</h2>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true)
              setError('')
            }}
          >
            Giriş Yap
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false)
              setError('')
            }}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-row">
              <div className="form-group">
                <label>Ad</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Adınız"
                />
              </div>
              <div className="form-group">
                <label>Soyad</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Soyadınız"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ornek@email.com"
            />
          </div>

          <div className="form-group">
            <label>Şifre</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? '⟳ Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
