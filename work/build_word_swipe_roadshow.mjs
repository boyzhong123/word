import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = "/Users/zhong/Documents/Codex/2026-06-04/files-mentioned-by-the-user-chivox";
const SKILL_DIR = "/Users/zhong/.codex/plugins/cache/openai-primary-runtime/presentations/26.601.10930/skills/presentations";
const BUILD_SCRIPT = path.join(SKILL_DIR, "scripts/build_artifact_deck.mjs");
const PYTHON = "/Users/zhong/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const NODE = "/Users/zhong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node";
const NODE_MODULES = "/Users/zhong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const WORKSPACE = (await fs.readFile(path.join(ROOT, "workspace-path.txt"), "utf8")).trim();
const SLIDES_DIR = path.join(WORKSPACE, "slides");
const PREVIEW_DIR = path.join(WORKSPACE, "preview");
const LAYOUT_DIR = path.join(WORKSPACE, "layout");
const OUTPUT_DIR = path.join(ROOT, "outputs");
const FINAL_PPTX = path.join(OUTPUT_DIR, "单词刷刷刷-暑期试销立项路演.pptx");
const CONTACT_SHEET = path.join(WORKSPACE, "word-swipe-contact-sheet.png");

const imgHomePrimary = "/Users/zhong/Downloads/ChatGPT Image 2026年6月4日 20_07_13 (2) (1).png";
const imgHomeKids = "/Users/zhong/Downloads/ChatGPT Image 2026年6月4日 20_07_15 (3).png";
const imgHomeHigh = "/Users/zhong/Downloads/ChatGPT Image 2026年6月4日 20_07_13 (1).png";
const imgWordDetail = "/Users/zhong/Downloads/ChatGPT Image 2026年6月4日 20_09_09.png";
const imgLiveScene = path.join(WORKSPACE, "assets/live-stream-scene.png");

const modulePreamble = `
const C = {
  navy: "#080A2A",
  navy2: "#12163A",
  blue: "#168AF7",
  cyan: "#16D5FF",
  pink: "#F1066B",
  magenta: "#CA0A76",
  green: "#18B957",
  orange: "#FF9F1C",
  white: "#FFFFFF",
  light: "#F4F8FF",
  soft: "#EAF3FF",
  text: "#101541",
  muted: "#6E7895",
  line: "#D7E6FA"
};
const W = 1280;
const H = 720;
const logo = (slide, ctx, light=false) => {
  ctx.addShape(slide,{x:58,y:48,w:34,h:34,geometry:"ellipse",fill:C.blue,line:ctx.line("#00000000",0)});
  ctx.addShape(slide,{x:74,y:48,w:34,h:34,geometry:"ellipse",fill:C.pink,line:ctx.line("#00000000",0)});
  ctx.addShape(slide,{x:67,y:55,w:22,h:22,geometry:"ellipse",fill:light?C.navy:C.white,line:ctx.line("#00000000",0)});
};
const page = (slide, ctx, n, light=false) => ctx.addText(slide,{x:1110,y:616,w:90,h:20,text:String(n).padStart(2,"0")+" / 16",fontSize:12,color:light?"#C8D7FF":"#7D89A7",align:"right",typeface:"微软雅黑"});
const header = (slide, ctx, eyebrow, title, subtitle, n, dark=false) => {
  if (dark) {
    ctx.addShape(slide,{x:0,y:0,w:W,h:H,fill:C.navy,line:ctx.line("#00000000",0)});
    ctx.addShape(slide,{x:850,y:-70,w:360,h:360,geometry:"ellipse",fill:"#00000000",line:ctx.line("#192492",74)});
    ctx.addShape(slide,{x:1010,y:-60,w:270,h:270,geometry:"ellipse",fill:"#00000000",line:ctx.line("#76105A",68)});
    logo(slide,ctx,true);
  ctx.addText(slide,{x:120,y:51,w:230,h:24,text:"CHIVOX · 驰声听说",fontSize:13,bold:true,color:"#D7EAFF",typeface:"微软雅黑"});
  ctx.addText(slide,{x:120,y:51,w:230,h:24,text:"CHIVOX · 驰声听说",fontSize:13,bold:true,color:"#D7EAFF",typeface:"微软雅黑"});
    ctx.addText(slide,{x:120,y:51,w:360,h:24,text:eyebrow,fontSize:13,bold:true,color:"#D7EAFF",typeface:"微软雅黑"});
    page(slide,ctx,n,true);
    ctx.addText(slide,{x:70,y:118,w:760,h:82,text:title,fontSize:31,bold:true,color:C.white,typeface:"微软雅黑"});
    ctx.addText(slide,{x:72,y:200,w:760,h:42,text:subtitle,fontSize:16,color:"#C9D6F7",typeface:"微软雅黑"});
    accent(slide,ctx,72,250);
  } else {
    ctx.addShape(slide,{x:0,y:0,w:W,h:H,fill:C.white,line:ctx.line("#00000000",0)});
    ctx.addShape(slide,{x:0,y:0,w:W,h:92,fill:C.light,line:ctx.line("#00000000",0)});
    ctx.addShape(slide,{x:910,y:-80,w:305,h:305,geometry:"ellipse",fill:"#00000000",line:ctx.line("#E6F3FF",58)});
    ctx.addShape(slide,{x:1015,y:-65,w:260,h:260,geometry:"ellipse",fill:"#00000000",line:ctx.line("#F8D8EA",58)});
    logo(slide,ctx,false);
    ctx.addText(slide,{x:120,y:51,w:360,h:24,text:eyebrow,fontSize:13,bold:true,color:C.blue,typeface:"微软雅黑"});
    page(slide,ctx,n,false);
    ctx.addText(slide,{x:68,y:122,w:850,h:76,text:title,fontSize:29,bold:true,color:C.text,typeface:"微软雅黑"});
    ctx.addText(slide,{x:70,y:202,w:820,h:38,text:subtitle,fontSize:15,color:C.muted,typeface:"微软雅黑"});
    accent(slide,ctx,70,246);
  }
};
const accent = (slide, ctx, x, y) => {
  ctx.addShape(slide,{x,y,w:90,h:5,fill:C.pink,line:ctx.line("#00000000",0)});
  ctx.addShape(slide,{x:x+100,y,w:116,h:5,fill:C.blue,line:ctx.line("#00000000",0)});
};
const card = (slide,ctx,x,y,w,h,opts={}) => {
  ctx.addShape(slide,{x,y,w,h,geometry:"roundRect",fill:opts.fill||"#FFFFFF",line:ctx.line(opts.line||"#DDE8FA",opts.lw||1)});
};
const stat = (slide,ctx,x,y,w,value,label,color=C.blue) => {
  card(slide,ctx,x,y,w,96,{fill:"#FFFFFF",line:"#DDE8FA"});
  ctx.addText(slide,{x:x+18,y:y+18,w:w-36,h:36,text:value,fontSize:30,bold:true,color,typeface:"微软雅黑",align:"center"});
  ctx.addText(slide,{x:x+18,y:y+58,w:w-36,h:22,text:label,fontSize:13,color:C.muted,typeface:"微软雅黑",align:"center"});
};
const tag = (slide,ctx,x,y,text,color=C.blue) => {
  ctx.addShape(slide,{x,y,w:118,h:28,geometry:"roundRect",fill:color,line:ctx.line("#00000000",0)});
  ctx.addText(slide,{x:x+10,y:y+5,w:98,h:16,text,fontSize:10,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
};
const wordCardMock = (slide,ctx,x,y,w,h,mode="front") => {
  ctx.addShape(slide,{x:x+5,y:y+7,w,h,geometry:"roundRect",fill:"#00000022",line:ctx.line("#00000000",0)});
  ctx.addShape(slide,{x,y,w,h,geometry:"roundRect",fill:"#FFFFFF",line:ctx.line("#E4E7EB",1)});
  ctx.addShape(slide,{x:x+18,y:y+16,w:16,h:16,geometry:"ellipse",fill:"#A7C984",line:ctx.line("#88AE63",1)});
  if (mode === "front") {
    ctx.addText(slide,{x:x+56,y:y+24,w:w-112,h:34,text:"Miss",fontSize:32,bold:true,color:"#18A5E8",typeface:"Arial",align:"center"});
    ctx.addText(slide,{x:x+84,y:y+68,w:w-168,h:18,text:"/mis/",fontSize:17,color:"#199DDC",typeface:"Arial",italic:true,align:"center"});
    ctx.addText(slide,{x:x+34,y:y+91,w:w-70,h:16,text:"【E】 Good morning, Miss Li.",fontSize:12,color:"#1596D2",typeface:"Arial"});
    ctx.addText(slide,{x:x-56,y:y+38,w:48,h:16,text:"单词",fontSize:13,bold:true,color:C.text,typeface:"微软雅黑",align:"right"});
    ctx.addShape(slide,{x:x-4,y:y+45,w:48,h:1,fill:"#111111",line:ctx.line("#111111",1)});
    ctx.addText(slide,{x:x+w+12,y:y+80,w:46,h:16,text:"音标",fontSize:13,bold:true,color:C.text,typeface:"微软雅黑"});
    ctx.addShape(slide,{x:x+w-54,y:y+88,w:64,h:1,fill:"#111111",line:ctx.line("#111111",1)});
  } else {
    ctx.addShape(slide,{x:x+20,y:y+26,w:124,h:34,geometry:"roundRect",fill:"#D95045",line:ctx.line("#00000000",0)});
    ctx.addText(slide,{x:x+26,y:y+32,w:112,h:18,text:"小姐，女士",fontSize:18,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
    ctx.addShape(slide,{x:x+22,y:y+76,w:36,h:20,geometry:"roundRect",fill:"#D95045",line:ctx.line("#00000000",0)});
    ctx.addText(slide,{x:x+26,y:y+80,w:28,h:12,text:"词性",fontSize:9,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
    ctx.addText(slide,{x:x+66,y:y+78,w:35,h:16,text:"n.",fontSize:15,color:C.text,typeface:"Arial"});
    ctx.addShape(slide,{x:x+22,y:y+104,w:36,h:20,geometry:"roundRect",fill:"#D95045",line:ctx.line("#00000000",0)});
    ctx.addText(slide,{x:x+26,y:y+108,w:28,h:12,text:"例句",fontSize:9,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
    ctx.addText(slide,{x:x+66,y:y+105,w:120,h:18,text:"早上好，李老师。",fontSize:14,color:C.text,typeface:"微软雅黑"});
    ctx.addShape(slide,{x:x+w-76,y:y+55,w:50,h:68,geometry:"rect",fill:"#EAF3FF",line:ctx.line("#CFDDED",1)});
    ctx.addText(slide,{x:x+w-70,y:y+78,w:38,h:18,text:"人物\\n彩图",fontSize:9,color:C.muted,typeface:"微软雅黑",align:"center"});
  }
};
const bullet = (slide,ctx,x,y,text,color=C.blue,size=15) => {
  ctx.addShape(slide,{x,y:y+7,w:8,h:8,geometry:"ellipse",fill:color,line:ctx.line("#00000000",0)});
  ctx.addText(slide,{x:x+18,y,w:360,h:28,text,fontSize:size,color:C.white,typeface:"微软雅黑"});
};
const bulletLight = (slide,ctx,x,y,text,color=C.blue,size=14,w=350) => {
  ctx.addShape(slide,{x,y:y+7,w:7,h:7,geometry:"ellipse",fill:color,line:ctx.line("#00000000",0)});
  ctx.addText(slide,{x:x+17,y,w,h:30,text,fontSize:size,color:C.text,typeface:"微软雅黑"});
};
`;

const slides = [
  {
    n: 1,
    code: `
export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  ctx.addShape(slide,{x:0,y:0,w:W,h:H,fill:C.navy,line:ctx.line("#00000000",0)});
  ctx.addShape(slide,{x:826,y:-40,w:360,h:360,geometry:"ellipse",fill:"#00000000",line:ctx.line("#1B35B7",76)});
  ctx.addShape(slide,{x:980,y:-34,w:300,h:300,geometry:"ellipse",fill:"#00000000",line:ctx.line("#C70A74",72)});
  logo(slide,ctx,true);
  ctx.addText(slide,{x:72,y:148,w:260,h:24,text:"PRODUCT ROADSHOW",fontSize:14,bold:true,color:"#CDE6FF",typeface:"微软雅黑"});
  ctx.addText(slide,{x:70,y:212,w:560,h:132,text:"单词刷刷刷\\n暑期试销立项路演",fontSize:44,bold:true,color:C.white,typeface:"微软雅黑"});
  ctx.addText(slide,{x:74,y:378,w:620,h:34,text:"一本书 × 小程序 × 单词卡，把暑假碎片时间变成可交付的词汇增长。",fontSize:20,color:"#D8E8FF",typeface:"微软雅黑"});
  accent(slide,ctx,74,438);
  ctx.addText(slide,{x:78,y:510,w:230,h:22,text:"目标：批准产品立项",fontSize:15,color:"#D7EAFF",typeface:"微软雅黑"});
  ctx.addText(slide,{x:338,y:510,w:260,h:22,text:"动作：启动暑期 3,000 本试销",fontSize:15,color:"#D7EAFF",typeface:"微软雅黑"});
  ctx.addText(slide,{x:78,y:604,w:300,h:22,text:"内部路演 · 2026 暑期",fontSize:12,color:"#AFC5F2",typeface:"微软雅黑"});
  ctx.addImage(slide,{path:${JSON.stringify(imgHomeKids)},x:755,y:125,w:260,h:462,fit:"cover",alt:"单词刷刷刷小程序学习路径"});
  ctx.addShape(slide,{x:730,y:108,w:312,h:500,geometry:"roundRect",fill:"#17327666",line:ctx.line("#58B5FF",1)});
  page(slide,ctx,1,true);
  return slide;
}
`
  },
  {
    n: 2,
    code: `
export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"VISION · 立项判断","把暑假背单词，从“家长催”变成“产品驱动”","内部立项不是做一个词汇工具，而是做一个可销售、可运营、可复用的暑期学习商品。",2,true);
  ctx.addText(slide,{x:74,y:276,w:660,h:92,text:"以一本词汇书为入口，把学习计划、三关闯关、听说测评和单词卡打包成暑期刚需",fontSize:30,bold:true,color:C.white,typeface:"微软雅黑"});
  const items = [
    ["01","暑期窗口明确","家长希望孩子保持学习节奏，词汇积累是最易理解的暑期目标。"],
    ["02","价格决策轻","39/59 元客单价低，适合直播、小红书、抖音与自有 App 转化。"],
    ["03","产品可交付","按书生成关卡与每日计划，让“买一本书”对应一条清晰完成路径。"],
    ["04","渠道可复用","同一套小程序能力，可挂接听说在线 App、内容种草与直播转化。"]
  ];
  items.forEach((it,i)=>{
    const y=254+i*82;
    card(slide,ctx,785,y,405,62,{fill:"#181D46",line:"#33406E"});
    ctx.addText(slide,{x:804,y:y+18,w:42,h:20,text:it[0],fontSize:18,bold:true,color:i===2?C.pink:C.cyan,typeface:"微软雅黑"});
    ctx.addText(slide,{x:862,y:y+10,w:160,h:20,text:it[1],fontSize:17,bold:true,color:C.white,typeface:"微软雅黑"});
    ctx.addText(slide,{x:862,y:y+34,w:306,h:18,text:it[2],fontSize:11,color:"#C7D3F3",typeface:"微软雅黑"});
  });
  return slide;
}
`
  },
  {
    n: 3,
    code: `
export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"MARKET · 暑期窗口","暑假 60 天：把背单词包装成可完成挑战","家长买的是确定感：每天学多少、多久完成、孩子有没有开口、暑假后留下什么成果。",3,false);
  const xs=[88,344,600,856];
  const titles=["每天可执行","进度可见","开口可测","成果可晒"];
  const notes=["5 个 / 10 个 / 自定义计划","关卡、星级、进度条持续反馈","单词 + 教材例句跟读背诵","打卡日历、单词卡、完成证书"];
  xs.forEach((x,i)=>{
    card(slide,ctx,x,278,198,148,{fill:"#FFFFFF",line:"#DDE8FA"});
    ctx.addText(slide,{x:x+18,y:302,w:50,h:30,text:String(i+1).padStart(2,"0"),fontSize:22,bold:true,color:i===3?C.pink:C.blue,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+18,y:350,w:150,h:28,text:titles[i],fontSize:22,bold:true,color:C.text,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+18,y:388,w:154,h:42,text:notes[i],fontSize:13,color:C.muted,typeface:"微软雅黑"});
  });
  ctx.addShape(slide,{x:170,y:494,w:860,h:64,geometry:"roundRect",fill:C.soft,line:ctx.line("#CFE2F9",1)});
  ctx.addText(slide,{x:210,y:512,w:780,h:28,text:"暑期主张：不是“多背一点”，而是让孩子完成一本书里的核心词汇路径",fontSize:22,bold:true,color:C.text,typeface:"微软雅黑",align:"center"});
  ctx.addText(slide,{x:432,y:584,w:360,h:18,text:"SUMMER COMPLETION LOOP",fontSize:10,bold:true,color:"#7181A0",typeface:"Calibri",align:"center"});
  return slide;
}
`
  },
  {
    n: 4,
    code: `
export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"PRODUCT · 核心产品","单词刷刷刷：一本书生成一条闯关学习路径","覆盖小学、初中、高中教材词汇，把词汇学习拆成孩子能坚持、家长能看懂的关卡。",4,false);
  ctx.addImage(slide,{path:${JSON.stringify(imgHomeKids)},x:840,y:132,w:214,h:380,fit:"cover",alt:"小学英语图解词汇学习路径"});
  ctx.addImage(slide,{path:${JSON.stringify(imgHomeHigh)},x:1010,y:160,w:184,h:326,fit:"cover",alt:"高中高频词汇学习路径"});
  card(slide,ctx,70,270,248,140,{fill:"#FFFFFF",line:"#DDE8FA"});
  card(slide,ctx,350,270,248,140,{fill:"#FFFFFF",line:"#DDE8FA"});
  card(slide,ctx,630,270,248,140,{fill:"#FFFFFF",line:"#DDE8FA"});
  [["小学","图解词汇 + 兴趣启蒙","用视觉和打卡降低入门压力"],["初中","教材词典 + 例句应用","跟随教材场景，承接听说训练"],["高中","高频词汇 + 高效记忆","面向备考与长周期词汇积累"]].forEach((d,i)=>{
    const x=[70,350,630][i];
    tag(slide,ctx,x+22,296,d[0],i===0?C.green:i===1?C.blue:C.pink);
    ctx.addText(slide,{x:x+22,y:342,w:200,h:24,text:d[1],fontSize:19,bold:true,color:C.text,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+22,y:378,w:200,h:28,text:d[2],fontSize:13,color:C.muted,typeface:"微软雅黑"});
  });
  ctx.addShape(slide,{x:82,y:496,w:748,h:58,geometry:"roundRect",fill:C.soft,line:ctx.line("#D7E6FA",1)});
  ctx.addText(slide,{x:118,y:514,w:676,h:26,text:"一本书 = 词库 + 例句 + 学习计划 + 闯关路径 + 学情反馈",fontSize:20,bold:true,color:C.text,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 5,
    code: `
export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"VALUE · 产品优势","单词刷刷刷的核心优势：让词汇学习有路径、有声音、有反馈","不是简单把词库搬到线上，而是把一本书拆成孩子能完成、家长能看见、渠道能销售的学习商品。",5,true);
  const points=[
    ["01","按书学习","每本书独立词库、例句和关卡，购买逻辑清楚，方便按年级售卖。",C.blue],
    ["02","计划驱动","可设置每天 5 个/10 个单词，自动生成每日任务，降低家长监督成本。",C.green],
    ["03","三关闭环","单词新学、跟读背诵、听力小测分别解决认知、开口和听辨。",C.orange],
    ["04","随身可听","随身听把碎片时间变成复习时间，车上、睡前、路上都能强化记忆。",C.cyan],
    ["05","线上线下结合","小程序负责学习和反馈，纸质单词卡负责复习、展示和礼品感。",C.pink],
    ["06","渠道友好","39/59 元低决策门槛，App 弹窗、家长通、软文、直播都能直接带购买。",C.magenta]
  ];
  points.forEach((p,i)=>{
    const x=78+(i%3)*382, y=268+Math.floor(i/3)*142;
    card(slide,ctx,x,y,326,104,{fill:"#151A43",line:i===4?"#CC1B7E":"#38436F"});
    ctx.addText(slide,{x:x+20,y:y+18,w:42,h:20,text:p[0],fontSize:16,bold:true,color:p[3],typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+72,y:y+18,w:174,h:22,text:p[1],fontSize:18,bold:true,color:C.white,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+20,y:y+52,w:280,h:34,text:p[2],fontSize:12,color:"#C9D6F7",typeface:"微软雅黑"});
  });
  ctx.addShape(slide,{x:118,y:586,w:864,h:46,geometry:"roundRect",fill:"#1E2658",line:ctx.line("#35406F",1)});
  ctx.addText(slide,{x:156,y:599,w:790,h:18,text:"产品亮点一句话：用小程序把学习做“细”，用单词卡把成果做“实”，用渠道把试销做“快”。",fontSize:15,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 6,
    code: `
export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"MODULE 01 · 单词新学","先建立音、形、义连接：孩子不是死记，而是看懂再开口","这一关负责把陌生单词变成可理解的学习对象，为后面的跟读和听测打底。",6,false);
  ctx.addImage(slide,{path:${JSON.stringify(imgWordDetail)},x:842,y:130,w:218,h:388,fit:"cover",alt:"单词新学详情页"});
  ctx.addShape(slide,{x:818,y:112,w:270,h:430,geometry:"roundRect",fill:"#EAF3FF66",line:ctx.line("#D7E6FA",1)});
  const blocks=[
    ["看见单词","展示单词、音标、中文释义和配图，降低孩子第一次接触的理解成本。",C.blue],
    ["听到标准音","美音/英音播放，让孩子先获得正确声音输入，避免凭拼写猜读。",C.green],
    ["理解教材句","给出教材中的原句，并可扩展更多例句，把单词放回真实语境。",C.orange],
    ["沉淀卡片信息","单词、音标、例句、变形/短语后续可同步到纸质卡片和复习路径。",C.pink]
  ];
  blocks.forEach((b,i)=>{
    const x=76+(i%2)*360, y=278+Math.floor(i/2)*134;
    card(slide,ctx,x,y,306,94,{fill:"#FFFFFF",line:"#DDE8FA"});
    ctx.addShape(slide,{x:x+20,y:y+22,w:30,h:30,geometry:"ellipse",fill:b[2],line:ctx.line("#00000000",0)});
    ctx.addText(slide,{x:x+64,y:y+18,w:130,h:22,text:b[0],fontSize:18,bold:true,color:C.text,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+64,y:y+48,w:210,h:28,text:b[1],fontSize:12,color:C.muted,typeface:"微软雅黑"});
  });
  ctx.addShape(slide,{x:92,y:582,w:780,h:44,geometry:"roundRect",fill:C.soft,line:ctx.line("#D7E6FA",1)});
  ctx.addText(slide,{x:132,y:594,w:700,h:18,text:"对用户的好处：孩子知道“这个词怎么读、是什么意思、在句子里怎么用”，学习阻力明显降低。",fontSize:15,bold:true,color:C.text,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 7,
    code: `
export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"MODULE 02 · 跟读背诵","从会看变成会说：单词和教材句都要开口练","这一关把驰声的听说能力放进去，让词汇学习不只是默背，而是和发音、表达一起训练。",7,true);
  const steps=[
    ["单词跟读","孩子读目标单词，系统可做发音反馈，及时纠正读音。",C.green],
    ["教材句跟读","读单词所在教材句，把词放进完整表达里练。",C.orange],
    ["扩展句背诵","后续可带更多同词例句，帮助从“认识”走向“会用”。",C.blue],
    ["星级反馈","用星级、进度和关卡完成度给孩子即时激励。",C.pink]
  ];
  steps.forEach((s,i)=>{
    const x=82+(i%2)*438, y=276+Math.floor(i/2)*134;
    card(slide,ctx,x,y,370,94,{fill:"#151A43",line:"#35406F"});
    ctx.addText(slide,{x:x+24,y:y+22,w:132,h:24,text:s[0],fontSize:20,bold:true,color:s[2],typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+24,y:y+54,w:310,h:28,text:s[1],fontSize:13,color:"#C9D6F7",typeface:"微软雅黑"});
  });
  ctx.addImage(slide,{path:${JSON.stringify(imgWordDetail)},x:925,y:165,w:200,h:356,fit:"cover",alt:"跟读背诵页面示意"});
  ctx.addShape(slide,{x:900,y:144,w:250,h:398,geometry:"roundRect",fill:"#15225766",line:ctx.line("#58B5FF",1)});
  ctx.addShape(slide,{x:108,y:582,w:760,h:44,geometry:"roundRect",fill:"#1E2658",line:ctx.line("#35406F",1)});
  ctx.addText(slide,{x:146,y:594,w:684,h:18,text:"对用户的好处：孩子每天开口练，家长看到的不是“背没背”，而是“读没读、读得怎样”。",fontSize:15,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 8,
    code: `
export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"MODULE 03 · 听力小测","从会读到听得出、写得对：用填空检测真实掌握","这一关不让孩子停留在“看着会”，而是通过听音填空检验听辨、拼写和反应速度。",8,false);
  const cols=[
    ["听","播放单词或句子音频，让孩子脱离文字提示先听懂。",C.blue],
    ["想","根据语境判断缺失词，调动词义和句子理解。",C.green],
    ["填","直接填空，检验拼写、音形对应和瞬时回忆。",C.orange],
    ["评","小测结果进入关卡进度，帮助孩子知道哪些词需要复习。",C.pink]
  ];
  cols.forEach((c,i)=>{
    const x=88+i*270;
    card(slide,ctx,x,288,218,156,{fill:"#FFFFFF",line:"#DDE8FA"});
    ctx.addShape(slide,{x:x+80,y:310,w:58,h:58,geometry:"ellipse",fill:c[2],line:ctx.line("#00000000",0)});
    ctx.addText(slide,{x:x+102,y:326,w:20,h:20,text:c[0],fontSize:20,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
    ctx.addText(slide,{x:x+24,y:390,w:170,h:38,text:c[1],fontSize:13,color:C.text,typeface:"微软雅黑",align:"center"});
  });
  ctx.addShape(slide,{x:190,y:510,w:798,h:52,geometry:"roundRect",fill:C.soft,line:ctx.line("#D7E6FA",1)});
  ctx.addText(slide,{x:232,y:526,w:720,h:18,text:"对用户的好处：把词汇学习和听力能力打通，尤其适合听说考试、课堂听写和暑期复习。",fontSize:16,bold:true,color:C.text,typeface:"微软雅黑",align:"center"});
  ctx.addText(slide,{x:405,y:604,w:420,h:18,text:"LISTEN · RECALL · SPELL · REVIEW",fontSize:10,bold:true,color:"#7181A0",typeface:"Calibri",align:"center"});
  return slide;
}
`
  },
  {
    n: 9,
    code: `
export async function slide09(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"MODULE 04 · 随身听","随身听：把碎片时间变成低压力复习时间","孩子不一定每天都能坐下来刷题，但可以在路上、车上、睡前反复听熟一本书。",9,true);
  card(slide,ctx,82,280,340,250,{fill:"#151A43",line:"#35406F"});
  ctx.addText(slide,{x:114,y:310,w:260,h:28,text:"适用场景",fontSize:23,bold:true,color:C.white,typeface:"微软雅黑"});
  [["上学路上",C.blue],["饭前饭后",C.green],["睡前 10 分钟",C.orange],["家长陪伴复习",C.pink]].forEach((s,i)=>{
    const y=362+i*40;
    ctx.addShape(slide,{x:116,y:y+4,w:12,h:12,geometry:"ellipse",fill:s[1],line:ctx.line("#00000000",0)});
    ctx.addText(slide,{x:140,y,w:220,h:20,text:s[0],fontSize:15,color:"#D7EAFF",typeface:"微软雅黑"});
  });
  card(slide,ctx,488,270,280,270,{fill:"#151A43",line:"#35406F"});
  ctx.addText(slide,{x:524,y:304,w:210,h:30,text:"随身听能力",fontSize:24,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
  ctx.addShape(slide,{x:548,y:362,w:170,h:92,geometry:"roundRect",fill:"#1E2658",line:ctx.line("#58B5FF",1)});
  ctx.addText(slide,{x:572,y:382,w:122,h:20,text:"单词音频",fontSize:16,bold:true,color:C.cyan,typeface:"微软雅黑",align:"center"});
  ctx.addText(slide,{x:572,y:414,w:122,h:18,text:"例句音频 · 循环听",fontSize:12,color:"#C9D6F7",typeface:"微软雅黑",align:"center"});
  ctx.addText(slide,{x:522,y:480,w:210,h:28,text:"按教材 / 关卡 / 错词 / 今日计划播放",fontSize:13,color:"#C9D6F7",typeface:"微软雅黑",align:"center"});
  card(slide,ctx,834,280,340,250,{fill:"#151A43",line:"#35406F"});
  ctx.addText(slide,{x:866,y:310,w:260,h:28,text:"带来的好处",fontSize:23,bold:true,color:C.white,typeface:"微软雅黑"});
  ["降低学习门槛：不用打开复杂任务也能复习","增强记忆频次：高频听熟比一次性硬背更稳定","服务家长陪伴：家长能用音频带孩子轻松过一遍","提升套餐价值：随身听让 39/59 元更像完整学习包"].forEach((t,i)=>{
    ctx.addText(slide,{x:868,y:360+i*42,w:270,h:24,text:"• "+t,fontSize:12,color:"#C9D6F7",typeface:"微软雅黑"});
  });
  ctx.addShape(slide,{x:168,y:588,w:850,h:42,geometry:"roundRect",fill:"#1E2658",line:ctx.line("#35406F",1)});
  ctx.addText(slide,{x:205,y:600,w:780,h:18,text:"随身听的定位：不是新增一个花哨功能，而是解决“孩子不愿每天坐下来背”的真实使用问题。",fontSize:15,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 10,
    code: `
export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"PACKAGE · 套餐设计","39 元轻量转化，59 元加纸质单词卡","基础款负责低门槛成交，单词卡套餐负责礼品感、开箱传播和更高客单价。",10,false);
  card(slide,ctx,70,278,280,258,{fill:"#FFFFFF",line:"#DDE8FA"});
  card(slide,ctx,384,252,326,286,{fill:"#FFFFFF",line:"#FFBCD9",lw:2});
  ctx.addText(slide,{x:96,y:306,w:190,h:26,text:"基础套餐",fontSize:20,bold:true,color:C.text,typeface:"微软雅黑"});
  ctx.addText(slide,{x:96,y:346,w:120,h:54,text:"¥39",fontSize:46,bold:true,color:C.blue,typeface:"微软雅黑"});
  bulletLight(slide,ctx,100,418,"一本书对应小程序词库",C.blue,13,220);
  bulletLight(slide,ctx,100,456,"学习计划 + 三关闯关",C.blue,13,220);
  bulletLight(slide,ctx,100,494,"适合弹窗与直播间引流",C.blue,13,220);
  tag(slide,ctx,556,270,"推荐",C.pink);
  ctx.addText(slide,{x:416,y:302,w:220,h:26,text:"单词卡套餐",fontSize:22,bold:true,color:C.text,typeface:"微软雅黑"});
  ctx.addText(slide,{x:416,y:342,w:120,h:58,text:"¥59",fontSize:52,bold:true,color:C.pink,typeface:"微软雅黑"});
  ctx.addText(slide,{x:548,y:364,w:170,h:24,text:"送纸质单词卡",fontSize:20,bold:true,color:C.text,typeface:"微软雅黑"});
  bulletLight(slide,ctx,420,428,"小程序学习 + 纸质复习卡",C.pink,13,250);
  bulletLight(slide,ctx,420,464,"更适合家长购买和暑期打卡",C.pink,13,250);
  bulletLight(slide,ctx,420,500,"提升客单价与开箱传播感",C.pink,13,250);
  ctx.addShape(slide,{x:758,y:252,w:386,h:292,geometry:"roundRect",fill:"#9DBE78",line:ctx.line("#88AA62",1)});
  ctx.addText(slide,{x:790,y:274,w:320,h:20,text:"纸质单词卡参考样式",fontSize:18,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
  wordCardMock(slide,ctx,846,300,250,110,"front");
  wordCardMock(slide,ctx,846,426,250,96,"back");
  ctx.addText(slide,{x:790,y:568,w:314,h:32,text:"单词、音标、例句、词性、彩图和扫码发音，形成“可摸到”的学习成果。",fontSize:14,color:C.text,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 11,
    code: `
export async function slide11(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"CHANNEL · 销售路径","四个独立入口，共同进入小程序直接购买","每个渠道都可以单独宣传、单独带二维码或链接；用户进入小程序后直接购买 39/59 元套餐。",11,true);
  const chans=[
    ["听说在线 App 内部弹窗","10几万月活保证","暑期词汇挑战弹窗、学习计划入口、家长消息触达",C.blue],
    ["家长通小程序推荐","家长侧触达","按年级推荐词汇书，重点承接 59 元单词卡套餐",C.green],
    ["新媒体软文推荐","内容种草","暑假背词攻略、单词卡开箱、学习成果晒图",C.pink],
    ["新媒体直播","即时成交","39 元试用、59 元加卡、直播间限时赠卡",C.orange]
  ];
  chans.forEach((c,i)=>{
    const y=272+i*74;
    card(slide,ctx,72,y,748,58,{fill:"#151A43",line:"#36416E"});
    ctx.addShape(slide,{x:92,y:y+15,w:28,h:28,geometry:"ellipse",fill:c[3],line:ctx.line("#00000000",0)});
    ctx.addText(slide,{x:136,y:y+10,w:210,h:20,text:c[0],fontSize:16,bold:true,color:C.white,typeface:"微软雅黑"});
    ctx.addText(slide,{x:360,y:y+10,w:150,h:18,text:c[1],fontSize:13,bold:true,color:c[3],typeface:"微软雅黑"});
    ctx.addText(slide,{x:520,y:y+11,w:276,h:34,text:c[2],fontSize:11,color:"#C9D6F7",typeface:"微软雅黑"});
  });
  ctx.addImage(slide,{path:${JSON.stringify(imgLiveScene)},x:858,y:276,w:330,h:186,fit:"cover",alt:"新媒体直播销售单词刷刷刷场景"});
  ctx.addShape(slide,{x:858,y:276,w:330,h:186,geometry:"roundRect",fill:"#00000000",line:ctx.line("#58B5FF",1)});
  ctx.addText(slide,{x:870,y:486,w:306,h:34,text:"直播画面用于理解成交场景：老师讲解小程序、展示教材词汇书与纸质单词卡。",fontSize:12,color:"#D7EAFF",typeface:"微软雅黑",align:"center"});
  ctx.addShape(slide,{x:138,y:592,w:834,h:44,geometry:"roundRect",fill:"#1E2658",line:ctx.line("#35406F",1)});
  ctx.addText(slide,{x:174,y:604,w:760,h:18,text:"共同落点：四个渠道独立宣传 → 进入单词刷刷刷小程序 → 直接购买 39/59 元套餐",fontSize:15,bold:true,color:C.white,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 16,
    code: `
export async function slide16(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"TRIAL · 暑期试销","首期 3,000 本：验证可卖、可学、可复购","先验证商品模型和渠道打法，再决定扩大书目、渠道和运营投入。",12,false);
  stat(slide,ctx,86,284,180,"3,000 本","首期销量目标",C.blue);
  stat(slide,ctx,300,284,180,"¥39 / ¥59","两档套餐",C.pink);
  stat(slide,ctx,514,284,180,"小学-高中","覆盖年级",C.green);
  stat(slide,ctx,728,284,180,"60 天","暑期运营窗口",C.orange);
  const rows=[
    ["保守","1,500 本","58,500 元起","验证购买兴趣"],
    ["目标","3,000 本","117,000 元起","验证规模成交"],
    ["进取","5,000 本","195,000 元起","验证区域复制"]
  ];
  rows.forEach((r,i)=>{
    const y=442+i*46;
    ctx.addShape(slide,{x:112,y,w:860,h:38,geometry:"roundRect",fill:i===1?"#EAF3FF":"#FFFFFF",line:ctx.line("#D7E6FA",1)});
    ctx.addText(slide,{x:140,y:y+10,w:100,h:16,text:r[0],fontSize:14,bold:true,color:i===1?C.blue:C.text,typeface:"微软雅黑"});
    ctx.addText(slide,{x:322,y:y+10,w:120,h:16,text:r[1],fontSize:14,bold:true,color:C.text,typeface:"微软雅黑"});
    ctx.addText(slide,{x:520,y:y+10,w:160,h:16,text:r[2],fontSize:14,bold:true,color:C.text,typeface:"微软雅黑"});
    ctx.addText(slide,{x:748,y:y+10,w:180,h:16,text:r[3],fontSize:14,color:C.muted,typeface:"微软雅黑"});
  });
  ctx.addText(slide,{x:110,y:622,w:900,h:18,text:"注：收入按 39 元基础价测算，59 元套餐将带来额外客单提升；试销重点先看转化、完课与复购意愿。",fontSize:11,color:C.muted,typeface:"微软雅黑"});
  return slide;
}
`
  },
  {
    n: 13,
    code: `
export async function slide13(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"MOAT · 为什么我们适合做","不只拼词库，更拼听说能力、内容加工和运营闭环","驰声的优势在于把语音评测、教材例句、小程序体验和渠道运营组合成一个商品。",13,true);
  const moats=[
    ["01 · AI SPEECH","语音评测能力","单词与句子跟读可评测，区别于纯背诵工具。"],
    ["02 · CONTENT","教材例句扩展","每本书绑定词库和教材句，后续可扩展更多语境。"],
    ["03 · MINI PROGRAM","小程序轻入口","不强制下载，适合内容平台和直播间快速承接。"],
    ["04 · OPS LOOP","运营可复制","学习计划、打卡、关卡与套餐可沉淀为暑期 SOP。"],
    ["05 · APP DEPTH","App 可承接","可为听说在线 App 导入暑期新用户和学情数据。"],
    ["06 · LOW CAC","低客单低门槛","39/59 元适合试销，不依赖重销售。"]
  ];
  moats.forEach((m,i)=>{
    const x=90+(i%3)*365, y=282+Math.floor(i/3)*128;
    card(slide,ctx,x,y,315,92,{fill:"#151A43",line:i===5?"#CC1B7E":"#38436F"});
    ctx.addText(slide,{x:x+20,y:y+18,w:130,h:16,text:m[0],fontSize:10,bold:true,color:i===5?C.pink:C.cyan,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+20,y:y+42,w:130,h:22,text:m[1],fontSize:18,bold:true,color:C.white,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+160,y:y+28,w:130,h:34,text:m[2],fontSize:11,color:"#C9D6F7",typeface:"微软雅黑"});
  });
  return slide;
}
`
  },
  {
    n: 14,
    code: `
export async function slide14(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"TEAM · 各方协同","立项后 4 周进入试销：四线同步推进","这不是单点功能上线，而是一套暑期商品化试验。",14,false);
  const teams=[
    ["产品 / 技术","小程序路径、学习计划、关卡与支付链路"],
    ["内容团队","小学-高中词库、教材例句、听力填空题"],
    ["运营团队","暑期打卡、家长话术、直播脚本、复盘看板"],
    ["渠道团队","听说在线 App、家长通、软文、直播四个独立入口"]
  ];
  teams.forEach((t,i)=>{
    const x=90+(i%2)*500, y=270+Math.floor(i/2)*138;
    card(slide,ctx,x,y,420,104,{fill:"#FFFFFF",line:i===3?"#FFBCD9":"#DDE8FA"});
    ctx.addText(slide,{x:x+24,y:y+24,w:140,h:24,text:t[0],fontSize:20,bold:true,color:i===3?C.pink:C.blue,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+24,y:y+60,w:330,h:24,text:t[1],fontSize:14,color:C.text,typeface:"微软雅黑"});
  });
  ctx.addShape(slide,{x:170,y:582,w:760,h:44,geometry:"roundRect",fill:C.soft,line:ctx.line("#D7E6FA",1)});
  ctx.addText(slide,{x:210,y:594,w:680,h:18,text:"立项通过后：1 周定需求 → 2 周补内容/联调 → 1 周渠道预热 → 暑期正式试销",fontSize:16,bold:true,color:C.text,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 15,
    code: `
export async function slide15(presentation, ctx) {
  const slide = presentation.slides.add();
  header(slide,ctx,"KPI · 试销看板","用 6 个指标决定是否扩大投入","首期不追求所有功能完美，核心看商品是否能转化、孩子是否能坚持、渠道是否能复用。",15,false);
  const kpis=[
    ["销量","3,000 本","验证付费转化"],
    ["套餐结构","59 元占比","验证单词卡价值"],
    ["7 日留存","打卡继续率","验证学习计划"],
    ["完课进度","关卡完成率","验证产品闭环"],
    ["渠道成本","获客/成交成本","验证投放效率"],
    ["复购意愿","换书/升级意向","验证长期空间"]
  ];
  kpis.forEach((k,i)=>{
    const x=80+(i%3)*360, y=256+Math.floor(i/3)*146;
    card(slide,ctx,x,y,292,102,{fill:"#FFFFFF",line:"#DDE8FA"});
    ctx.addText(slide,{x:x+20,y:y+18,w:95,h:18,text:k[0],fontSize:15,bold:true,color:i===1?C.pink:C.blue,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+20,y:y+42,w:140,h:26,text:k[1],fontSize:24,bold:true,color:C.text,typeface:"微软雅黑"});
    ctx.addText(slide,{x:x+20,y:y+76,w:200,h:18,text:k[2],fontSize:12,color:C.muted,typeface:"微软雅黑"});
  });
  ctx.addText(slide,{x:120,y:612,w:900,h:20,text:"复盘结论标准：若销量、留存、套餐结构任两项达标，即建议扩大书目与渠道；若仅渠道达标，则优先优化内容与学习机制。",fontSize:13,color:C.text,typeface:"微软雅黑",align:"center"});
  return slide;
}
`
  },
  {
    n: 12,
    code: `
export async function slide12(presentation, ctx) {
  const slide = presentation.slides.add();
  ctx.addShape(slide,{x:0,y:0,w:W,h:H,fill:C.navy,line:ctx.line("#00000000",0)});
  ctx.addShape(slide,{x:835,y:-60,w:380,h:380,geometry:"ellipse",fill:"#00000000",line:ctx.line("#1B35B7",78)});
  ctx.addShape(slide,{x:1000,y:-50,w:300,h:300,geometry:"ellipse",fill:"#00000000",line:ctx.line("#76105A",72)});
  logo(slide,ctx,true);
  ctx.addText(slide,{x:74,y:180,w:760,h:120,text:"请求批准：\\n单词刷刷刷产品立项 + 暑期试销",fontSize:42,bold:true,color:C.white,typeface:"微软雅黑"});
  accent(slide,ctx,78,360);
  const asks=[["产品立项","确认为暑期重点试销项目"],["试销目标","首期 3,000 本，覆盖小学至高中"],["资源投入","产品/内容/运营/渠道联合推进"],["复盘机制","暑期结束输出扩张建议"]];
  asks.forEach((a,i)=>{
    const x=88+i*285;
    card(slide,ctx,x,440,230,86,{fill:"#151A43",line:"#35406F"});
    ctx.addText(slide,{x:x+18,y:462,w:190,h:22,text:a[0],fontSize:18,bold:true,color:i===1?C.pink:C.cyan,typeface:"微软雅黑",align:"center"});
    ctx.addText(slide,{x:x+18,y:494,w:190,h:18,text:a[1],fontSize:12,color:"#C9D6F7",typeface:"微软雅黑",align:"center"});
  });
  ctx.addText(slide,{x:84,y:610,w:780,h:22,text:"让一本词汇书，在暑假变成一条可完成、可打卡、可转化的学习路径。",fontSize:20,bold:true,color:"#D8E8FF",typeface:"微软雅黑"});
  page(slide,ctx,16,true);
  return slide;
}
`
  }
];

await fs.mkdir(SLIDES_DIR, { recursive: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });

for (const slide of slides) {
  const name = `slide-${String(slide.n).padStart(2, "0")}.mjs`;
  await fs.writeFile(path.join(SLIDES_DIR, name), `${modulePreamble}\n${slide.code}\n`, "utf8");
}

const audit = `task mode: template-following source used as visual template, rebuilt as editable artifact-tool deck because the narrative changed from partnership proposal to internal product-roadshow.
primary deck-profile: gtm-growth
secondary profile gates: product-platform, consumer-retail
source structure: 12-slide template, alternating deep navy claim pages and white evidence pages, Chivox logo chrome, blue/pink accent rules, ring motif.
reused visual rules: 1280x720 frame, navy #080A2A, blue/pink paired accents, top-left Chivox mark, top-right page numbers, rounded proof cards.
product proof assets: user-provided mini-program screenshots for learning path and word detail page.
known assumptions: first trial target is 3,000 books; revenue rows use 39 RMB baseline and note 59 RMB package uplift.
`;
await fs.writeFile(path.join(WORKSPACE, "template-audit.txt"), audit, "utf8");
await fs.writeFile(path.join(WORKSPACE, "source-notes.txt"), [
  "Source PPTX: chivox-ai-book-partnership.pptx, used for visual system and slide rhythm.",
  `Product screenshots: ${imgHomePrimary}`,
  `Product screenshots: ${imgHomeKids}`,
  `Product screenshots: ${imgHomeHigh}`,
  `Product screenshots: ${imgWordDetail}`,
  `Generated live-stream scene: ${imgLiveScene}`,
  "No external market figures were added. All numeric targets are trial assumptions from user confirmation or transparent derived rows."
].join("\n"), "utf8");
await fs.writeFile(path.join(WORKSPACE, "deviation-log.txt"), [
  "All slides: rebuilt with editable artifact-tool primitives instead of in-place mutation because content scope shifted to a new internal product-roadshow narrative.",
  "Slides 1, 4, 6, 7: product screenshots inserted as real user-provided assets.",
  "Slides 12, 15: trial metrics are planning assumptions, not historical performance claims."
].join("\n"), "utf8");
await fs.writeFile(path.join(WORKSPACE, "template-frame-map.json"), JSON.stringify({
  outputSlides: slides.map((s) => ({
    outputSlide: s.n,
    sourceSlide: Math.min(s.n, 12),
    narrativeRole: [
      "opening thesis",
      "investment judgment",
      "summer window",
      "product overview",
      "product advantages",
      "module: word learning",
      "module: read aloud recitation",
      "module: listening quiz",
      "module: portable listening",
      "package model",
      "channel loop",
      "trial sizing",
      "moat",
      "team plan",
      "trial KPI",
      "approval ask"
    ][s.n - 1],
    reuseMode: "visual-system-rebuild",
    editTargets: []
  })),
  omittedSourceSlides: []
}, null, 2), "utf8");

const result = spawnSync(
  NODE,
  [
    BUILD_SCRIPT,
    "--workspace", WORKSPACE,
    "--slides-dir", SLIDES_DIR,
    "--out", FINAL_PPTX,
    "--preview-dir", PREVIEW_DIR,
    "--layout-dir", LAYOUT_DIR,
    "--contact-sheet", CONTACT_SHEET,
    "--slide-count", "16",
    "--scale", "1"
  ],
  {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_PATH: NODE_MODULES,
      PYTHON
    }
  }
);

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(result.status ?? 1);
}

console.log(result.stdout);
console.log(JSON.stringify({ finalPptx: FINAL_PPTX, contactSheet: CONTACT_SHEET }, null, 2));