import { useCallback, useEffect, useRef, useState } from 'react'
import { sendChat } from '../lib/api.js'

const STORAGE_KEY = 'ai-chat-history'
const TYPE_INTERVAL_MS = 24 // 打字机每帧间隔
const TYPE_CHARS_PER_TICK = 3 // 每帧显示字符数

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 聊天状态管理:
 * - messages: [{role, content, error?}]
 * - typing: 正在打字机展示的 AI 消息(还没进 messages)
 * - loading: 等待接口返回中
 */
export function useChat() {
  const [messages, setMessages] = useState(loadHistory)
  const [typing, setTyping] = useState(null) // { full, shown }
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const saveTimerRef = useRef(null)

  // messages 变化时防抖保存
  useEffect(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      } catch {
        /* localStorage 满了就算了 */
      }
    }, 300)
    return () => clearTimeout(saveTimerRef.current)
  }, [messages])

  useEffect(() => () => clearInterval(timerRef.current), [])

  /** 打字机:逐步展示 full,结束后并入 messages */
  const startTyping = useCallback((full) => {
    let shown = 0
    setTyping({ full, shown: '' })
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      shown += TYPE_CHARS_PER_TICK
      if (shown >= full.length) {
        clearInterval(timerRef.current)
        setTyping(null)
        setMessages((prev) => [...prev, { role: 'assistant', content: full }])
      } else {
        setTyping({ full, shown: full.slice(0, shown) })
      }
    }, TYPE_INTERVAL_MS)
  }, [])

  /** 跳过打字机动画,直接显示完整回复 */
  const skipTyping = useCallback(() => {
    clearInterval(timerRef.current)
    setTyping((t) => {
      if (t) {
        setMessages((prev) => [...prev, { role: 'assistant', content: t.full }])
      }
      return null
    })
  }, [])

  const send = useCallback(
    async (text) => {
      const content = text.trim()
      if (!content || loading || typing) return

      const userMsg = { role: 'user', content }
      // 上下文只用正常消息(排除标记为 error 的)
      const context = [...messages.filter((m) => !m.error), userMsg]
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const reply = await sendChat(context)
        setLoading(false)
        startTyping(reply)
      } catch (err) {
        setLoading(false)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `出错了:${err.message}`, error: true },
        ])
      }
    },
    [messages, loading, typing, startTyping]
  )

  const clear = useCallback(() => {
    clearInterval(timerRef.current)
    setTyping(null)
    setMessages([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return { messages, typing, loading, send, clear, skipTyping }
}
