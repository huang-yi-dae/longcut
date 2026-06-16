# 全栈开发实习备战 — 学习计划

> 目标：补齐 Tencent 全栈开发 JD 要求差距，4 周覆盖所有缺失技能

---

## 一、学习者现状

| 维度 | 当前能力 | 对应新方向的起点 |
|------|---------|----------------|
| React/Next.js | 组件、Hooks、状态管理、数据流、API Route | ✅ 可直接用 |
| TypeScript | 类型系统、泛型、interface/type | ✅ 可直接用 |
| Java | Java SE 基础、OOP | ✅ 语言已满足要求 |
| Python | Flask、脚本编写 | ✅ 语言已满足要求 |
| PostgreSQL | Supabase CRUD、JOIN、Zod 验证 | ✅ 迁移到 MySQL 只需对比学习 |
| Node.js 运行时 | 通过 Next.js 间接使用 | ⚠️ 没系统学过 event loop / streams |
| 缓存中间件 | 从未接触 | ❌ |
| 性能优化 | 从未接触 | ❌ |
| Vue | 从未接触 | ❌ |

---

## 二、第一性原理路径地图

**核心问题**：一个全栈应用的请求从浏览器发出后，经过哪些中间件/服务/数据库，才能最终返回响应？

```
层 1：Node.js 运行时           ──────── 服务器端代码是怎么跑起来的？
层 2：数据库 + 缓存            ──────── 数据怎么存、怎么加速读？
层 3：全栈实战                 ──────── 组合所有技能写一个完整功能
层 4：面试冲刺                 ──────── 系统设计 + Vue 概览 + Go 入门
```

---

## 三、对比迁移表

| 已知概念 | 新概念对应 | 区别 |
|---------|-----------|------|
| Java 线程/并发 | Node.js 事件循环 | 多线程 vs 单线程 + 异步非阻塞 |
| Python 装饰器 | Node.js 中间件 | 本质相同，API 不同 |
| PostgreSQL / SQL | MongoDB 文档模型 | 关系型 vs 文档型，JOIN vs 嵌套 |
| Python dict | Redis 数据结构 | 内存级、持久化可选、原子操作 |
| React | Vue | 同为组件化框架，Vue 模板语法 vs JSX |
| Python Flask | Node.js Express | 同为轻量框架，中间件模式相同 |
| useState / useEffect | Vue 响应式 ref/reactive | 不可变 vs 可变、自动追踪 |

---

## 四、设计原则（Bjork 合意困难）

| 原则 | 落地方式 |
|------|---------|
| 间隔 (Spacing) | 每个主题分到多天，不集中刷 |
| 交错 (Interleaving) | 每天混合理论 + 代码 + 对比 |
| 变化 (Variation) | 读代码 → 写代码 → 改 bug → 面试问答 |
| 检索 (Retrieval) | 每天先闭卷回答前一天问题，再学新内容 |

---

## 五、分阶段计划（4 周）

### 阶段 1：Node.js 运行时深入（第 1 周）
**目标**：理解 Node.js 事件循环、模块系统、流式处理

| 天 | 内容 | 练习 |
|----|------|------|
| 1 | **事件循环**：call stack、task queue、microtask、nextTick vs setTimeout | 手写代码预测执行顺序，对比 Java 线程 |
| 2 | **模块系统**：CommonJS vs ESM、require vs import、module.exports | 在项目里找 .js 和 .ts 的导入导出差异 |
| 3 | **Stream & Buffer**：Readable/Writable/Transform stream、pipe | 读 LongCut 中 transcript 或 AI 流式处理代码 |
| 4 | **进程管理**：child_process、cluster、process.env | 项目里 process.env 都已见过，对比 PM2 |
| 5 | **Express 框架**：中间件模式、路由、请求-响应生命周期 | 对比 Next.js API Route 和 Flask route |
| 6 | **复习 + 综合**：用原生 Node.js 写一个简单 HTTP 服务器 | 不要框架，从零写一个 |
| 7 | **休息/补漏** | 回顾本周卡住的地方 |

### 阶段 2：数据库 + 缓存（第 2 周 ~ 第 3 周周二）
**目标**：掌握 MongoDB 和 Redis 核心操作

| 天 | 内容 | 练习 |
|----|------|------|
| 8 | **MongoDB 概念**：文档、集合、无 schema、BSON vs JSON | 对比 PostgreSQL 表结构 |
| 9 | **MongoDB CRUD**：find/insert/update/delete/aggregate | 在项目中模拟 MongoDB 查询（不实际安装） |
| 10 | **Mongoose ODM**：Schema、Model、populate（≈ JOIN） | 对比 Supabase + Zod |
| 11 | **MongoDB 面试题**：索引、复制集、分片、优缺点 | 整理面试笔记 |
| 12 | **Redis 基础**：string/hash/list/set/sorted set | 在 localhost 装一个试 SET/GET |
| 13 | **Redis 缓存模式**：Cache Aside、Read Through、Session Store | 把项目里的 favoriate 用 Redis 做缓存设计 |
| 14 | **Redis 面试题**：过期策略、持久化（RDB/AOF）、分布式锁 | 对比 PostgreSQL 的缓存 vs Redis |
| 15 | **复习 + 对比**：MySQL vs MongoDB vs Redis 适用场景 | 画一张选型对比表 |

### 阶段 3：全栈实战 + 性能（第 3 周周三 ~ 第 4 周周三）
**目标**：在 LongCut 中加一个新功能，覆盖全栈流程

| 天 | 内容 | 练习 |
|----|------|------|
| 16 | **功能设计**：为 LongCut 加一个"热门笔记"排行榜功能 | 设计数据结构 + API + UI 方案 |
| 17 | **后端实现**：编写 API Route + Supabase/Redis 查询 | 用 Supabase 存储，Redis 做排行榜缓存 |
| 18 | **前端实现**：排行榜组件 + 三态渲染 | 用已经学过的 React 技能 |
| 19 | **性能优化**：N+1 查询、懒加载、虚拟列表、CDN | 分析项目中哪些 API 可以加缓存 |
| 20 | **Vue 概览**：对比 React，7 天内看懂 Vue 代码 | 读 Vue 官方教程，做对比表 |
| 21 | **Go 入门（可选）**：变量、函数、并发 goroutine | 写一个简单的 HTTP server |

### 阶段 4：面试冲刺（第 4 周周四 ~ 周末）
**目标**：面试题练习 + 项目亮点整理

| 天 | 内容 | 练习 |
|----|------|------|
| 22 | **系统设计基础**：RESTful API 设计、数据库选型、缓存策略 | 画一个"设计一个笔记系统"的架构图 |
| 23 | **项目亮点整理**：从 LongCut 中提炼 3 个面试能讲的点 | 乐观更新、AI fallback、三层架构 |
| 24 | **模拟面试**：全栈开发面试问答 | 我从 JD 出发逐一提问 |
| 25~28 | **弹性补漏** | 复习弱项 + 投递准备 |

---

## 六、每日练习模板

```markdown
## [日期] 练习 #N

### 检索（5 分钟）
- 闭卷回答前一天的核心问题：

### 主练习（45-60 分钟）
- 今天课题：_______
- 核心疑问：_______
- 代码/笔记：_______

### 产出（10 分钟）
- 关键理解：_______
- 面试可说的点：_______
```

---

## 七、进度追踪表

| 阶段 | 内容 | 计划日期 | 状态 |
|------|------|---------|------|
| 1 | Node.js 事件循环 | 第 1 天 | ✅ |
| 1 | Node.js 模块系统 | 第 2 天 | ✅ |
| 1 | Stream & Buffer | 第 3 天 | ✅ |
| 1 | 进程管理（Cluster + child_process + process.env） | 第 4 天 | ✅ |
| 1 | Express + 对比 + API 安全 | 第 5 天 | ✅ |
| 1 | 原生 HTTP 服务器 | 第 6 天 | ⬜ |
| 2 | MongoDB 概念 + CRUD | 第 8-9 天 | ✅ |
| 2 | Mongoose | 第 10 天 | ⬜ |
| 2 | MongoDB 面试题 | 第 11 天 | ⬜ |
| 2 | Redis 基础 | 第 12 天 | ✅ |
| 2 | Redis 缓存模式 | 第 13 天 | ✅ |
| 2 | Redis 面试题 | 第 14 天 | ⬜ |
| 2 | 数据库对比复习 | 第 15 天 | ⬜ |
| 3 | 功能设计 | 第 16 天 | ⬜ |
| 3 | 后端实现 | 第 17 天 | ⬜ |
| 3 | 前端实现 | 第 18 天 | ⬜ |
| 3 | 性能优化 | 第 19 天 | ⬜ |
| 3 | Vue 概览 | 第 20 天 | ⬜ |
| 3 | Go 入门 | 第 21 天 | ⬜ |
| 4 | 系统设计 + 项目亮点 | 第 22-23 天 | ⬜ |
| 4 | 模拟面试 | 第 24 天 | ⬜ |
| 4 | 弹性补漏 | 第 25-28 天 | ⬜ |

---

## 八、动态调整机制

| 信号 | 响应 |
|------|------|
| 某天内容太多 | 拆到两天，后面顺延 |
| Node.js 卡住 | 暂停 MongoDB，多给 1 天补 Node.js 基础 |
| 面试考点浮现 | 随时插入面试题练习，替换当天练习 |
| 投递时间提前 | 跳跃到阶段 4，面完再补 |

---

_生成：2026-06-15 | 基于 Tencent CDG/WXG/CSIG 全栈开发 JD_
