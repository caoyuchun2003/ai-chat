# AI 聊天

GitHub Pages 前端 + 百度 CFC 代理千帆。站点：**https://chat.yuchuntest.com/**

```
浏览器 (chat.yuchuntest.com)  ──HTTPS──▶  百度 CFC  ──▶  千帆
```

功能：多轮上下文、打字机、Markdown、localStorage、深浅色、移动端。

## 目录

```
web/    React + Vite → Pages
cfc/    CFC 函数（bsam 部署）
```

## 部署

### 1. CFC

```bash
export QIANFAN_API_KEY='千帆 Bearer Key'   # 或已有 QIANFAN_AK
cd cfc && bash scripts/deploy.sh
```

控制台复制 HTTP 触发器 URL（POST + OPTIONS）。

### 2. 前端 / Pages

仓库 Variables：`API_URL` = 触发器 URL。  
推送 `main` → Actions 部署。

自定义域：`chat.yuchuntest.com`（`base: '/'`）。

百度 DNS：主机 `chat`，类型 **CNAME**，值 `caoyuchun2003.github.io`。  
仓库 Pages → Custom domain → Enforce HTTPS。

### 3. CORS

CFC 环境变量 `ALLOW_ORIGIN=https://chat.yuchuntest.com`（deploy 模板已写）。

## 本地

```bash
cd web
npm install
VITE_API_URL='<CFC触发器URL>' npm run dev
```

## 常见问题

- **CORS**：触发器勾选 OPTIONS；`ALLOW_ORIGIN` 与页面源一致
- **401**：确认是千帆 v2 API Key，不是 IAM AK/SK
- **白屏 / 资源 404**：自定义域必须用 `base: '/'`（本仓库已设）
