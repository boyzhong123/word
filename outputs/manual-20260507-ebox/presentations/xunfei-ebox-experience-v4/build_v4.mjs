import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  ensureArtifactToolWorkspace,
  importArtifactTool,
  saveBlobToFile,
} from "/Users/zhong/.codex/plugins/cache/openai-primary-runtime/presentations/26.505.10851/skills/presentations/scripts/artifact_tool_utils.mjs";

const ROOT = "/Users/zhong/Desktop/Cursor仓库/ChivoxMCP官网";
const WORKSPACE = path.join(ROOT, "outputs/manual-20260507-ebox/presentations/xunfei-ebox-experience-v4");
const ASSET_DIR = path.join(ROOT, "outputs/xunfei-ebox-experience-visual-upgrade/assets-v4/normalized");
const PREVIEW_DIR = path.join(WORKSPACE, "preview");
const LAYOUT_DIR = path.join(WORKSPACE, "layout");
const QA_DIR = path.join(WORKSPACE, "qa");
const FINAL_DIR = path.join(ROOT, "outputs/xunfei-ebox-experience-visual-upgrade");
const FINAL_PPTX = path.join(FINAL_DIR, "xunfei-ebox-pro-experience-report-20260507.pptx");

const W = 1280;
const H = 720;

const C = {
  paper: "#FFF8F1",
  paper2: "#F6FBFF",
  paper3: "#F8FAF6",
  white: "#FFFFFF",
  ink: "#111827",
  text: "#344054",
  muted: "#667085",
  faint: "#EAECF0",
  line: "#E4E7EC",
  orange: "#FF6A00",
  orangeSoft: "#FFF1E6",
  teal: "#12B8A6",
  tealSoft: "#E7FAF7",
  blue: "#2474FF",
  blueSoft: "#ECF3FF",
  green: "#00A86B",
  greenSoft: "#EAF8EF",
  red: "#EF3340",
  redSoft: "#FFF0F0",
  gold: "#F2A000",
  goldSoft: "#FFF6DA",
  violet: "#6E5BFF",
  violetSoft: "#F0EEFF",
  dark: "#0B1220",
};

const FONT = {
  title: "PingFang SC",
  body: "PingFang SC",
  mono: "Aptos Mono",
};

const img = (n) => path.join(ASSET_DIR, `${String(n).padStart(2, "0")}.png`);
const IMG = {
  cover: img(4),
  intro: img(5),
  oral: img(6),
  wordLoop: img(8),
  wordFeedback: img(9),
  contentTop: img(10),
  camp: img(11),
  story: img(12),
  brand: img(13),
  exam: img(14),
  resources: img(15),
  homework: img(16),
  parent: img(17),
  mobility: img(18),
  textbook: img(19),
  professional: img(20),
  more: img(21),
  specs: img(22),
  pk: img(23),
  listening: img(24),
  compare: img(28),
  examWords: img(29),
  hotContent: img(31),
  reviews: img(32),
  improvement: img(34),
  rate: img(35),
  banner: img(36),
  wordSystem: img(37),
  wordTeach: img(39),
};

const SOURCE_FOOTER = "来源：用户提供天猫详情页截图、讯飞商城与公开页面；页面宣传口径需以真机和当前商品页复核。";
const records = [];

function log(kind, slideNo, role, text, bbox, extra = {}) {
  records.push({ kind, slide: slideNo, role, text: text || "", bbox, ...extra });
}

function line(fill = "#00000000", width = 0) {
  return { style: "solid", fill, width };
}

function addShape(slide, slideNo, geometry, x, y, w, h, fill, stroke = "#00000000", strokeWidth = 0, role = "shape") {
  const shape = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: line(stroke, strokeWidth),
  });
  log("shape", slideNo, role, "", [x, y, w, h], { geometry });
  return shape;
}

function addText(slide, slideNo, text, x, y, w, h, opts = {}) {
  const shape = addShape(
    slide,
    slideNo,
    opts.geometry || "rect",
    x,
    y,
    w,
    h,
    opts.fill || "#00000000",
    opts.line || "#00000000",
    opts.lineWidth || 0,
    opts.role || "text",
  );
  shape.text = text;
  shape.text.fontSize = opts.size || 18;
  shape.text.color = opts.color || C.ink;
  shape.text.bold = Boolean(opts.bold);
  shape.text.typeface = opts.face || FONT.body;
  shape.text.alignment = opts.align || "left";
  shape.text.verticalAlignment = opts.valign || "top";
  shape.text.insets = opts.insets || { left: 0, right: 0, top: 0, bottom: 0 };
  shape.text.autoFit = opts.autoFit || "shrinkText";
  log("textbox", slideNo, opts.role || "text", text, [x, y, w, h]);
  return shape;
}

async function imageBlob(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function addImage(slide, slideNo, filePath, x, y, w, h, opts = {}) {
  const image = slide.images.add({
    blob: await imageBlob(filePath),
    fit: opts.fit || "contain",
    alt: opts.alt || path.basename(filePath),
  });
  image.position = { left: x, top: y, width: w, height: h };
  if (opts.rounded) image.geometry = "roundRect";
  log("image", slideNo, opts.role || "image", "", [x, y, w, h], { filePath });
  return image;
}

async function addEvidenceImage(slide, slideNo, filePath, x, y, w, h, caption = "", opts = {}) {
  addShape(slide, slideNo, "roundRect", x - 10, y - 10, w + 20, h + (caption ? 38 : 20), C.white, C.line, 1, "evidence frame");
  await addImage(slide, slideNo, filePath, x, y, w, h, { fit: opts.fit || "contain", rounded: true, role: "evidence image" });
  if (caption) {
    addText(slide, slideNo, caption, x, y + h + 12, w, 18, {
      size: 11,
      color: C.muted,
      align: "center",
      role: "image caption",
    });
  }
}

function addHeader(slide, slideNo, kicker, accent = C.orange) {
  addText(slide, slideNo, kicker, 56, 28, 360, 24, {
    size: 13,
    color: accent,
    bold: true,
    face: FONT.mono,
    role: "kicker",
  });
  addText(slide, slideNo, `${String(slideNo).padStart(2, "0")} / 25`, 1120, 28, 104, 22, {
    size: 12,
    color: C.muted,
    bold: true,
    face: FONT.mono,
    align: "right",
    role: "page number",
  });
  addShape(slide, slideNo, "rect", 56, 62, 1168, 1.2, C.line, "#00000000", 0, "header rule");
}

function addTitle(slide, slideNo, title, subtitle = "", opts = {}) {
  const x = opts.x || 56;
  const y = opts.y || 86;
  const w = opts.w || 760;
  addText(slide, slideNo, title, x, y, w, opts.h || 84, {
    size: opts.size || 36,
    color: opts.color || C.ink,
    bold: true,
    role: "claim title",
  });
  if (subtitle) {
    addText(slide, slideNo, subtitle, x + 2, y + (opts.subtitleY || 104), w - 20, opts.subtitleH || 54, {
      size: opts.subtitleSize || 18,
      color: opts.subtitleColor || C.text,
      role: "subtitle",
    });
  }
}

function addFooter(slide, slideNo, text = SOURCE_FOOTER) {
  addText(slide, slideNo, text, 56, 688, 1060, 16, {
    size: 10,
    color: C.muted,
    role: "source footer",
  });
}

function addCard(slide, slideNo, title, body, x, y, w, h, opts = {}) {
  const accent = opts.accent || C.orange;
  const fill = opts.fill || C.white;
  addShape(slide, slideNo, "roundRect", x, y, w, h, fill, opts.line || C.line, 1, "content card");
  addShape(slide, slideNo, "rect", x, y, 5, h, accent, "#00000000", 0, "card accent");
  if (title) {
    addText(slide, slideNo, title, x + 22, y + 18, w - 38, 28, {
      size: opts.titleSize || 20,
      color: accent,
      bold: true,
      role: "card title",
    });
  }
  if (body) {
    addText(slide, slideNo, body, x + 22, y + (title ? 56 : 20), w - 42, h - (title ? 68 : 34), {
      size: opts.bodySize || 16,
      color: opts.bodyColor || C.text,
      role: "card body",
    });
  }
}

function addMetric(slide, slideNo, value, label, x, y, w, h, accent = C.orange, note = "") {
  addShape(slide, slideNo, "roundRect", x, y, w, h, C.white, C.line, 1, "metric card");
  addShape(slide, slideNo, "rect", x, y, w, 6, accent, "#00000000", 0, "metric top");
  addText(slide, slideNo, value, x + 18, y + 20, w - 36, 36, {
    size: 30,
    color: accent,
    bold: true,
    role: "metric value",
  });
  addText(slide, slideNo, label, x + 18, y + 62, w - 36, 24, {
    size: 15,
    color: C.ink,
    bold: true,
    role: "metric label",
  });
  if (note) {
    addText(slide, slideNo, note, x + 18, y + 96, w - 36, 16, {
      size: 11,
      color: C.muted,
      role: "metric note",
    });
  }
}

function addSpecCard(slide, slideNo, value, label, x, y, w, h, accent = C.orange, valueSize = 20) {
  addShape(slide, slideNo, "roundRect", x, y, w, h, C.white, C.line, 1, "spec card");
  addShape(slide, slideNo, "rect", x, y, w, 6, accent, "#00000000", 0, "spec top");
  addText(slide, slideNo, value, x + 18, y + 22, w - 36, 24, {
    size: valueSize,
    color: accent,
    bold: true,
    role: "spec value",
  });
  addText(slide, slideNo, label, x + 18, y + 60, w - 36, 22, {
    size: 14,
    color: C.ink,
    bold: true,
    role: "spec label",
  });
}

function addTag(slide, slideNo, text, x, y, w, accent = C.orange, fill = C.orangeSoft) {
  addShape(slide, slideNo, "roundRect", x, y, w, 32, fill, "#00000000", 0, "tag");
  addText(slide, slideNo, text, x + 12, y + 7, w - 24, 16, {
    size: 13,
    color: accent,
    bold: true,
    align: "center",
    role: "tag text",
  });
}

function addMiniList(slide, slideNo, items, x, y, w, h, opts = {}) {
  const rowH = h / items.length;
  items.forEach((item, index) => {
    const yy = y + index * rowH;
    const accent = item.accent || opts.accent || C.orange;
    addShape(slide, slideNo, "ellipse", x, yy + 8, 26, 26, item.fill || C.orangeSoft, accent, 1, "list dot");
    addText(slide, slideNo, String(index + 1), x + 7, yy + 12, 12, 12, {
      size: 11,
      color: accent,
      bold: true,
      align: "center",
      role: "list number",
    });
    addText(slide, slideNo, item.title, x + 40, yy + 6, w - 42, 24, {
      size: 17,
      color: C.ink,
      bold: true,
      role: "list title",
    });
    addText(slide, slideNo, item.body, x + 40, yy + 34, w - 42, rowH - 38, {
      size: 13,
      color: C.text,
      role: "list body",
    });
  });
}

function addSlideNotes(slide, note) {
  slide.speakerNotes.setText(`${note}\n\n主要来源：用户提供天猫详情页截图、讯飞商城、公开报道与用户提供的驰声AI智慧课堂资料。`);
}

function addTwoColTable(slide, slideNo, x, y, w, h, rows, headers = ["EBOX Pro", "驰声课堂产品"]) {
  const colW = w / 2;
  const headH = 44;
  addShape(slide, slideNo, "roundRect", x, y, w, h, C.white, C.line, 1, "comparison table");
  addShape(slide, slideNo, "rect", x, y, colW, headH, C.orangeSoft, "#00000000", 0, "table header left");
  addShape(slide, slideNo, "rect", x + colW, y, colW, headH, C.blueSoft, "#00000000", 0, "table header right");
  addText(slide, slideNo, headers[0], x + 20, y + 12, colW - 40, 20, { size: 16, color: C.orange, bold: true, align: "center", role: "table header" });
  addText(slide, slideNo, headers[1], x + colW + 20, y + 12, colW - 40, 20, { size: 16, color: C.blue, bold: true, align: "center", role: "table header" });
  const rowH = (h - headH) / rows.length;
  rows.forEach((row, i) => {
    const yy = y + headH + i * rowH;
    addShape(slide, slideNo, "rect", x, yy, w, 1, C.line, "#00000000", 0, "table row line");
    addText(slide, slideNo, row[0], x + 22, yy + 12, colW - 44, rowH - 18, { size: 14, color: C.text, role: "table cell" });
    addText(slide, slideNo, row[1], x + colW + 22, yy + 12, colW - 44, rowH - 18, { size: 14, color: C.text, role: "table cell" });
  });
}

async function slide01(p) {
  const n = 1;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "体验报告 / EBOX PRO", C.orange);
  addText(slide, n, "科大讯飞 AI英语宝 EBOX Pro", 56, 96, 710, 64, {
    size: 42,
    color: C.ink,
    bold: true,
    role: "cover title",
  });
  addText(slide, n, "基于讯飞商城、天猫详情页与公开页面整理，用于内部产品体验与竞品观察。", 58, 174, 650, 42, {
    size: 18,
    color: C.text,
    role: "cover subtitle",
  });
  const metrics = [
    ["近400", "口语话题", C.blue, "覆盖新课标"],
    ["10000+", "中高考真题", C.teal, "页面宣传口径"],
    ["95%+", "教材覆盖率", C.green, "页面宣传口径"],
    ["3寸/105g", "便携硬件", C.gold, "官方参数口径"],
  ];
  metrics.forEach((m, i) => addMetric(slide, n, m[0], m[1], 56 + i * 178, 284, 150, 116, m[2], m[3]));
  addCard(slide, n, "一句话判断", "EBOX Pro 把英语练习、AI反馈、内容资源、家长管控与低价小屏硬件组合成家庭端入口；当前不等同于课堂系统，但值得持续跟踪。", 56, 512, 720, 94, { accent: C.red, bodySize: 16 });
  await addEvidenceImage(slide, n, IMG.cover, 852, 90, 310, 520, "天猫详情页主视觉", { fit: "contain" });
  addFooter(slide, n);
  addSlideNotes(slide, "封面页：用天猫主视觉和关键指标建立产品对象。");
}

async function slide02(p) {
  const n = 2;
  const slide = p.slides.add();
  slide.background.fill = C.paper2;
  addHeader(slide, n, "EXECUTIVE SUMMARY", C.blue);
  addTitle(slide, n, "先给结论：它是家庭端英语学习入口，不是课堂系统", "对驰声的影响来自两点：低价硬件降低用户预期，讯飞若补齐学校端能力，会形成更直接冲击。", { w: 980 });
  const cards = [
    ["产品本质", "3寸小屏 + 麦克风/扬声器 + 内容资源 + AI评分，面向学生个人和家长监督。", C.orange, C.orangeSoft],
    ["强势卖点", "语音评测、单词、听力、真题、作文、家长管控被包装成一个日常闭环。", C.teal, C.tealSoft],
    ["当前边界", "缺少课堂统一发题、班级数据、教师端讲评和成套听说试题闭环。", C.blue, C.blueSoft],
    ["监控信号", "若出现教师端、学校套装、班级作业、校采渠道，影响会从间接转为直接。", C.red, C.redSoft],
  ];
  cards.forEach((c, i) => addCard(slide, n, c[0], c[1], 70 + (i % 2) * 575, 280 + Math.floor(i / 2) * 150, 510, 112, { accent: c[2], fill: c[3], bodySize: 16 }));
  addFooter(slide, n);
  addSlideNotes(slide, "执行摘要页：突出产品定位、亮点、边界和需要监控的升级方向。");
}

async function slide03(p) {
  const n = 3;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "产品定义", C.orange);
  addTitle(slide, n, "先把它放对位置：\n小屏终端承接家庭高频练习", "不是复读机，也不是课堂学习机；它围绕英语练习、AI反馈、家长管控和安全联系形成家庭端入口。", { w: 720, h: 98, subtitleY: 112 });
  const items = [
    { title: "学习入口", body: "单词、听力、口语、作文、真题测验集中在一个设备上。", accent: C.orange },
    { title: "反馈入口", body: "通过口语评分、作文批改、错因反馈，让练习形成闭环。", accent: C.teal },
    { title: "家长入口", body: "家长看学情、管控内容和时长，也可使用通话/定位/支付。", accent: C.blue },
    { title: "渠道入口", body: "天猫详情页把它对标听力宝、单词机、电话手表和外教课。", accent: C.red },
  ];
  addMiniList(slide, n, items, 70, 270, 600, 300);
  await addEvidenceImage(slide, n, IMG.intro, 815, 102, 330, 500, "详情页功能入口：AI口语、听写、真题、作文等", { fit: "contain" });
  addFooter(slide, n);
  addSlideNotes(slide, "产品定义页：用功能入口截图说明它不是单点工具，而是家庭英语练习终端。");
}

async function slide04(p) {
  const n = 4;
  const slide = p.slides.add();
  slide.background.fill = C.paper3;
  addHeader(slide, n, "产品包装", C.teal);
  addTitle(slide, n, "6合1：把家长要的事\n装进一个设备", "详情页用“听力机、口语私教、电话手表、单词机、电子词典、写作顾问”来降低理解成本。", { w: 710, h: 98, subtitleY: 112 });
  const chips = [
    ["听力机", "听力/熏听/复读"],
    ["口语私教", "陪练与评分"],
    ["电话手表", "通话/定位/支付"],
    ["单词机", "诊学测练"],
    ["电子词典", "查词翻译"],
    ["写作顾问", "作文批改"],
  ];
  chips.forEach((c, i) => {
    const x = 70 + (i % 2) * 300;
    const y = 250 + Math.floor(i / 2) * 96;
    addShape(slide, n, "roundRect", x, y, 250, 64, C.white, C.line, 1, "six-in-one chip");
    addText(slide, n, c[0], x + 20, y + 14, 110, 22, { size: 18, color: [C.orange, C.teal, C.blue, C.green, C.gold, C.red][i], bold: true, role: "chip title" });
    addText(slide, n, c[1], x + 138, y + 17, 92, 18, { size: 13, color: C.muted, role: "chip note" });
  });
  await addEvidenceImage(slide, n, IMG.intro, 780, 112, 360, 470, "详情页“6合1”视频介绍入口", { fit: "contain" });
  addCard(slide, n, "体验报告要验证", "这些功能是否真的共享同一套学习数据、反馈链路和家长端视图，而不是单独入口的功能堆叠。", 70, 566, 610, 70, { accent: C.teal, bodySize: 15 });
  addFooter(slide, n);
  addSlideNotes(slide, "6合1包装页：重点不是罗列功能，而是解释为什么这套包装能打动家长。");
}

async function slide05(p) {
  const n = 5;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "同类产品对比", C.orange);
  addTitle(slide, n, "天猫详情页主动建立品类差异：\n它卖的是学习闭环", "对比听力宝、单词机、App和电话手表时，核心话术都指向“更完整、更专注、更安全”。", { w: 760, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.compare, 70, 210, 405, 458, "详情页同类产品对比矩阵", { fit: "contain" });
  const points = [
    { title: "对听力类产品", body: "不是只播放：强调语法、句型、真题和精讲。", accent: C.teal },
    { title: "对单词类产品", body: "不是孤立背词：强调语境、用法和真题检测。", accent: C.green },
    { title: "对App类产品", body: "不是手机学习：强调专注、无游戏和低干扰。", accent: C.blue },
    { title: "对电话手表", body: "不是只联系：强调学习专业度和家长可控。", accent: C.red },
  ];
  points.forEach((pnt, i) => addCard(slide, n, pnt.title, pnt.body, 545, 232 + i * 100, 600, 76, { accent: pnt.accent, fill: C.white, bodySize: 15, titleSize: 18 }));
  addFooter(slide, n);
  addSlideNotes(slide, "品类对比页：用详情页矩阵说明电商话术如何塑造 EBOX Pro 的差异。");
}

async function slide06(p) {
  const n = 6;
  const slide = p.slides.add();
  slide.background.fill = C.paper2;
  addHeader(slide, n, "体验路径", C.blue);
  addTitle(slide, n, "真实体验要看一次练习能否形成反馈-复练闭环", "功能存在不够，关键是孩子能否低摩擦开始、理解反馈、并愿意再练一次。", { w: 850 });
  const stages = [
    ["选内容", "教材/单词/听力/口语题", C.green, C.greenSoft],
    ["听与读", "熏听/复读/跟读/朗读", C.blue, C.blueSoft],
    ["AI评分", "发音/语调/流畅度/语法", C.orange, C.orangeSoft],
    ["错因反馈", "纠错/精讲/建议/二次练", C.gold, C.goldSoft],
    ["家长查看", "学情/管控/安全联系", C.red, C.redSoft],
  ];
  stages.forEach((s, i) => {
    const x = 70 + i * 230;
    addShape(slide, n, "roundRect", x, 272, 180, 220, s[3], "#00000000", 0, "journey stage");
    addShape(slide, n, "ellipse", x + 53, 306, 74, 74, C.white, s[2], 3, "stage number circle");
    addText(slide, n, String(i + 1), x + 76, 326, 30, 30, { size: 28, color: s[2], bold: true, align: "center", role: "stage number" });
    addText(slide, n, s[0], x + 22, 404, 136, 28, { size: 20, color: C.ink, bold: true, align: "center", role: "stage title" });
    addText(slide, n, s[1], x + 22, 444, 136, 36, { size: 13, color: C.text, align: "center", role: "stage note" });
  });
  addCard(slide, n, "验收标准", "用同一题目、同一学生样本、同一环境噪声条件，验证评分稳定性与反馈可执行性。", 208, 548, 860, 70, { accent: C.blue, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "体验路径页：无连接线，避免导出后出现误导性的线条。");
}

async function slide07(p) {
  const n = 7;
  const slide = p.slides.add();
  slide.background.fill = C.paper3;
  addHeader(slide, n, "内容版图", C.green);
  addTitle(slide, n, "内容资源是它的护城河：\n课内、考试、拓展三条线并行", "详情页把 21年资源沉淀、10000+真题、95%+教材覆盖率作为信任背书。", { w: 720, h: 98, subtitleY: 112 });
  const metrics = [
    ["21年", "教育资源沉淀", C.orange, "页面宣传"],
    ["10000+", "中高考真题", C.green, "页面宣传"],
    ["95%+", "教材覆盖率", C.blue, "页面宣传"],
  ];
  metrics.forEach((m, i) => addMetric(slide, n, m[0], m[1], 70 + i * 205, 265, 170, 120, m[2], m[3]));
  addCard(slide, n, "课内同步", "主流教材版本覆盖，承接预习、复习和课文精讲。", 70, 428, 270, 86, { accent: C.blue, bodySize: 15 });
  addCard(slide, n, "考试考级", "中高考、KET/PET、词汇与真题资源强化应试路径。", 360, 428, 270, 86, { accent: C.green, bodySize: 15 });
  addCard(slide, n, "课外拓展", "时文、名著、科普和分级听力扩大英语输入。", 70, 536, 560, 74, { accent: C.orange, bodySize: 15 });
  await addEvidenceImage(slide, n, IMG.resources, 812, 100, 330, 510, "详情页资源页：21年沉淀/真题/教材覆盖", { fit: "contain" });
  addFooter(slide, n);
  addSlideNotes(slide, "内容版图页：把详情页资源宣传拆成课内、考试、拓展三条线。");
}

async function slide08(p) {
  const n = 8;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "课内同步", C.blue);
  addTitle(slide, n, "同步教材是家庭端最稳定的日常使用理由", "家长不一定理解语音评测算法，但能理解“跟着校内教材预复习”。", { w: 760 });
  await addEvidenceImage(slide, n, IMG.textbook, 70, 190, 390, 470, "详情页：同步教材与考试资源展示", { fit: "contain" });
  const points = [
    ["价值", "降低选内容成本，孩子每天知道练什么。"],
    ["场景", "课前预习、课后复习、听读巩固都可以落在同一终端上。"],
    ["待核验", "实际教材版本、年级覆盖、更新速度、离线可用范围。"],
  ];
  points.forEach((pnt, i) => addCard(slide, n, pnt[0], pnt[1], 540, 238 + i * 122, 610, 88, { accent: [C.blue, C.teal, C.red][i], bodySize: 16 }));
  addFooter(slide, n);
  addSlideNotes(slide, "课内同步页：解释为什么同步教材对家庭使用频次重要。");
}

async function slide09(p) {
  const n = 9;
  const slide = p.slides.add();
  slide.background.fill = C.paper2;
  addHeader(slide, n, "听力与阅读", C.teal);
  addTitle(slide, n, "听力不是单纯多听：\n详情页强调“听得懂有重点”", "时文、名著、真题和教研精讲把听力训练从泛听拉回到理解与应试。", { w: 760, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.hotContent, 64, 168, 340, 470, "详情页：时文 + 名著 + 真题精讲", { fit: "contain" });
  await addEvidenceImage(slide, n, IMG.listening, 444, 168, 330, 470, "详情页：听力精讲与词汇/语法/句型拆解", { fit: "contain" });
  addCard(slide, n, "体验判断", "关键不是资源数量，而是精讲能否真正帮助学生定位听不懂的原因：词汇、语法、句型、背景知识还是语速。", 820, 235, 325, 140, { accent: C.teal, bodySize: 16 });
  addCard(slide, n, "对驰声启示", "如果家庭端把“听力理解脚手架”做得足够顺，课堂端的精讲与数据闭环需要更突出教师价值。", 820, 410, 325, 120, { accent: C.blue, bodySize: 15 });
  addFooter(slide, n);
  addSlideNotes(slide, "听力与阅读页：用两个详情页证据图说明它不是只播音频。");
}

async function slide10(p) {
  const n = 10;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "口语练习", C.orange);
  addTitle(slide, n, "24小时AI私教的卖点：让孩子先敢开口", "详情页展示中英混合输入、主动引导和对话回应，目标是降低开口门槛。", { w: 760 });
  await addEvidenceImage(slide, n, IMG.oral, 772, 92, 340, 520, "详情页：24小时AI口语私教", { fit: "contain" });
  const items = [
    { title: "低门槛", body: "不用预约外教，孩子可以随时练。", accent: C.orange },
    { title: "多轮引导", body: "对话式回应能把单句练习拉成表达训练。", accent: C.teal },
    { title: "中英混合", body: "降低初期表达焦虑，帮助从敢说到完整说。", accent: C.blue },
    { title: "体验风险", body: "真实语音识别、延迟、反馈质量需要真机验证。", accent: C.red },
  ];
  addMiniList(slide, n, items, 76, 266, 600, 286);
  addFooter(slide, n);
  addSlideNotes(slide, "口语 AI 私教页：重点解释为什么家庭端会被这个卖点吸引。");
}

async function slide11(p) {
  const n = 11;
  const slide = p.slides.add();
  slide.background.fill = C.paper3;
  addHeader(slide, n, "AI反馈", C.green);
  addTitle(slide, n, "评分报告把练习变成可追踪结果", "详情页强调每次练习生成评分报告，弱项一目了然；这正好触达家长的结果感。", { w: 760 });
  await addEvidenceImage(slide, n, IMG.oral, 70, 176, 320, 472, "详情页：口语练习与评分报告", { fit: "contain" });
  const points = [
    ["评分维度", "关注发音、语法、流畅度等维度是否明确。"],
    ["反馈颗粒度", "看是否给出可执行修改建议，而不仅是分数。"],
    ["稳定性", "同题多次录音、不同噪声环境下评分是否一致。"],
    ["家长视角", "家长端是否能看到趋势，而不是单次成绩。"],
  ];
  points.forEach((pnt, i) => addCard(slide, n, pnt[0], pnt[1], 470 + (i % 2) * 330, 246 + Math.floor(i / 2) * 128, 292, 92, { accent: [C.green, C.teal, C.blue, C.red][i], bodySize: 14 }));
  addFooter(slide, n);
  addSlideNotes(slide, "AI反馈页：从体验验证角度说明评分报告该看什么。");
}

async function slide12(p) {
  const n = 12;
  const slide = p.slides.add();
  slide.background.fill = C.paper2;
  addHeader(slide, n, "口语话题", C.blue);
  addTitle(slide, n, "近400个口语话题\n让训练更接近新课标表达", "页面把话题覆盖与新课标绑定，形成“不是随便聊天，而是围绕考试与表达能力训练”的认知。", { w: 760, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, img(2), 778, 105, 340, 500, "详情页：近400口语话题与新课标标签", { fit: "contain" });
  const topics = ["团队精神", "积极生活", "学习方法", "交流合作", "未来畅想", "保护环境", "珍爱生命", "文化习俗"];
  topics.forEach((t, i) => {
    const x = 78 + (i % 4) * 155;
    const y = 276 + Math.floor(i / 4) * 82;
    addTag(slide, n, t, x, y, 124, [C.orange, C.green, C.blue, C.teal, C.gold, C.red, C.violet, C.green][i], [C.orangeSoft, C.greenSoft, C.blueSoft, C.tealSoft, C.goldSoft, C.redSoft, C.violetSoft, C.greenSoft][i]);
  });
  addCard(slide, n, "体验判断", "话题库是否真正覆盖本地中考/新课标表达要求，以及AI回应是否能纠正内容、逻辑与语言准确性。", 78, 474, 600, 86, { accent: C.blue, bodySize: 15 });
  addFooter(slide, n);
  addSlideNotes(slide, "口语话题页：把详情页上的话题气泡转为内部可读的分类。");
}

async function slide13(p) {
  const n = 13;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "单词体系", C.orange);
  addTitle(slide, n, "单词不是背词表：\n诊断-学习-复习-测评", "详情页把单词学习包装成“科学背单词”：AI诊断、学习方案、真人讲解、复习与巩固。", { w: 720, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.wordSystem, 792, 90, 330, 520, "详情页：AI诊学测单词学习体系", { fit: "contain" });
  const steps = [
    ["诊", "AI诊断摸底\n推荐学习方案", C.orange, C.orangeSoft],
    ["学", "卡片记忆\n考点用法讲解", C.blue, C.blueSoft],
    ["练", "听写/朗读/速听\n多模式复习", C.teal, C.tealSoft],
    ["测", "真题检测\n弱项再练", C.green, C.greenSoft],
  ];
  steps.forEach((s, i) => {
    const x = 80 + i * 166;
    addShape(slide, n, "ellipse", x, 292, 86, 86, s[3], s[2], 2, "word stage circle");
    addText(slide, n, s[0], x + 26, 314, 34, 30, { size: 30, color: s[2], bold: true, align: "center", role: "word stage mark" });
    addText(slide, n, s[1], x - 18, 398, 122, 52, { size: 14, color: C.text, align: "center", role: "word stage text" });
  });
  addCard(slide, n, "体验判断", "看推荐是否真的基于测评结果调整词表和复习节奏，而不是固定路径。", 86, 530, 560, 74, { accent: C.orange, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "单词体系页：强调学习流程而不是单点功能。");
}

async function slide14(p) {
  const n = 14;
  const slide = p.slides.add();
  slide.background.fill = C.paper2;
  addHeader(slide, n, "考点用法", C.blue);
  addTitle(slide, n, "真人原音讲解把单词从“会拼”推进到“会用”", "详情页示例把词义、搭配、同义辨析、高频考点和例句放在同一学习界面里。", { w: 760 });
  await addEvidenceImage(slide, n, IMG.wordTeach, 70, 152, 330, 500, "详情页：单词真人原音讲解", { fit: "contain" });
  addCard(slide, n, "对用户的意义", "家长购买的不是词库容量，而是孩子能不能把词放回语境、题目和表达里使用。", 470, 225, 610, 92, { accent: C.blue, bodySize: 17 });
  addCard(slide, n, "对体验的要求", "讲解要足够短、准确、可复听；如果内容太长或入口太深，会削弱随手学习的价值。", 470, 350, 610, 92, { accent: C.teal, bodySize: 17 });
  addCard(slide, n, "对驰声的启示", "课堂端可以把“词汇-句型-听说任务”组合成教师可控的任务链，区别于个人终端自学。", 470, 475, 610, 92, { accent: C.orange, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "单词讲解页：解释从背词到会用的产品价值。");
}

async function slide15(p) {
  const n = 15;
  const slide = p.slides.add();
  slide.background.fill = C.paper3;
  addHeader(slide, n, "真题练习", C.green);
  addTitle(slide, n, "真题练习把单词记忆\n拉向考试结果", "详情页强调 5000+ 历年真题并结合学情个性化推送，这是单词学习从输入到检测的关键环节。", { w: 720, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.exam, 760, 105, 350, 500, "详情页：匹配真题练习与考点解析", { fit: "contain" });
  const cards = [
    ["从记得住到考得好", "真题让学生知道这个词在真实题目里怎么出现。", C.green],
    ["个性化推送", "如果能依据错题和掌握度调整题目，会形成更强复练路径。", C.blue],
    ["验收点", "题库年份、地区、题型、解析质量和更新频率都要实测。", C.red],
  ];
  cards.forEach((c, i) => addCard(slide, n, c[0], c[1], 76, 250 + i * 118, 590, 84, { accent: c[2], bodySize: 16 }));
  addFooter(slide, n);
  addSlideNotes(slide, "真题练习页：把真题作为单词学习闭环的重要证据。");
}

async function slide16(p) {
  const n = 16;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "生成式语境", C.orange);
  addTitle(slide, n, "单词故事：生成式AI进入\n低龄学习的轻入口", "讯飞星火与 DeepSeek 的联名表达，核心是把单词放进故事语境，减少纯背词的枯燥。", { w: 760, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.story, 750, 105, 360, 500, "详情页：讯飞星火 × DeepSeek 单词故事", { fit: "contain" });
  addCard(slide, n, "产品意义", "生成式内容让词汇学习更像“理解和应用”，不是只在拼写层面反复。", 76, 260, 610, 86, { accent: C.orange, bodySize: 17 });
  addCard(slide, n, "体验风险", "故事质量、难度控制、事实安全、英文自然度和内容审核是关键。", 76, 378, 610, 86, { accent: C.red, bodySize: 17 });
  addCard(slide, n, "可复用思路", "课堂端也可以把生成式语境用于口语任务、写作素材和错题讲解，但需要教师可控。", 76, 496, 610, 86, { accent: C.blue, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "生成式语境页：说明 AI 故事不只是视觉噱头，而是单词学习策略。");
}

async function slide17(p) {
  const n = 17;
  const slide = p.slides.add();
  slide.background.fill = C.paper2;
  addHeader(slide, n, "动机机制", C.blue);
  addTitle(slide, n, "训练营和PK把学习频次\n从“想起来”变成“每天做”", "详情页用免费训练营、分学段词汇和PK竞技，试图把枯燥练习转成日常任务。", { w: 760, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.camp, 64, 174, 310, 462, "详情页：18个免费单词训练营", { fit: "contain" });
  await addEvidenceImage(slide, n, IMG.pk, 414, 174, 310, 462, "详情页：PK竞技模式", { fit: "contain" });
  addCard(slide, n, "正向价值", "分学段训练营提供路径感，PK提供短期动力，适合家庭端碎片化使用。", 780, 238, 350, 106, { accent: C.blue, bodySize: 16 });
  addCard(slide, n, "边界提醒", "需要验证是否会偏向“刷分”和排名刺激，而不是稳定提升听说读写能力。", 780, 382, 350, 106, { accent: C.red, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "动机机制页：训练营和PK既是卖点，也是需要关注的体验边界。");
}

async function slide18(p) {
  const n = 18;
  const slide = p.slides.add();
  slide.background.fill = C.paper3;
  addHeader(slide, n, "作文与作业", C.green);
  addTitle(slide, n, "作文批改：从“孩子自学”\n扩展到“家长省心”", "详情页强调结构点评、精细批改、AI润色和整体点评，触达家长辅导作业的痛点。", { w: 760, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.homework, 774, 100, 330, 510, "详情页：作文批改与查词听写", { fit: "contain" });
  const list = [
    { title: "结构点评", body: "帮助学生理解作文组织，而不是只纠正单词。", accent: C.green },
    { title: "精细批改", body: "标出语法、拼写、表达问题，形成可修改反馈。", accent: C.blue },
    { title: "AI润色", body: "提供更自然表达，但要防止替代学生思考。", accent: C.orange },
    { title: "家长视角", body: "家长英语水平不足时，也能完成辅导与检查。", accent: C.red },
  ];
  addMiniList(slide, n, list, 76, 270, 610, 292);
  addFooter(slide, n);
  addSlideNotes(slide, "作文与作业页：突出它对家长场景的扩展。");
}

async function slide19(p) {
  const n = 19;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "家长管控", C.orange);
  addTitle(slide, n, "家长端是2C硬件\n成立的关键", "安全、时间、内容、通话和学情可视，是家长愿意让孩子带设备的前提。", { w: 720, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.parent, 836, 154, 300, 468, "详情页：家长管控与电话手表平替", { fit: "contain" });
  const points = [
    ["不能下载游戏", "强化“学习设备”而不是手机替代品。"],
    ["学情可视", "家长能看到练习情况和学习趋势。"],
    ["远程管控", "上课模式、微聊、通话等权限可控。"],
    ["安全联系", "覆盖通话、定位、支付等安全场景。"],
  ];
  points.forEach((pnt, i) => addCard(slide, n, pnt[0], pnt[1], 86 + (i % 2) * 340, 282 + Math.floor(i / 2) * 138, 296, 98, { accent: [C.orange, C.green, C.blue, C.red][i], bodySize: 15 }));
  addFooter(slide, n);
  addSlideNotes(slide, "家长管控页：解释为什么 parent app 和安全属性是产品核心。");
}

async function slide20(p) {
  const n = 20;
  const slide = p.slides.add();
  slide.background.fill = C.paper2;
  addHeader(slide, n, "便携与连接", C.teal);
  addTitle(slide, n, "离线和插卡让它从桌面学习机\n变成可随身终端", "没网也能用、支持 SIM 卡、在校/在途/在外学习，扩大了设备出现的场景。", { w: 820, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.mobility, 762, 116, 350, 490, "详情页：离线、SIM与多场景学习", { fit: "cover" });
  const places = [
    ["在校学", "不用手机也可完成听读与复习"],
    ["在途学", "公交/接送/等待时做碎片练习"],
    ["在外学", "插卡和定位让家长更放心"],
  ];
  places.forEach((pnt, i) => {
    addShape(slide, n, "roundRect", 78 + i * 206, 286, 174, 118, [C.tealSoft, C.blueSoft, C.orangeSoft][i], "#00000000", 0, "scenario card");
    addText(slide, n, pnt[0], 98 + i * 206, 312, 134, 26, { size: 22, color: [C.teal, C.blue, C.orange][i], bold: true, align: "center", role: "scenario title" });
    addText(slide, n, pnt[1], 96 + i * 206, 354, 138, 42, { size: 13, color: C.text, align: "center", role: "scenario body" });
  });
  addCard(slide, n, "体验要点", "重点看离线资源范围、插卡流程、定位精度、支付限额、设备发热和续航表现。", 86, 496, 570, 84, { accent: C.teal, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "便携与连接页：把硬件形态和使用场景联系起来。");
}

async function slide21(p) {
  const n = 21;
  const slide = p.slides.add();
  slide.background.fill = C.paper3;
  addHeader(slide, n, "硬件参数", C.green);
  addTitle(slide, n, "参数显示它是轻量随身设备，\n而不是大屏课堂终端", "84×70.5×15mm / 105g / 3英寸屏 / 1800mAh，接口为 USB-C 与 3.5mm。", { w: 630, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.specs, 710, 120, 430, 360, "详情页：产品型号与参数", { fit: "contain" });
  const specs = [
    ["型号", "QM-T200 Pro", C.orange],
    ["屏幕", "3英寸高清触控屏", C.blue],
    ["电池", "1800mAh", C.green],
    ["重量", "105g", C.gold],
    ["尺寸", "84×70.5×15mm", C.teal],
    ["接口", "USB-C / 3.5mm", C.red],
  ];
  specs.forEach((s, i) => {
    const x = 72 + (i % 3) * 196;
    const y = 284 + Math.floor(i / 3) * 118;
    const size = i < 2 ? 18 : i < 4 ? 24 : 16;
    addSpecCard(slide, n, s[1], s[0], x, y, 164, 92, s[2], size);
  });
  addCard(slide, n, "解读", "轻、小、可通话是家庭端优势；但屏幕尺寸与课堂教学展示、统一操作、长时间作答并不天然匹配。", 72, 540, 610, 76, { accent: C.green, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "硬件参数页：明确与课堂产品的硬件形态差异。");
}

async function slide22(p) {
  const n = 22;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "真机体验基准", C.red);
  addTitle(slide, n, "已到手设备要重点验证：\n算法、内容、家长端、硬件四条线", "公开页面能说明产品卖点，但体验报告最终要回到真实任务、真实录音和真实家长端流程。", { w: 860, h: 98, subtitleY: 112 });
  const areas = [
    ["语音评测", "同题多次录音、噪声环境、口音差异、评分波动、反馈可执行性。", C.red],
    ["内容资源", "教材版本、真题年份、口语话题覆盖、精讲质量、更新频率。", C.green],
    ["家长端", "绑定流程、学情视图、通话定位、支付权限、隐私授权。", C.blue],
    ["硬件体验", "续航、发热、录音质量、外放音量、耳机口、离线与插卡。", C.orange],
  ];
  areas.forEach((a, i) => addCard(slide, n, a[0], a[1], 70 + (i % 2) * 575, 230 + Math.floor(i / 2) * 150, 510, 112, { accent: a[2], fill: C.white, bodySize: 16 }));
  addCard(slide, n, "体验报告交付物", "用统一题目、统一学生样本和统一噪声条件做录音评测；保留设备录屏、家长端截图、评分日志和异常样例。", 210, 556, 860, 76, { accent: C.red, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "真机体验基准页：这是后续同事拿设备继续测试的操作清单。");
}

async function slide23(p) {
  const n = 23;
  const slide = p.slides.add();
  slide.background.fill = C.paper2;
  addHeader(slide, n, "对驰声的冲击", C.orange);
  addTitle(slide, n, "短期冲击偏间接，\n真正风险在学校端升级路径", "EBOX Pro 目前更偏 2C 家庭端；但讯飞若把教师端、成套题和学校渠道补齐，会压低课堂硬件入口预期。", { w: 930, h: 98, subtitleY: 112 });
  await addEvidenceImage(slide, n, IMG.cover, 78, 190, 220, 370, "EBOX Pro：家庭端小屏终端", { fit: "contain" });
  const tiers = [
    ["当前形态", "家庭自学/家长管控\n低价随身硬件", C.green, C.greenSoft],
    ["潜在升级", "教师端/班级作业\n学校渠道套装", C.gold, C.goldSoft],
    ["直接冲击", "课堂硬件入口\n价格预期与资源绑定", C.red, C.redSoft],
  ];
  tiers.forEach((t, i) => {
    const x = 370 + i * 258;
    addShape(slide, n, "roundRect", x, 250, 214, 148, t[3], "#00000000", 0, "impact tier");
    addText(slide, n, t[0], x + 18, 278, 178, 26, { size: 20, color: t[2], bold: true, align: "center", role: "impact title" });
    addText(slide, n, t[1], x + 20, 324, 174, 46, { size: 15, color: C.text, align: "center", role: "impact body" });
  });
  addCard(slide, n, "判断", "它现在不是直接替代智课宝的课堂产品；更像把语音评测和英语练习前置到家庭高频场景，改变用户对硬件价格和功能完整度的预期。", 370, 468, 730, 94, { accent: C.orange, bodySize: 16 });
  addFooter(slide, n);
  addSlideNotes(slide, "对驰声冲击页：区分当前影响和升级风险。");
}

async function slide24(p) {
  const n = 24;
  const slide = p.slides.add();
  slide.background.fill = C.paper;
  addHeader(slide, n, "产品差异", C.blue);
  addTitle(slide, n, "驰声的差异点仍在课堂闭环，\n而不是单机学习", "用户提供的 AI智慧课堂资料显示，驰声聚焦课堂听说练测评、教师讲评、班级报告和成套硬件部署。", { w: 960, h: 98, subtitleY: 112 });
  addTwoColTable(slide, n, 88, 210, 1060, 370, [
    ["2C 家庭端；孩子个人练习，家长查看和管控。", "学校课堂端；教师组织全班听说读写练测评。"],
    ["内容入口多，强调单词、听力、口语、作文和真题。", "强调成套听说试题、统一答题、课堂讲评和练习报告。"],
    ["3英寸小屏、105g，适合随身和碎片学习。", "面向课堂部署，屏幕和硬件形态服务统一教学。"],
    ["家长端安全与沟通是重要卖点。", "教师端数据、班级对比和学情分析是核心价值。"],
  ]);
  addCard(slide, n, "要守住的边界", "驰声要把“课堂组织效率、统一发题收题、全班数据分析、听说考试练习闭环”讲清楚，避免被拉入单机学习机的价格比较。", 150, 610, 980, 56, { accent: C.blue, bodySize: 15 });
  addFooter(slide, n, "来源：用户提供《AI智慧课堂产品.pptx》与本次 EBOX Pro 详情页信息整理。");
  addSlideNotes(slide, "产品差异页：把 EBOX Pro 与驰声课堂产品放在场景、流程和硬件形态上对比。");
}

async function slide25(p) {
  const n = 25;
  const slide = p.slides.add();
  slide.background.fill = C.dark;
  addHeader(slide, n, "下一步", C.orange);
  addTitle(slide, n, "把 EBOX Pro 当作“家庭端升级信号”持续跟踪", "不是因为它今天替代课堂产品，而是因为它验证了低价硬件 + 语音评测 + 内容资源的家庭入口打法。", { w: 920, color: C.white, subtitleColor: "#CBD5E1" });
  const actions = [
    ["真机体验", "完成口语评分、作文批改、内容资源、家长端和续航测试，形成可复现样例。", C.orange],
    ["渠道监控", "跟踪天猫/JD/官网价格、套装变化、学校渠道宣传和教师端入口。", C.teal],
    ["产品防线", "强化课堂听说试题、统一练测评、教师讲评、班级报告和数据闭环。", C.blue],
    ["机会探索", "评估课后家庭延伸方案，让课堂数据与家庭练习形成连续体验。", C.green],
  ];
  actions.forEach((a, i) => {
    const x = 78 + (i % 2) * 565;
    const y = 250 + Math.floor(i / 2) * 150;
    addCard(slide, n, a[0], a[1], x, y, 510, 106, { accent: a[2], fill: "#182235", line: "#2D3748", bodyColor: "#D0D5DD", bodySize: 16 });
  });
  addText(slide, n, "核心判断：当前不恐慌，但要把升级信号看得很细。", 232, 596, 820, 34, {
    size: 24,
    color: C.white,
    bold: true,
    align: "center",
    role: "closing sentence",
  });
  addFooter(slide, n, "来源：用户提供天猫详情页截图、讯飞商城与公开页面；驰声信息来自用户提供资料。");
  addSlideNotes(slide, "收束页：给出后续动作，避免把报告停留在产品介绍。");
}

async function createDeck(Presentation) {
  const p = Presentation.create({ slideSize: { width: W, height: H } });
  p.theme.colorScheme = {
    name: "EBOX Pro Experience Report",
    themeColors: {
      accent1: C.orange,
      accent2: C.teal,
      accent3: C.blue,
      accent4: C.green,
      bg1: C.paper,
      tx1: C.ink,
      tx2: C.text,
    },
  };
  const builders = [
    slide01,
    slide02,
    slide03,
    slide04,
    slide05,
    slide06,
    slide07,
    slide08,
    slide09,
    slide10,
    slide11,
    slide12,
    slide13,
    slide14,
    slide15,
    slide16,
    slide17,
    slide18,
    slide19,
    slide20,
    slide21,
    slide22,
    slide23,
    slide24,
    slide25,
  ];
  for (const builder of builders) await builder(p);
  return p;
}

async function renderAndExport(presentation, PresentationFile) {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(LAYOUT_DIR, { recursive: true });
  await fs.mkdir(QA_DIR, { recursive: true });
  await fs.mkdir(FINAL_DIR, { recursive: true });

  for (let i = 0; i < presentation.slides.items.length; i += 1) {
    const slide = presentation.slides.items[i];
    const preview = await presentation.export({ slide, format: "png", scale: 1 });
    await saveBlobToFile(preview, path.join(PREVIEW_DIR, `slide-${String(i + 1).padStart(2, "0")}.png`));
    const layout = await presentation.export({ slide, format: "layout" });
    await fs.writeFile(path.join(LAYOUT_DIR, `slide-${String(i + 1).padStart(2, "0")}.layout.json`), await layout.text(), "utf8");
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
  await fs.writeFile(
    path.join(QA_DIR, "shape-records.ndjson"),
    records.map((record) => JSON.stringify(record)).join("\n") + "\n",
    "utf8",
  );

  const contactSheet = path.join(QA_DIR, "contact-sheet.png");
  const python = "python3";
  const script = "/Users/zhong/.codex/plugins/cache/openai-primary-runtime/presentations/26.505.10851/skills/presentations/scripts/make_contact_sheet.py";
  const inputs = Array.from({ length: presentation.slides.items.length }, (_, i) => path.join(PREVIEW_DIR, `slide-${String(i + 1).padStart(2, "0")}.png`));
  const result = spawnSync(python, [script, "--output", contactSheet, ...inputs], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`contact sheet failed\n${result.stdout}\n${result.stderr}`);
  }

  const manifest = {
    output: FINAL_PPTX,
    slideCount: presentation.slides.items.length,
    previewDir: PREVIEW_DIR,
    contactSheet,
    records: path.join(QA_DIR, "shape-records.ndjson"),
  };
  await fs.writeFile(path.join(QA_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

await ensureArtifactToolWorkspace(WORKSPACE);
const { Presentation, PresentationFile } = await importArtifactTool(WORKSPACE);
const presentation = await createDeck(Presentation);
const manifest = await renderAndExport(presentation, PresentationFile);
console.log(JSON.stringify(manifest, null, 2));