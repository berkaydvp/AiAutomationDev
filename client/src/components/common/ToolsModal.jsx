import { useEffect } from 'react'
import './ToolsModal.css'

function ToolsModal({ tools, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔧 Available Tools</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {tools.length === 0 ? (
            <p className="no-tools">Henüz araç yüklenmedi...</p>
          ) : (
            <div className="tools-grid">
              {tools.map((tool, index) => (
                <div key={index} className="tool-card">
                  <div className="tool-icon">🛠️</div>
                  <div className="tool-name">{tool}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ToolsModal
