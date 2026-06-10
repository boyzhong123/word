const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;
const OUT_DIR = "/Users/zhong/Desktop/Cursor仓库/ChivoxMCP官网/outputs/xunfei-ebox-pro-research";
const SRC_DIR = "/tmp/xunfei_ebox_ocr/images";
const CHANNEL_DIR = "/tmp/xunfei_ebox_ocr/tmall_assets";
const SCRATCH_DIR = path.join(OUT_DIR, "tmp", "slides-15");
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");
const VERIFY_DIR = path.join(SCRATCH_DIR, "verification");
const INSPECT_PATH = path.join(SCRATCH_DIR, "inspect.ndjson");

const C = {
  bg: "#FFF7EF",
  bg2: "#F7FBF8",
  ink: "#121212",
  graphite: "#3F3F46",
  muted: "#71717A",
  line: "#E7DDD1",
  orange: "#FF6A00",
  orange2: "#FF8A2A",
  green: "#25C36B",
  greenDark: "#0F7A45",
  blue: "#436CFF",
  teal: "#1DAFA3",
  gold: "#D89C25",
  red: "#E05243",
  white: "#FFFFFF",
  panel: "#FFFFFFE8",
  paleOrange: "#FFF0E2",
  paleGreen: "#EAF8EF",
  paleBlue: "#EEF3FF",
  paleTeal: "#EAF8F7",
  paleGold: "#FFF4D9",
  paleRed: "#FFF0EF",
};

const F = {
  title: "PingFang SC",
  body: "PingFang SC",
  mono: "Aptos Mono",
};

const IMG = {
  hero: path.join(SRC_DIR, "00-英语宝Pro-750.png"),
  comparison: path.join(SRC_DIR, "01.jpg"),
  newFeatures: path.join(SRC_DIR, "02.jpg"),
  brand: path.join(SRC_DIR, "04.jpg"),
  method: path.join(SRC_DIR, "05.jpg"),
  offline: path.join(SRC_DIR, "06.jpg"),
  writing: path.join(SRC_DIR, "07.jpg"),
  words: path.join(SRC_DIR, "08.jpg"),
  story: path.join(SRC_DIR, "11.jpg"),
  listening: path.join(SRC_DIR, "14.jpg"),
  score: path.join(SRC_DIR, "15.jpg"),
  speaking: path.join(SRC_DIR, "17.jpg"),
  speakingFix: path.join(SRC_DIR, "18.jpg"),
  topics: path.join(SRC_DIR, "19.jpg"),
  resources: path.join(SRC_DIR, "20.jpg"),
  articles: path.join(SRC_DIR, "21.jpg"),
  textbook: path.join(SRC_DIR, "24.jpg"),
  exam: path.join(SRC_DIR, "25.jpg"),
  extra: path.join(SRC_DIR, "26.jpg"),
  safety: path.join(SRC_DIR, "27.jpg"),
  functions: path.join(SRC_DIR, "28.jpg"),
  params: path.join(SRC_DIR, "29.jpg"),
  tmallProduct: path.join(CHANNEL_DIR, "zol-tmall-product.jpg"),
  dealerProduct: path.join(CHANNEL_DIR, "zol-128gb-dealer.jpg"),
};

const SOURCE_TEXT = [
  "讯飞商城商品页：https://www.xunfei.cn/goods?goodsId=2345",
  "用户提供天猫商品页：detail.tmall.com/item.htm?id=841021527608&skuId=6077493052524",
  "ZOL 天猫促销页：https://dcdv.zol.com.cn/1170/11702198.html",
  "ZOL 经销行情页：https://price.zol.com.cn/1104/11049703.html",
  "ZOL 参数页：https://price.zol.com.cn/1104/11049703_param.html",
];

const records = [];

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(VERIFY_DIR, { recursive: true });
}

function line(fill = "#00000000", width = 0) {
  return { style: "solid", fill, width };
}

function rec(kind, slideNo, role, text, bbox, extra = {}) {
  records.push({
    kind,
    slide: slideNo,
    role,
    text,
    textPreview: String(text || "").replace(/\n/g, " | ").slice(0, 180),
    textLines: String(text || "").split(/\n/).length,
    bbox,
    ...extra,
  });
}

function addShape(slide, slideNo, geometry, x, y, w, h, fill, stroke = "#00000000", strokeWidth = 0, role = "shape") {
  const shape = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: line(stroke, strokeWidth),
  });
  rec("shape", slideNo, role, "", [x, y, w, h], { shapeType: geometry });
  return shape;
}

function addText(slide, slideNo, text, x, y, w, h, opts = {}) {
  const shape = addShape(slide, slideNo, "rect", x, y, w, h, opts.fill || "#00000000", opts.line || "#00000000", opts.lineWidth || 0, opts.role || "text");
  shape.text = text;
  shape.text.fontSize = opts.size || 20;
  shape.text.color = opts.color || C.ink;
  shape.text.bold = Boolean(opts.bold);
  shape.text.typeface = opts.face || F.body;
  shape.text.alignment = opts.align || "left";
  shape.text.verticalAlignment = opts.valign || "top";
  shape.text.insets = opts.insets || { left: 0, right: 0, top: 0, bottom: 0 };
  if (opts.autoFit) shape.text.autoFit = opts.autoFit;
  rec("textbox", slideNo, opts.role || "text", text, [x, y, w, h]);
  return shape;
}

async function imageBlob(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function addImage(slide, slideNo, filePath, x, y, w, h, opts = {}) {
  const image = slide.images.add({
    blob: await imageBlob(filePath),
    fit: opts.fit || "cover",
    alt: opts.alt || path.basename(filePath),
  });
  image.position = { left: x, top: y, width: w, height: h };
  if (opts.rounded) image.geometry = "roundRect";
  rec("image", slideNo, opts.role || "image", "", [x, y, w, h], { path: filePath });
  return image;
}

function addHeader(slide, slideNo, section) {
  addText(slide, slideNo, section, 54, 28, 760, 24, {
    size: 15,
    color: C.orange,
    bold: true,
    face: F.mono,
    role: "section label",
  });
  addText(slide, slideNo, `${String(slideNo).padStart(2, "0")} / 15`, 1128, 28, 90, 24, {
    size: 14,
    color: C.muted,
    bold: true,
    face: F.mono,
    align: "right",
    role: "page number",
  });
  addShape(slide, slideNo, "rect", 54, 62, 1172, 1.5, C.line, "#00000000", 0, "header rule");
}

function addTitle(slide, slideNo, title, subtitle = "", x = 54, y = 86, w = 760) {
  addText(slide, slideNo, title, x, y, w, 78, {
    size: 36,
    color: C.ink,
    bold: true,
    face: F.title,
    role: "title",
  });
  if (subtitle) {
    addText(slide, slideNo, subtitle, x + 2, y + 92, w - 20, 54, {
      size: 17,
      color: C.graphite,
      role: "subtitle",
    });
  }
}

function addSourceFooter(slide, slideNo, text = "来源：讯飞商城、用户提供天猫链接、ZOL 天猫促销页与经销行情页；电商价格为时点信息，需购买前复核。") {
  addText(slide, slideNo, text, 54, 684, 1090, 18, {
    size: 10,
    color: C.muted,
    role: "source footer",
  });
}

function notes(slide, body) {
  slide.speakerNotes.setText(`${body}\n\n资料来源：\n${SOURCE_TEXT.map((s) => `- ${s}`).join("\n")}`);
}

function addPill(slide, slideNo, text, x, y, w, fill = C.paleOrange, color = C.orange) {
  addShape(slide, slideNo, "roundRect", x, y, w, 34, fill, "#00000000", 0, "pill");
  addText(slide, slideNo, text, x + 12, y + 7, w - 24, 18, {
    size: 13,
    color,
    bold: true,
    align: "center",
    role: "pill text",
  });
}

function addMetric(slide, slideNo, value, label, x, y, w, h, color = C.orange, note = "") {
  addShape(slide, slideNo, "roundRect", x, y, w, h, C.panel, C.line, 1, `metric ${label}`);
  addShape(slide, slideNo, "rect", x, y, w, 6, color, "#00000000", 0, "metric accent");
  addText(slide, slideNo, value, x + 18, y + 18, w - 36, 42, {
    size: h > 118 ? 32 : 28,
    color,
    bold: true,
    role: "metric value",
  });
  addText(slide, slideNo, label, x + 20, y + 66, w - 40, 26, {
    size: 15,
    color: C.ink,
    bold: true,
    role: "metric label",
  });
  if (note) {
    addText(slide, slideNo, note, x + 20, y + h - 34, w - 40, 20, {
      size: 11,
      color: C.muted,
      role: "metric note",
    });
  }
}

function addCard(slide, slideNo, title, body, x, y, w, h, opts = {}) {
  const accent = opts.accent || C.orange;
  addShape(slide, slideNo, "roundRect", x, y, w, h, opts.fill || C.panel, C.line, 1, `card ${title}`);
  addShape(slide, slideNo, "rect", x, y, 7, h, accent, "#00000000", 0, "card accent");
  addText(slide, slideNo, title, x + 22, y + 18, w - 44, 28, {
    size: opts.titleSize || 19,
    color: accent,
    bold: true,
    role: "card title",
  });
  addText(slide, slideNo, body, x + 22, y + 54, w - 44, h - 72, {
    size: opts.bodySize || 15,
    color: C.graphite,
    role: "card body",
  });
}

function addTable(slide, slideNo, x, y, widths, rowH, rows, opts = {}) {
  const totalW = widths.reduce((a, b) => a + b, 0);
  const totalH = rowH * rows.length;
  addShape(slide, slideNo, "roundRect", x, y, totalW, totalH, C.panel, C.line, 1, "table panel");
  rows.forEach((row, r) => {
    let cx = x;
    const isHeader = r === 0;
    if (r > 0) addShape(slide, slideNo, "rect", x, y + r * rowH, totalW, 1, C.line, "#00000000", 0, "table row line");
    row.forEach((cell, c) => {
      if (isHeader) addShape(slide, slideNo, "rect", cx, y, widths[c], rowH, c === 0 ? C.ink : C.orange, "#00000000", 0, "table header fill");
      addText(slide, slideNo, cell, cx + 12, y + r * rowH + 11, widths[c] - 24, rowH - 18, {
        size: isHeader ? 14 : opts.size || 13,
        color: isHeader ? C.white : C.graphite,
        bold: isHeader || c === 0,
        align: c === 0 ? "left" : "center",
        role: "table cell",
      });
      cx += widths[c];
    });
  });
}

function addMiniConclusion(slide, slideNo, text) {
  addShape(slide, slideNo, "roundRect", 70, 624, 760, 42, C.paleGreen, "#00000000", 0, "mini conclusion");
  addText(slide, slideNo, text, 92, 635, 716, 18, {
    size: 14,
    color: C.greenDark,
    bold: true,
    role: "mini conclusion text",
  });
}

async function slide1(p) {
  const n = 1;
  const slide = p.slides.add();
  slide.background.fill = C.bg;
  addShape(slide, n, "rect", 760, 0, 520, H, "#FFE7D3", "#00000000", 0, "right field");
  await addImage(slide, n, IMG.hero, 698, 32, 530, 650, { fit: "cover", rounded: true, role: "official hero image" });
  addShape(slide, n, "rect", 690, 0, 590, H, "#FFFFFF55", "#00000000", 0, "image wash");
  addPill(slide, n, "扩展版调研报告", 58, 72, 160);
  addText(slide, n, "科大讯飞 AI 英语宝\nEBOX Pro", 58, 132, 604, 136, {
    size: 47,
    color: C.ink,
    bold: true,
    face: F.title,
    role: "cover title",
  });
  addText(slide, n, "整合讯飞商城官方详情、用户提供天猫商品页、ZOL 天猫促销与经销行情信息，形成约 15 页产品调研汇报。", 62, 304, 572, 74, {
    size: 19,
    color: C.graphite,
    role: "cover subtitle",
  });
  addMetric(slide, n, "999元", "讯飞商城官方价", 58, 438, 172, 146, C.orange, "官网接口");
  addMetric(slide, n, "669元", "ZOL 记录天猫实付", 248, 438, 172, 146, C.green, "2026-04-24");
  addMetric(slide, n, "15页", "扩展报告", 438, 438, 172, 146, C.blue, "含渠道分析");
  addText(slide, n, "生成日期：2026-05-06", 58, 636, 360, 22, { size: 13, color: C.muted, role: "date" });
  notes(slide, "封面。说明本版已补充天猫渠道和 ZOL 公开页面信息。");
}

async function slide2(p) {
  const n = 2;
  const slide = p.slides.add();
  slide.background.fill = C.bg2;
  addHeader(slide, n, "EXECUTIVE VIEW");
  addTitle(slide, n, "一句话结论", "EBOX Pro 的定位正在从“英语学习机”扩展为“英语学习 + 听力熏听 + 儿童通信 + 家长管控”的复合终端。");
  await addImage(slide, n, IMG.tmallProduct, 846, 110, 322, 322, { fit: "contain", rounded: true, role: "ZOL Tmall product image" });
  addCard(slide, n, "官方主线", "讯飞商城强调 AI 英语学习闭环、作文/听力/口语训练、资源沉淀与家长可控。", 64, 266, 360, 164, { accent: C.orange });
  addCard(slide, n, "电商主线", "天猫渠道标题更偏“听力宝、熏听机、磨耳朵、复读机、便携学习机”，突出听力和价格刺激。", 448, 266, 360, 164, { accent: C.green });
  addCard(slide, n, "调研判断", "面向家长购买决策时，应同时讲清学习效果、可控性、价格时点和功能边界。", 64, 456, 744, 104, { accent: C.blue, bodySize: 16 });
  addMiniConclusion(slide, n, "核心建议：报告中把“学习能力”和“渠道销售话术”分开看，避免把促销页口径直接等同官方参数。");
  addSourceFooter(slide, n);
  notes(slide, "执行摘要。天猫/ZOL 提供的是渠道促销口径，官方商城提供的是产品详情与参数口径。");
}

async function slide3(p) {
  const n = 3;
  const slide = p.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, n, "SOURCE MAP");
  addTitle(slide, n, "资料来源与可用性", "天猫详情页本身触发登录/安全校验，因此本版通过公开可访问页面补充渠道信息，并在风险页标注待复核。");
  const rows = [
    ["来源", "本次可获取内容", "可信度/使用方式"],
    ["讯飞商城", "官方详情图、商品接口、SKU、价格、硬件参数", "作为主来源"],
    ["天猫链接", "商品 ID 与 SKU；正文受登录/反爬限制", "保留为待复核渠道"],
    ["ZOL 促销页", "天猫活动价、券后价、标题卖点、商品图", "作为第三方渠道观察"],
    ["ZOL 经销行情", "128GB 899 元、资源与功能描述、参数差异", "辅助对比，不替代官方"],
  ];
  addTable(slide, n, 64, 258, [176, 352, 310], 62, rows, { size: 13 });
  await addImage(slide, n, IMG.tmallProduct, 948, 244, 218, 218, { fit: "contain", rounded: true, role: "channel product thumbnail" });
  addCard(slide, n, "本版处理原则", "价格、重量、存储等口径若存在冲突，优先保留官方值，同时把第三方口径作为“渠道信息/待核验项”呈现。", 888, 492, 310, 118, { accent: C.red, bodySize: 14 });
  addSourceFooter(slide, n, "来源：用户提供天猫链接、讯飞商城、ZOL 促销页与经销行情页。");
  notes(slide, "资料来源说明页。用于解释为什么报告中出现 ZOL 作为补充来源，以及为什么要标注待复核。");
}

async function slide4(p) {
  const n = 4;
  const slide = p.slides.add();
  slide.background.fill = "#FFFFFF";
  addHeader(slide, n, "PRODUCT SNAPSHOT");
  addTitle(slide, n, "产品与硬件概览", "官方 SKU 为 128G 心想事“橙”版本，核心硬件参数来自讯飞商城官方接口和参数图。", 54, 86, 700);
  await addImage(slide, n, IMG.params, 802, 100, 350, 426, { fit: "contain", rounded: true, role: "official parameter image" });
  const rows = [
    ["字段", "官方口径"],
    ["商品名称", "科大讯飞AI英语宝EBOX Pro-128G-心想事“橙”"],
    ["商品编码", "XF002344"],
    ["产品型号", "QM-T200 Pro"],
    ["屏幕/电池", "3 英寸高清触控屏；1800mAh"],
    ["尺寸/重量", "84mm × 70.5mm × 15mm；105g"],
    ["接口", "USB Type-C；3.5mm 耳机接口"],
  ];
  addTable(slide, n, 64, 256, [160, 512], 50, rows, { size: 14 });
  addMetric(slide, n, "999元", "讯飞商城官方价", 818, 548, 160, 106, C.orange, "接口值");
  addMetric(slide, n, "0", "抓取时库存", 998, 548, 160, 106, C.gold, "需复核");
  addSourceFooter(slide, n, "来源：讯飞商城商品接口与官方参数图 OCR。");
  notes(slide, "硬件参数页，作为后续第三方口径对比的基准。");
}

async function slide5(p) {
  const n = 5;
  const slide = p.slides.add();
  slide.background.fill = C.bg2;
  addHeader(slide, n, "CHANNEL PRICING");
  addTitle(slide, n, "天猫渠道促销口径", "ZOL 于 2026-04-24 记录该商品在天猫精选的促销算法：活动价 1099 元，券后与立减后实付 669 元。");
  await addImage(slide, n, IMG.tmallProduct, 806, 104, 340, 340, { fit: "contain", rounded: true, role: "ZOL Tmall product image" });
  addMetric(slide, n, "1099元", "天猫精选活动价", 76, 286, 188, 134, C.orange, "ZOL 记录");
  addMetric(slide, n, "400-30", "优惠券", 286, 286, 188, 134, C.green, "满减券");
  addMetric(slide, n, "430元", "下单立省", 496, 286, 188, 134, C.blue, "促销差额");
  addMetric(slide, n, "669元", "实付价", 286, 454, 188, 134, C.red, "时点价格");
  addCard(slide, n, "解读", "该价格体现电商渠道强促销属性，适合作为“市场成交刺激点”，但不可替代实时天猫价。", 76, 454, 188, 134, { accent: C.gold, titleSize: 17, bodySize: 12 });
  addCard(slide, n, "页面限制", "用户提供的天猫详情页直接访问会进入登录/安全校验，当前页价格需人工打开复核。", 496, 454, 250, 134, { accent: C.red, titleSize: 17, bodySize: 13 });
  addSourceFooter(slide, n, "来源：ZOL《科大讯飞EBOX Pro熏听机669元》，发布时间 2026-04-24。");
  notes(slide, "天猫渠道页。强调时点促销价格和待复核。");
}

async function slide6(p) {
  const n = 6;
  const slide = p.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, n, "ECOMMERCE POSITIONING");
  addTitle(slide, n, "电商标题卖点拆解", "天猫/电商语境中，产品被包装成“听力宝、熏听机、磨耳朵复读机、便携式学习机”。", 54, 86, 760);
  await addImage(slide, n, IMG.dealerProduct, 856, 100, 268, 536, { fit: "cover", rounded: true, role: "ZOL dealer product image" });
  const cards = [
    ["听力宝 / 熏听机", "强调沉浸式磨耳朵、分级听力、教材同步和日常随身听。", C.orange],
    ["复读机", "强调精准复读、语音跟读、发音纠错等传统听说训练需求。", C.green],
    ["便携式学习机", "强调轻巧便携、碎片化场景和学生随身使用。", C.blue],
    ["AI 英语宝", "强调 AI 语音技术、学习进度匹配和内容难度调整。", C.teal],
  ];
  cards.forEach(([title, body, color], i) => {
    const x = 70 + (i % 2) * 370;
    const y = 260 + Math.floor(i / 2) * 170;
    addCard(slide, n, title, body, x, y, 330, 136, { accent: color, bodySize: 15 });
  });
  addMiniConclusion(slide, n, "渠道话术更偏“听力场景 + 便携复读”，这和官方“全能力 AI 学习终端”叙事形成互补。");
  addSourceFooter(slide, n);
  notes(slide, "电商标题卖点页，补充天猫渠道的用户感知入口。");
}

async function slide7(p) {
  const n = 7;
  const slide = p.slides.add();
  slide.background.fill = "#FFFFFF";
  addHeader(slide, n, "PRICE & PARAMETER GAP");
  addTitle(slide, n, "渠道价格与参数口径差异", "官方商城、ZOL 天猫促销页、ZOL 经销行情页的价格和部分参数并不完全一致，需要作为后续核验项。", 54, 86, 820);
  const rows = [
    ["口径", "价格/配置", "关键说明"],
    ["讯飞商城官方", "999 元；128G；105g", "主来源；库存抓取时为 0"],
    ["ZOL 天猫促销", "活动价 1099；实付 669 元", "2026-04-24 时点价格"],
    ["ZOL 经销行情", "128GB 报价 899 元；提到 160g", "2025-12-23；与官方重量不一致"],
    ["调研处理", "以官方参数为基准", "渠道价格作为市场观察，不做实时承诺"],
  ];
  addTable(slide, n, 70, 258, [210, 260, 410], 64, rows, { size: 14 });
  addCard(slide, n, "需要特别标注", "价格属于促销时点信息；重量、存储、功能包的差异可能来自版本、渠道或第三方描述错误。", 970, 266, 210, 252, { accent: C.red, bodySize: 15 });
  addSourceFooter(slide, n, "来源：讯飞商城接口、ZOL 2026-04-24 天猫促销页、ZOL 2025-12-23 经销行情页。");
  notes(slide, "口径差异页。把冲突信息前置，可以让报告更可信。");
}

async function slide8(p) {
  const n = 8;
  const slide = p.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, n, "FUNCTION MAP");
  addTitle(slide, n, "功能架构：学习闭环外加安全通信", "官方卖点并非单点功能，而是围绕“英语学习效率”和“家长安心”组合。", 54, 86, 720);
  await addImage(slide, n, IMG.newFeatures, 888, 100, 274, 500, { fit: "cover", rounded: true, role: "official new features image" });
  addShape(slide, n, "ellipse", 444, 314, 216, 216, C.paleOrange, C.orange, 2, "central circle");
  addText(slide, n, "AI 英语\n学习闭环", 486, 374, 132, 66, { size: 26, color: C.orange, bold: true, align: "center", role: "central label" });
  const nodes = [
    ["单词", "诊学测背\n故事生成\n单词 PK", 128, 286, C.green],
    ["作文", "拍照批改\n全文点评\n写作润色", 292, 498, C.blue],
    ["听力", "文章大意\n逐句评分\n高频词提取", 594, 498, C.teal],
    ["口语", "AI 私教\n中英混输\n语法发音纠错", 704, 286, C.gold],
    ["安全", "通话定位\n支付管控\n上课模式", 404, 236, C.red],
  ];
  nodes.forEach(([title, body, x, y, color]) => {
    addShape(slide, n, "roundRect", x, y, 160, 108, C.panel, color, 1.4, `node ${title}`);
    addText(slide, n, title, x + 18, y + 14, 124, 24, { size: 20, color, bold: true, align: "center", role: "node title" });
    addText(slide, n, body, x + 20, y + 48, 120, 50, { size: 13, color: C.graphite, align: "center", role: "node body" });
  });
  addSourceFooter(slide, n);
  notes(slide, "功能架构页。保持原版核心结构。");
}

async function slide9(p) {
  const n = 9;
  const slide = p.slides.add();
  slide.background.fill = C.bg2;
  addHeader(slide, n, "CORE LEARNING");
  addTitle(slide, n, "核心学习能力：四个主模块", "单词、作文、听力、口语构成官方学习能力的主干，电商渠道则把听力/复读卖点进一步前置。", 54, 86, 820);
  const imgs = [IMG.words, IMG.writing, IMG.listening, IMG.speaking];
  const labels = [
    ["单词", "AI 诊断摸底；推荐学习方案；真人原音讲解", C.green],
    ["作文", "拍照改作文；基础/深度批改；全文点评与润色", C.blue],
    ["听力", "提炼文章大意；逐句跟读评测；高频词提取", C.teal],
    ["口语", "24小时 AI 私教；1V1 进阶；语法与发音纠错", C.orange],
  ];
  imgs.forEach(async () => {});
  for (let i = 0; i < 4; i += 1) {
    const x = 64 + i * 284;
    await addImage(slide, n, imgs[i], x, 234, 238, 292, { fit: "cover", rounded: true, role: `${labels[i][0]} image` });
    addShape(slide, n, "roundRect", x, 540, 238, 94, C.panel, C.line, 1, `${labels[i][0]} card`);
    addText(slide, n, labels[i][0], x + 18, 556, 70, 26, { size: 21, color: labels[i][2], bold: true, role: "learning module title" });
    addText(slide, n, labels[i][1], x + 88, 556, 130, 50, { size: 13, color: C.graphite, role: "learning module body" });
  }
  addSourceFooter(slide, n);
  notes(slide, "学习能力概览页。四大模块均来自官方详情图 OCR。");
}

async function slide10(p) {
  const n = 10;
  const slide = p.slides.add();
  slide.background.fill = "#FFFFFF";
  addHeader(slide, n, "WORD LEARNING");
  addTitle(slide, n, "单词学习：从诊断到故事化记忆", "单词模块强调“学得快、记得牢、考得好”，并用生成式内容降低枯燥感。");
  await addImage(slide, n, IMG.words, 790, 100, 270, 440, { fit: "cover", rounded: true, role: "word learning official image" });
  await addImage(slide, n, IMG.story, 1040, 192, 150, 260, { fit: "cover", rounded: true, role: "word story official image" });
  const steps = [
    ["诊", "AI 诊断摸底\n智能推荐学习方案"],
    ["学", "卡片记忆\n真人原音讲解考点"],
    ["测", "3000+ 历年真题\n结合学情推送"],
    ["趣", "AI 单词故事\n全国学霸单词 PK"],
  ];
  steps.forEach(([mark, body], i) => {
    const x = 78 + i * 168;
    addShape(slide, n, "ellipse", x, 286, 76, 76, [C.paleGreen, C.paleOrange, C.paleBlue, C.paleGold][i], [C.green, C.orange, C.blue, C.gold][i], 2, "step circle");
    addText(slide, n, mark, x + 22, 307, 32, 30, { size: 27, color: [C.green, C.orange, C.blue, C.gold][i], bold: true, align: "center", role: "step mark" });
    addText(slide, n, body, x - 22, 384, 124, 70, { size: 14, color: C.graphite, align: "center", role: "step body" });
  });
  addCard(slide, n, "调研解读", "单词学习路径比较完整：诊断、学习、练习、复习、趣味化都有对应功能；适合做成日常高频入口。", 86, 516, 570, 94, { accent: C.green, bodySize: 15 });
  addSourceFooter(slide, n);
  notes(slide, "单词学习页。");
}

async function slide11(p) {
  const n = 11;
  const slide = p.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, n, "LISTENING & SPEAKING");
  addTitle(slide, n, "听力与口语：电商渠道最容易感知的卖点", "ZOL 天猫促销页把“智能熏听、精准复读、语音跟读、听力精练”放在前台，这与官方听说训练能力高度一致。", 54, 86, 836);
  await addImage(slide, n, IMG.score, 64, 246, 230, 300, { fit: "cover", rounded: true, role: "speaking score image" });
  await addImage(slide, n, IMG.speakingFix, 316, 246, 230, 300, { fit: "cover", rounded: true, role: "speaking correction image" });
  await addImage(slide, n, IMG.topics, 568, 246, 230, 300, { fit: "cover", rounded: true, role: "speaking topics image" });
  addCard(slide, n, "听力训练", "AI 提炼文章大意、资深教研精讲、逐句跟读评测、多维度评分。", 838, 256, 300, 126, { accent: C.teal });
  addCard(slide, n, "口语陪练", "24 小时 AI 私教，支持中英混合输入，引导学生从敢开口到会表达。", 838, 404, 300, 126, { accent: C.orange });
  addCard(slide, n, "渠道表达", "“熏听机/复读机”话术更接近家长已有认知，适合做转化入口。", 838, 552, 300, 86, { accent: C.green, bodySize: 14 });
  addSourceFooter(slide, n);
  notes(slide, "听力与口语页。补齐天猫渠道对听力卖点的强调。");
}

async function slide12(p) {
  const n = 12;
  const slide = p.slides.add();
  slide.background.fill = C.bg2;
  addHeader(slide, n, "CONTENT SYSTEM");
  addTitle(slide, n, "内容资源：课内同步 + 考试考级 + 课外拓展", "官方强调 21 年教育资源沉淀，渠道页也补充 BBC、TED、影视对白等泛听资源说法。", 54, 86, 840);
  await addImage(slide, n, IMG.resources, 810, 104, 320, 350, { fit: "cover", rounded: true, role: "resources image" });
  await addImage(slide, n, IMG.exam, 940, 432, 210, 170, { fit: "cover", rounded: true, role: "exam image" });
  const metrics = [
    ["21年", "教育资源沉淀", C.orange],
    ["10000+", "中高考真题", C.green],
    ["95%+", "教材版本覆盖", C.blue],
    ["4000篇", "课外分级听力", C.teal],
  ];
  metrics.forEach(([v, l, color], i) => addMetric(slide, n, v, l, 70 + i * 178, 286, 152, 122, color, "官方宣传"));
  addCard(slide, n, "资源结构", "课文同步精讲、考试资源、时文/名著/真题精讲、英语课外分级听力、语文课外资源。", 70, 452, 332, 122, { accent: C.orange });
  addCard(slide, n, "第三方补充", "ZOL 经销行情提到 BBC 新闻、TED 演讲、影视对白、同声传译等内容，需以实际设备可用资源核验。", 426, 452, 332, 122, { accent: C.red });
  addSourceFooter(slide, n);
  notes(slide, "资源系统页。把官方资源与第三方补充资源分开标注。");
}

async function slide13(p) {
  const n = 13;
  const slide = p.slides.add();
  slide.background.fill = "#FFFFFF";
  addHeader(slide, n, "CREDIBILITY");
  addTitle(slide, n, "技术与教育背书", "讯飞的听说评测、考试服务和教育合作，是支撑“英语学习硬件”可信度的关键。", 54, 86, 800);
  await addImage(slide, n, IMG.brand, 830, 92, 320, 520, { fit: "cover", rounded: true, role: "official brand image" });
  const metrics = [
    ["26年", "AI 核心技术研发", "官方宣传"],
    ["70项", "国际 AI 大赛冠军", "2018-2024"],
    ["5万+", "中小学合作数量", "教育平台数据"],
    ["9000万", "累计服务考生", "听口考试服务"],
  ];
  metrics.forEach(([v, l, note], i) => {
    const x = 78 + (i % 2) * 330;
    const y = 278 + Math.floor(i / 2) * 164;
    addMetric(slide, n, v, l, x, y, 280, 126, [C.orange, C.green, C.blue, C.gold][i], note);
  });
  addCard(slide, n, "调研解读", "背书的价值在于降低家长对口语评分、作文批改、考试资源的信任门槛；但效果仍需实测。", 78, 604, 610, 54, { accent: C.green, bodySize: 14, titleSize: 0 });
  addSourceFooter(slide, n);
  notes(slide, "技术背书页。");
}

async function slide14(p) {
  const n = 14;
  const slide = p.slides.add();
  slide.background.fill = C.bg;
  addHeader(slide, n, "MODEL & SCENARIO");
  addTitle(slide, n, "Pro 版差异与家长场景", "Pro 版的差异不止学习功能，而是把通话、定位、支付、管控能力和学习功能组合在一起。", 54, 86, 820);
  await addImage(slide, n, IMG.comparison, 64, 232, 310, 416, { fit: "cover", rounded: true, role: "model comparison image" });
  await addImage(slide, n, IMG.safety, 890, 232, 248, 416, { fit: "cover", rounded: true, role: "safety image" });
  const cards = [
    ["Pro 增量", "AI 个性化生成单词故事、拨打电话、辅助定位、移动支付、双模型与双核芯片。", C.orange],
    ["家长安心", "不用手机也能联系，支持上课模式、微聊管控、通话管控和学情查看。", C.green],
    ["使用场景", "在校学、在途学、在外学，覆盖碎片化学习和安全联系。", C.blue],
  ];
  cards.forEach(([title, body, color], i) => addCard(slide, n, title, body, 418, 252 + i * 128, 398, 104, { accent: color, bodySize: 14 }));
  addSourceFooter(slide, n);
  notes(slide, "版本差异与家长场景合并页。");
}

async function slide15(p) {
  const n = 15;
  const slide = p.slides.add();
  slide.background.fill = C.bg2;
  addHeader(slide, n, "RECOMMENDATION");
  addTitle(slide, n, "结论与后续验证建议", "EBOX Pro 适合作为英语学习辅助与家长可控终端；推广时可借助天猫“听力宝/熏听机”话术，但必须保留核验边界。", 54, 86, 840);
  await addImage(slide, n, IMG.hero, 892, 104, 260, 392, { fit: "cover", rounded: true, role: "hero image crop" });
  const risks = [
    ["价格时点", "天猫促销价会变，669 元只作为 2026-04-24 ZOL 记录。"],
    ["参数冲突", "第三方页面重量等口径与官方参数不一致。"],
    ["App 依赖", "AI 1 对 1 作文辅导需配套 App“讯飞易听说”。"],
    ["隐私支付", "定位、通话、支付涉及儿童数据和家长授权。"],
  ];
  risks.forEach(([title, body], i) => {
    const x = 70 + (i % 2) * 370;
    const y = 260 + Math.floor(i / 2) * 128;
    addCard(slide, n, title, body, x, y, 330, 98, { accent: [C.red, C.gold, C.blue, C.green][i], bodySize: 14 });
  });
  addCard(slide, n, "最终建议", "以官方参数和功能为基准，补充天猫渠道价格与听力场景话术；下一步实测作文批改、口语评分、家长 App、续航、支付限额和资源更新。", 70, 530, 700, 92, { accent: C.orange, bodySize: 15 });
  addShape(slide, n, "roundRect", 850, 520, 340, 122, C.panel, C.line, 1, "source panel");
  addText(slide, n, "主要来源", 874, 540, 120, 24, { size: 18, color: C.orange, bold: true, role: "source title" });
  addText(slide, n, "讯飞商城官方页\n用户提供天猫链接\nZOL 天猫促销页\nZOL 经销行情页", 874, 574, 268, 58, { size: 13, color: C.graphite, role: "source list" });
  addSourceFooter(slide, n, "注：本报告为公开页面与 OCR 信息整理，不含线下真机实测。");
  notes(slide, "结论页。");
}

async function createDeck() {
  await ensureDirs();
  const p = Presentation.create({ slideSize: { width: W, height: H } });
  p.theme.colorScheme = {
    name: "EBOX Extended Research",
    themeColors: {
      accent1: C.orange,
      accent2: C.green,
      accent3: C.blue,
      bg1: C.bg,
      tx1: C.ink,
      tx2: C.graphite,
    },
  };
  const builders = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10, slide11, slide12, slide13, slide14, slide15];
  for (const build of builders) await build(p);
  return p;
}

async function saveBlob(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function writeInspect(presentation) {
  const head = [
    JSON.stringify({ kind: "deck", id: "xunfei-ebox-pro-extended", slideCount: presentation.slides.count, slideSize: { width: W, height: H } }),
    ...presentation.slides.items.map((_, i) => JSON.stringify({ kind: "slide", slide: i + 1, id: `slide-${i + 1}` })),
  ];
  await fs.writeFile(INSPECT_PATH, [...head, ...records.map((r) => JSON.stringify(r))].join("\n") + "\n", "utf8");
}

async function renderAndExport(presentation) {
  await writeInspect(presentation);
  for (let i = 0; i < presentation.slides.items.length; i += 1) {
    const preview = await presentation.export({ slide: presentation.slides.items[i], format: "png", scale: 1 });
    await saveBlob(preview, path.join(PREVIEW_DIR, `slide-${String(i + 1).padStart(2, "0")}.png`));
  }
  const pptx = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(OUT_DIR, "output.pptx");
  await pptx.save(pptxPath);
  await fs.writeFile(path.join(VERIFY_DIR, "render_verify_loops.ndjson"), JSON.stringify({
    kind: "render_verify_loop",
    deckId: "xunfei-ebox-pro-extended",
    loop: 1,
    maxLoops: 3,
    timestamp: new Date().toISOString(),
    slideCount: presentation.slides.count,
    previewDir: PREVIEW_DIR,
    pptxPath,
  }) + "\n", "utf8");
  return pptxPath;
}

const presentation = await createDeck();
const pptxPath = await renderAndExport(presentation);
console.log(pptxPath);