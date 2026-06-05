const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak
} = require('docx');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function makeCell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, ...(opts.bold ? { bold: true } : {}), size: 22, font: "Arial" })],
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    })]
  });
}

function makeRow(cells) {
  return new TableRow({ children: cells });
}

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, size: 32, font: "Arial" })] });
}

function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, size: 28, font: "Arial" })] });
}

function heading3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true, size: 24, font: "Arial" })] });
}

function para(text, opts = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({ text, size: 22, font: "Arial", ...opts }));
  } else {
    // array of [text, opts]
    text.forEach(([t, o]) => runs.push(new TextRun({ text: t, size: 22, font: "Arial", ...o, ...(o || {}) })));
  }
  return new Paragraph({ children: runs, spacing: { after: 120 } });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Consolas", color: "333333" })],
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    indent: { left: 360 },
    spacing: { before: 60, after: 60 },
  });
}

function quote(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Arial", italics: true, color: "555555" })],
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 8 } },
    spacing: { before: 60, after: 60 },
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: "LongCut \u5B66\u4E60\u7B14\u8BB0 \u2014 2026-05-29", bold: true, size: 36, font: "Arial" })] }),
      new Paragraph({ spacing: { after: 240 },
        children: [new TextRun({ text: "Stage 7.2 ~ 7.5\uFF1A\u5168\u6808\u5B9E\u6218\u8BBE\u8BA1 + \u7528\u6237\u4F53\u9A8C\u589E\u5F3A", size: 24, font: "Arial", color: "666666", italics: true })] }),

      // ===== Stage 7.2 =====
      heading1("Stage 7.2 \u2014 \u6536\u85CF\u89C6\u9891\u529F\u80FD\u8BBE\u8BA1"),

      heading2("7.2.1 \u5B8C\u6574\u6D41\u7A0B\u8BBE\u8BA1"),
      para("\u7528\u6237\u70B9\u6536\u85CF \u2192 \u524D\u7AEF\u53D1 POST \u8BF7\u6C42 \u2192 \u540E\u7AEF\u63A5\u6536 \u2192 \u5B58\u5165\u6570\u636E\u5E93"),
      para([["\u77E5\u8BC6\u70B9\u4E32\u8054\uFF1A", { bold: true }], ["\u524D\u7AEF\u7EC4\u4EF6\u4EA4\u4E92\uFF086.1\uFF09 + Server Action\uFF086.2\uFF09 + Prisma\uFF086.4\uFF09 + Token \u8BA4\u8BC1\uFF086.3\uFF09"]]),
      quote("\uD83D\uDCAC \u5927\u9E45\u63D0\u95EE\uFF1A\u524D\u7AEF\u7EC4\u4EF6\u53D1\u51FA post \u8BF7\u6C42\uFF0C\u540E\u7AEF\u63A5\u53D7\u8BF7\u6C42\u4E4B\u540E\u8C03\u7528 jsx \u5B58\u5165\u6570\u636E\u5E93\u91CC\u9762"),
      quote("\u2705 \u7EA0\u9519\uFF1A\u4E0D\u662F JSX\uFF0CJSX \u662F\u524D\u7AEF\u6A21\u677F\u8BED\u6CD5\u3002\u540E\u7AEF\u7528 Prisma\uFF08ORM\uFF09\u2014\u2014\u5BF9\u8C61\u5173\u7CFB\u6620\u5C04\uFF0C\u5C06\u4EE3\u7801\u6620\u5C04\u5230 SQL \u8BED\u53E5\u3002"),

      heading2("7.2.2 Server Action vs route.ts \u9009\u578B"),
      para("\u6536\u85CF\u662F\u5199\u6570\u636E\uFF0C\u7528 Server Action\u3002"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          makeRow([makeCell("\u64CD\u4F5C", 3000, { bold: true, shading: "D5E8F0" }), makeCell("\u65B9\u5F0F", 6026, { bold: true, shading: "D5E8F0" })]),
          makeRow([makeCell("\u5199\u6570\u636E\uFF08\u6536\u85CF\u3001\u5220\u9664\uFF09", 3000), makeCell("Server Action", 6026)]),
          makeRow([makeCell("\u8BFB\u6570\u636E\u3001\u7B2C\u4E09\u65B9 API", 3000), makeCell("route.ts", 6026)]),
        ]
      }),
      para(""),

      heading2("7.2.3 Prisma \u591A\u5BF9\u591A\u5173\u8054\u8868"),
      para("\u4E00\u4E2A\u7528\u6237\u53EF\u4EE5\u6536\u85CF\u5F88\u591A\u89C6\u9891\uFF0C\u4E00\u4E2A\u89C6\u9891\u4E5F\u53EF\u4EE5\u88AB\u5F88\u591A\u7528\u6237\u6536\u85CF \u2192 \u591A\u5BF9\u591A\u5173\u7CFB\u3002\u5173\u8054\u8868\u53EA\u9700\u4E24\u4E2A\u5B57\u6BB5\uFF1A"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 7026],
        rows: [
          makeRow([makeCell("\u5B57\u6BB5", 2000, { bold: true, shading: "D5E8F0" }), makeCell("\u4F5C\u7528", 7026, { bold: true, shading: "D5E8F0" })]),
          makeRow([makeCell("userId", 2000), makeCell("\u8C01\u6536\u85CF\u7684", 7026)]),
          makeRow([makeCell("videoId", 2000), makeCell("\u6536\u85CF\u4E86\u54EA\u4E2A\u89C6\u9891", 7026)]),
        ]
      }),
      para(""),

      heading2("7.2.4 \u5B89\u5168\uFF1AToken \u8BA4\u8BC1\uFF0C\u4E0D\u4FE1\u4EFB\u524D\u7AEF"),
      para([["\u5173\u952E\u539F\u5219\uFF1A", { bold: true }], ["\u4E0D\u8BA9\u524D\u7AEF\u4F20 userId\uFF0C\u540E\u7AEF\u81EA\u5DF1\u4ECE Token \u89E3\u6790\u3002"]]),
      quote("\uD83D\uDCAC \u5927\u9E45\u63D0\u95EE\uFF1A\u80FD\u4E0D\u80FD\u8BA9\u524D\u7AEF\u76F4\u63A5\u4F20 userId\uFF1F"),
      quote("\u2705 \u56DE\u7B54\uFF1A\u4E0D\u5B89\u5168\u3002\u77E5\u9053 userId \u5C31\u80FD\u5728\u8BF7\u6C42\u5934\u91CC\u4F2A\u9020\u8EAB\u4EFD\uFF0C\u5192\u5145\u522B\u4EBA\u6536\u85CF/\u53D6\u6D88\u3002"),
      para("\u6B63\u786E\u6D41\u7A0B\uFF1A\u524D\u7AEF\u53EA\u4F20 videoId \u2192 \u540E\u7AEF\u4ECE Token \u89E3\u6790 userId \u2192 Prisma \u5199\u5165\u3002"),

      heading2("7.2.5 toggle \u6536\u85CF/\u53D6\u6D88\u903B\u8F91"),
      para("\u4E00\u4E2A Server Action \u5185\u90E8\u5224\u65AD\uFF0C\u5B9E\u73B0\u5207\u6362\uFF1A"),
      code("'use server'"),
      code(""),
      code("export async function toggleFavorite(videoId: string) {"),
      code("  const session = await auth()"),
      code("  if (!session) throw new Error('\u672A\u767B\u5F55')"),
      code(""),
      code("  // \u67E5\u662F\u5426\u5B58\u5728"),
      code("  const existing = await prisma.favorite.findFirst({"),
      code("    where: { userId: session.user.id, videoId }"),
      code("  })"),
      code(""),
      code("  // toggle\uFF1A\u6709\u5C31\u5220\uFF0C\u6CA1\u6709\u5C31\u52A0"),
      code("  if (existing) {"),
      code("    await prisma.favorite.delete({ where: { id: existing.id } })"),
      code("    return { action: 'removed' }"),
      code("  } else {"),
      code("    await prisma.favorite.create({"),
      code("      data: { userId: session.user.id, videoId }"),
      code("    })"),
      code("    return { action: 'added' }"),
      code("  }"),
      code("}"),
      para("\u4E09\u6B65\u8D70\uFF1A\u67E5 \u2192 \u5224\u65AD \u2192 \u52A0\u6216\u5220\u3002"),

      heading2("7.2.6 \u521D\u59CB\u5316\u72B6\u6001\uFF1Aroute.ts \u8BFB\u6570\u636E"),
      para("\u7528\u6237\u6253\u5F00\u9875\u9762\u65F6\u9700\u8981\u77E5\u9053\u662F\u5426\u5DF2\u6536\u85CF \u2192 \u7528 route.ts\uFF08GET\uFF09\u67E5\u6570\u636E\u5E93\u3002"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3200, 2000, 3826],
        rows: [
          makeRow([makeCell("\u63A5\u53E3", 3200, { bold: true, shading: "D5E8F0" }), makeCell("\u65B9\u5F0F", 2000, { bold: true, shading: "D5E8F0" }), makeCell("\u4F5C\u7528", 3826, { bold: true, shading: "D5E8F0" })]),
          makeRow([makeCell("GET /api/favorites?videoId=xxx", 3200), makeCell("route.ts", 2000), makeCell("\u67E5\u8BE2\u662F\u5426\u5DF2\u6536\u85CF", 3826)]),
          makeRow([makeCell("toggleFavorite(videoId)", 3200), makeCell("Server Action", 2000), makeCell("\u6536\u85CF/\u53D6\u6D88", 3826)]),
        ]
      }),
      para(""),

      // ===== Page Break =====
      new Paragraph({ children: [new PageBreak()] }),

      // ===== Stage 7.3 =====
      heading1("Stage 7.3 \u2014 \u4E50\u89C2\u66F4\u65B0\uFF08Optimistic Update\uFF09"),

      heading2("7.3.1 \u6838\u5FC3\u601D\u8DEF"),
      para([["\u5148\u76F8\u4FE1\u4F1A\u6210\u529F\uFF0C\u7ACB\u523B\u6539 UI \u2192 \u540E\u53F0\u53D1\u8BF7\u6C42 \u2192 \u5931\u8D25\u518D\u6539\u56DE\u6765\u3002", { bold: true }]]),
      code("// 1. \u7ACB\u523B\u5207\u6362\u72B6\u6001\uFF08\u4E0D\u7B49\u540E\u7AEF\uFF09"),
      code("setIsFavorited(true)"),
      code(""),
      code("// 2. \u540E\u53F0\u53D1\u8BF7\u6C42"),
      code("try {"),
      code("  await toggleFavorite(videoId)"),
      code("} catch {"),
      code("  // 3. \u5931\u8D25\u4E86\uFF0C\u6539\u56DE\u6765"),
      code("  setIsFavorited(false)"),
      code("}"),
      para("\u7C7B\u4F3C\u5FAE\u4FE1\u53D1\u6D88\u606F\u2014\u2014\u6D88\u606F\u7ACB\u523B\u663E\u793A\uFF0C\u4E0D\u7B49\u5F85\u5BF9\u65B9\u6536\u5230\u3002\u5931\u8D25\u624D\u663E\u793A\u7EA2\u8272\u611F\u53F9\u53F7\u3002"),

      heading2("7.3.2 \u9002\u7528\u4E0E\u4E0D\u9002\u7528\u573A\u666F"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 800, 5726],
        rows: [
          makeRow([makeCell("\u573A\u666F", 2500, { bold: true, shading: "D5E8F0" }), makeCell("\u9002\u5408\uFF1F", 800, { bold: true, shading: "D5E8F0", center: true }), makeCell("\u539F\u56E0", 5726, { bold: true, shading: "D5E8F0" })]),
          makeRow([makeCell("\u70B9\u8D5E\u3001\u6536\u85CF", 2500), makeCell("\u2714", 800, { center: true }), makeCell("\u5931\u8D25\u4E86\u6539\u56DE\u6765\uFF0C\u7528\u6237\u65E0\u611F", 5726)]),
          makeRow([makeCell("\u5220\u9664\u6570\u636E", 2500), makeCell("\u2716", 800, { center: true }), makeCell("\u6539\u4E86\u56DE\u4E0D\u53BB\uFF0C\u7528\u6237\u5FC3\u6001\u5D29\u6E83", 5726)]),
          makeRow([makeCell("\u652F\u4ED8/\u6CE8\u518C", 2500), makeCell("\u2716", 800, { center: true }), makeCell("\u5FC5\u987B\u7B49\u786E\u8BA4\u7ED3\u679C", 5726)]),
        ]
      }),
      para(""),
      para([["\u6838\u5FC3\u5224\u65AD\uFF1A", { bold: true }], ["\u5931\u8D25\u4E86\u80FD\u4E0D\u80FD\u65E0\u635F\u64A4\u56DE\u3002"]]),

      // ===== Stage 7.4 =====
      heading1("Stage 7.4 \u2014 Error Boundary\uFF08\u9519\u8BEF\u8FB9\u754C\uFF09"),

      heading2("7.4.1 \u95EE\u9898\uFF1A\u7EC4\u4EF6\u6E32\u67D3\u9519\u8BEF\u5BFC\u81F4\u6574\u9875\u767D\u5C4F"),
      para("React \u9ED8\u8BA4\u884C\u4E3A\uFF1A\u4E00\u4E2A\u5C0F\u7EC4\u4EF6\u6E32\u67D3\u62A5\u9519 \u2192 \u6574\u4E2A\u9875\u9762\u767D\u5C4F\u3002\u4E00\u4E2A\u5730\u65B9\u70B8\u4E86\uFF0C\u5168\u90E8\u966A\u846C\u3002"),

      heading2("7.4.2 try...catch \u4E3A\u4EC0\u4E48\u5146\u4E0D\u4F4F"),
      quote("\uD83D\uDCAC \u5927\u9E45\u63D0\u95EE\uFF1A\u6E32\u67D3\u9519\u8BEF\u80FD\u7528 try...catch \u5146\u4F4F\u5417\uFF1F"),
      quote("\u2705 \u56DE\u7B54\uFF1A\u4E0D\u80FD\u3002JSX \u4E0D\u662F\u5728\u4EE3\u7801\u91CC\u7ACB\u523B\u6267\u884C\u7684\u2014\u2014React \u62FF\u5230 JSX \u540E\u81EA\u5DF1\u5185\u90E8\u8C03\u7528\u3002try...catch \u7BA1\u4E0D\u5230 React \u5185\u90E8\u7684\u6E32\u67D3\u8FC7\u7A0B\u3002"),

      heading2("7.4.3 Error Boundary \u7528\u6CD5"),
      code("<ErrorBoundary fallback={<p>\u8FD9\u5757\u5185\u5BB9\u52A0\u8F7D\u5931\u8D25\u4E86</p>}>"),
      code("  <VideoCard data={data} />"),
      code("</ErrorBoundary>"),
      para([["Error Boundary = \u6E32\u67D3\u9519\u8BEF\u7684 try...catch", { bold: true }], ["\uFF08\u4E13\u4E3A React \u6E32\u67D3\u5C42\u9762\u8BBE\u8BA1\uFF09\u3002"]]),

      heading2("7.4.4 \u653E\u7F6E\u7B56\u7565\uFF1A\u6309\u6A21\u5757\u5305\u88F9"),
      new Paragraph({ numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "\u274C \u53EA\u5305\u6700\u9876\u5C42 \u2192 \u7B49\u4E8E\u6CA1\u5305", size: 22, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "\u274C \u6BCF\u4E2A\u7EC4\u4EF6\u90FD\u5305 \u2192 \u592A\u7E41\u7410", size: 22, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "\u2705 \u6309\u9875\u9762\u5173\u952E\u5206\u754C\u70B9\u5305\uFF1A\u5BFC\u822A\u680F\u3001\u89C6\u9891\u5217\u8868\u3001\u4FA7\u8FB9\u680F\u5404\u81EA\u4E00\u5C42", size: 22, font: "Arial" })] }),
      para([["\u539F\u5219\uFF1A", { bold: true }], ["\u70B8\u54EA\u5757\u54EA\u5757\u663E\u793A fallback\uFF0C\u5176\u4ED6\u6B63\u5E38\u3002"]]),

      // ===== Stage 7.5 =====
      heading1("Stage 7.5 \u2014 Middleware\uFF08\u4E2D\u95F4\u4EF6\uFF09"),

      heading2("7.5.1 \u95EE\u9898\uFF1A\u6BCF\u4E2A\u9875\u9762\u90FD\u5199\u767B\u5F55\u68C0\u67E5"),
      para("\u6240\u6709\u9700\u8981\u767B\u5F55\u7684\u9875\u9762\u90FD\u5199 if (!session) redirect('/login') \u2192 \u91CD\u590D\u3001\u96BE\u7BA1\u7406\u3002"),

      heading2("7.5.2 Middleware \u4F5C\u4E3A\u5168\u5C40\u5173\u5361"),
      para([["Middleware", { bold: true }], [" = \u8BF7\u6C42\u5230\u8FBE\u9875\u9762\u4E4B\u524D\u7684\u7EDF\u4E00\u68C0\u67E5\u7AD9\uFF1A"]]),
      para("\u7528\u6237\u8BBF\u95EE /favorites \u2192 Middleware(\u68C0\u67E5Token) \u2192 \u901A\u8FC7\u2192\u9875\u9762\u6E32\u67D3"),
      para("\u7528\u6237\u8BBF\u95EE /favorites \u2192 Middleware(\u68C0\u67E5Token) \u2192 \u65E0Token \u2192 \u8DF3\u8F6C /login"),
      para("\u53EA\u9700\u8981\u4E00\u4E2A\u6587\u4EF6 middleware.ts\uFF08\u9879\u76EE\u6839\u76EE\u5F55\uFF09\uFF1A"),
      code("import { auth } from '@/lib/auth'"),
      code(""),
      code("export default auth((req) => {"),
      code("  if (!req.auth) {"),
      code("    return Response.redirect(new URL('/login', req.url))"),
      code("  }"),
      code("  return Response.next()  // \u653E\u884C"),
      code("})"),
      code(""),
      code("// \u53EA\u5BF9\u8FD9\u51E0\u4E2A\u8DEF\u5F84\u751F\u6548"),
      code("export const config = {"),
      code("  matcher: ['/favorites/:path*', '/settings/:path*']"),
      code("}"),
      para("matcher \u51B3\u5B9A\u4E86\u54EA\u4E9B\u8DEF\u5F84\u9700\u8981\u62E6\u622A\u3002\u9996\u9875\u4E0D\u9700\u8981\u767B\u5F55\u5C31\u4E0D\u653E\u8FDB matcher\u3002"),

      heading2("7.5.3 withSecurity vs Middleware"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 3500, 3026],
        rows: [
          makeRow([makeCell("", 2500, { bold: true, shading: "D5E8F0" }), makeCell("withSecurity", 3500, { bold: true, shading: "D5E8F0" }), makeCell("Middleware", 3026, { bold: true, shading: "D5E8F0" })]),
          makeRow([makeCell("\u4F5C\u7528\u8303\u56F4", 2500), makeCell("\u5355\u4E2A route.ts", 3500), makeCell("\u5168\u7AD9\u6240\u6709\u8BF7\u6C42", 3026)]),
          makeRow([makeCell("\u4F4D\u7F6E", 2500), makeCell("API \u8DEF\u7531\u5185\u90E8", 3500), makeCell("\u8BF7\u6C42\u5230\u8FBE\u524D", 3026)]),
        ]
      }),
      para(""),
      para([["Middleware \u662F withSecurity \u7684\u5168\u5C40\u5347\u7EA7\u7248", { bold: true }], ["\u2014\u2014\u4E00\u628A\u5927\u95E8\u7BA1\u6240\u6709\u5165\u53E3\u3002"]]),

      // ===== Summary =====
      new Paragraph({ children: [new PageBreak()] }),
      heading1("\u672C\u6B21\u603B\u7ED3"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1200, 2200, 5626],
        rows: [
          makeRow([makeCell("Stage", 1200, { bold: true, shading: "D5E8F0" }), makeCell("\u4E3B\u9898", 2200, { bold: true, shading: "D5E8F0" }), makeCell("\u6838\u5FC3\u77E5\u8BC6", 5626, { bold: true, shading: "D5E8F0" })]),
          makeRow([makeCell("7.2", 1200), makeCell("\u6536\u85CF\u529F\u80FD\u8BBE\u8BA1", 2200), makeCell("Server Action + Prisma \u591A\u5BF9\u591A + Token \u5B89\u5168 + toggle", 5626)]),
          makeRow([makeCell("7.3", 1200), makeCell("\u4E50\u89C2\u66F4\u65B0", 2200), makeCell("\u5148\u6539 UI \u540E\u7B49\u540E\u7AEF\uFF0C\u5931\u8D25\u64A4\u56DE", 5626)]),
          makeRow([makeCell("7.4", 1200), makeCell("Error Boundary", 2200), makeCell("\u6E32\u67D3\u9519\u8BEF\u7684 try...catch\uFF0C\u6309\u6A21\u5757\u5305\u88F9", 5626)]),
          makeRow([makeCell("7.5", 1200), makeCell("Middleware", 2200), makeCell("\u5168\u5C40\u8BA4\u8BC1\u5173\u5361\uFF0Cmatcher \u63A7\u5236\u8303\u56F4", 5626)]),
        ]
      }),
      para(""),
      para([["\u8DE8\u9636\u6BB5\u8FDE\u7EBF\uFF1A", { bold: true }]]),
      new Paragraph({ numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "7.2 \u4E32\u8054\u4E86 6.1\uFF08\u8868\u5355\u4EA4\u4E92\uFF09+ 6.2\uFF08Server Action\uFF09+ 6.3\uFF08\u8BA4\u8BC1\uFF09+ 6.4\uFF08Prisma\uFF09", size: 22, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "7.3 \u5BF9\u6BD4\u4E86 7.2 \u7684\u6536\u85CF\u4EA4\u4E92\uFF08\u4E50\u89C2 vs \u666E\u901A\u66F4\u65B0\uFF09", size: 22, font: "Arial" })] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "7.5 = 6.2 \u7684 withSecurity \u5347\u7EA7\u4E3A\u5168\u5C40\u7248", size: 22, font: "Arial" })] }),

    ]
  }]
});

const outPath = 'D:\\Develop\\longcut\\docs\\learning-notes-05-29.docx';
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log('DOCX created: ' + outPath);
}).catch(err => {
  console.error('Error creating DOCX:', err);
  process.exit(1);
});
