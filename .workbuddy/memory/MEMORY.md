# LongCut 项目长期记忆

## 学习进度
- Stage 5.7~7.10 理论阶段全部完成（2026-05-28 ~ 2026-06-01）
- 开始 LongCut 实战阶段
- 2026-06-04：组件阅读实战 + 函数 Props 理解 + VideoHeader 挂载
- 2026-06-05：乐观更新修复 + Tailwind CSS + 数据流 + API Route + Zustand
- 2026-06-08：Context vs Zustand + Middleware + JSX 本质 + Supabase 客户端
- 2026-06-11：TypeScript 类型基础 + interface 嵌套 + 泛型 + 可选链 vs 非空断言 + 客户端/服务器运行环境 + Supabase 数据库全量修复
- 2026-06-12：创建 longcut-neat 技能（Skill Creator 实践 + neat-freak 本地化适配）
- 2026-06-12（下午）：React Hooks 进阶 — useEffect / useRef / useCallback / useMemo / 自定义 Hook
- 2026-06-15：Zustand 复习 + Supabase CRUD（insert/select/eq/order/limit/single/delete/upsert）+ 权限检查 + Zod 运行时验证（parse/safeParse/refine/transform）+ 联表查询 JOIN + 格式桥接 + Security 中间件（rateLimit/maxBodySize）+ AI fallback 降级 + 数据库迁移 Migration
- 2026-06-16：Node.js 运行时深入 — 事件循环（同步→微任务→宏任务）/ async/await暂停机制 / 模块系统（export default不加{} vs 具名加{}）/ Stream流（管道传输不爆内存）/ .pipe()连接流 / Express（=Node.js版Flask）/ API安全五关（认证→限流→校验→鉴权→输出过滤）/ Cluster多进程并行 / child_process调外部命令 / process.env环境变量 / MongoDB文档存储（JSON对象可嵌套）vs PostgreSQL表格 / MongoDB CRUD（条件对象vs链式调用，$set只改指定字段）/ 缓存三大问题（穿透=缓存空值，击穿=互斥锁，雪崩=过期时间加随机值）

## 实战记录
- 乐观更新：video-header.tsx 收藏按钮
- Server Action：toggle-favorite route.ts → app/actions/toggle-favorite.ts
- Bug 修复：highlights-panel.tsx isPlayingAll 未定义（Zustand 迁移遗漏）
- VideoHeader 挂载到分析页面（app/analyze/[videoId]/page.tsx）
- 乐观更新问题修复：去掉 isUpdating，直接乐观更新不显示加载
- Supabase 数据库全量修复：schema 未推送 → 合并16个migration → GRANT权限补齐

## 关键理解
- JSX 是函数调用的语法糖：<UrlInput onSubmit={fn} /> 等价于 UrlInput({ onSubmit: fn })
- 子组件通知父组件的唯一方式：调用父组件传进来的函数
- e.preventDefault() 阻止浏览器默认的页面刷新行为
- React ≈ Flask，Next.js ≈ Django（Python 类比）
- Tailwind CSS：一个类名 = 一个 CSS 属性，间距类数字×4
- 数据流：UrlInput → AnalyzePage → API → setVideoInfo → props → VideoHeader
- Zustand：全局状态管理器，解决多个组件共享同一份数据的问题
- Context：先包 Provider 才能用（AuthProvider + useAuth）
- Middleware：请求先过中间件再加载页面（刷新 session + 安全头）
- Supabase 三种客户端：client（浏览器localStorage）、server（cookie）、admin（服务角色绕过安全策略）
- TypeScript 类型：string/number/boolean、?可选、|联合、[]数组、()=>void函数类型
- interface：定义对象形状（≠Java的interface），可嵌套
- 泛型：useState<VideoInfo | null>，跟 Java ArrayList<String> 一个道理
- !非空断言（危险）vs ?.可选链（安全）：能用?.就不用!
- "use client"：因为有 useState/onClick，不是因为 JSX
- TypeScript 只在标注了类型的地方检查，后端 JSON 是信任区
- Supabase 手动建表 vs Dashboard 建表：手动建表不自动 GRANT，需手动补 `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated`
- React Hooks：useEffect（[]只跑一次 / [deps]依赖变重跑 / return清理）、useRef（跨渲染存值，不触发渲染）、useCallback（缓存函数） vs useMemo（缓存计算结果）
- 自定义 Hook：把 hook 逻辑封装成 useXxx 函数复用
- 数据获取标准模式：useState 存 + useEffect 调 API + setState 触发渲染
- cron.schedule 里的 SQL 参数不能用 `$$` 嵌套（PL/pgSQL DO block 内），要用单引号
- 事件循环执行顺序：同步代码 → 微任务（Promise/await）→ 宏任务（setTimeout），await只暂停当前函数不阻塞外部
- ES模块：export default不加{}（一个文件最多一个）vs export具名加{}（可以多个）
- Stream流：管道传输数据不用全部装进内存，.pipe()连接两个流自动搬运数据
- Express = Node.js版Flask：stream.pipe(res) = send_file()，框架自动调用handler
- API安全五关：认证→限流→输入校验→鉴权→输出过滤（认证问"你是谁"，鉴权问"你凭什么做")
- Cluster：多进程利用多核CPU，子进程数=CPU核数，主进程分发请求
- child_process：调外部命令（Python/Go/Shell），不关心语言只关心命令和输出
- process.env = os.environ（Python），dotenv = load_dotenv
- MongoDB：文档存储（JSON对象可嵌套），CRUD用条件对象（vs Supabase链式调用），$set只改指定字段（不加$set=整个替换），选型=结构固定用PostgreSQL/灵活多变用MongoDB
- Redis：内存缓存（快100~1000倍），≈数据库层面useMemo，set/get/set+EX过期，只在服务器端
- 缓存三大问题：穿透（请求不存在→缓存空值）、击穿（热门数据过期瞬间→互斥锁）、雪崩（大量同时过期→过期时间加随机值）

## 项目技术栈
- 包管理：pnpm（不是 npm）
- 数据库：Supabase（不是 Prisma）
- 认证：Supabase Auth（邮箱登录可用，Google OAuth 需额外配置）
- 状态管理：Zustand
