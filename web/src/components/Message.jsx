import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true, gfm: true })

/**
 * 单条消息
 * - 用户消息:纯文本
 * - AI 消息:Markdown 渲染 + XSS 过滤
 * - cursor: 打字机进行中时显示闪烁光标
 */
export default function Message({ role, content, error = false, cursor = false }) {
  const isUser = role === 'user'

  const html = useMemo(() => {
    if (isUser || error) return null
    return DOMPurify.sanitize(marked.parse(content))
  }, [isUser, error, content])

  return (
    <div className={`msg ${isUser ? 'msg-user' : 'msg-ai'}${error ? ' msg-error' : ''}`}>
      <div className="msg-bubble">
        {html !== null ? (
          <>
            <div className="msg-md" dangerouslySetInnerHTML={{ __html: html }} />
            {cursor && <span className="cursor" />}
          </>
        ) : (
          <span className="msg-text">{content}</span>
        )}
      </div>
    </div>
  )
}
