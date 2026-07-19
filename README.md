# LongCut (Local Edition)

> **Forked from [SamuelZ12/longcut](https://github.com/SamuelZ12/longcut)** (AGPL v3)  
> Original author: [Samuel Z](https://github.com/SamuelZ12) — a Next.js 15 video learning workspace.

A locally-deployed, single-user adaptation of LongCut that replaces cloud dependencies with a fully self-contained stack. Paste a YouTube URL, get AI-powered highlight reels, topic breakdowns, timestamped answers, and note-taking — all running on your own machine.

## What's Different from Upstream

| Area | Upstream | This Fork |
|------|----------|-----------|
| **Database** | Supabase (PostgreSQL, cloud) | SQLite (`node:sqlite`, local file) |
| **Authentication** | Supabase Auth (email/social) | None — fixed local user, auto-login |
| **AI Provider** | MiniMax / Grok / Gemini | DeepSeek (configurable) |
| **Storage** | Supabase Storage | Not used (local images only) |
| **Payments** | Stripe subscriptions | Disabled |
| **Deployment** | Vercel (serverless) | Local dev (`pnpm dev -p 8080`) |
| **Proxy** | Not needed | `https-proxy-agent` for YouTube access |

Everything else — the AI highlight engine, transcript pipeline, note-taking workspace, chat UI — is unchanged from upstream.

## Quick Start

### Prerequisites

- **Node.js 22+** (the app uses `node:sqlite`, available since 22.x)
- **pnpm** (the project uses pnpm as package manager)
- A **DeepSeek** API key (or configure another provider via `AI_PROVIDER`)
- A proxy or VPN to access YouTube (optional — only needed if blocked in your region; set `GLOBAL_AGENT_HTTP_PROXY` in `.env.local`)

### Setup

```bash
git clone https://github.com/huang-yi-dae/longcut.git
cd longcut
pnpm install
```

### Configure Environment

Create `.env.local` in the project root:

```env
# AI provider (DeepSeek recommended)
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-key-here

# App URL (default port 8080 to avoid conflicts with other Next.js projects)
NEXT_PUBLIC_APP_URL=http://localhost:8080

# CSRF protection (generate with: openssl rand -base64 32)
CSRF_SALT=longcut_dev_salt_2026_random_string

# YouTube proxy — optional. Set if you need a proxy to access YouTube
# (e.g. users in mainland China). Leave empty or comment out to skip.
# GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:10090
```

### Run

```bash
pnpm dev       # http://localhost:8080
```

The app auto-logs you in as a local user. No sign-up, no passwords. Data is stored in `data/local.db` (gitignored).

## Architecture (unchanged from upstream)

LongCut is a Next.js 15 App Router application with:

- **AI pipeline**: Provider-agnostic prompts, structured output schemas (Zod), transcript chunking, and fallback handling via `lib/ai-providers/`.
- **Transcript engine**: Direct YouTube caption extraction with multi-client fallback (Android → Web → iOS).
- **Workspace UI**: YouTube player sync, highlight reels with Play All, theme-based re-generation, AI chat with citations, notes dashboard.
- **Security**: CSP headers, CSRF tokens, Zod input validation, request body size guards.

## Project Structure

```
app/          # Next.js App Router (pages, API routes, Server Actions)
components/   # React components (chat, highlights, notes, player, UI primitives)
contexts/     # Auth context (fixed local user)
lib/          # Business logic (AI, DB, proxy, validation, providers)
scripts/      # Dev tools and integration tests
types/        # TypeScript ambient declarations
```

## License

This project is distributed under the GNU Affero General Public License v3.0 (AGPL v3), the same license as the upstream project. See [LICENSE](LICENSE) for details.

Original copyright: SamuelZ12/longcut. Modifications copyright: 2026 huang-yi-dae.
