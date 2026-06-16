const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak } = require('docx');
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
function italic(t) { return new TextRun({ text: t, font: 'Microsoft YaHei', size: 21, italics: true, color: '666666' }); }
function bullet(t) { return new Paragraph({ spacing: { after: 80 }, bullet: { level: 0 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 21 })] }); }

function tb(h, rows) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: h.map(header =>
        new TableCell({
          borders,
          shading: { type: ShadingType.CLEAR, color: 'E07B3C', fill: 'E07B3C' },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: header, font: 'Microsoft YaHei', size: 20, bold: true, color: 'FFFFFF' })] })]
        })
      )}),
      ...rows.map(r => new TableRow({ children: r.map(c =>
        new TableCell({
          borders,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: String(c), font: 'Microsoft YaHei', size: 19, color: '333333' })] })]
        })
      )}))
    ]
  });
}

const doc = new Document({
  title: 'React Hooks 进阶 - 2026-06-12',
  sections: [{
    children: [
      h1('React Hooks 进阶：useEffect / useRef / useCallback / useMemo 与自定义 Hook'),
      p('学习日期：2026-06-12 | 项目：LongCut（Next.js 全栈项目）', { italics: true, color: '666666' }),
      new Paragraph({ spacing: { after: 200 }, children: [] }),

      // ============ 一、useEffect ============
      h2('阶段一：useEffect — 副作用调度器'),
      h3('1.1 为什么需要 useEffect'),
      p('用户问：没有 useEffect，能不能直接在组件函数体里 fetch？'),
      p('不行。React 组件的函数体在每次渲染时都会重新执行。直接写 fetch 会导致死循环：fetch → setState → re-render → fetch...'),
      p('useEffect 将"副作用"（发请求、设定时器、加监听）与"渲染"解耦——组件先渲染出来，渲染完了再执行副作用。'),

      h3('1.2 基础语法'),
      ...codeBlock('useEffect(() => {\n  // 组件渲染后，这里自动执行\n}, [依赖列表]);'),

      h3('1.3 三种依赖模式'),
      tb(['写法', '执行时机', '适用场景'], [
        ['[]', '只在第一次渲染后执行一次', '加载初始数据、注册清理'],
        ['[a, b]', '第一次 + 依赖变化时', '响应数据变化'],
        ['不写', '每次渲染都执行', '几乎不用'],
      ]),

      h3('1.4 清理函数（cleanup）'),
      p('useEffect 中可以 return 一个函数，在组件卸载时被调用。需要清理的场景：'),
      bullet('定时器：setInterval / setTimeout'),
      bullet('事件监听：addEventListener'),
      bullet('网络连接：WebSocket、Subscription'),
      bullet('进行中的请求：AbortController'),

      h3('1.5 为什么没有 onMount？'),
      p('用户问：为什么 React 不直接提供一个 onMount 函数？'),
      p('因为 useEffect 一个 API 就覆盖了三种场景：挂载（[]）、更新（[deps]）、卸载（return fn）。更少的 API 数量，更高的灵活性。'),

      new Paragraph({ children: [new TextRun({ break: 1 })] }),

      // ============ 二、useRef ============
      h2('阶段二：useRef — 跨渲染的"箱子"'),
      h3('2.1 为什么需要 useRef'),
      p('组件重新渲染时，普通变量会被重置。useRef 让 React 记住这个对象，后续渲染返回同一个引用。'),
      ...codeBlock('let count = 0; count++;  // 每次渲染都重置为 0\nconst ref = useRef(0); ref.current++;  // 跨渲染保留'),

      h3('2.2 useRef vs useState'),
      tb(['', 'useState', 'useRef'], [
        ['值变了', '触发重新渲染', '不触发'],
        ['用途', '存"变了要更新界面"的数据', '存"变了不需要更新界面"的数据'],
      ]),

      h3('2.3 项目中的应用'),
      ...codeBlock('const abortManager = useRef(new AbortManager());\nconst authPromptHandled = useRef(false);\nconst shuffledTips = useRef<string[]>([]);'),

      h3('2.4 useRef 与闭包'),
      ...codeBlock('useEffect(() => {\n  const current = abortManager.current; // 快照\n  return () => current.cleanup();\n}, []);'),

      new Paragraph({ children: [new TextRun({ break: 1 })] }),

      // ============ 三、浏览器事件 ============
      h2('阶段三：addEventListener / removeEventListener'),
      h3('3.1 基础用法'),
      ...codeBlock('window.addEventListener("scroll", handleScroll);\nwindow.removeEventListener("scroll", handleScroll);'),
      p('关键规则：移除时必须是同一个函数引用。匿名函数无法移除。'),

      h3('3.2 常见事件'),
      tb(['事件名', '触发时机'], [
        ['scroll', '滚动'],
        ['click', '点击'],
        ['keydown / keyup', '键盘按键'],
        ['resize', '窗口大小变化'],
        ['mousemove', '鼠标移动'],
      ]),

      h3('3.3 标准配对模式'),
      ...codeBlock('useEffect(() => {\n  const handleScroll = () => setScrolled(window.scrollY > threshold);\n  window.addEventListener("scroll", handleScroll);\n  return () => window.removeEventListener("scroll", handleScroll);\n}, [threshold]);'),
      p('挂载时加监听，卸载时移除。'),

      new Paragraph({ children: [new TextRun({ break: 1 })] }),

      // ============ 四、useCallback ============
      h2('阶段四：useCallback — 函数的 useRef'),
      h3('4.1 为什么需要 useCallback'),
      p('每次渲染函数都是新的引用。useCallback 缓存函数跨渲染保持同一个引用。'),

      h3('4.2 语法'),
      ...codeBlock('const cachedFn = useCallback(fn, [依赖列表]);'),

      h3('4.3 useCallback vs useEffect'),
      tb(['', 'useEffect', 'useCallback'], [
        ['第一个参数', '要执行的副作用', '要缓存的函数'],
        ['依赖不变', '不重新执行', '返回同一个函数引用'],
        ['依赖变了', '重新执行', '创建新函数'],
      ]),

      h3('4.4 用户金句'),
      p('"useCallback是函数版本的useRef，使用的是useEffect的语法。"', { italics: true, color: 'E07B3C' }),

      new Paragraph({ children: [new TextRun({ break: 1 })] }),

      // ============ 五、useMemo ============
      h2('阶段五：useMemo — 缓存计算结果'),
      h3('5.1 为什么需要 useMemo'),
      p('每次渲染都重新排序是浪费的。useMemo 在依赖没变时返回上次缓存的结果。'),

      h3('5.2 useMemo vs useCallback'),
      ...codeBlock('// useCallback(fn, deps) 等价于 useMemo(() => fn, deps)\n// useMemo 缓存计算结果\nconst sorted = useMemo(() => items.sort(), [items]);'),
      tb(['', 'useCallback', 'useMemo'], [
        ['缓存什么', '函数本身', '函数的计算结果'],
        ['等价关系', 'useMemo(() => fn, deps)', '-'],
      ]),

      h3('5.3 React Hooks 全景对照'),
      tb(['Hook', '用途', '变了触发渲染？'], [
        ['useState', '存状态', '✅'],
        ['useEffect', '执行副作用', '❌'],
        ['useRef', '跨渲染存值', '❌'],
        ['useCallback', '缓存函数', '❌'],
        ['useMemo', '缓存计算结果', '❌'],
      ]),

      new Paragraph({ children: [new TextRun({ break: 1 })] }),

      // ============ 六、自定义 Hook ============
      h2('阶段六：自定义 Hook — 把逻辑打包复用'),
      h3('6.1 本质'),
      p('把 hook 相关的逻辑封装成一个函数，以 use 开头命名，到处复用。'),

      h3('6.2 useElapsedTimer（项目实例）'),
      ...codeBlock('export function useElapsedTimer(startTime: number | null): number {\n  const [elapsedTime, setElapsedTime] = useState<number>(0);\n\n  useEffect(() => {\n    if (startTime) {\n      const interval = setInterval(() => {\n        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));\n      }, 1000);\n      return () => clearInterval(interval);\n    } else {\n      setElapsedTime(0);\n    }\n  }, [startTime]);\n\n  return elapsedTime;\n}'),
      p('使用：const elapsed = useElapsedTimer(startTime);'),

      h3('6.3 useInAppBrowser（17 行极简版）'),
      ...codeBlock('export function useInAppBrowser(): boolean {\n  const [isInApp, setIsInApp] = useState(false);\n  useEffect(() => { setIsInApp(isInAppBrowser()); }, []);\n  return isInApp;\n}'),

      h3('6.4 挑战题：useScrolled'),
      ...codeBlock('export function useScrolled(threshold = 100): boolean {\n  const [scrolled, setScrolled] = useState(false);\n  useEffect(() => {\n    const handleScroll = () => setScrolled(window.scrollY > threshold);\n    window.addEventListener("scroll", handleScroll);\n    return () => window.removeEventListener("scroll", handleScroll);\n  }, [threshold]);\n  return scrolled;\n}'),

      new Paragraph({ children: [new TextRun({ break: 1 })] }),

      // ============ 七、数据获取标准模式 ============
      h2('阶段七：数据获取标准模式'),
      h3('7.1 useState + useEffect 搭档关系'),
      p('用户总结："useState 用来控制和改变一个状态，useEffect 决定具体什么时候来控制和改变这个状态。"', { italics: true, color: 'E07B3C' }),

      h3('7.2 项目中的数据获取链路'),
      ...codeBlock('useEffect(() => {\n  fetch(url)\n  setVideoInfo(data)  // → 触发重新渲染\n  ref.current = true   // → 标记已处理\n  return () => cleanup\n}, [])'),

      h3('7.3 类型标注'),
      ...codeBlock('const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);'),
      p('VideoInfo | null：要么是完整数据，要么是还没请求到的 null。'),

      new Paragraph({ children: [new TextRun({ break: 1 })] }),

      // ============ 总结 ============
      new Paragraph({ spacing: { before: 400 } },),
      h2('今日知识点总结'),
      tb(['#', '知识点', '一句话'], [
        ['1', 'useEffect', '渲染后执行，[]只跑一次，[a,b]依赖变重跑'],
        ['2', '清理函数', 'return fn 在卸载时执行，防泄漏'],
        ['3', 'useRef', '跨渲染保存值，变了不刷新界面'],
        ['4', 'addEventListener', '浏览器注册事件监听'],
        ['5', 'removeEventListener', '移除监听，须是同一个函数引用'],
        ['6', 'useCallback', '缓存函数跨渲染保持引用'],
        ['7', 'useMemo', '缓存计算结果，依赖不变直接复用'],
        ['8', '自定义 Hook', '把 hook 逻辑封装成 useXxx 函数'],
        ['9', '数据标准模式', 'useState 存 + useEffect 取'],
      ]),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = 'D:/Develop/longcut/docs/learning-notes-2026-06-12.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('DOCX written to ' + outPath);
});
