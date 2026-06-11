const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak, Footer, PageNumber } = require('docx')

function codeBlock(text) {
  return new Paragraph({ spacing: { before: 80, after: 80 }, indent: { left: 360 }, shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' }, border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'E07B3C' } }, children: [new TextRun({ text, font: 'Consolas', size: 18, color: '333333' })] })
}
function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 32, bold: true, color: '1a1a2e' })] }) }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 26, bold: true, color: '16213e' })] }) }
function p(t, o = {}) { return new Paragraph({ spacing: { after: 120, line: 360 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 21, ...o })] }) }
function b(t) { return p(t, { bold: true }) }
function tb(h, rows) { return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ tableHeader: true, children: h.map(h => new TableCell({ shading: { type: ShadingType.SOLID, color: 'E07B3C' }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, font: 'Microsoft YaHei', size: 20, bold: true, color: 'FFFFFF' })] })] })) }), ...rows.map(r => new TableRow({ children: r.map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, font: 'Microsoft YaHei', size: 20 })] })] })) }))] }) }

const doc = new Document({
  styles: { default: { document: { run: { font: 'Microsoft YaHei', size: 21 } } } },
  sections: [{
    properties: {},
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['— ', PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES, ' —'], font: 'Microsoft YaHei', size: 18, color: '999999' })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'LongCut 学习笔记', font: 'Microsoft YaHei', size: 52, bold: true, color: 'E07B3C' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: '2026-06-09', font: 'Microsoft YaHei', size: 32, color: '888888' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: '三层架构 + 收藏链路 + AI 链路 + Adapter 模式', font: 'Microsoft YaHei', size: 24, color: '666666' })] }),
      new Paragraph({ children: [new PageBreak()] }),

      h1('一、三层架构'),
      p('前端（浏览器）→ 后端（Next.js 服务器）→ 数据库（Supabase/PostgreSQL）'),
      p('前端不直接碰数据库，只能通过 API 或 Server Action 跟后端通信。'),
      tb(['操作', '前端', '后端', '数据库'], [
        ['收藏按钮', 'video-header.tsx', 'toggle-favorite.ts', 'user_videos'],
        ['查看缓存', 'analyze page', 'check-video-cache/route.ts', 'video_analyses'],
        ['登录', 'auth-modal.tsx', 'Supabase Auth', 'auth.users']
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      h1('二、收藏功能完整链路'),
      h2('从前端到数据库的 6 步'),
      codeBlock('1. 用户点收藏按钮\n2. video-header.tsx：先乐观更新 UI\n3. 调用 toggleFavorite(videoId, isFavorite)\n4. Server Action：\n   a. 创建 Supabase 客户端\n   b. 从 cookie 读 token 确认身份\n   c. 查 video_analyses 表找视频 ID\n   d. 写入 user_videos 表（upsert）\n5. 返回 { success: true, isFavorite }\n6. 失败时回滚 UI'),
      h2('数据库表结构'),
      codeBlock('CREATE TABLE user_videos (\n  id uuid PRIMARY KEY,\n  user_id uuid NOT NULL,\n  video_id uuid NOT NULL,\n  accessed_at timestamp,\n  is_favorite boolean DEFAULT false,\n  notes text,\n  UNIQUE (user_id, video_id)\n);'),
      h2('REFERENCES 关联'),
      p('user_id uuid REFERENCES profiles(id) ON DELETE CASCADE'),
      p('video_id uuid REFERENCES video_analyses(id) ON DELETE CASCADE'),
      p('外键约束确保引用的数据存在。ON DELETE CASCADE 表示关联记录自动删除。'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('三、AI 分析完整链路'),
      h2('route.ts：入口和验证'),
      codeBlock('import { NextRequest, NextResponse } from "next/server";\nimport { generateTopicsFromTranscript } from "@/lib/ai-processing";\n\nasync function handler(request: NextRequest) {\n  const body = await request.json();\n  // zod 验证...\n  return NextResponse.json({ topics, candidates });\n}'),
      h2('Prompt 结构'),
      codeBlock('<task>\n<role>You are an expert content strategist</role>\n<goal>找出主题</goal>\n<instructions>...</instructions>\n<outputFormat>JSON</outputFormat>\n<transcriptChunk>字幕内容</transcriptChunk>\n</task>'),
      h2('ai-client.ts'),
      codeBlock('export async function generateAIResponse(\n  prompt: string,\n  options: GenerateAIOptions = {}\n): Promise<string> {\n  const providerParams = coerceProviderParams(prompt, options);\n  const result = await generateStructuredContent(providerParams);\n  return result.content;\n}'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('四、Adapter 模式'),
      p('每个 AI 供应商有自己的 API 格式，adapter 负责统一输出。'),
      codeBlock('const PROVIDER_NAME = "deepseek";\nconst DEFAULT_MODEL = "deepseek-v4-flash";\nconst DEFAULT_BASE_URL = "https://api.deepseek.com/v1";'),
      h2('stripReasoningBlocks'),
      p('删除 DeepSeek 思考模式的 <think> 标签内容。'),
      h2('?? 运算符'),
      codeBlock('const message = choice.message ?? choice.delta ?? {};'),
      p('左边不是 null/undefined 就用左边，否则用右边。区别：|| 会跳过空字符串和 0，?? 不会。'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('附录：今日提问精选'),
      tb(['问题', '关键答案'], [
        ['前端能直接操作数据库吗？', '不能，必须通过后端 API 或 Server Action'],
        ['REFERENCES 是什么意思？', '外键约束，确保引用存在'],
        ['NextRequest 和 NextResponse？', '收到的请求 和 发回的响应'],
        ['zod.parse(body) 做什么？', '验证请求数据格式'],
        ['Prompt 用 XML 标签？', '分隔各部分，让 AI 理解'],
        ['coerceProviderParams 作用？', '标准化参数格式'],
        ['Adapter 模式是什么？', '统一不同供应商的接口'],
        ['?? 和 || 区别？', '?? 只跳过 null/undefined'],
        ['stripReasoningBlocks 删什么？', 'DeepSeek 的 <think> 标签']
      ]),
      new Paragraph({ spacing: { before: 400 }, children: [] }),
      p('笔记生成时间：2026-06-09 | 三层架构 + 收藏链路 + AI 链路 + Adapter', { italics: true, color: '999999' })
    ]
  }]
})

const path = require('path');
const outputPath = path.resolve(__dirname, '..', 'docs', 'learning-notes-06-09.docx');
Packer.toBuffer(doc).then(buffer => {
  require('fs').writeFileSync(outputPath, buffer);
  console.log('DOCX generated:', outputPath);
});
