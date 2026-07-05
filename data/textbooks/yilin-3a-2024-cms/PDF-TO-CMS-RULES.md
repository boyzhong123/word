# 给其他 AI 处理下一本 PDF 的规则

1. 先用目录页确定 Unit 标题、Cartoon Time 标题、Story Time 标题和页码，不要用 OCR 猜章节。
2. 扫描版 PDF 先渲染页面图片，再 OCR；Story/Cartoon 的角色名必须看图确认气泡归属。
3. 每个 Unit 固定输出四个栏目：Lead-in、Words、Cartoon Time、Story Time。
4. Words 使用书后 Word lists，星号词去掉星号，专有名词按需要补充，不要把目录标题当单词。
5. Cartoon/Story 一般导成一个 dialog 组；旁白可用 Narrator，群体可用 Students/Friends/Children/Family。
6. 所有英文导入 CMS 前要标准化：中文标点转英文标点，弯引号转直引号，长破折号转普通 `-` 或拆句。
7. 生成一键脚本时要自执行 `(async function(){ ... })()`，并用书名正则匹配当前册别，例如 `/三上|三年级上/`。
8. 一键脚本流程固定：找左侧 book 节点 -> 删除旧 Unit -> 创建 8 个 Unit -> 创建 4 个栏目 -> 调 `resources/batch` 导入内容。
9. 如果 CMS 报“参数异常”，优先检查英文里有没有长破折号、特殊省略号、弯引号、中文冒号/问号。
10. 最终交付至少包含：`BOOK-CONTENT.md`、结构化 JSON、`translations.tsv`、`unit-XX/sections/*.txt`、`console/99-reset-and-import-book.js`。
