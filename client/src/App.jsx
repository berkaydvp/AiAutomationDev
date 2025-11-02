import { useState, useRef, useEffect } from 'react'
import './App.css'
import { ChatMessage, ChatInput } from './components/chat'
import { Header, ToolsModal, AuthModal } from './components/common'

function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [tools, setTools] = useState([])
  const [user, setUser] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load available tools
    fetchTools()
    // Check if user is logged in
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const fetchTools = async () => {
    try {
      const response = await fetch('/api/chat/tools')
      if (response.ok) {
        const data = await response.json()
        setTools(data)
      }
    } catch (error) {
      console.error('Tools yüklenirken hata:', error)
    }
  }

  const handleAuthSuccess = (authData) => {
    setUser({
      email: authData.email,
      firstName: authData.firstName,
      lastName: authData.lastName
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const handleSendMessage = async (message) => {
    if (!message.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: message })
      })

      if (!response.ok) {
        throw new Error('API isteği başarısız')
      }

      const data = await response.json()
      
      // Add assistant message
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp)
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error)
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <Header 
        onToolsClick={() => setShowTools(true)}
        user={user}
        onLoginClick={() => setShowAuth(true)}
        onLogout={handleLogout}
      />
      
      <main className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>👋 Hoş Geldiniz!</h2>
              <p>Ford veritabanı hakkında sorularınızı sorabilirsiniz.</p>
              <div className="example-prompts">
                <p><strong>Örnek sorular:</strong></p>
                <ul>
                  <li>Hangi tablolar var?</li>
                  <li>Müşteri bilgilerini göster</li>
                  <li>En çok satılan ürünler nelerdir?</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          {isLoading && (
            <div className="loading-indicator">
              <div className="typing-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </main>

      <footer className="footer">
        <p>Powered by OpenAI & Model Context Protocol</p>
      </footer>

      {showTools && (
        <ToolsModal 
          tools={tools} 
          onClose={() => setShowTools(false)} 
        />
      )}

      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}

export default App
