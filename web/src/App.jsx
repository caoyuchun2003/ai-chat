import { useChat } from './hooks/useChat.js'
import MessageList from './components/MessageList.jsx'
import ChatInput from './components/ChatInput.jsx'

export default function App() {
  const { messages, typing, loading, send, clear, skipTyping } = useChat()

  const handleClear = () => {
    if (messages.length === 0) return
    if (window.confirm('确定清空所有对话记录?')) clear()
  }

  return (
    <div className="app">
      <header className="header">
        <h1>AI 聊天</h1>
        <button className="clear-btn" onClick={handleClear} title="清空对话">
          清空
        </button>
      </header>
      <MessageList messages={messages} typing={typing} loading={loading} onSkip={skipTyping} />
      <ChatInput onSend={send} disabled={loading || !!typing} />
    </div>
  )
}
