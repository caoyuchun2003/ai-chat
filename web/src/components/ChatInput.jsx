import { useRef, useState } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  const submit = () => {
    if (disabled || !value.trim()) return
    onSend(value)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    // Enter 发送,Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const handleInput = (e) => {
    setValue(e.target.value)
    // 自适应高度
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  return (
    <div className="chat-input">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        placeholder="和瑶瑶说点什么,Enter 发送,Shift+Enter 换行"
        onChange={handleInput}
        onKeyDown={handleKeyDown}
      />
      <button onClick={submit} disabled={disabled || !value.trim()} aria-label="发送">
        ➤
      </button>
    </div>
  )
}
