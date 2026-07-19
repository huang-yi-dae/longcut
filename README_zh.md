# LongCut（本地版）

> **Fork 自 [SamuelZ12/longcut](https://github.com/SamuelZ12/longcut)**（AGPL v3）  
> 原作者：[Samuel Z](https://github.com/SamuelZ12) — 一款 Next.js 15 视频学习工具。

将 LongCut 改造为完全自托管的本地部署版本。粘贴 YouTube 链接，获得 AI 驱动的高光片段、主题拆解、时间戳问答和笔记功能——全部在你自己的电脑上运行。

## 与上游的差异

| 方面 | 上游 | 本分支 |
|------|------|--------|
| **数据库** | Supabase（PostgreSQL，云端） | SQLite（`node:sqlite`，本地文件） |
| **认证** | Supabase Auth（邮箱 / 社交登录） | 无 — 固定本地用户，自动登录 |
| **AI 提供商** | MiniMax / Grok / Gemini | DeepSeek（可配置） |
| **存储** | Supabase Storage | 未使用（本地图片即可） |
| **支付** | Stripe 订阅 | 已禁用 |
| **部署** | Vercel（Serverless） | 本地开发（`pnpm dev -p 8080`） |
| **代理** | 不需要 | `https-proxy-agent` 用于访问 YouTube |

其余功能——AI 高光引擎、字幕提取管线、笔记工作区、聊天界面——与上游保持一致。

## 快速开始

### 环境要求

- **Node.js 22+**（使用了 `node:sqlite`，最低 22.x）
- **pnpm**（本项目使用 pnpm 作为包管理器）
- **DeepSeek** API key（或通过 `AI_PROVIDER` 配置其他提供商）
- 用于访问 YouTube 的代理 / VPN（在 `.env.local` 中设置 `GLOBAL_AGENT_HTTP_PROXY`）

### 安装

```bash
git clone https://github.com/huang-yi-dae/longcut.git
cd longcut
pnpm install
```

### 环境配置

在项目根目录创建 `.env.local`：

```env
# AI 提供商（推荐 DeepSeek）
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-你的-key

# 应用地址（默认 8080 端口，避免与其他 Next.js 项目冲突）
NEXT_PUBLIC_APP_URL=http://localhost:8080

# CSRF 保护（使用 openssl rand -base64 32 生成）
CSRF_SALT=longcut_dev_salt_2026_random_string

# YouTube 代理（Node.js 的 fetch 不走系统代理）
GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:10090
```

### 运行

```bash
pnpm dev       # http://localhost:8080
```

应用会自动以本地用户身份登录，无需注册、无需密码。数据存储在 `data/local.db`（已加入 .gitignore）。

## 架构（与上游相同）

LongCut 是一个 Next.js 15 App Router 应用，包含：

- **AI 管线**：提供商无关的提示词、结构化输出 Schema（Zod）、字幕分块、fallback 处理，通过 `lib/ai-providers/` 实现。
- **字幕引擎**：直接从 YouTube 提取公开字幕，支持多客户端回退（Android → Web → iOS）。
- **工作区界面**：YouTube 播放器同步、高光片段 Play All、基于主题的重新生成、带引用的 AI 聊天、笔记仪表盘。
- **安全**：CSP 头、CSRF 令牌、Zod 输入验证、请求体大小限制。

## 项目结构

```
app/          # Next.js App Router（页面、API 路由、Server Actions）
components/   # React 组件（聊天、高光、笔记、播放器、UI 基础组件）
contexts/     # Auth 上下文（固定本地用户）
lib/          # 业务逻辑（AI、数据库、代理、验证、提供商）
scripts/      # 开发工具和集成测试
types/        # TypeScript 环境声明
```

## 开源协议

本项目基于 GNU Affero General Public License v3.0（AGPL v3）发布，与上游项目保持一致。详见 [LICENSE](LICENSE)。

原版版权：SamuelZ12/longcut。修改版权：2026 huang-yi-dae。
