# 译林版三年级下册 CMS 导入包

## 推荐用法

1. 打开 CMS 的“三下/三年级下”详情页，等左侧目录加载出来。
2. 打开浏览器控制台。
3. 复制 `console/99-reset-and-import-book.js` 全部内容粘贴运行。
4. 脚本会删除该书下面旧 Unit，重建 8 个 Unit 和 4 个栏目，并导入内容。

## 重要规则

- 不要在控制台只输入文件名，例如 `console/99-reset-and-import-book.js`，那样浏览器会当成 JS 表达式执行，当然会报 `xxx is not defined`。
- 必须复制文件里的全部代码。
- 英文内容尽量使用 ASCII 标点：直引号、普通连字符 `-`，不要用中文标点或长破折号。
- Story/Cartoon 的角色名必须看图核对气泡归属，不能只靠 OCR。

## 内容文件

- `BOOK-CONTENT.md`：人工校对用总览。
- `book-content-16765054.json`：结构化数据源。
- `translations.tsv`：英文到中文释义/译文。
- `unit-XX/sections/*.txt`：每个单元四个栏目原文。

## 重新生成

修改 `unit-XX/sections/*.txt` 或 `translations.tsv` 后运行：

```bash
python3 scripts/build-yilin-3b-cms.py
```
