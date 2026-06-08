const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, PageBreak, Footer, PageNumber
} = require('docx')

function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 360 },
    shading: { type: ShadingType.SOLID, color: 'F5F5F5', fill: 'F5F5F5' },
    border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'E07B3C' } },
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

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text, font: 'Microsoft YaHei', size: 21, ...opts })]
  })
}

function boldPara(text) { return para(text, { bold: true }) }

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
  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: cell, font: 'Microsoft YaHei', size: 20 })] })]
    }))
  }))
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] })
}

const doc = new Document({
  styles: { default: { document: { run: { font: 'Microsoft YaHei', size: 21 } } } },
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
      // 封面
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'LongCut 学习笔记', font: 'Microsoft YaHei', size: 52, bold: true, color: 'E07B3C' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: '2026-06-05', font: 'Microsoft YaHei', size: 32, color: '888888' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: '乐观更新修复 + Git + Tailwind CSS + 数据流 + API Route + Zustand', font: 'Microsoft YaHei', size: 24, color: '666666' })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // 一、乐观更新修复
      heading1('一、乐观更新修复'),
      heading2('问题定位'),
      codeBlock('setIsUpdating(true);           // ← 先禁用按钮 + 显示转圈动画\nsetFavoriteStatus(...);          // ← 再乐观更新'),
      para('setIsUpdating(true) 在前面，导致按钮先禁用并显示加载态，用户看不到"星星立刻变亮"的效果。'),
      heading2('修复方案'),
      para('去掉 isUpdating 状态，直接乐观更新不显示加载：'),
      codeBlock('const handleToggleFavorite = async () => {\n  if (!user) {\n    toast.error("Please sign in to save favorites");\n    return;\n  }\n\n  setFavoriteStatus(favoriteStatus => !favoriteStatus);\n  onFavoriteToggle?.(!favoriteStatus);\n\n  try {\n    const response = await toggleFavorite(videoId, !favoriteStatus);\n    if (!response.success) {\n      throw new Error("Failed to update favorite status");\n    }\n    toast.success(\n      response.isFavorite ? "Added to favorites" : "Removed from favorites"\n    );\n  } catch {\n    setFavoriteStatus(favoriteStatus => !favoriteStatus);\n    onFavoriteToggle?.(!favoriteStatus);\n    toast.error("Failed to update favorite status");\n  }\n};'),
      heading2('清理残留引用'),
      tableFromData(['需要删除', '位置'], [
        ['isUpdating state', 'state 声明'],
        ['disabled={isUpdating}', 'Button 属性'],
        ['isUpdating ? <Loader2 /> : <Star />', '三元表达式'],
        ['Loader2 import', '文件顶部']
      ]),
      para('Loader2 是旋转加载图标，之前用在 isUpdating 时显示。现在 isUpdating 永远是 false，Loader2 永远不会显示，所以删掉。'),

      new Paragraph({ children: [new PageBreak()] }),

      // 二、Git 提交规范
      heading1('二、Git 提交规范'),
      heading2('提交策略'),
      para('分两次提交：第一次只提交我们改的文件，第二次提交其他所有改动。'),
      codeBlock('# 第一次：我们的改动\ngit add components/video-header.tsx app/analyze/[videoId]/page.tsx app/actions/toggle-favorite.ts\ngit commit -m "feat: mount VideoHeader with optimistic favorite toggle"\n\n# 第二次：其他改动\ngit add -A\ngit commit -m "chore: update dependencies and add project infrastructure"'),
      heading2('Commit Message 格式'),
      tableFromData(['前缀', '含义', '例子'], [
        ['feat:', '新功能', 'feat: mount VideoHeader'],
        ['fix:', '修复 bug', 'fix: restore MiniMax translation'],
        ['chore:', '杂项（依赖、配置）', 'chore: update dependencies'],
        ['refactor:', '重构（不改功能）', 'refactor: extract auth logic']
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // 三、Tailwind CSS 基础
      heading1('三、Tailwind CSS 基础'),
      heading2('什么是 Tailwind'),
      para('用简短的工具类名代替一长串 CSS 属性。一个类名 = 一个 CSS 属性。'),
      codeBlock('/* Tailwind */\n<div className="flex items-center gap-3.5">\n\n/* 等价 CSS */\ndisplay: flex;\nalign-items: center;\ngap: 3.5;'),
      heading2('数值映射'),
      para('间距类（p, m, gap, w, h）数字 × 4px。'),
      tableFromData(['数值', '实际大小'], [
        ['0', '0px'], ['1', '4px'], ['2', '8px'], ['3', '12px'],
        ['4', '16px'], ['5', '20px'], ['6', '24px'], ['8', '32px']
      ]),
      heading2('方向后缀'),
      tableFromData(['写法', '含义'], [
        ['p-3', '四个方向都是 12px'],
        ['px-3', '左右都是 12px（x = 水平）'],
        ['py-3', '上下都是 12px（y = 垂直）'],
        ['pt-3', '只有顶部 12px']
      ]),
      heading2('常用类名速查'),
      boldPara('Flex 布局'),
      tableFromData(['类名', 'CSS'], [
        ['flex', 'display: flex'],
        ['items-center', 'align-items: center'],
        ['gap-3.5', 'gap: 14px'],
        ['flex-shrink-0', 'flex-shrink: 0（不允许缩小）']
      ]),
      boldPara('颜色'),
      para('数字越大颜色越深：50（最浅）→ 900（最深）。'),
      tableFromData(['类名', 'CSS'], [
        ['text-white', 'color: white'],
        ['text-gray-500', 'color: #6b7280'],
        ['bg-black/80', 'background: rgba(0,0,0,0.8)']
      ]),
      boldPara('圆角'),
      tableFromData(['类名', '实际大小'], [
        ['rounded', '4px'], ['rounded-lg', '8px'], ['rounded-xl', '12px'], ['rounded-full', '完全圆形']
      ]),
      heading2('响应式前缀'),
      tableFromData(['前缀', '屏幕宽度'], [
        ['无前缀', '所有屏幕都生效'],
        ['sm:', '>= 640px'], ['md:', '>= 768px'], ['lg:', '>= 1024px'], ['xl:', '>= 1280px']
      ]),
      codeBlock('/* 手机 1 列，桌面 3 列 */\n<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">'),

      new Paragraph({ children: [new PageBreak()] }),

      // 四、数据流理解
      heading1('四、数据流理解'),
      heading2('完整流程'),
      codeBlock('1. UrlInput → 用户粘贴 URL，点击提交\n   ↓ onSubmit(url)\n\n2. AnalyzePage → 提取 videoId，发 fetch 请求\n   ↓ fetch(\'/api/xxx\')\n\n3. API Route → 查询数据库/YouTube\n   ↓ 返回 JSON\n\n4. setVideoInfo(data) → 数据存到 useState\n   ↓ React 重渲染\n\n5. 传 props → videoInfo 传给子组件\n   ↓\n\n6. VideoHeader 渲染 → 显示标题、作者、收藏按钮'),
      heading2('关键理解'),
      para('数据不在浏览器里，需要从服务器拿。videoInfo 这个 state 初始值是 null，等服务器返回数据后才变成真正的视频信息。'),

      new Paragraph({ children: [new PageBreak()] }),

      // 五、API Route 阅读
      heading1('五、API Route 阅读'),
      heading2('check-video-cache 结构'),
      codeBlock('1. import 引入\n2. async function handler(req) { ... }\n3. export const POST = withSecurity(handler, ...)'),
      heading2('三种返回状态'),
      tableFromData(['状态', '返回值'], [
        ['有缓存', '{ cached: true, topics, transcript, videoInfo, ... }'],
        ['没缓存', '{ cached: false, videoId }'],
        ['出错', "{ error: '...' }, status: 500" ]
      ]),
      para('没缓存不是错误，是正常返回 { cached: false }。前端收到后会调用分析接口重新分析。'),
      heading2('遗漏的步骤'),
      para('归属权检查（ownedByCurrentUser）：视频是否是当前用户创建的，前端用来决定显示什么按钮。'),
      para('记录访问（user_videos upsert）：写入 user_videos 表，相当于"打卡"。'),

      new Paragraph({ children: [new PageBreak()] }),

      // 六、Zustand 状态管理
      heading1('六、Zustand 状态管理'),
      heading2('解决的问题'),
      para('useState 只能在当前组件里用。如果两个不相关的组件需要知道同一个状态（比如"是否正在播放"），就需要 Zustand。'),
      heading2('Store 结构'),
      codeBlock('import { create } from \'zustand\'\n\nconst usePlayAllStore = create((set) => ({\n  isPlayingAll: false,\n  playAllIndex: 0,\n  setIsPlayingAll: (value) => set({ isPlayingAll: value }),\n  setPlayAllIndex: (value) => set({ playAllIndex: value }),\n  resetPlayAll: () => set({ isPlayingAll: false, playAllIndex: 0 }),\n  nextInPlayAll: () => set((state) => ({ playAllIndex: state.playAllIndex + 1 })),\n}))'),
      heading2('Python 类比'),
      codeBlock('# Zustand store ≈ 全局字典 + 修改函数\nplay_all_store = {\n    "isPlayingAll": False,\n    "playAllIndex": 0\n}\n\ndef set_is_playing_all(value):\n    play_all_store["isPlayingAll"] = value'),
      heading2('使用方式'),
      codeBlock('// 读取数据\nconst isPlayingAll = usePlayAllStore((state) => state.isPlayingAll);\n\n// 修改数据\nconst setIsPlayingAll = usePlayAllStore((state) => state.setIsPlayingAll);\nsetIsPlayingAll(true);  // 所有用到 isPlayingAll 的组件自动更新'),

      new Paragraph({ children: [new PageBreak()] }),

      // 附录
      heading1('附录：今日提问精选'),
      tableFromData(['问题', '关键答案'], [
        ['Loader2 的作用是啥？', '旋转加载图标，之前用在 isUpdating 时显示，现在删掉了'],
        ['Tailwind 数字都要乘以 4 吗？', '间距类乘 4，字体和圆角用名字不用算'],
        ['flex-shrink-0 是什么意思？', '不允许元素在空间不足时缩小'],
        ['数据从 URL 到 VideoHeader 经过哪些步骤？', 'UrlInput → AnalyzePage → API → setVideoInfo → props → VideoHeader'],
        ['没缓存是错误吗？', '不是，正常返回 { cached: false }，前端会调用分析接口'],
        ['Zustand 是什么？', '全局状态管理器，解决多个组件共享同一份数据的问题'],
        ['useState 和 Zustand 的区别？', 'useState 只在当前组件，Zustand 是全局的']
      ]),

      new Paragraph({ spacing: { before: 400 }, children: [] }),
      para('笔记生成时间：2026-06-05 | 乐观更新修复 + Git + Tailwind CSS + 数据流 + API Route + Zustand', { italics: true, color: '999999' })
    ]
  }]
})

const path = require('path')
const outputPath = path.resolve(__dirname, '..', 'docs', 'learning-notes-06-05.docx')
Packer.toBuffer(doc).then(buffer => {
  require('fs').writeFileSync(outputPath, buffer)
  console.log('DOCX generated:', outputPath)
})
