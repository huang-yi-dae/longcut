# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## [LRN-20260611-001] knowledge_gap

**Logged**: 2026-06-11T22:53+08:00
**Priority**: high
**Status**: pending
**Area**: infra | backend

### Summary
Supabase 手动建表不自动 GRANT 权限

### Details
通过 Supabase Dashboard SQL Editor 手动 CREATE TABLE 不会自动给 `anon`/`authenticated` 角色赋权，而 Dashboard Table Editor 建表会自动 GRANT。手动建表后 PostgREST API 返回 42501 `permission denied for table`。

修复：
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
```

RLS 策略仍生效控制行级访问，GRANT 只是允许 API 访问表。

### Suggested Action
- 在 init-full.sql 末尾添加 GRANT 语句
- 任何手动建表的 SQL 迁移都应包含 GRANT

### Metadata
- Source: user_feedback | error
- Related Files: supabase/init-full.sql
- Tags: supabase, postgrest, rls, permissions, grant

---

## [LRN-20260611-002] insight

**Logged**: 2026-06-11T22:53+08:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
cron.schedule 在 DO $$ block 内不能用 $$ 包裹 SQL 参数

### Details
PL/pgSQL 的 `DO $$ ... END; $$;` 块内调用 `cron.schedule` 时，第三个参数（SQL 字符串）不能用 `$$` 包裹——会和外层 DO block 的 `$$` 冲突，报 `syntax error at or near "SELECT"`。

修复：用单引号 `'...'` 或命名 dollar-quote `$cron_block$ ... $cron_block$`。

### Suggested Action
- 检查其他 migration 是否有类似 $$ 嵌套

### Metadata
- Source: error
- Related Files: supabase/init-full.sql
- Tags: supabase, pg_cron, plpgsql, dollar-quote

---

## [LRN-20260611-003] best_practice

**Logged**: 2026-06-11T22:53+08:00
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
curl 直打 Supabase PostgREST API 是排查权限问题的最快方式

### Details
当 Supabase 功能异常时，用 curl 直接验证比让用户去 Dashboard 跑 SQL 更快：
- `curl /rest/v1/<table>?select=*&limit=1` + anon key
- 返回 `[]` = OK，`permission denied` = 缺 GRANT，`relation does not exist` = 缺表

避免了用户在 Dashboard 和终端之间来回切换的摩擦。

### Suggested Action
- 首选 curl 验证，再让用户跑 SQL

### Metadata
- Source: conversation
- Tags: supabase, curl, debugging, api

---

## [LRN-20260611-004] correction

**Logged**: 2026-06-11T22:53+08:00
**Priority**: high
**Status**: pending
**Area**: config

### Summary
learn-command skill 缺少 OpenViking 双写步骤

### Details
用户指出 /learn 执行后没有同步到 OpenViking。learn-command SKILL.md 的 Phase Four 只写了本地文件和索引更新，漏了 OV 双写（remember + add_resource）。已更新 Phase Four 添加了 OV 双写步骤。

### Metadata
- Source: user_correction
- Related Files: ~/.workbuddy/skills/learn-command/SKILL.md
- Tags: openviking, learn-command, memory-sync, skill
