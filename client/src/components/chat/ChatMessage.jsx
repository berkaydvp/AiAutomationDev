import './ChatMessage.css'

function ChatMessage({ message }) {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
      <div className="message-avatar">
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        <div className="message-text">{message.content}</div>
        <div className="message-time">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  )
}

export default ChatMessage
