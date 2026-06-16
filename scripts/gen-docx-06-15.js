const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType } = require('docx');
const fs = require('fs');

function codeBlock(text) {
  const lines = text.split('\n');
  return lines.map(line =>
    new Paragraph({ spacing: { before: 0, after: 0 }, indent: { left: 360 }, shading: { type: ShadingType.CLEAR, color: 'F5F5F5', fill: 'F5F5F5' }, border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'E07B3C' } }, children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 18, color: '333333' })] })
  );
}

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 32, bold: true, color: '1a1a2e' })] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 26, bold: true, color: '16213e' })] }); }
function h3(t) { return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 23, bold: true, color: '0f3460' })] }); }
function p(t, o = {}) { return new Paragraph({ spacing: { after: 120, line: 360 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 21, ...o })] }); }
function bold(t) { return new TextRun({ text: t, font: 'Microsoft YaHei', size: 21, bold: true }); }
function bullet(t) { return new Paragraph({ spacing: { after: 80 }, bullet: { level: 0 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 21 })] }); }
function tip(t) { return new Paragraph({ spacing: { after: 80, before: 80 }, indent: { left: 360 }, shading: { type: ShadingType.CLEAR, color: 'FFF3E0', fill: 'FFF3E0' }, border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'FF9800' } }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 20, italics: true, color: 'E65100' })] }); }

function tb(h, rows) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: h.map(header =>
        new TableCell({
          borders, shading: { type: ShadingType.CLEAR, color: 'E07B3C', fill: 'E07B3C' },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: header, font: 'Microsoft YaHei', size: 20, bold: true, color: 'FFFFFF' })] })]
        })
      )}),
      ...rows.map(r => new TableRow({ children: r.map(c =>
        new TableCell({
          borders, margins: { top: 40, bottom: 40, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: String(c), font: 'Microsoft YaHei', size: 19, color: '333333' })] })]
        })
      )}))
    ]
  });
}

const doc = new Document({
  styles: { default: { document: { run: { font: 'Microsoft YaHei', size: 21 } } } },
  sections: [{
    children: [
      h1('LongCut 学习笔记 — 2026-06-15'),
      p('后端核心模式：Supabase CRUD、Zod 验证、安全中间件、AI 降级'),
      p(''),

      h2('1. Zustand 状态管理复习'),
      p('创建 Store 的语法：'),
      ...codeBlock("const usePlayAllStore = create<PlayAllState>((set) => ({\n  isPlayingAll: false,\n  playAllIndex: 0,\n  setIsPlayingAll: (value) => set({ isPlayingAll: value }),\n  nextInPlayAll: () => set((state) => ({ playAllIndex: state.playAllIndex + 1 })),\n}))"),
      p(''),
      tb(['场景', '写法', '说明'], [
        ['直接赋值', 'set({ isPlayingAll: true })', '新值和旧值无关'],
        ['依赖旧值', 'set((state) => ({ count: state.count + 1 }))', '保证拿到最新值'],
        ['使用 store', 'const { isPlayingAll } = usePlayAllStore()', '无需 Provider']
      ]),
      p(''),
      tip('用户提问：为什么 nextInPlayAll 要用函数形式？因为新值依赖旧值，set(state => ...) 保证 state 是调用时刻的最新快照。'),

      h2('2. Supabase 增删改查'),
      h3('2.1 查询'),
      ...codeBlock("const { data, error } = await supabase\n  .from('user_notes')\n  .select('*')\n  .eq('user_id', user.id)\n  .eq('video_id', targetVideoId)\n  .order('created_at', { ascending: false })\n  .limit(10)"),
      p(''),
      tb(['Supabase', 'SQL'], [
        [".from('user_notes')", 'FROM user_notes'],
        [".select('*')", 'SELECT *'],
        [".eq('col', val)", 'WHERE col = val'],
        [".order('col', false)", 'ORDER BY col DESC'],
        ['.limit(10)', 'LIMIT 10']
      ]),
      p(''),
      h3('2.2 新增与返回插入数据'),
      ...codeBlock("// 不返回数据\nconst { error } = await supabase.from('user_notes').insert({...})\n\n// 返回插入的数据\nconst { data: noteRow, error } = await supabase\n  .from('user_notes')\n  .insert({...})\n  .select()\n  .single()"),
      p(''),
      h3('2.3 Upsert（存在则更新，否则新建）'),
      ...codeBlock("await supabase.from('user_favorites').upsert(\n  { user_id, video_analysis_id, is_favorite },\n  { onConflict: 'user_id,video_analysis_id' }\n)"),
      p(''),
      h3('2.4 删除'),
      ...codeBlock("await supabase.from('user_notes').delete()\n  .eq('id', noteId)\n  .eq('user_id', user.id)"),

      h2('3. 后端权限检查'),
      p('标准模式：'),
      ...codeBlock("const { data: { user } } = await supabase.auth.getUser();\n\nawait supabase.from('user_notes').delete()\n  .eq('id', noteId)\n  .eq('user_id', user.id)"),
      p('核心原则：永远不信任前端传来的 ID，必须加上 user_id 作为筛选条件。'),

      h2('4. Zod 运行时验证'),
      h3('4.1 parse vs safeParse'),
      ...codeBlock("// .parse() — 失败抛异常\ntry { const data = schema.parse(body); }\ncatch (error) { /* z.ZodError */ }\n\n// .safeParse() — 失败不抛异常\nconst result = schema.safeParse(body);\nif (!result.success) {\n  return NextResponse.json({ error: result.error.issues[0]?.message });\n}"),
      p(''),
      h3('4.2 refine 和 transform'),
      ...codeBlock("const schema = z.object({\n  youtubeId: z.string().optional(),\n  videoId: z.string().optional()\n}).refine(data => data.youtubeId || data.videoId, {\n  message: '两个可选字段至少传一个'\n});\n\nconst sanitized = z.string()\n  .min(1).max(500)\n  .transform((val) => val.trim())"),

      h2('5. Supabase 联表查询'),
      h3('5.1 JOIN 语法'),
      ...codeBlock("const { data } = await supabase\n  .from('user_notes')\n  .select(`\n    *,\n    video_analyses!inner(\n      youtube_id, title, author,\n      thumbnail_url, duration, slug\n    )\n  `)"),
      p(''),
      tb(['写法', '类型', '行为'], [
        ['video_analyses!inner(...)', 'INNER JOIN', '视频不存在则不返回笔记'],
        ['video_analyses(...)', 'LEFT JOIN', '视频不存在时 video 为 null']
      ]),

      h2('6. 格式桥接'),
      p('数据库 snake_case → JS camelCase：'),
      ...codeBlock("function mapNoteWithVideo(row) {\n  return {\n    userId: row.user_id,\n    video: row.video_analyses ? {\n      youtubeId: row.video_analyses.youtube_id,\n    } : null,\n  };\n}"),

      h2('7. Security 中间件'),
      h3('7.1 预设与自定义'),
      ...codeBlock("// 预设\nSECURITY_PRESETS.AUTHENTICATED\n// => { requireAuth: true, csrfProtection: true }\n\n// 自定义\nwithSecurity(handler, {\n  requireAuth: true,\n  rateLimit: { windowMs: 60000, maxRequests: 20 },\n  maxBodySize: 32 * 1024,\n  csrfProtection: true,\n})"),

      h2('8. 高阶函数模式'),
      p('withSecurity 是高阶函数——接收 handler 返回包裹了安全检查的新函数。'),
      p('处理流水线：方法检查 → 登录检查 → 频率限制 → 请求体大小 → CSRF → 执行 handler → 注入安全头。'),

      h2('9. 前端三态模式'),
      p('任何异步操作都需要三种状态跟踪：'),
      ...codeBlock("const [isLoading, setIsLoading] = useState(false);\nconst [error, setError] = useState<string | null>(null);\nconst [data, setData] = useState<Topic[]>([]);"),
      p(''),
      tb(['阶段', 'isLoading', 'error', 'data'], [
        ['等待中', 'true', 'null', '空'],
        ['成功', 'false', 'null', '有值'],
        ['失败', 'false', '有信息', '空']
      ]),
      p('渲染分支：'),
      ...codeBlock("if (isLoading) return <Spinner />;\nif (error) return <ErrorBox msg={error} />;\nreturn <DataList items={data} />;"),

      h2('10. AI 降级策略'),
      h3('10.1 Provider 切换'),
      ...codeBlock("try {\n  return await primaryAdapter.generate(params);\n} catch (error) {\n  if (isRetryableError(error)) {\n    const fallbackKey = getFallbackProvider(primaryKey);\n    if (fallbackKey) {\n      return await fallbackAdapter.generate(params);\n    }\n  }\n  throw error;\n}"),
      p('可重试错误：rate limit、429、timeout、5xx。'),
      h3('10.2 结果降级'),
      ...codeBlock("if (!response) {\n  return fallbackFactory();  // 用预置通用问题\n}"),

      h2('11. 数据库迁移'),
      p('supabase/migrations/ 下的 .sql 文件，每个文件记录一次数据库结构变更。'),
      p('按文件名排序即变更历史，新开发者拉代码后跑迁移即可拥有最新数据库结构。'),

      h2('12. NEXT_PUBLIC_ 前缀'),
      tb(['写法', '访问位置', '说明'], [
        ['NEXT_PUBLIC_*', '浏览器端', '编译进前端 JS 包'],
        ['无前缀', '服务端', '仅 Node.js 运行时可用，不暴露给浏览器']
      ]),
      p('敏感密钥绝不能加 NEXT_PUBLIC_ 前缀。'),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('D:/Develop/longcut/docs/learning-notes-2026-06-15.docx', buf);
  console.log('DOCX generated: learning-notes-2026-06-15.docx (' + (buf.length / 1024).toFixed(1) + ' KB)');
});
