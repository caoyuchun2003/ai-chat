/**
 * 百度 CFC：AI 聊天代理（nodejs12 兼容，无原生 fetch）
 *
 * 环境变量：
 *   QIANFAN_API_KEY  必填
 *   MODEL            可选，默认 deepseek-v3.2
 *   ALLOW_ORIGIN     可选，默认 https://chat.yuchuntest.com
 */

'use strict';

var https = require('https');
var url = require('url');

var QIANFAN_URL = 'https://qianfan.baidubce.com/v2/chat/completions';
var MAX_MESSAGES = 20;
var MAX_TOTAL_CHARS = 8000;

var SYSTEM_PROMPT =
  '你是「瑶瑶」，一个温暖、聪明又贴心的 AI 小助手。' +
  '你的名字取自小主人「夏瑶」，是她的爸爸亲手为她做的。' +
  '说话亲切、有耐心、带点活泼；遇到小朋友能听懂的问题就用简单的话解释，' +
  '遇到正经问题也能认真、专业地回答。有人问你是谁时，就大方地说你叫瑶瑶。';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':
      process.env.ALLOW_ORIGIN || 'https://chat.yuchuntest.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function respond(statusCode, bodyObj) {
  return {
    isBase64Encoded: false,
    statusCode: statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(bodyObj),
  };
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  var cleaned = [];
  for (var i = 0; i < raw.length; i++) {
    var m = raw[i];
    if (
      m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0
    ) {
      cleaned.push({ role: m.role, content: m.content });
    }
  }
  if (cleaned.length === 0) return null;

  var recent = cleaned.slice(-MAX_MESSAGES);
  while (recent.length > 0 && recent[0].role !== 'user') recent.shift();
  if (recent.length === 0) return null;

  var totalChars = 0;
  for (var j = 0; j < recent.length; j++) {
    totalChars += recent[j].content.length;
  }
  if (totalChars > MAX_TOTAL_CHARS) return null;

  return recent;
}

function httpsJson(method, targetUrl, headers, bodyObj) {
  return new Promise(function (resolve, reject) {
    var u = url.parse(targetUrl);
    var body = bodyObj ? JSON.stringify(bodyObj) : null;
    var opts = {
      hostname: u.hostname,
      path: u.path,
      method: method,
      headers: Object.assign({}, headers || {}, {
        'Content-Type': 'application/json',
      }),
    };
    if (body) {
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    var req = https.request(opts, function (res) {
      var chunks = [];
      res.on('data', function (c) {
        chunks.push(c);
      });
      res.on('end', function () {
        var text = Buffer.concat(chunks).toString('utf8');
        var data = null;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          return reject(new Error('invalid json from upstream'));
        }
        resolve({ status: res.statusCode || 0, data: data });
      });
    });
    req.on('error', reject);
    req.setTimeout(55000, function () {
      req.destroy(new Error('upstream timeout'));
    });
    if (body) req.write(body);
    req.end();
  });
}

exports.handler = async function (event) {
  var method = (event.httpMethod || '').toUpperCase();

  if (method === 'OPTIONS') {
    return {
      isBase64Encoded: false,
      statusCode: 204,
      headers: corsHeaders(),
      body: '',
    };
  }

  if (method !== 'POST') {
    return respond(405, { error: 'method not allowed' });
  }

  if (!process.env.QIANFAN_API_KEY) {
    return respond(500, { error: 'QIANFAN_API_KEY 未配置' });
  }

  var payload;
  try {
    var rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf-8')
      : event.body || '';
    payload = JSON.parse(rawBody);
  } catch (e) {
    return respond(400, { error: '请求体不是合法 JSON' });
  }

  var messages = sanitizeMessages(payload.messages);
  if (!messages) {
    return respond(400, { error: 'messages 格式不正确或超出长度限制' });
  }

  try {
    var out = await httpsJson(
      'POST',
      QIANFAN_URL,
      { Authorization: 'Bearer ' + process.env.QIANFAN_API_KEY },
      {
        model: process.env.MODEL || 'deepseek-v3.2',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages),
      }
    );

    if (out.status < 200 || out.status >= 300) {
      console.error('qianfan error:', out.status, JSON.stringify(out.data));
      var detail =
        (out.data && out.data.error && out.data.error.message) ||
        (out.data && out.data.error_msg) ||
        undefined;
      return respond(502, {
        error: '千帆接口返回 ' + out.status,
        detail: detail,
      });
    }

    var reply =
      out.data &&
      out.data.choices &&
      out.data.choices[0] &&
      out.data.choices[0].message &&
      out.data.choices[0].message.content;
    if (typeof reply !== 'string') {
      console.error('unexpected qianfan response:', JSON.stringify(out.data));
      return respond(502, { error: '千帆返回格式异常' });
    }

    return respond(200, { reply: reply });
  } catch (err) {
    console.error('request failed:', err);
    return respond(502, { error: '调用千帆接口失败: ' + (err.message || err) });
  }
};
