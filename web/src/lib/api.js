// CFC HTTP 触发器地址:
// 优先读构建时环境变量 VITE_API_URL,否则用下面的常量(部署 CFC 后替换)
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://7f5dhf17xhh4.cfc-execute.bj.baidubce.com';

const MAX_CONTEXT_MESSAGES = 20; // 与 CFC 侧限制保持一致

/**
 * 发送对话上下文,返回 AI 回复文本
 * @param {{role: 'user'|'assistant', content: string}[]} messages
 * @returns {Promise<string>}
 */
export async function sendChat(messages) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages.slice(-MAX_CONTEXT_MESSAGES) }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`服务返回异常 (HTTP ${res.status})`);
  }

  if (!res.ok || typeof data.reply !== 'string') {
    throw new Error(data.error || `请求失败 (HTTP ${res.status})`);
  }
  return data.reply;
}
