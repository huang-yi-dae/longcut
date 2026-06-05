const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, PageBreak, Footer, PageNumber,
  NumberFormat
} = require('docx')

function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 360 },
    shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' },
    border: {
      left: { style: BorderStyle.SINGLE, size: 4, color: 'E07B3C' }
    },
    children: [new TextRun({ text, font: 'Consolas', size: 18, color: '333333' })]
  })
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: 'Microsoft YaHei', size: 32, bold: true, color: '1a1a2e' })]
  })
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: 'Microsoft YaHei', size: 26, bold: true, color: '16213e' })]
  })
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: 'Microsoft YaHei', size: 22, bold: true, color: '2c3e50' })]
  })
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text, font: 'Microsoft YaHei', size: 21, ...opts })]
  })
}

function boldPara(text) {
  return para(text, { bold: true })
}

function tableFromData(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      shading: { type: ShadingType.SOLID, color: 'E07B3C' },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, font: 'Microsoft YaHei', size: 20, bold: true, color: 'FFFFFF' })]
      })]
    }))
  })

  const dataRows = rows.map(row =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell, font: 'Microsoft YaHei', size: 20 })]
          })]
        })
      )
    })
  )

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows]
  })
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Microsoft YaHei', size: 21 } }
    }
  },
  sections: [{
    properties: {},
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: ['— ', PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES, ' —'], font: 'Microsoft YaHei', size: 18, color: '999999' })]
        })]
      })
    },
    children: [
      // ===== 封面 =====
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'LongCut 学习笔记', font: 'Microsoft YaHei', size: 52, bold: true, color: 'E07B3C' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: '2026-06-01', font: 'Microsoft YaHei', size: 32, color: '888888' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: 'Stage 7.6 ~ 7.10 + 进阶 Hooks + 实战 + 开发环境', font: 'Microsoft YaHei', size: 24, color: '666666' })]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 一、理论篇 =====
      heading1('一、理论篇：Stage 7.6 ~ 7.10'),

      // 7.6
      heading2('7.6 缓存与 ISR（增量静态再生成）'),
      boldPara('核心概念'),
      para('缓存 = 以空间换时间。把结果存起来，下次直接用，不用重新算。'),
      boldPara('ISR 机制'),
      codeBlock('export const revalidate = 60  // 页面缓存 60 秒，过期后后台重新生成'),
      para('用户访问 → 返回缓存的旧页面（快）→ 后台悄悄生成新页面 → 下一个用户拿到新的。'),

      boldPara('两种方案对比'),
      tableFromData(['', '组件拆分', 'ISR'], [
        ['做法', '页面内部分静态+动态组件', '整页缓存 + 定时刷新'],
        ['适合', '少量字段需要实时', '整个页面都不需要秒级实时'],
        ['关系', '两者可以同时使用', '—']
      ]),

      // 7.7
      heading2('7.7 TypeScript 泛型（Generics）'),
      boldPara('核心'),
      para('<T> 是类型占位符，让函数/组件能处理多种类型，同时保留类型检查。和 Java 泛型概念一致。'),
      boldPara('常见用法'),
      codeBlock('useState(false)                // T = boolean（自动推断）\nuseState<Video | null>(null)    // 手动指定 T = Video'),
      boldPara('实战：手写泛型 useFetch'),
      codeBlock('function useFetch<T>(url: string) {\n  const [data, setData] = useState<T | null>(null)\n  // ...fetch 逻辑\n  return { loading, error, data }\n}\n\n// 调用\nconst { data } = useFetch<Video[]>(\'/api/videos\')\nconst { data } = useFetch<User>(\'/api/user/me\')'),

      para('关键理解：useEffect 回调不能是 async，所以需要内层定义 async 函数再调用。'),

      // 7.8
      heading2('7.8 环境变量（Environment Variables）'),
      boldPara('规则'),
      para('只有 NEXT_PUBLIC_ 开头的变量才会暴露给浏览器。不加前缀 = 只有后端能用。'),
      codeBlock('# .env.local\n\n# 前端看不到（只有 route.ts / Server Action 可用）\nDATABASE_URL=postgresql://...\nYOUTUBE_API_KEY=abc123\n\n# 前端能看到\nNEXT_PUBLIC_API_BASE=https://api.example.com'),
      boldPara('原则'),
      para('不放心就全不加前缀——默认服务端专属，最安全。'),

      // 7.9
      heading2('7.9 测试基础（Testing）'),
      boldPara('核心'),
      para('自动化测试 = 让代码验证代码，改完不用手点一遍。'),
      boldPara('三个核心匹配器'),
      codeBlock('expect(count).toBe(10)                              // 严格相等（===）\nexpect(data).toEqual({ id: 1, title: "React" })        // 内容相等\nexpect(() => fn()).toThrow(\'参数不能为空\')              // 期望抛错'),
      tableFromData(['匹配器', '比较方式', '适用场景'], [
        ['toBe', '===（引用地址）', '基本类型'],
        ['toEqual', '逐字段比内容', '对象/数组']
      ]),
      boldPara('Mock（模拟）'),
      codeBlock('global.fetch = vi.fn().mockResolvedValue({\n  ok: true,\n  json: () => Promise.resolve([{ id: 1, title: "测试视频" }])\n})'),
      tableFromData(['部分', '作用'], [
        ['vi.fn()', '创建假函数'],
        ['.mockResolvedValue(...)', '设定 resolve 后的值'],
        ['global.fetch = ...', '全局替换 fetch']
      ]),
      boldPara('vi 常用功能'),
      codeBlock('vi.fn()              // 创建假函数\nvi.spyOn(obj, "m")   // 监听方法调用\nvi.useFakeTimers()   // 假装控制时间（测防抖）\nvi.restoreAllMocks() // 还原所有假函数'),

      // 7.10
      heading2('7.10 REST 规范'),
      boldPara('核心规则'),
      para('URL 是资源（名词），HTTP 方法是动作（动词）。'),
      codeBlock('GET    /api/videos       → 获取视频列表\nPOST   /api/videos       → 创建新视频\nGET    /api/videos/123   → 获取 123 号视频\nDELETE /api/videos/123   → 删除 123 号视频'),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 二、进阶 Hooks =====
      heading1('二、进阶 Hooks：useCallback 与 useMemo'),

      heading2('useCallback：缓存函数引用'),
      boldPara('解决的问题'),
      para('每次组件重新渲染，函数都会被重新创建（新地址）。配合 React.memo 时，新函数地址会让 memo 失效。'),
      codeBlock('// ❌ 每次渲染都创建新函数\nconst handleClick = () => { ... }\n\n// ✅ 依赖没变就用同一个函数\nconst handleClick = useCallback(() => { ... }, [依赖数组])'),
      boldPara('依赖数组规则（与 useEffect 相同）'),
      codeBlock('const handleToggleFavorite = useCallback(async () => {\n  setFavoriteStatus(favoriteStatus => !favoriteStatus)\n  onFavoriteToggle?.(!favoriteStatus)\n}, [favoriteStatus, onFavoriteToggle])  // 函数里用到什么就放什么'),
      boldPara('重要规则'),
      para('useState 返回的 setter（setFavorites 等）引用永远不变，不需要放进依赖数组。'),

      heading2('useMemo：缓存计算结果'),
      boldPara('解决的问题'),
      para('每次渲染重复计算耗时操作。'),
      codeBlock('// ❌ 每次渲染都重新过滤\nconst filtered = videos.filter(v => v.title.includes(keyword))\n\n// ✅ keyword 或 videos 没变就用上一次的结果\nconst filtered = useMemo(() => {\n  return videos.filter(v => v.title.includes(keyword))\n}, [videos, keyword])'),
      para('useCallback(fn, deps) 等价于 useMemo(() => fn, deps)——useCallback 就是「缓存函数版本的 useMemo」。'),

      heading2('三大 Hook 对比'),
      tableFromData(['Hook', '缓存什么', '解决的问题', '返回值'], [
        ['useEffect(fn, deps)', '不缓存', '依赖变了要做事', 'void'],
        ['useCallback(fn, deps)', '函数引用', '配合 React.memo 防止无谓渲染', '函数'],
        ['useMemo(fn, deps)', '计算结果', '避免重复计算', '值']
      ]),
      para('相同点：都是"看依赖 → 没变就跳过"的模式。'),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 三、实战篇 =====
      heading1('三、实战篇：LongCut 项目'),

      heading2('任务一：乐观更新收藏按钮'),
      boldPara('修改文件'),
      para('components/video-header.tsx'),
      boldPara('改前 vs 改后'),
      para('改前：点按钮 → fetch → 等返回 → 改按钮状态'),
      para('改后：点按钮 → 立刻改按钮状态 → 后台 fetch → 失败改回来'),
      boldPara('关键代码'),
      codeBlock('// 1. 乐观更新：fetch 之前立刻切换 UI\nsetFavoriteStatus(favoriteStatus => !favoriteStatus)\nonFavoriteToggle?.(!favoriteStatus)\n\n// 2. 后台发请求\ntry {\n  await fetch(...)\n} catch {\n  // 3. 失败回滚\n  setFavoriteStatus(favoriteStatus => !favoriteStatus)\n  onFavoriteToggle?.(!favoriteStatus)\n}'),

      heading2('任务二：route.ts → Server Action'),
      boldPara('创建文件'),
      para('app/actions/toggle-favorite.ts'),
      boldPara('核心差异'),
      tableFromData(['', 'route.ts', 'Server Action'], [
        ['标记', 'export const POST = withSecurity(...)', "'use server'"],
        ['参数', 'req.json() 手动解析', '直接接收，像普通函数'],
        ['返回值', 'NextResponse.json({ status: 200 })', 'return { ... } 普通对象'],
        ['错误处理', 'NextResponse.json({ status: 401 })', 'throw new Error(...)'],
        ['前端调用', "fetch('/api/xxx', { body: ... })", 'toggleFavorite(id, true)']
      ]),
      para('Server Action 去掉了所有 HTTP 协议相关的东西——写后端逻辑就像写普通函数一样。'),

      boldPara('理解 req 和 NextResponse'),
      para('req：Next.js 根据 URL → 文件 → HTTP 方法 → 函数，自动传入的请求对象'),
      para('NextResponse：你主动调用的工具，用来构建 HTTP 响应'),
      para('req = 收到的包裹，NextResponse = 你填的回单，两个方向不同。'),

      heading2('Bug 修复：isPlayingAll 未定义'),
      boldPara('问题'),
      para('highlights-panel.tsx 第 120 行 isPlayingAll is not defined'),
      boldPara('原因'),
      para('Zustand 迁移时从 store 导入了但漏了取值。'),
      boldPara('修复'),
      codeBlock('const isPlayingAll = usePlayAllStore((state) => state.isPlayingAll)'),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 四、开发环境 =====
      heading1('四、开发环境入门'),

      heading2('包管理器对比'),
      tableFromData(['Python', 'Node.js (LongCut)', '作用'], [
        ['pip', 'pnpm / npm / yarn', '包管理'],
        ['requirements.txt', 'package.json', '依赖清单'],
        ['venv（虚拟环境）', 'node_modules 目录', '隔离的包目录']
      ]),
      para('LongCut 使用 pnpm（根据 pnpm-lock.yaml 确认）。Node.js 没有 venv——每个项目独立 node_modules。'),
      para('npx = 临时下载运行命令行工具，类似 python -m venv。'),

      boldPara('常用命令'),
      codeBlock('pnpm install  # 安装依赖\npnpm dev      # 启动开发服务器'),

      heading2('配置文件说明'),
      tableFromData(['文件', '作用'], [
        ['package.json + pnpm-lock.yaml', '包管理'],
        ['tsconfig.json', 'TypeScript 配置（Next.js 自动生成）'],
        ['next.config.ts', 'Next.js 框架配置'],
        ['.env.local', '敏感信息']
      ]),

      heading2('Next.js 编译流程'),
      tableFromData(['工具', '职责'], [
        ['tsconfig.json', 'TypeScript 类型检查规则'],
        ['Next.js 内置工具', '编译 .ts/.tsx → .js'],
        ['TypeScript', '只做类型检查，不负责编译']
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 附录 =====
      heading1('附录：今日提问精选'),
      tableFromData(['问题', '关键答案'], [
        ['pnpm 怎么建虚拟环境？', 'Node.js 没有 venv，每个项目独立的 node_modules'],
        ['tsconfig.json 需要自己写吗？', '不用，Next.js 创建项目时自动生成'],
        ['为什么 Server Action 用 use server？', '声明运行位置，不是安全检查'],
        ['useCallback 依赖数组里放什么？', '函数里用到的所有外部变量（除 useState setter）'],
        ['useCallback 和 useMemo 是同一个东西？', '本质一样，useCallback 是缓存函数版本的 useMemo'],
        ['三个 Hook 有什么区别？', '执行副作用 / 缓存函数 / 缓存值']
      ]),

      new Paragraph({ spacing: { before: 400 }, children: [] }),
      para('笔记生成时间：2026-06-01 | Stage 5.7~7.10 理论完成，进入 LongCut 实战阶段', { italics: true, color: '999999' })
    ]
  }]
})

const path = require('path')
const outputPath = path.resolve(__dirname, '..', 'docs', 'learning-notes-06-01.docx')
Packer.toBuffer(doc).then(buffer => {
  require('fs').writeFileSync(outputPath, buffer)
  console.log('DOCX generated:', outputPath)
})
