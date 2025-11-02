import { useState, useRef, useEffect } from 'react'
import './ChatInput.css'

function ChatInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Sorunuzu yazın..."
        disabled={disabled}
        rows={1}
      />
      <button 
        type="submit" 
        className="send-button"
        disabled={disabled || !message.trim()}
      >
        {disabled ? '⟳' : '➤'}
      </button>
    </form>
  )
}

export default ChatInput
