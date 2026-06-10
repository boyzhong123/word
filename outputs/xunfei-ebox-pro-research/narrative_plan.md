# 科大讯飞 AI 英语宝 EBOX Pro 调研报告 PPT 叙事计划

## 受众
产品负责人、市场/BD、教育硬件调研人员、采购或竞品分析人员。

## 目标
将讯飞商城官方商品页和详情长图 OCR 信息整理成一份可汇报、可编辑的中文调研 PPT，帮助快速判断 EBOX Pro 的定位、卖点、资源壁垒、风险点和后续验证方向。

## 叙事主线
先给结论：EBOX Pro 不是单一英语学习机，而是“英语学习 + 儿童通信 + 家长管控”的复合型 AI 终端。随后用官方参数、功能结构、教育资源、版本差异和安全管控能力证明这一判断，最后给出风险和建议。

## 幻灯片列表
1. 封面：产品名称、核心定位、价格与硬件关键数。
2. 一句话结论：产品定位、购买理由、调研研判。
3. 产品与硬件概览：SKU、价格、型号、屏幕、电池、重量等。
4. 功能架构：AI 英语学习闭环、内容资源、安全通信和家长管控。
5. 核心学习能力：单词、作文、听力、口语四大模块。
6. 内容资源与技术背书：教育资源沉淀、真题、教材覆盖、学校合作等。
7. EBOX Pro vs EBOX：功能差异对比。
8. 用户场景与家长价值：在校、在途、在外学习，以及安全管控。
9. 风险与验证清单：厂商自述、App 依赖、隐私支付、学习路径复杂度。
10. 结论与建议：适用人群、采购/推广建议、后续验证项、来源。

## 来源计划
主要来源为用户提供的讯飞商城商品页、讯飞商城商品信息接口、产品详情接口，以及此前 OCR 识别得到的 31 张官方详情图。PPT 内引用关键结论与数据，避免长段原文复制。

## 视觉系统
使用讯飞 EBOX Pro 官方橙色硬件作为主视觉，搭配黑色标题、浅暖背景、绿色重点线和少量蓝色功能色。页面风格为商务调研汇报，使用大标题、指标卡、结构图、对比表和风险矩阵。

## 图片计划
复用官方详情图作为产品截图和证据型视觉素材，主文本全部用可编辑 PowerPoint 文本呈现。每页至少包含一处产品图、参数图、功能图或资源图，避免纯文字页面。

## 可编辑性计划
所有标题、正文、数据、表格、结论、风险清单、来源说明均为 PowerPoint 可编辑对象。官方图片仅作为视觉与证据素材，不承担主要文本表达。
const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;
const OUT_DIR = "/Users/zhong/Desktop/Cursor仓库/ChivoxMCP官网/outputs/xunfei-ebox-pro-research";
const SRC_DIR = "/tmp/xunfei_ebox_ocr/images";
const SCRATCH_DIR = path.join(OUT_DIR, "tmp", "slides");
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");
const VERIFY_DIR = path.join(SCRATCH_DIR, "verification");
const INSPECT_PATH = path.join(SCRATCH_DIR, "inspect.ndjson");

const COLORS = {
  bg: "#FFF7EF",
  bg2: "#F3F8F6",
  ink: "#151515",
  graphite: "#3F3F46",
  muted: "#71717A",
  line: "#E7DDD1",
  orange: "#FF6A00",
  orange2: "#FF8A2A",
  green: "#25C36B",
  greenDark: "#0F7A45",
  blue: "#446CFF",
  teal: "#20B5A9",
  gold: "#D89C25",
  white: "#FFFFFF",
  panel: "#FFFFFFE8",
  paleOrange: "#FFF0E2",
  paleGreen: "#EAF8EF",
  paleBlue: "#EEF3FF",
  paleGold: "#FFF4D9",
};

const FONT = {
  title: "PingFang SC",
  body: "PingFang SC",
  mono: "Aptos Mono",
};

const SOURCES = [
  "讯飞商城商品页：https://www.xunfei.cn/goods?goodsId=2345",
  "商品信息接口：https://api.xunfei.cn/ifly-mall-service/v2/product/goods/ordinary/info/2345",
  "产品详情接口：https://api.xunfei.cn/ifly-mall-service/v2/product/goods/product/details/2345",
  "详情长图 OCR：31 张官方详情图，抓取日期 2026-05-05",
];

const IMG = {
  hero: path.join(SRC_DIR, "00-英语宝Pro-750.png"),
  comparison: path.join(SRC_DIR, "01.jpg"),
  newFeatures: path.join(SRC_DIR, "02.jpg"),
  brand: path.join(SRC_DIR, "04.jpg"),
  method: path.join(SRC_DIR, "05.jpg"),
  offline: path.join(SRC_DIR, "06.jpg"),
  writing: path.join(SRC_DIR, "07.jpg"),
  words: path.join(SRC_DIR, "08.jpg"),
  listening: path.join(SRC_DIR, "14.jpg"),
  speaking: path.join(SRC_DIR, "17.jpg"),
  resources: path.join(SRC_DIR, "20.jpg"),
  safety: path.join(SRC_DIR, "27.jpg"),
  functions: path.join(SRC_DIR, "28.jpg"),
  params: path.join(SRC_DIR, "29.jpg"),
};

const records = [];

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(VERIFY_DIR, { recursive: true });
}

function line(fill = "#00000000", width = 0) {
  return { style: "solid", fill, width };
}

function slideBg(slide, fill = COLORS.bg) {
  slide.background.fill = fill;
}

function record(kind, slideNo, role, text, bbox) {
  records.push({ kind, slide: slideNo, role, text, textPreview: String(text || "").slice(0, 180), textLines: String(text || "").split(/\n/).length, bbox });
}

function addShape(slide, slideNo, geometry, x, y, w, h, fill, stroke = "#00000000", strokeWidth = 0, role = "shape") {
  const shape = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: line(stroke, strokeWidth),
  });
  records.push({ kind: "shape", slide: slideNo, role, shapeType: geometry, bbox: [x, y, w, h] });
  return shape;
}

function addText(slide, slideNo, text, x, y, w, h, opts = {}) {
  const shape = addShape(slide, slideNo, "rect", x, y, w, h, opts.fill || "#00000000", opts.line || "#00000000", opts.lineWidth || 0, opts.role || "text");
  shape.text = text;
  shape.text.fontSize = opts.size || 22;
  shape.text.color = opts.color || COLORS.ink;
  shape.text.bold = Boolean(opts.bold);
  shape.text.typeface = opts.face || FONT.body;
  shape.text.alignment = opts.align || "left";
  shape.text.verticalAlignment = opts.valign || "top";
  shape.text.insets = opts.insets || { left: 0, right: 0, top: 0, bottom: 0 };
  if (opts.autoFit) shape.text.autoFit = opts.autoFit;
  record("textbox", slideNo, opts.role || "text", text, [x, y, w, h]);
  return shape;
}

async function readImageBlob(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function addImage(slide, slideNo, filePath, x, y, w, h, opts = {}) {
  const image = slide.images.add({
    blob: await readImageBlob(filePath),
    fit: opts.fit || "cover",
    alt: opts.alt || path.basename(filePath),
  });
  image.position = { left: x, top: y, width: w, height: h };
  if (opts.rounded) image.geometry = "roundRect";
  records.push({ kind: "image", slide: slideNo, role: opts.role || "image", path: filePath, bbox: [x, y, w, h] });
  return image;
}

function addHeader(slide, slideNo, section) {
  addText(slide, slideNo, section, 54, 28, 760, 24, {
    size: 15,
    color: COLORS.orange,
    bold: true,
    face: FONT.mono,
    role: "section label",
  });
  addText(slide, slideNo, `${String(slideNo).padStart(2, "0")} / 10`, 1128, 28, 90, 24, {
    size: 14,
    color: COLORS.muted,
    bold: true,
    face: FONT.mono,
    align: "right",
    role: "page number",
  });
  addShape(slide, slideNo, "rect", 54, 62, 1172, 1.5, COLORS.line, "#00000000", 0, "header rule");
}

function addTitle(slide, slideNo, title, subtitle = "", x = 54, y = 86, w = 720) {
  addText(slide, slideNo, title, x, y, w, 92, {
    size: 39,
    color: COLORS.ink,
    bold: true,
    face: FONT.title,
    role: "title",
  });
  if (subtitle) {
    addText(slide, slideNo, subtitle, x + 2, y + 104, w - 20, 62, {
      size: 18,
      color: COLORS.graphite,
      face: FONT.body,
      role: "subtitle",
    });
  }
}

function addPill(slide, slideNo, text, x, y, w, fill = COLORS.paleOrange, color = COLORS.orange) {
  addShape(slide, slideNo, "roundRect", x, y, w, 34, fill, "#00000000", 0, "pill");
  addText(slide, slideNo, text, x + 14, y + 6, w - 28, 20, {
    size: 14,
    color,
    bold: true,
    align: "center",
    role: "pill text",
  });
}

function addMetric(slide, slideNo, value, label, x, y, w, h, color = COLORS.orange, note = "") {
  addShape(slide, slideNo, "roundRect", x, y, w, h, COLORS.panel, COLORS.line, 1, `metric ${label}`);
  addShape(slide, slideNo, "rect", x, y, w, 6, color, "#00000000", 0, "metric accent");
  addText(slide, slideNo, value, x + 18, y + 22, w - 36, 45, {
    size: 34,
    color,
    bold: true,
    role: "metric value",
  });
  addText(slide, slideNo, label, x + 20, y + 73, w - 40, 34, {
    size: 16,
    color: COLORS.ink,
    bold: true,
    role: "metric label",
  });
  if (note) {
    addText(slide, slideNo, note, x + 20, y + h - 36, w - 40, 24, {
      size: 12,
      color: COLORS.muted,
      role: "metric note",
    });
  }
}

function addCard(slide, slideNo, title, body, x, y, w, h, opts = {}) {
  const accent = opts.accent || COLORS.orange;
  addShape(slide, slideNo, "roundRect", x, y, w, h, opts.fill || COLORS.panel, COLORS.line, 1, `card ${title}`);
  addShape(slide, slideNo, "rect", x, y, 7, h, accent, "#00000000", 0, "card accent");
  addText(slide, slideNo, title, x + 24, y + 20, w - 48, 30, {
    size: opts.titleSize || 20,
    color: COLORS.ink,
    bold: true,
    role: "card title",
  });
  addText(slide, slideNo, body, x + 24, y + 62, w - 48, h - 82, {
    size: opts.bodySize || 16,
    color: COLORS.graphite,
    role: "card body",
  });
}

function addSourceFooter(slide, slideNo, text = "来源：讯飞商城官方商品页、商品信息接口、产品详情图 OCR") {
  addText(slide, slideNo, text, 54, 680, 1080, 22, {
    size: 11,
    color: COLORS.muted,
    role: "source footer",
  });
}

function setNotes(slide, text) {
  slide.speakerNotes.setText(`${text}\n\n资料来源：\n${SOURCES.map((s) => `- ${s}`).join("\n")}`);
}

async function slide1(p) {
  const slideNo = 1;
  const slide = p.slides.add();
  slideBg(slide, COLORS.bg);
  addShape(slide, slideNo, "rect", 0, 0, W, H, "#FFF7EF", "#00000000", 0, "background");
  addShape(slide, slideNo, "rect", 760, 0, 520, H, "#FFE7D3", "#00000000", 0, "right color field");
  await addImage(slide, slideNo, IMG.hero, 702, 32, 528, 650, { fit: "cover", rounded: true, role: "official hero image" });
  addShape(slide, slideNo, "rect", 700, 0, 580, H, "#FFFFFF4D", "#00000000", 0, "image wash");
  addPill(slide, slideNo, "产品调研报告", 58, 72, 142);
  addText(slide, slideNo, "科大讯飞 AI 英语宝\nEBOX Pro", 56, 128, 602, 142, {
    size: 48,
    color: COLORS.ink,
    bold: true,
    face: FONT.title,
    role: "cover title",
  });
  addText(slide, slideNo, "从官方商品页与详情长图 OCR 提取信息，评估其产品定位、核心卖点、资源壁垒与潜在风险。", 60, 300, 560, 78, {
    size: 20,
    color: COLORS.graphite,
    role: "cover subtitle",
  });
  addShape(slide, slideNo, "rect", 60, 414, 430, 2, COLORS.green, "#00000000", 0, "green rule");
  addMetric(slide, slideNo, "999元", "官方价", 58, 456, 170, 128, COLORS.orange, "接口抓取价格");
  addMetric(slide, slideNo, "3英寸", "高清触控屏", 248, 456, 170, 128, COLORS.green, "便携终端");
  addMetric(slide, slideNo, "105g", "整机重量", 438, 456, 170, 128, COLORS.blue, "官方参数");
  addText(slide, slideNo, "生成日期：2026-05-05", 58, 636, 360, 24, {
    size: 13,
    color: COLORS.muted,
    role: "date",
  });
  setNotes(slide, "封面。强调这是基于官方商品页和 OCR 的产品调研汇报。");
}

async function slide2(p) {
  const slideNo = 2;
  const slide = p.slides.add();
  slideBg(slide, COLORS.bg2);
  addHeader(slide, slideNo, "EXECUTIVE VIEW");
  addTitle(slide, slideNo, "一句话结论", "EBOX Pro 的核心不是单一英语学习，而是把学习、通信、安全和家长管控做成一个便携 AI 终端。");
  await addImage(slide, slideNo, IMG.comparison, 834, 100, 350, 515, { fit: "cover", rounded: true, role: "official comparison screenshot" });
  addCard(slide, slideNo, "产品定位", "面向中小学生的英语学习硬件，覆盖单词、作文、听力、口语与考试资源；同时保留通话、定位、支付和管控能力。", 64, 290, 350, 190, { accent: COLORS.orange });
  addCard(slide, slideNo, "购买理由", "家长想给孩子学习工具，但不希望直接给手机。EBOX Pro 用“可控终端”承接碎片化学习和亲子联系。", 436, 290, 350, 190, { accent: COLORS.green });
  addCard(slide, slideNo, "调研研判", "差异化来自讯飞听说评测背书、AI 生成式学习内容，以及儿童安全通信属性；真实体验仍需专项验证。", 64, 500, 722, 116, { accent: COLORS.blue, bodySize: 17 });
  addSourceFooter(slide, slideNo);
  setNotes(slide, "执行摘要页。先给结论，方便听众快速抓住这款产品为什么值得关注。");
}

async function slide3(p) {
  const slideNo = 3;
  const slide = p.slides.add();
  slideBg(slide, COLORS.bg);
  addHeader(slide, slideNo, "PRODUCT SNAPSHOT");
  addTitle(slide, slideNo, "产品与硬件概览", "SKU 显示为 128G 心想事“橙”版本，官方价 999 元；抓取时库存为 0，但商品处于上架状态。", 54, 86, 650);
  await addImage(slide, slideNo, IMG.params, 770, 92, 392, 480, { fit: "contain", rounded: true, role: "official parameter image" });
  const specs = [
    ["商品名称", "科大讯飞AI英语宝EBOX Pro-128G-心想事“橙”"],
    ["商品编码", "XF002344"],
    ["产品型号", "QM-T200 Pro"],
    ["屏幕", "3 英寸高清触控屏"],
    ["电池", "1800mAh"],
    ["接口", "USB Type-C；3.5mm 耳机接口"],
    ["尺寸/重量", "84mm × 70.5mm × 15mm；105g"],
  ];
  addShape(slide, slideNo, "roundRect", 62, 270, 640, 344, COLORS.panel, COLORS.line, 1, "spec table panel");
  specs.forEach((row, i) => {
    const y = 292 + i * 42;
    if (i > 0) addShape(slide, slideNo, "rect", 84, y - 10, 590, 1, COLORS.line, "#00000000", 0, "table rule");
    addText(slide, slideNo, row[0], 90, y, 110, 24, { size: 15, color: COLORS.muted, bold: true, role: "spec key" });
    addText(slide, slideNo, row[1], 220, y, 430, 24, { size: 16, color: COLORS.ink, role: "spec value" });
  });
  addMetric(slide, slideNo, "0", "抓取时库存", 778, 588, 170, 96, COLORS.gold, "需复核售卖状态");
  addMetric(slide, slideNo, "1", "上架状态", 970, 588, 170, 96, COLORS.green, "isOnSale=1");
  addSourceFooter(slide, slideNo, "来源：讯飞商城商品信息接口与官方参数图 OCR");
  setNotes(slide, "硬件参数与商品接口信息。库存状态是抓取时点信息，后续购买前应复核。");
}

async function slide4(p) {
  const slideNo = 4;
  const slide = p.slides.add();
  slideBg(slide, "#FFFFFF");
  addHeader(slide, slideNo, "FUNCTION MAP");
  addTitle(slide, slideNo, "功能架构：学习闭环外加安全通信", "官方卖点并非单点功能，而是围绕“英语学习效率”和“家长安心”组合。", 54, 86, 690);
  await addImage(slide, slideNo, IMG.newFeatures, 880, 98, 300, 492, { fit: "cover", rounded: true, role: "official new features image" });
  addShape(slide, slideNo, "ellipse", 468, 298, 230, 230, COLORS.paleOrange, COLORS.orange, 2, "central circle");
  addText(slide, slideNo, "AI 英语\n学习闭环", 512, 358, 144, 70, { size: 28, color: COLORS.orange, bold: true, align: "center", role: "central label" });
  const nodes = [
    ["单词", "诊学测背\n故事生成\n单词 PK", 166, 242, COLORS.green],
    ["作文", "拍照批改\n全文点评\n写作润色", 332, 468, COLORS.blue],
    ["听力", "文章大意\n逐句评分\n高频词提取", 640, 468, COLORS.teal],
    ["口语", "AI 私教\n中英混输\n语法发音纠错", 706, 242, COLORS.gold],
    ["安全", "通话定位\n支付管控\n上课模式", 398, 198, COLORS.orange],
  ];
  nodes.forEach(([title, body, x, y, color]) => {
    addShape(slide, slideNo, "roundRect", x, y, 178, 120, COLORS.panel, color, 1.4, `node ${title}`);
    addText(slide, slideNo, title, x + 20, y + 16, 138, 28, { size: 22, color, bold: true, align: "center", role: "node title" });
    addText(slide, slideNo, body, x + 24, y + 52, 130, 56, { size: 15, color: COLORS.graphite, align: "center", role: "node body" });
  });
  addSourceFooter(slide, slideNo);
  setNotes(slide, "功能架构页。把官方宣传中的多个模块归纳为学习闭环与安全通信两条主线。");
}

async function slide5(p) {
  const slideNo = 5;
  const slide = p.slides.add();
  slideBg(slide, COLORS.bg);
  addHeader(slide, slideNo, "LEARNING CAPABILITIES");
  addTitle(slide, slideNo, "核心学习能力", "单词、作文、听力、口语四个模块形成主要学习卖点。", 54, 86, 690);
  await addImage(slide, slideNo, IMG.words, 62, 236, 240, 330, { fit: "cover", rounded: true, role: "word learning image" });
  await addImage(slide, slideNo, IMG.writing, 326, 236, 240, 330, { fit: "cover", rounded: true, role: "writing image" });
  await addImage(slide, slideNo, IMG.listening, 590, 236, 240, 330, { fit: "cover", rounded: true, role: "listening image" });
  await addImage(slide, slideNo, IMG.speaking, 854, 236, 240, 330, { fit: "cover", rounded: true, role: "speaking image" });
  const cards = [
    ["单词", "AI 诊断摸底\n推荐学习方案\n真人原音讲解", 62, COLORS.green],
    ["作文", "拍照改作文\n基础/深度批改\n全文点评与润色", 326, COLORS.blue],
    ["听力", "提炼文章大意\n逐句跟读评测\n高频词提取", 590, COLORS.teal],
    ["口语", "24小时 AI 私教\n1V1 逐步进阶\n语法与发音纠错", 854, COLORS.orange],
  ];
  cards.forEach(([title, body, x, color]) => {
    addShape(slide, slideNo, "roundRect", x, 548, 240, 108, COLORS.panel, COLORS.line, 1, `learning card ${title}`);
    addText(slide, slideNo, title, x + 18, 564, 70, 28, { size: 22, color, bold: true, role: "learning title" });
    addText(slide, slideNo, body, x + 98, 562, 124, 76, { size: 14, color: COLORS.graphite, role: "learning body" });
  });
  addSourceFooter(slide, slideNo);
  setNotes(slide, "核心学习能力页。每个模块都用官方详情图作为视觉证据，旁边用可编辑文字归纳。");
}

async function slide6(p) {
  const slideNo = 6;
  const slide = p.slides.add();
  slideBg(slide, "#FFFFFF");
  addHeader(slide, slideNo, "CONTENT & CREDIBILITY");
  addTitle(slide, slideNo, "内容资源与技术背书", "官方宣传强调资源沉淀、考试服务能力和讯飞 AI 技术积累。", 54, 86, 680);
  await addImage(slide, slideNo, IMG.resources, 802, 90, 340, 456, { fit: "cover", rounded: true, role: "official resources image" });
  await addImage(slide, slideNo, IMG.brand, 872, 510, 240, 142, { fit: "cover", rounded: true, role: "official brand image" });
  const metrics = [
    ["21年", "教育资源沉淀", "启蒙到大学覆盖", 70, 268, COLORS.orange],
    ["10000+", "中高考真题", "持续更新", 286, 268, COLORS.green],
    ["95%+", "教材版本覆盖", "官方宣传口径", 502, 268, COLORS.blue],
    ["4000篇", "新课标课外听力", "含分级听力/经典教材", 70, 444, COLORS.teal],
    ["5万+", "中小学合作", "服务 1.3 亿+ 师生", 286, 444, COLORS.gold],
    ["9000万", "累计服务考生", "听口考试技术服务", 502, 444, COLORS.orange],
  ];
  metrics.forEach(([value, label, note, x, y, color]) => addMetric(slide, slideNo, value, label, x, y, 182, 136, color, note));
  addSourceFooter(slide, slideNo);
  setNotes(slide, "内容资源和技术背书页。注意这些主要来自官方宣传，作为调研素材需标注口径。");
}

async function slide7(p) {
  const slideNo = 7;
  const slide = p.slides.add();
  slideBg(slide, COLORS.bg2);
  addHeader(slide, slideNo, "MODEL COMPARISON");
  addTitle(slide, slideNo, "EBOX Pro vs EBOX：Pro 强在通信与生成式 AI", "普通 EBOX 偏基础学习；Pro 版叠加通话、定位、支付、双模型和双核芯片。", 54, 86, 760);
  await addImage(slide, slideNo, IMG.comparison, 842, 108, 340, 472, { fit: "cover", rounded: true, role: "official model comparison image" });
  const x0 = 62;
  const y0 = 246;
  const colW = [332, 180, 180];
  const rowH = 42;
  addShape(slide, slideNo, "roundRect", x0, y0, 698, 364, COLORS.panel, COLORS.line, 1, "comparison table");
  const headers = ["功能", "EBOX Pro", "EBOX"];
  let x = x0;
  headers.forEach((h, i) => {
    addShape(slide, slideNo, "rect", x, y0, colW[i], 46, i === 0 ? COLORS.ink : COLORS.orange, "#00000000", 0, "table header");
    addText(slide, slideNo, h, x + 16, y0 + 12, colW[i] - 32, 22, { size: 16, color: COLORS.white, bold: true, align: "center", role: "table header text" });
    x += colW[i];
  });
  const rows = [
    ["诊学测单词学习闭环", "支持", "支持"],
    ["AI 个性化生成单词故事", "支持", "不支持"],
    ["AI 口语陪练 / 中高考口语评分", "支持", "支持"],
    ["AI 听力练习", "支持", "支持"],
    ["拨打电话 / 辅助定位 / 移动支付", "支持", "不支持"],
    ["AI 大模型", "讯飞星火 + DeepSeek", "讯飞星火"],
    ["芯片升级", "双核，体验更佳", "单核芯片"],
  ];
  rows.forEach((row, r) => {
    const y = y0 + 46 + r * rowH;
    addShape(slide, slideNo, "rect", x0, y, 698, 1, COLORS.line, "#00000000", 0, "row rule");
    let cx = x0;
    row.forEach((cell, c) => {
      addText(slide, slideNo, cell, cx + 12, y + 10, colW[c] - 24, 22, {
        size: c === 0 ? 15 : 14,
        color: c === 1 && cell !== "不支持" ? COLORS.greenDark : COLORS.graphite,
        bold: c === 0 || c === 1,
        align: c === 0 ? "left" : "center",
        role: "comparison cell",
      });
      cx += colW[c];
    });
  });
  addSourceFooter(slide, slideNo);
  setNotes(slide, "版本对比页。左侧是可编辑对比表，右侧保留官方对比图作为依据。");
}

async function slide8(p) {
  const slideNo = 8;
  const slide = p.slides.add();
  slideBg(slide, COLORS.bg);
  addHeader(slide, slideNo, "USER SCENARIOS");
  addTitle(slide, slideNo, "用户场景与家长价值", "产品试图解决“孩子需要学习终端，但家长不想给手机”的矛盾。", 54, 86, 720);
  await addImage(slide, slideNo, IMG.safety, 840, 96, 310, 492, { fit: "cover", rounded: true, role: "official safety image" });
  const scenarios = [
    ["在校学", "上课模式减少干扰；设备不能下载游戏，强调沉浸学习。", COLORS.green],
    ["在途学", "离线可用、支持 SIM 卡，通勤和碎片化时间也能学习。", COLORS.orange],
    ["在外学", "通话、定位、亲子微聊和支付限额降低家长焦虑。", COLORS.blue],
  ];
  scenarios.forEach(([title, body, color], i) => {
    const x = 76 + i * 240;
    addShape(slide, slideNo, "ellipse", x + 66, 264, 88, 88, `${color}22`, color, 2, "scenario icon");
    addText(slide, slideNo, String(i + 1), x + 95, 286, 30, 34, { size: 26, color, bold: true, align: "center", role: "scenario number" });
    addCard(slide, slideNo, title, body, x, 376, 204, 150, { accent: color, bodySize: 15 });
  });
  addShape(slide, slideNo, "roundRect", 86, 562, 662, 72, COLORS.panel, COLORS.line, 1, "parent value band");
  addText(slide, slideNo, "家长价值主张", 112, 582, 140, 28, { size: 18, color: COLORS.orange, bold: true, role: "parent value title" });
  addText(slide, slideNo, "可联系、可定位、可管控、低娱乐干扰，是 EBOX Pro 区别于手机和平板的关键购买理由。", 266, 582, 450, 32, { size: 17, color: COLORS.graphite, role: "parent value body" });
  addSourceFooter(slide, slideNo);
  setNotes(slide, "用户场景页。突出家长决策逻辑，而不只是学生学习功能。");
}

async function slide9(p) {
  const slideNo = 9;
  const slide = p.slides.add();
  slideBg(slide, "#FFFFFF");
  addHeader(slide, slideNo, "RISKS & VALIDATION");
  addTitle(slide, slideNo, "风险与验证清单", "这类产品的购买价值高度依赖真实体验，需要把官方宣传转化为可验证指标。", 54, 86, 780);
  await addImage(slide, slideNo, IMG.functions, 882, 114, 280, 460, { fit: "cover", rounded: true, role: "official functions image" });
  const risks = [
    ["厂商自述口径", "技术背书、资源数量和学习效果主要来自官方宣传，需第三方或实测验证。", "验证：数据出处、样本口径、实际可用资源。"],
    ["App 依赖", "AI 1 对 1 作文辅导需配套 App“讯飞易听说”，不是完全内置能力。", "验证：App 账号、付费边界、离线/联网限制。"],
    ["隐私与支付", "定位、通话、亲子微聊、移动支付涉及儿童数据与家长授权。", "验证：权限、支付限额、数据留存和关闭机制。"],
    ["功能路径复杂", "学习、通信、内容资源过多，可能增加孩子使用负担。", "验证：新手路径、日活场景、家长端管控效率。"],
  ];
  risks.forEach(([title, body, check], i) => {
    const x = i % 2 === 0 ? 62 : 468;
    const y = i < 2 ? 266 : 472;
    const color = [COLORS.orange, COLORS.blue, COLORS.green, COLORS.gold][i];
    addShape(slide, slideNo, "roundRect", x, y, 360, 164, COLORS.panel, COLORS.line, 1, `risk ${title}`);
    addText(slide, slideNo, title, x + 22, y + 18, 250, 26, { size: 19, color, bold: true, role: "risk title" });
    addText(slide, slideNo, body, x + 22, y + 54, 310, 46, { size: 14, color: COLORS.graphite, role: "risk body" });
    addShape(slide, slideNo, "roundRect", x + 20, y + 112, 318, 34, `${color}18`, "#00000000", 0, "validation pill");
    addText(slide, slideNo, check, x + 34, y + 120, 290, 18, { size: 12, color: COLORS.ink, role: "validation text" });
  });
  addSourceFooter(slide, slideNo);
  setNotes(slide, "风险页。把宣传点转为后续调研、采购或竞品分析时需要验证的清单。");
}

async function slide10(p) {
  const slideNo = 10;
  const slide = p.slides.add();
  slideBg(slide, COLORS.bg2);
  addHeader(slide, slideNo, "RECOMMENDATION");
  addTitle(slide, slideNo, "结论与建议", "EBOX Pro 适合作为英语学习辅助与家长可控终端，不宜被表述为替代课堂或系统辅导。", 54, 86, 810);
  await addImage(slide, slideNo, IMG.hero, 872, 98, 272, 398, { fit: "cover", rounded: true, role: "official hero crop" });
  addCard(slide, slideNo, "适合人群", "中小学阶段、对英语听说/单词/作文训练有明确需求，同时需要通话定位和家长管控的家庭。", 62, 264, 360, 156, { accent: COLORS.green });
  addCard(slide, slideNo, "推广角度", "不要只讲“学习机”，应突出“AI 英语能力 + 安全通信 + 可管控”的复合价值。", 448, 264, 360, 156, { accent: COLORS.orange });
  addCard(slide, slideNo, "下一步验证", "实测作文批改准确率、口语评分一致性、内容更新频率、续航、家长 App 和隐私/支付控制。", 62, 442, 746, 120, { accent: COLORS.blue, bodySize: 16 });
  addShape(slide, slideNo, "roundRect", 850, 520, 340, 116, COLORS.panel, COLORS.line, 1, "sources panel");
  addText(slide, slideNo, "主要来源", 874, 540, 120, 24, { size: 18, color: COLORS.orange, bold: true, role: "source title" });
  addText(slide, slideNo, "讯飞商城商品页\n商品信息接口\n产品详情接口\n31 张官方详情图 OCR", 874, 572, 268, 52, { size: 13, color: COLORS.graphite, role: "source list" });
  addSourceFooter(slide, slideNo, "注：本报告基于官方公开信息与 OCR 提取结果，未包含线下实测数据。");
  setNotes(slide, "结论页。给出适用边界、推广建议和下一步验证方向。");
}

async function createDeck() {
  await ensureDirs();
  const p = Presentation.create({ slideSize: { width: W, height: H } });
  p.theme.colorScheme = {
    name: "EBOX Research",
    themeColors: {
      accent1: COLORS.orange,
      accent2: COLORS.green,
      accent3: COLORS.blue,
      bg1: COLORS.bg,
      tx1: COLORS.ink,
      tx2: COLORS.graphite,
    },
  };
  await slide1(p);
  await slide2(p);
  await slide3(p);
  await slide4(p);
  await slide5(p);
  await slide6(p);
  await slide7(p);
  await slide8(p);
  await slide9(p);
  await slide10(p);
  return p;
}

async function saveBlobToFile(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function writeInspect(presentation) {
  const head = [
    JSON.stringify({ kind: "deck", id: "xunfei-ebox-pro-research", slideCount: presentation.slides.count, slideSize: { width: W, height: H } }),
    ...presentation.slides.items.map((_, i) => JSON.stringify({ kind: "slide", slide: i + 1, id: `slide-${i + 1}` })),
  ];
  await fs.writeFile(INSPECT_PATH, [...head, ...records.map((r) => JSON.stringify(r))].join("\n") + "\n", "utf8");
}

async function renderAndExport(presentation) {
  await writeInspect(presentation);
  for (let i = 0; i < presentation.slides.items.length; i += 1) {
    const preview = await presentation.export({ slide: presentation.slides.items[i], format: "png", scale: 1 });
    await saveBlobToFile(preview, path.join(PREVIEW_DIR, `slide-${String(i + 1).padStart(2, "0")}.png`));
  }
  const pptx = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(OUT_DIR, "output.pptx");
  await pptx.save(pptxPath);
  await fs.writeFile(path.join(VERIFY_DIR, "render_verify_loops.ndjson"), JSON.stringify({
    kind: "render_verify_loop",
    deckId: "xunfei-ebox-pro-research",
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