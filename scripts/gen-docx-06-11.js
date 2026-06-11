const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak, Footer, PageNumber } = require('docx');
const fs = require('fs');

// Helper functions
function codeBlock(text) {
  const lines = text.split('\n');
  return lines.map(line =>
    new Paragraph({ spacing: { before: 0, after: 0 }, indent: { left: 360 }, shading: { type: ShadingType.CLEAR, color: 'F5F5F5', fill: 'F5F5F5' }, border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'E07B3C' } }, children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 18, color: '333333' })] })
  );
}

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 32, bold: true, color: '1a1a2e' })] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 26, bold: true, color: '16213e' })] }); }
function p(t, o = {}) { return new Paragraph({ spacing: { after: 120, line: 360 }, children: [new TextRun({ text: t, font: 'Microsoft YaHei', size: 21, ...o })] }); }
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
          children: [new Paragraph({ children: [new TextRun({ text: String(c), font: 'Microsoft YaHei', size: 20 })] })]
        })
      )}))
    ]
  });
}

// Build document
const children = [
  // Title page
  new Paragraph({ spacing: { before: 2400 }, children: [] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'LongCut 学习笔记', font: 'Microsoft YaHei', size: 52, bold: true, color: 'E07B3C' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: '2026-06-11', font: 'Microsoft YaHei', size: 32, color: '888888' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'TypeScript 类型系统入门 + 运行环境理解', font: 'Microsoft YaHei', size: 24, color: '666666' })] }),
  new Paragraph({ children: [new PageBreak()] }),

  // 一、TypeScript 基础类型
  h1('一、TypeScript 基础类型'),
  h2('1.1 编译时 vs 运行时'),
  p('TypeScript 的核心价值：在写代码的时候就发现类型错误，而不是跑到一半才炸。'),
  p('给变量和函数参数加冒号指定类型：let name: string = "大鹅"'),
  h2('1.2 三大基本类型'),
  ...codeBlock('let name: string = "大鹅";       // 小写 s，不是 String\nlet age: number = 20;             // 不区分 int/float\nlet isStudent: boolean = true;    // 小写 b，不是 Boolean'),
  h2('1.3 TypeScript vs Java'),
  tb(['概念', 'Java', 'TypeScript'], [
    ['字符串', 'String', 'string（小写）'],
    ['整数', 'int / long', 'number（全包）'],
    ['浮点', 'float / double', 'number（全包）'],
    ['布尔', 'boolean', 'boolean'],
  ]),
  new Paragraph({ children: [new PageBreak()] }),

  // 二、Interface
  h1('二、interface — 定义对象的形状'),
  h2('2.1 interface 基本语法'),
  p('从 video-header.tsx 入手，interface 定义一个对象长什么样——有哪些属性，每个属性什么类型。'),
  ...codeBlock('interface VideoHeaderProps {\n  videoInfo: VideoInfo;\n  videoId: string;\n  isFavorite?: boolean;\n  onFavoriteToggle?: (newStatus: boolean) => void;\n}'),
  h2('2.2 可选属性 ?'),
  p('isFavorite?: boolean 表示这个属性可以不传。传了就是 boolean，没传就是 undefined。'),
  h2('2.3 联合类型 |'),
  p('duration: number | null 表示值可以是 number 或 null。| 是类型注解里的语法，不是代码表达式里的逻辑或。'),
  h2('2.4 数组类型 []'),
  p('tags?: string[] 表示字符串数组。在类型后面加 [] 表示"这个类型的数组"。'),
  tb(['TypeScript', 'Python 类比'], [
    ['string[]', 'list[str]'],
    ['number[]', 'list[int]'],
  ]),
  new Paragraph({ children: [new PageBreak()] }),
  h2('2.5 函数类型'),
  p('onFavoriteToggle?: (newStatus: boolean) => void'),
  tb(['部分', '含义'], [
    ['onFavoriteToggle?', '可选属性'],
    ['(newStatus: boolean)', '参数：布尔值'],
    ['=> void', '返回值：void（无返回值）'],
  ]),
  h2('2.6 嵌套 interface'),
  p('VideoHeaderProps 包含 videoInfo: VideoInfo — 一个 interface 嵌套另一个。VideoHeaderProps 包含了 VideoInfo 的全部字段，还额外加了组件自己需要的字段。'),
  h2('2.7 TypeScript interface vs Java interface'),
  tb(['', 'Java interface', 'TypeScript interface'], [
    ['定义', '行为（方法）', '形状（字段+类型）'],
    ['实现', 'class implements', '对象直接符合即可'],
  ]),
  new Paragraph({ children: [new PageBreak()] }),

  // 三、泛型
  h1('三、泛型 — 给类型开一个"参数位"'),
  h2('3.1 useState<T> 是泛型'),
  p('const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);'),
  p('useState 本身不知道你要存什么类型，尖括号里指定。跟 Java 的 ArrayList<String> 一个道理。'),
  h2('3.2 VideoInfo | null 联合用法'),
  p('初始值是 null，组件刚渲染时 videoInfo 为空。收到 API 数据后才变成 VideoInfo 对象。TypeScript 要求使用前先确认不是 null。'),

  new Paragraph({ children: [new PageBreak()] }),

  // 四、运行时的安全访问
  h1('四、运行时的安全访问'),
  h2('4.1 非空断言 ! — 危险'),
  p('<VideoHeader videoInfo={videoInfo!} />'),
  p('感叹号告诉 TypeScript："我保证不是 null，别报错"。但 ! 不会在运行时做任何检查——如果真的是 null，代码照样炸。'),
  h2('4.2 可选链 ?. — 安全'),
  p('onFavoriteToggle?.(!favoriteStatus);'),
  p('如果 onFavoriteToggle 是 null/undefined，什么都不做，不报错。这是运行时真正保护你。'),
  h2('4.3 ! vs ?. 对比'),
  tb(['写法', '如果值是 null/undefined', '安全性'], [
    ['videoInfo!', '强行当它不是，运行炸', '危险 ❌'],
    ['data?.error', '返回 undefined，不报错', '安全 ✅'],
  ]),
  p('原则：能用 ?. 就不用 !。'),
  h2('4.4 typeof 是运行时运算符'),
  p('typeof 是 JavaScript 原生运算符，在运行时执行。不是 TypeScript 编译时的类型检查。'),
  new Paragraph({ children: [new PageBreak()] }),
  h2('4.5 防御性编程案例'),
  ...codeBlock('const message =\n  typeof data?.error === "string" &&\n  data.error.trim().length > 0\n    ? data.error\n    : "Failed to load...";'),
  p('三层检查：1) data 不是 null  2) error 是字符串  3) 不是空字符串。层层保护，确保只有有效的错误信息才被使用。'),
  tb(['后端返回', '检查结果', '使用'], [
    ['{ error: "" }', '空字符串，trim后长度为0', '默认提示'],
    ['{ error: 500 }', '不是 string', '默认提示'],
    ['{ error: null }', 'null', '默认提示'],
    ['{ error: "真实错误" }', '非空字符串', '使用后端错误'],
  ]),

  new Paragraph({ children: [new PageBreak()] }),

  // 五、客户端 vs 服务器
  h1('五、客户端 vs 服务器 — 代码到底跑在哪'),
  h2('5.1 "use client" 的真正原因'),
  p('video-header.tsx 第一行有 "use client"。不是因为 JSX——是因为 useState（状态会变，需要浏览器追踪）和 onClick（点击事件只在浏览器存在）。'),
  h2('5.2 判断标准'),
  tb(['特征', '服务器组件', '客户端组件'], [
    ['渲染 JSX', '✅', '✅'],
    ['useState', '❌', '✅'],
    ['onClick / onChange', '❌', '✅'],
    ['useEffect', '❌', '✅'],
    ['localStorage', '❌', '✅'],
  ]),
  p('服务器渲染 HTML 是一次性的，没有"点击"也没有"状态变化"。'),
  h2('5.3 代码运行位置'),
  p('api/video-info/route.ts → 跑在 Next.js 服务器（Node.js）'),
  p('video-header.tsx、page.tsx → 跑在用户电脑的 Chrome 浏览器里'),
  new Paragraph({ children: [new PageBreak()] }),
  h2('5.4 VideoInfo 类型生命周期'),
  p('步骤一：lib/types.ts 定义 interface VideoInfo（类型定义）'),
  p('步骤二：api/video-info/route.ts 拼字段返回 JSON（没标注类型 — 信任区）'),
  p('步骤三：page.tsx 中 useState<VideoInfo | null>(null) 接收（标注了类型 — 检查区）'),
  p('步骤四：videoInfo! 非空断言传给 VideoHeader'),
  p('步骤五：videoInfo.title、videoInfo.author 实际使用'),
  p('核心结论：TypeScript 只在标注了类型的地方做检查。'),

  new Paragraph({ children: [new PageBreak()] }),

  // 六、type vs interface
  h1('六、type vs interface + 联合与交叉'),
  h2('6.1 type 关键字'),
  p('type 能描述任何类型，不只是对象形状。从 lib/types.ts 中：'),
  ...codeBlock('export type PlaybackCommandType =\n  \'SEEK\' | \'PLAY_TOPIC\' | \'PLAY\' | \'PAUSE\';\nexport type TopicGenerationMode = \'smart\' | \'fast\';'),
  h2('6.2 字面量类型'),
  p('type Cmd = \'SEEK\' | \'PLAY\' 表示值只能是这两个之一。跟 Java enum 作用类似。'),
  h2('6.3 interface vs type 对比'),
  tb(['特性', 'interface', 'type'], [
    ['描述对象形状', '✅', '✅'],
    ['字面量联合', '❌', '✅'],
    ['联合类型', '❌', '✅'],
    ['extends 继承', '✅', '❌（用 & 代替）'],
  ]),
  p('项目约定：描述对象用 interface，其他用 type。'),
  h2('6.4 联合 vs 交叉/继承'),
  tb(['写法', '含义', '例子'], [
    ['A | B', '或 — 可以是 A 或 B', 'number | null'],
    ['A & B / extends B', '且 — 同时有 A 和 B', 'NoteWithVideo extends Note'],
  ]),
  p('判断标准：有没有共同字段？有就用 extends，没有用 |。'),

  new Paragraph({ children: [new PageBreak()] }),

  // 七、今日提问精选
  h1('附录：今日提问精选'),
  tb(['问题', '关键答案'], [
    ['interface 描述什么？', '描述对象长什么样，有哪些字段、什么类型'],
    ['? 是什么意思？', '可选属性，可以不传，没传就是 undefined'],
    ['| 是逻辑或吗？', '不是，是联合类型，表示值可以是其中一种'],
    ['useState 的类型怎么标？', '泛型：useState<VideoInfo | null>(null)'],
    ['! 和 ?. 哪个安全？', '?. 安全，运行时真的保护；! 只骗编译器'],
    ['typeof 是 TS 还是 JS？', 'JavaScript 原生运算符，运行时执行'],
    ['"use client" 因为 JSX？', '不是，因为 useState/onClick 需要浏览器环境'],
    ['服务器能渲染 JSX 吗？', '能，Next.js Server Component 默认就渲染 JSX'],
    ['type 和 interface 区别？', 'interface 只能描述对象，type 什么都能描述'],
    ['extends 什么时候用？', '有共同字段时用 extends 继承'],
    ['三元表达式怎么写？', '条件 ? 真值 : 假值'],
  ]),
  new Paragraph({ spacing: { before: 400 }, children: [] }),
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Microsoft YaHei', size: 21 } } } },
  sections: [{
    properties: {},
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['— ', PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES, ' —'], font: 'Microsoft YaHei', size: 18, color: '999999' })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const path = 'D:/Develop/longcut/docs/learning-notes-2026-06-11.docx';
  fs.writeFileSync(path, buffer);
  console.log('DOCX created: ' + path);
});
