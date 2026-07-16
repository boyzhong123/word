# 译林版六年级上册（2026秋）CMS 导入包

## 推荐用法

1. 打开 CMS 的“六上/六年级上”详情页，等左侧目录加载出来。
2. 打开浏览器控制台。
3. 复制 `console/99-reset-and-import-book.js` 全部内容粘贴运行。
4. 脚本会删除该书下面旧 Unit，重建 8 个 Unit 和 5 个栏目，并导入内容。

## 栏目

- Lead-in
- Words
- Cartoon Time
- Story Time
- Grammar Time

Wrap-up / Assessment 暂不导入。

## 文件

- `BOOK-CONTENT.md`：人工校对用总览。
- `book-content-6a-2026.json`：结构化数据源。
- `translations.tsv`：英文到中文释义/译文。
- `unit-XX/sections/*.txt`：每个单元分栏原文。
