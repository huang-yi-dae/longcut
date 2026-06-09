const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak, Footer, PageNumber } = require('docx')

function codeBlock(text) {
  return new Paragraph({ spacing: { before: 80, after: 80 }, indent: { left: 360 }, shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' }, border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'E07B3C' } }, children: [new TextRun({ text, font: 'Consolas', size: 18, color: '333333' })] })
}
function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, font: 'Microsoft YaHei', size: 32, bold: true, color: '1a1a2e' })] }) }
function h2(text) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text, font: 'Microsoft YaHei', size: 26, bold: true, color: '16213e' })] }) }
function para(text, o = {}) { return new Paragraph({ spacing: { after: 120, line: 360 }, children: [new TextRun({ text, font: 'Microsoft YaHei', size: 21, ...o })] }) }
function bold(text) { return para(text, { bold: true }) }
function tbl(headers, rows) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ tableHeader: true, children: headers.map(h => new TableCell({ shading: { type: ShadingType.SOLID, color: 'E07B3C' }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, font: 'Microsoft YaHei', size: 20, bold: true, color: 'FFFFFF' })] })] })) }),
    ...rows.map(row => new TableRow({ children: row.map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, font: 'Microsoft YaHei', size: 20 })] })] })) }))
  ] })
}

const doc = new Document({
  styles: { default: { document: { run: { font: 'Microsoft YaHei', size: 21 } } } },
  sections: [{
    properties: {},
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['— ', PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES, ' —'], font: 'Microsoft YaHei', size: 18, color: '999999' })] })] }) },
    children: [
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'LongCut 学习笔记', font: 'Microsoft YaHei', size: 52, bold: true, color: 'E07B3C' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: '2026-06-08', font: 'Microsoft YaHei', size: 32, color: '888888' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'Context vs Zustand + Middleware + JSX 本质 + Supabase 客户端', font: 'Microsoft YaHei', size: 24, color: '666666' })] }),
      new Paragraph({ children: [new PageBreak()] }),

      h1('一、Context 详解'),
      h2('Context vs Zustand 对比'),
      tbl(['', 'Zustand', 'React Context'], [
        ['使用条件', '直接 import', '必须被 Provider 包裹'],
        ['范围', '全局', '仅 Provider 内部'],
        ['创建方式', 'create((set) => ({...}))', 'createContext() + Provider'],
        ['读取方式', 'useStore(s => s.xxx)', 'useContext(AuthContext)'],
        ['Python 类比', '全局变量', 'with 语句']
      ]),
      h2('AuthProvider 使用流程'),
      bold('auth-context.tsx: 定义 AuthProvider（盒子怎么造）'),
      bold('layout.tsx: 使用 AuthProvider（盒子怎么用）'),
      bold('VideoHeader: 使用 useAuth()（从盒子里拿东西）'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('二、Zustand 用法细节'),
      h2('create 函数的作用'),
      codeBlock('const usePlayAllStore = create((set) => ({\n  isPlayingAll: false,\n  setIsPlayingAll: (value) => set({ isPlayingAll: value }),\n}))'),
      para('create 存数据并给 set() 工具修改数据。类似 class 构造器。'),
      h2('两种读取方式'),
      bold('选择器模式（取单个值）'),
      codeBlock('const isPlayingAll = usePlayAllStore((state) => state.isPlayingAll);'),
      bold('解构模式（取多个值）'),
      codeBlock('const { isPlayingAll, setIsPlayingAll } = usePlayAllStore();'),
      h2('箭头函数选择器'),
      para('(state) => state.isPlayingAll 中的 state 是形参，名字随意：'),
      codeBlock('usePlayAllStore((state) => state.isPlayingAll)\nusePlayAllStore((x) => x.isPlayingAll)\nusePlayAllStore((data) => data.isPlayingAll)'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('三、Middleware（中间件）'),
      h2('执行流程'),
      para('用户访问页面 → Next.js 检查 matcher → 执行 middleware（服务器端） → 浏览器加载 React 组件'),
      para('middleware 跑在服务器端，React 还没开始工作。'),
      h2('matcher 配置'),
      codeBlock("export const config = {\n  matcher: ['/((?!api/webhooks|_next/static|...).*)']\n};"),
      para('除了 webhook 和静态文件，其他所有请求都走中间件。'),
      h2('主要作用'),
      para('1. 刷新 session：检查用户登录状态是否过期'),
      para('2. 加安全头：Content-Security-Policy 控制哪些外部资源可以加载'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('四、React / Next.js / TypeScript 关系'),
      tbl(['技术', '本质', '职责'], [
        ['TypeScript', '语言（JS + 类型）', '编写代码'],
        ['React', 'UI 库', '写页面组件'],
        ['Next.js', '全栈框架', '路由 + 后端 + 中间件']
      ]),
      para('Python 类比：TypeScript = Python + mypy，React = Flask，Next.js = Django'),
      h2('.ts vs .tsx'),
      para('.ts：纯 TypeScript，没有 JSX（如 route.ts、utils.ts）'),
      para('.tsx：TypeScript + JSX（如 video-header.tsx、page.tsx）'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('五、JSX 本质'),
      h2('JSX = 函数调用的语法糖'),
      codeBlock('// 你写 JSX（语法糖）：\n<div className="flex">你好</div>\n\n// 编译后：\nReact.createElement("div", { className: "flex" }, "你好")'),
      para('语法糖 = 一种更舒服的写法，功能完全一样。类似于 Python 的列表推导式。'),
      h2('编译过程'),
      para('JSX → 编译（.tsx → .js）→ React.createElement 调用 → 浏览器执行 → 创建 DOM → 用户看到 UI'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('六、Supabase 客户端体系'),
      h2('三个客户端'),
      tbl(['文件', '存储位置', '使用场景'], [
        ['client.ts', 'localStorage', '前端组件（useAuth）'],
        ['server.ts', 'HTTP Cookie', 'Route Handler / Server Action'],
        ['admin.ts', '环境变量', '后台脚本（绕过安全策略）']
      ]),
      h2('三种 Key 对比'),
      para('anon key（NEXT_PUBLIC_ 前缀，嵌入前端）：基本操作，受安全策略限制'),
      para('service role key（无前缀，仅服务器）：绕过所有安全策略'),
      para('用户 token（localStorage / cookie）：只能操作自己的数据'),
      h2('Row Level Security（行级安全策略）'),
      codeBlock('CREATE POLICY "用户只能看自己的数据" ON user_videos\n  FOR SELECT USING (user_id = auth.uid());'),
      para('真正保护数据的是 RLS 策略，不是 anon key。anon key 公开也没事。'),

      new Paragraph({ children: [new PageBreak()] }),

      h1('附录：今日提问精选'),
      tbl(['问题', '关键答案'], [
        ['Zustand 和 Context 有什么区别？', 'Zustand import 即用，Context 需 Provider 包裹'],
        ['state 是固定名字吗？', '不是，形参名随意，类似 self'],
        ['middleware 什么时候执行？', '请求先过 middleware 再加载页面，在服务器端执行'],
        ['React 可以不用 Next.js 吗？', '可以，纯 React 用 create-react-app'],
        ['.ts 和 .tsx 区别？', '.ts 纯逻辑，.tsx 包含 JSX 标签'],
        ['JSX 编译成什么？', 'React.createElement 函数调用'],
        ['anon key 泄露了危险吗？', '不危险，anon key 本就在前端公开'],
        ['为什么需要两个客户端？', '浏览器用 localStorage，服务器用 cookie'],
      ]),
      new Paragraph({ spacing: { before: 400 }, children: [] }),
      para('笔记生成时间：2026-06-08 | Context vs Zustand + Middleware + JSX + Supabase', { italics: true, color: '999999' })
    ]
  }]
})

const path = require('path');
const outputPath = path.resolve(__dirname, '..', 'docs', 'learning-notes-06-08.docx');
Packer.toBuffer(doc).then(buffer => {
  require('fs').writeFileSync(outputPath, buffer);
  console.log('DOCX generated:', outputPath);
});
