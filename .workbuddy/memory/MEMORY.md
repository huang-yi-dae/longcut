# LongCut 项目长期记忆

## 学习进度
- Stage 5.7~7.10 理论阶段全部完成（2026-05-28 ~ 2026-06-01）
- 开始 LongCut 实战阶段
- 2026-06-04：组件阅读实战 + 函数 Props 理解 + VideoHeader 挂载

## 实战记录
- 乐观更新：video-header.tsx 收藏按钮
- Server Action：toggle-favorite route.ts → app/actions/toggle-favorite.ts
- Bug 修复：highlights-panel.tsx isPlayingAll 未定义（Zustand 迁移遗漏）
- VideoHeader 挂载到分析页面（app/analyze/[videoId]/page.tsx）
- 乐观更新问题修复：去掉 isUpdating，直接乐观更新不显示加载

## 关键理解
- JSX 是函数调用的语法糖：<UrlInput onSubmit={fn} /> 等价于 UrlInput({ onSubmit: fn })
- 子组件通知父组件的唯一方式：调用父组件传进来的函数
- e.preventDefault() 阻止浏览器默认的页面刷新行为
- React ≈ Flask，Next.js ≈ Django（Python 类比）

## 项目技术栈
- 包管理：pnpm（不是 npm）
- 数据库：Supabase（不是 Prisma）
- 认证：Supabase Auth（邮箱登录可用，Google OAuth 需额外配置）
- 状态管理：Zustand
