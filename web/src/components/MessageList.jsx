import { useEffect, useRef } from 'react'
import Message from './Message.jsx'

export default function MessageList({ messages, typing, loading, onSkip }) {
  const bottomRef = useRef(null)

  // 新消息 / 打字中自动滚到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, typing, loading])

  const empty = messages.length === 0 && !typing && !loading

  return (
    <div className="message-list" onClick={typing ? onSkip : undefined}>
      {empty && (
        <div className="empty-hint">
          <p>👋 你好,有什么可以帮你的?</p>
          <p className="empty-sub">对话记录保存在本地浏览器中</p>
        </div>
      )}
      {messages.map((m, i) => (
        <Message key={i} role={m.role} content={m.content} error={m.error} />
      ))}
      {typing && <Message role="assistant" content={typing.shown} cursor />}
      {loading && (
        <div className="msg msg-ai">
          <div className="msg-bubble">
            <span className="dots">
              <i /><i /><i />
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
