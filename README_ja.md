# LongCut（ローカル版）

> **[SamuelZ12/longcut](https://github.com/SamuelZ12/longcut) からフォーク**（AGPL v3）  
> 原作者：[Samuel Z](https://github.com/SamuelZ12) — Next.js 15 動画学習ワークスペース。

LongCut を完全に自己ホスト型のローカルデプロイ版に改造しました。YouTube の URL を貼り付けるだけで、AI によるハイライトリール、トピック分解、タイムスタンプ付き Q&A、ノート機能がすべて自分のマシン上で動作します。

## アップストリームとの違い

| 項目 | アップストリーム | 本フォーク |
|------|------------------|-----------|
| **データベース** | Supabase（PostgreSQL、クラウド） | SQLite（`node:sqlite`、ローカルファイル） |
| **認証** | Supabase Auth（メール / ソーシャルログイン） | なし — 固定ローカルユーザー、自動ログイン |
| **AI プロバイダ** | MiniMax / Grok / Gemini | DeepSeek（設定可能） |
| **ストレージ** | Supabase Storage | 未使用（ローカル画像のみ） |
| **決済** | Stripe サブスクリプション | 無効化 |
| **デプロイ** | Vercel（サーバーレス） | ローカル開発（`pnpm dev -p 8080`） |
| **プロキシ** | 不要 | `https-proxy-agent` で YouTube アクセス |

その他の機能——AI ハイライトエンジン、字幕抽出パイプライン、ノートワークスペース、チャット UI——はアップストリームと同様です。

## クイックスタート

### 前提条件

- **Node.js 22+**（`node:sqlite` を使用、22.x 以降が必要）
- **pnpm**（本プロジェクトは pnpm をパッケージマネージャとして使用）
- **DeepSeek** API キー（または `AI_PROVIDER` で他のプロバイダを設定）
- YouTube にアクセスするためのプロキシ / VPN（オプション — YouTube がブロックされている地域のみ必要；`.env.local` に `GLOBAL_AGENT_HTTP_PROXY` を設定）

### セットアップ

```bash
git clone https://github.com/huang-yi-dae/longcut.git
cd longcut
pnpm install
```

### 環境設定

プロジェクトルートに `.env.local` を作成：

```env
# AI プロバイダ（DeepSeek 推奨）
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-key-here

# アプリ URL（デフォルトポート 8080、他の Next.js プロジェクトとの競合を避けるため）
NEXT_PUBLIC_APP_URL=http://localhost:8080

# CSRF 保護（openssl rand -base64 32 で生成）
CSRF_SALT=longcut_dev_salt_2026_random_string

# YouTube プロキシ — オプション。YouTube がブロックされている地域
#（中国本土など）ではプロキシアドレスを設定してください。不要なら空欄かコメントアウト。
# GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:10090
```

### 実行

```bash
pnpm dev       # http://localhost:8080
```

アプリは自動的にローカルユーザーとしてログインします。サインアップやパスワードは不要です。データは `data/local.db` に保存されます（.gitignore 対象）。

## アーキテクチャ（アップストリームと同様）

LongCut は Next.js 15 App Router アプリケーションで、以下を含みます：

- **AI パイプライン**：プロバイダに依存しないプロンプト、構造化出力スキーマ（Zod）、字幕チャンク分割、フォールバック処理（`lib/ai-providers/` 経由）。
- **字幕エンジン**：YouTube の公開字幕を直接抽出、マルチクライアントフォールバック（Android → Web → iOS）。
- **ワークスペース UI**：YouTube プレーヤー同期、ハイライトリールの一括再生、テーマベースの再生成、引用付き AI チャット、ノートダッシュボード。
- **セキュリティ**：CSP ヘッダー、CSRF トークン、Zod 入力検証、リクエストボディサイズ制限。

## プロジェクト構成

```
app/          # Next.js App Router（ページ、API ルート、Server Actions）
components/   # React コンポーネント（チャット、ハイライト、ノート、プレーヤー、UI プリミティブ）
contexts/     # 認証コンテキスト（固定ローカルユーザー）
lib/          # ビジネスロジック（AI、DB、プロキシ、バリデーション、プロバイダ）
scripts/      # 開発ツールと統合テスト
types/        # TypeScript アンビエント宣言
```

## ライセンス

本プロジェクトは GNU Affero General Public License v3.0（AGPL v3）の下で配布されています。アップストリームプロジェクトと同一のライセンスです。詳細は [LICENSE](LICENSE) をご参照ください。

原著作者権：SamuelZ12/longcut。改変著作権：2026 huang-yi-dae。
