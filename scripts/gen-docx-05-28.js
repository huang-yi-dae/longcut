const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak
} = require('docx');

const NODE_PATH = 'C:/Users/20145/.workbuddy/binaries/node/workspace/node_modules';
const OUTPUT = 'D:/Develop/longcut/docs/learning-notes-05-28.docx';

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function makeCell(text, width, opts = {}) {
  const runs = [];
  if (opts.bold) {
    runs.push(new TextRun({ text, bold: true, font: "Arial", size: 20 }));
  } else {
    runs.push(new TextRun({ text, font: "Arial", size: 20 }));
  }
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: runs })]
  });
}

function makeCode(code) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: 360 },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    children: [new TextRun({ text: code, font: "Courier New", size: 18 })]
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, font: "Arial", size: 32 })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, font: "Arial", size: 28 })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true, font: "Arial", size: 24 })] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: !!opts.bold })]
  });
}
function q(text) {
  return new Paragraph({
    spacing: { before: 120, after: 40 },
    indent: { left: 360 },
    shading: { fill: "FFF8E1", type: ShadingType.CLEAR },
    children: [new TextRun({ text: "> " + text, font: "Arial", size: 21, italics: true, color: "333333" })]
  });
}
function qa(qtext, atext) {
  return [q("Q: " + qtext), p("A: " + atext)];
}

const children = [];

// =========================================================
// Title
// =========================================================
children.push(new Paragraph({ spacing: { after: 200 },
  children: [new TextRun({ text: "LongCut 学习笔记 — 2026年5月28日", font: "Arial", size: 40, bold: true, color: "1a1a2e" })]
}));
children.push(new Paragraph({ spacing: { after: 40 },
  children: [new TextRun({ text: "Stage 5.7~7.1  |  AI 学习伙伴：小鹅", font: "Arial", size: 22, color: "666666" })]
}));
children.push(new Paragraph({ children: [new PageBreak()] }));

// =========================================================
// Stage 5.7
// =========================================================
children.push(h1("Stage 5 Advanced Hooks（续）"));
children.push(h2("5.7  fetch + async/await"));
children.push(h3("核心概念"));
children.push(p("fetch 是浏览器内置的网络请求函数，默认发起 GET 请求，类似于 Python 的 requests.get()"));
children.push(p("await 用于等待异步操作完成，async 与 await 是固定搭配"));
children.push(p("用了 await 的外层函数必须声明为 async"));

children.push(h3("useEffect + async 的经典坑"));
children.push(p("不能直接把 async 函数传给 useEffect："));
children.push(makeCode("// ❌ 错误！async 函数永远返回 Promise，React 要求返回 undefined 或清理函数"));
children.push(makeCode("useEffect(async () => { const data = await fetch('/api/video') }, [])"));
children.push(p("正确写法：把 async 放在内层函数："));
children.push(makeCode("useEffect(() => { async function loadData() { ... } loadData() }, [])"));

children.push(h3("关键问答"));
children.push(...qa("response.json() 为什么也需要 await？", "因为需要从网络流中读完数据并解析为 JSON，这个过程也是异步的。"));
children.push(...qa("箭头函数 async () => { } 是什么意思？", "这是匿名异步箭头函数。async=声明异步，()=无参数，=> =返回后面内容，{}=函数体。"));
children.push(...qa("\"回调\"和\"普通返回\"有什么区别？", "普通return立即交出值；回调是把函数交给对方，对方决定何时调用。类比：递信 vs 留电话。"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// =========================================================
// Stage 5.8
// =========================================================
children.push(h2("5.8  try...catch + res.ok"));
children.push(h3("核心概念"));
children.push(p("try...catch 捕获异步错误，类似 Python try...except"));
children.push(p("fetch 的特殊坑：服务器返回 404、500 时 catch 兜不住，必须手动用 res.ok 检查"));

children.push(h3("HTTP 状态码速查"));
children.push(new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [1500, 2500, 5026],
  rows: [
    new TableRow({ children: [
      makeCell("状态码", 1500, { bold: true, shading: "E8E8E8" }),
      makeCell("含义", 2500, { bold: true, shading: "E8E8E8" }),
      makeCell("场景", 5026, { bold: true, shading: "E8E8E8" })
    ]}),
    new TableRow({ children: [makeCell("200", 1500), makeCell("成功", 2500), makeCell("数据正常返回", 5026)] }),
    new TableRow({ children: [makeCell("401", 1500), makeCell("未登录", 2500), makeCell("token 过期", 5026)] }),
    new TableRow({ children: [makeCell("403", 1500), makeCell("无权限", 2500), makeCell("非管理员", 5026)] }),
    new TableRow({ children: [makeCell("404", 1500), makeCell("找不到", 2500), makeCell("资源不存在", 5026)] }),
    new TableRow({ children: [makeCell("500", 1500), makeCell("服务器错误", 2500), makeCell("后端崩溃", 5026)] }),
  ]
}));

children.push(h3("关键问答"));
children.push(...qa("手动检查状态码需要分不同情况吗？", "大多数时 !res.ok 统一兜底。只有 401 需单独处理跳登录页。"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// =========================================================
// Stage 5.9
// =========================================================
children.push(h2("5.9  loading/error/data 三段式"));
children.push(p("用三个 useState 管理三种状态，finally 确保 loading 一定关闭"));
children.push(makeCode("const [loading, setLoading] = useState(true)"));
children.push(makeCode("const [error, setError] = useState(null)"));
children.push(makeCode("const [data, setData] = useState(null)"));
children.push(p("执行顺序：组件渲染→loading=true→显示\"加载中\"→fetch完成→setData/setError→setLoading(false)→组件重渲染"));

children.push(new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [2500, 2500, 4026],
  rows: [
    new TableRow({ children: [
      makeCell("状态", 2500, { bold: true, shading: "E8E8E8" }),
      makeCell("loading", 2500, { bold: true, shading: "E8E8E8" }),
      makeCell("页面显示", 4026, { bold: true, shading: "E8E8E8" })
    ]}),
    new TableRow({ children: [makeCell("等待中", 2500), makeCell("true", 2500), makeCell("加载中...", 4026)] }),
    new TableRow({ children: [makeCell("失败", 2500), makeCell("false", 2500), makeCell("出错了：xxx", 4026)] }),
    new TableRow({ children: [makeCell("成功", 2500), makeCell("false", 2500), makeCell("实际内容", 4026)] }),
  ]
}));

children.push(...qa("渲染部分是在 useEffect 里面还是外面？", "在组件函数最外层，不在 useEffect 里。useState 值变了 → React 自动重渲染 → 重新 return。"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// =========================================================
// Stage 5.10
// =========================================================
children.push(h2("5.10  自定义 Hook 封装 fetch"));
children.push(p("将 fetch + loading + error 三段式封装为可复用的 useFetch Hook"));
children.push(p("不同组件传不同 URL，复用同一套逻辑"));
children.push(makeCode("function useFetch(url) {"));
children.push(makeCode("  const [loading, setLoading] = useState(true)"));
children.push(makeCode("  useEffect(() => { ... }, [url])"));
children.push(makeCode("  return { loading, error, data }"));
children.push(makeCode("}"));

children.push(h2("5.11  useRef"));
children.push(p("useRef 返回 { current: null }，改 .current 不会触发重新渲染"));
children.push(p("主要用于获取 DOM 元素、记住上一次的值"));
children.push(makeCode("const inputRef = useRef(null); <input ref={inputRef} />; inputRef.current.focus()"));

children.push(new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [2200, 3413, 3413],
  rows: [
    new TableRow({ children: [
      makeCell("", 2200, { shading: "E8E8E8" }),
      makeCell("useState", 3413, { bold: true, shading: "E8E8E8" }),
      makeCell("useRef", 3413, { bold: true, shading: "E8E8E8" })
    ]}),
    new TableRow({ children: [makeCell("改了会怎样", 2200), makeCell("重新渲染", 3413), makeCell("不渲染", 3413)] }),
    new TableRow({ children: [makeCell("怎么改", 2200), makeCell("setXxx(新值)", 3413), makeCell("xxx.current = 新值", 3413)] }),
    new TableRow({ children: [makeCell("怎么读", 2200), makeCell("直接用 xxx", 3413), makeCell("用 xxx.current", 3413)] }),
  ]
}));

children.push(...qa("绑进去的是输入的内容吗？", "不，绑进去的是整个 DOM 元素。内容要额外通过 .current.value 读取。"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// =========================================================
// Stage 5.12
// =========================================================
children.push(h2("5.12  useReducer"));
children.push(p("适合复杂状态管理。你发 action，reducer 决定如何改"));
children.push(p("返回 [state, dispatch] 数组，和 useState 一样的解构方式"));
children.push(p("核心思路与 Zustand 相同：当前状态 + 指令 → 新状态"));
children.push(makeCode("const [state, dispatch] = useReducer(reducer, 0)"));
children.push(makeCode("dispatch({ type: 'add' })  // 发指令"));

children.push(...qa("为什么用数组而不是对象解构？", "顺序固定只有两个值，数组解构更简洁。有名字的一堆东西才用对象解构。"));

// =========================================================
// Stage 6
// =========================================================
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Stage 6  实战应用"));

children.push(h2("6.1  表单处理"));
children.push(p("受控组件：useState 控制 input 值"));
children.push(makeCode("<input value={keyword} onChange={(e) => setKeyword(e.target.value)} />"));
children.push(p("e = 事件对象，e.target.value = 用户输入的内容"));

children.push(new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [2200, 3413, 3413],
  rows: [
    new TableRow({ children: [
      makeCell("Hook", 2200, { bold: true, shading: "E8E8E8" }),
      makeCell("表单场景", 3413, { bold: true, shading: "E8E8E8" }),
      makeCell("原因", 3413, { bold: true, shading: "E8E8E8" })
    ]}),
    new TableRow({ children: [makeCell("useState", 2200), makeCell("实时显示/过滤", 3413), makeCell("值变了要渲染", 3413)] }),
    new TableRow({ children: [makeCell("useRef", 2200), makeCell("提交时读一次", 3413), makeCell("不需要渲染", 3413)] }),
    new TableRow({ children: [makeCell("useEffect", 2200), makeCell("输入后发请求", 3413), makeCell("副作用", 3413)] }),
  ]
}));

children.push(p("防抖搜索 = useState + useDebounce + useFetch 三者组合"));

children.push(...qa("? : 和 ${} 是什么？", "? : = 三元表达式(Python x if cond else y)；${} = 模板字符串(Python f-string)，必须用反引号。"));

children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(h2("6.2  Server Actions"));
children.push(p("'use server' 标记的函数跑在服务端，Next.js 自动生成隐藏 fetch"));

children.push(new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [2200, 3413, 3413],
  rows: [
    new TableRow({ children: [
      makeCell("", 2200, { shading: "E8E8E8" }),
      makeCell("旧写法", 3413, { bold: true, shading: "E8E8E8" }),
      makeCell("Server Action", 3413, { bold: true, shading: "E8E8E8" })
    ]}),
    new TableRow({ children: [makeCell("后端", 2200), makeCell("要写 route.ts", 3413), makeCell("不需要", 3413)] }),
    new TableRow({ children: [makeCell("前端", 2200), makeCell("fetch() 发请求", 3413), makeCell("直接调用函数", 3413)] }),
    new TableRow({ children: [makeCell("标记", 2200), makeCell("无", 3413), makeCell("'use server'", 3413)] }),
  ]
}));

children.push(p("使用时机：表单提交用 Server Action，前端主动请求数据/需要可控性用 route.ts"));

children.push(h2("6.3  认证与鉴权"));
children.push(p("Authentication（认证）=\"你是谁？\"，Authorization（鉴权）=\"你能做什么？\""));
children.push(p("Token 机制：登录→后端生成随机token→前后端各存一份→每次请求验证"));
children.push(p("安全：推荐 HttpOnly Cookie，前端 JS 读不到，防 XSS 攻击"));

children.push(...qa("Cookie 泄露会重新生成 token 吗？", "不会自动重新生成。给 token 设过期时间是最常见做法，过期需重新登录。"));

children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(h2("6.4  数据库集成（Prisma ORM）"));
children.push(p("Prisma = Next.js 生态主流 ORM，用 JS 语法操作数据库"));

children.push(new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [1800, 3613, 3613],
  rows: [
    new TableRow({ children: [
      makeCell("操作", 1800, { bold: true, shading: "E8E8E8" }),
      makeCell("原生 SQL", 3613, { bold: true, shading: "E8E8E8" }),
      makeCell("Prisma", 3613, { bold: true, shading: "E8E8E8" })
    ]}),
    new TableRow({ children: [makeCell("查一条", 1800), makeCell("SELECT * FROM videos WHERE id='abc'", 3613), makeCell("prisma.video.findUnique({ where: { id: 'abc' } })", 3613)] }),
    new TableRow({ children: [makeCell("查全部", 1800), makeCell("SELECT * FROM videos", 3613), makeCell("prisma.video.findMany()", 3613)] }),
    new TableRow({ children: [makeCell("新增", 1800), makeCell("INSERT INTO videos VALUES (...)", 3613), makeCell("prisma.video.create({ data: {...} })", 3613)] }),
    new TableRow({ children: [makeCell("删除", 1800), makeCell("DELETE FROM videos WHERE id='abc'", 3613), makeCell("prisma.video.delete({ where: { id: 'abc' } })", 3613)] }),
  ]
}));

children.push(p("工作流程：schema.prisma 定义→prisma db push 建表→prisma generate 生成代码→自动补全"));
children.push(p("多表查询：先在 schema 声明关系，然后用 include 实现联查"));

children.push(h2("6.5  部署上线（Vercel）"));
children.push(p("GitHub 仓库 → Vercel 导入 → 自动构建 + 上线 → 获取 xxx.vercel.app 域名"));
children.push(p("每次 git push，Vercel 自动检测并重新部署"));

// =========================================================
// Stage 7
// =========================================================
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1("Stage 7  进阶实战"));
children.push(h2("7.1  性能优化"));

children.push(h3("React.memo"));
children.push(p("props 没变就不重新渲染，防止父组件重渲染时的子组件无谓更新"));

children.push(h3("代码分割"));
children.push(p("React：lazy + Suspense 实现按需加载"));
children.push(p("Next.js：自动处理，每个 page.tsx 自动分割"));
children.push(makeCode("const SearchPage = lazy(() => import('./search-page'))"));
children.push(makeCode("<Suspense fallback={<div>加载中...</div>}><SearchPage /></Suspense>"));

children.push(h3("lazy + Suspense 核心机制"));
children.push(p("lazy 组件没准备好 → throw Promise → Suspense 接住 → 显示 fallback"));
children.push(p("浏览器下载完 → Promise resolve → React 监听 → 自动重渲染 → 正常显示"));

children.push(...qa("React 如何发现 lazy 组件还没准备好？", "throw Promise，Suspense 接住。类似 try...catch 但兜的不是错误而是\"还没加载完\"。"));
children.push(...qa("React 怎么知道 Promise 完成了？", "import() 本身是 Promise。浏览器下载完→自动 resolve→React 监听到→自动渲染。"));

// Build document
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1a1a2e" },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2d3436" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "333333" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "LongCut 学习笔记 — 2026.05.28", font: "Arial", size: 16, color: "999999" })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "— ", font: "Arial", size: 16, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" }), new TextRun({ text: " —", font: "Arial", size: 16, color: "999999" })]
      })] })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log('DOCX generated: ' + OUTPUT);
});
