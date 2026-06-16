# Errors

Command failures and integration errors.

---

## [ERR-20260611-001] supabase_postgrest_query

**Logged**: 2026-06-11T22:53+08:00
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
PostgREST 返回 `permission denied for table user_videos`（代码 42501）

### Error
```
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT SELECT ON public.user_videos TO anon;","message":"permission denied for table user_videos"}
```

### Context
- 通过 SQL Editor 手动执行 init-full.sql 创建了所有表
- 应用端 Server Component 查询 `user_videos` 时报 `Error fetching user videos: {}`
- curl 直打 API 确认是权限问题

### Resolution
- **Resolved**: 2026-06-11T22:37+08:00
- **Fix**: `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;`
- **Root cause**: 手动 SQL 建表不自动 GRANT，需手动补齐

### Metadata
- Reproducible: yes
- Related Files: supabase/init-full.sql, app/my-videos/page.tsx
- Tags: supabase, postgrest, permissions, grant
