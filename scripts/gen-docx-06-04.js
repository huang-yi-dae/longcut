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
        children: [new TextRun({ text: '2026-06-04', font: 'Microsoft YaHei', size: 32, color: '888888' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: 'React/Next.js 概念辨析 + 组件阅读实战 + 函数 Props 本质 + VideoHeader 挂载', font: 'Microsoft YaHei', size: 24, color: '666666' })]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 一、React / Next.js / Vite 概念辨析 =====
      heading1('一、React / Next.js / Vite 概念辨析'),

      heading2('三者关系'),
      tableFromData(['技术', '本质', '说明'], [
        ['React', 'UI 库', '组件、Hooks、useState、useEffect'],
        ['Next.js', '基于 React 的框架', '路由、Server Actions、SSR/ISR'],
        ['Vite', '构建工具', 'LongCut 没用 Vite，用的是 Next.js 自带的']
      ]),

      heading2('Python 类比'),
      tableFromData(['Python 世界', '前端世界', '设计理念'], [
        ['Python 语言', 'JavaScript / TypeScript', '基础语言'],
        ['Flask（轻量，只做 Web）', 'React（轻量，只做 UI）', '专注一件事'],
        ['Django（全栈全家桶）', 'Next.js（全栈全家桶）', '路由 + 后端 + 模板全包'],
        ['pip / requirements.txt', 'pnpm / package.json', '包管理'],
        ['venv', 'node_modules', '隔离环境']
      ]),

      heading2('Next.js = React + 路由 + 后端'),
      tableFromData(['部分', '说明'], [
        ['React', '你已经会的，组件 / Hooks'],
        ['路由', '文件夹结构自动变 URL，不用手动配'],
        ['后端', "'use server' 直接写数据库操作，不用单独起后端服务器"]
      ]),
      para('跟 Flask 对比：Flask 项目你要写前端模板（HTML）+ 后端路由（@app.route）。Next.js 把这两件事合到一个项目里了——前端组件和后端逻辑在同一个代码库，用同一个语言（JS/TS）。'),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 二、组件阅读实战 =====
      heading1('二、组件阅读实战：url-input.tsx'),

      heading2('组件文件结构'),
      codeBlock('1. import 引入\n2. interface（props 类型定义）\n3. export function 组件名（解构 props）\n   ├── state（useState）\n   ├── useEffect\n   ├── handler（事件处理函数）\n   └── return JSX（渲染）'),

      heading2('HTML 原生标签 vs 自定义组件'),
      tableFromData(['写法', '类型', '例子'], [
        ['小写', 'HTML 原生标签', '<div>, <form>, <input>, <p>'],
        ['大写开头', '自定义 React 组件', '<Card>, <Button>, <ModeSelector>']
      ]),
      para('大写开头的组件都通过 import 引入，本质上跟 VideoHeader、UrlInput 是一样的——一个函数，返回 JSX。只不过它们被封装在 ui/ 目录下，专门处理样式。'),

      heading2('div 的排列方式'),
      tableFromData(['写法', '排列方向'], [
        ['<div>', '垂直（默认，从上往下堆）'],
        ['<div className="flex ...">', '水平（改成从左往右排）']
      ]),
      codeBlock('{/* 水平排列：图标 + 输入框并排 */}\n<div className="flex w-full items-center gap-2.5">\n  <Link className="..." />   ← 链接图标\n  <input ... />               ← URL 输入框\n</div>'),

      heading2('条件渲染'),
      codeBlock('{error && (\n  <p className="...">{error}</p>\n)}'),
      para('条件为真时渲染组件，否则不渲染。等价于 {error ? <p>{error}</p> : null}。当 error 是空字符串（falsy），不显示；设置非空字符串后错误提示才显示。'),

      heading2('e.preventDefault() 阻止页面刷新'),
      para('浏览器收到 <form> 提交时，默认会刷新页面（把数据拼到 URL 上发 GET 请求）。在 React 单页应用里，刷新会丢失所有状态，所以必须阻止。'),
      tableFromData(['对比项', '传统 HTML form', 'React 的 form'], [
        ['提交时', '刷新页面', '不刷新，JS 处理'],
        ['数据传输', '浏览器自动拼 URL', 'JS 手动控制'],
        ['e.preventDefault()', '不需要', '必须，否则会刷新']
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 三、函数 Props 的本质 =====
      heading1('三、函数 Props 的本质'),

      heading2('JSX 是函数调用的语法糖'),
      codeBlock('<UrlInput onSubmit={handleSubmit} onModeChange={setMode} />'),
      para('React 内部翻译为函数调用：'),
      codeBlock('UrlInput({ onSubmit: handleSubmit, onModeChange: setMode })'),
      para('用 Python 类比：'),
      codeBlock('def url_input(onSubmit, on_mode_change):\n    pass\n\n# 调用时传参数，和 React 的 props 机制一模一样\nurl_input(onSubmit=handle_analyze, on_mode_change=set_mode)'),
      para('所以"传 props"不是 DOM 树层面的操作，就是函数传参——父组件调用子函数时多传了几个参数。'),

      heading2('子组件通知父组件的唯一方式'),
      boldPara('函数 props 是"子组件通知父组件"的唯一方式。子组件没有数据修改权，它只能喊一声，让父组件自己处理。'),
      para('完整流程：'),
      codeBlock('// 1. 父组件定义函数 + 通过 props 传给子组件\n<UrlInput onSubmit={(url) => handleAnalyze(url)} />\n\n// 2. 子组件收到函数引用\nexport function UrlInput({ onSubmit, onModeChange }) { ... }\n\n// 3. 子组件在合适的时机调用\nonSubmit(url);           // 用户点提交时\nonModeChange("smart");   // 用户切换模式时'),

      heading2('与 Python 类比'),
      para('React 的 props 解构赋值：'),
      codeBlock('export function UrlInput({ onSubmit, onModeChange }) { ... }'),
      para('等价于 Python 的关键字参数解包：'),
      codeBlock('def url_input(**kwargs):\n    on_submit = kwargs[\'on_submit\']\n    on_mode_change = kwargs[\'on_mode_change\']'),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 四、实战：VideoHeader 挂载 =====
      heading1('四、实战：VideoHeader 挂载到分析页面'),

      heading2('孤岛组件'),
      para('VideoHeader 的代码写好了（乐观更新 + Server Action），但项目里没有被 import——就像写了一个 Python 函数但没在 main() 里调用。不会出现在页面上。'),

      heading2('操作步骤'),
      boldPara('1. 在分析页面顶部添加 import'),
      para('文件：app/analyze/[videoId]/page.tsx'),
      codeBlock('import { VideoHeader } from "@/components/video-header";'),

      boldPara('2. 在左栏 YouTubePlayer 前放置 VideoHeader'),
      codeBlock('<div className="sticky top-[6.5rem] space-y-3.5" id="video-container">\n  <VideoHeader\n    videoInfo={videoInfo!}\n    videoId={videoId!}\n    onFavoriteToggle={(newStatus) => {\n      console.log("收藏状态变啦:", newStatus);\n    }}\n  />\n  <YouTubePlayer ... />\n</div>'),
      para('videoInfo! 的感叹号表示"我确定它不是 null"，因为这行代码已经在 videoId && topics.length > 0 的条件判断里面了。'),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 五、乐观更新问题修复 =====
      heading1('五、乐观更新问题修复'),

      heading2('问题定位'),
      codeBlock('setIsUpdating(true);           // ← 先禁用按钮 + 显示转圈动画\nsetFavoriteStatus(...);          // ← 再乐观更新'),
      para('setIsUpdating(true) 在前面，导致按钮先禁用并显示加载态，用户看不到"星星立刻变亮"的效果——看到的只是转圈圈。这不是真正的乐观更新。'),

      heading2('修复方案'),
      para('去掉 isUpdating 状态，直接乐观更新不显示加载：'),
      codeBlock('const handleToggleFavorite = async () => {\n  if (!user) {\n    toast.error("Please sign in to save favorites");\n    return;\n  }\n\n  // 没有 isUpdating 了，直接乐观更新\n  setFavoriteStatus(favoriteStatus => !favoriteStatus);\n  onFavoriteToggle?.(!favoriteStatus);\n\n  try {\n    const response = await toggleFavorite(videoId, !favoriteStatus);\n    if (!response.success) {\n      throw new Error("Failed to update favorite status");\n    }\n    toast.success(\n      response.isFavorite ? "Added to favorites" : "Removed from favorites"\n    );\n  } catch {\n    // 失败回滚\n    setFavoriteStatus(favoriteStatus => !favoriteStatus);\n    onFavoriteToggle?.(!favoriteStatus);\n    toast.error("Failed to update favorite status");\n  }\n};'),
      para('同时把 JSX 中 disabled={isUpdating} 和 Loader2 加载动画相关代码删掉。'),

      new Paragraph({ children: [new PageBreak()] }),

      // ===== 附录 =====
      heading1('附录：今日提问精选'),
      tableFromData(['问题', '关键答案'], [
        ['React、Next.js、Vite 分别是什么？', 'React=UI 库，Next.js=框架，Vite=构建工具'],
        ['Next.js 是 React+后端吗？', '更准确是 React + 路由 + 后端能力'],
        ['<div> 垂直还是水平排列？', '默认垂直，加 className="flex" 改为水平'],
        ['e.preventDefault() 是检查格式吗？', '不是，是阻止浏览器默认的页面刷新行为'],
        ['{error && <p>} 什么意思？', '条件渲染，条件为真才显示组件'],
        ['<Card>、<Button> 是什么？', '自定义 React 组件（大写开头），封装了样式的盒子'],
        ['Props 传参是必须跨文件吗？', '不需要，本质是 A 函数调 B 函数传参数'],
        ['<UrlInput onSubmit={fn} /> 在干什么？', '等价于 UrlInput({ onSubmit: fn })，JSX 是函数调用的语法糖'],
        ['为什么 VideoHeader 不显示？', '孤岛组件——定义了但没被父组件 import 引用'],
        ['VideoHeader 放上面还是下面？', '上面更自然，先看标题再播放视频'],
        ['为什么乐观更新不生效？', 'setIsUpdating(true) 在前面导致按钮先禁用']
      ]),

      new Paragraph({ spacing: { before: 400 }, children: [] }),
      para('笔记生成时间：2026-06-04 | React/Next.js 概念辨析 + 组件阅读 + 函数 Props + VideoHeader 挂载', { italics: true, color: '999999' })
    ]
  }]
})

const path = require('path')
const outputPath = path.resolve(__dirname, '..', 'docs', 'learning-notes-06-04.docx')
Packer.toBuffer(doc).then(buffer => {
  require('fs').writeFileSync(outputPath, buffer)
  console.log('DOCX generated:', outputPath)
})
