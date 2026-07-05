# 译林版四年级下册 CMS 导入包

## 推荐用法

1. 打开 CMS 的“四下/四年级下”详情页，等左侧目录加载出来。
2. 打开浏览器控制台。
3. 复制 `console/99-reset-and-import-book.js` 全部内容粘贴运行。
4. 脚本会删除该书下面旧 Unit，重建 8 个 Unit 和 4 个栏目，并导入内容。

## 文件

- `BOOK-CONTENT.md`：人工校对用总览。
- `book-content-4b.json`：结构化数据源。
- `translations.tsv`：英文到中文释义/译文。
- `unit-XX/sections/*.txt`：每个单元四个栏目原文。
