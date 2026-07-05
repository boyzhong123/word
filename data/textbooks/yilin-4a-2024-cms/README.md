# 牛津译林四上(24版) — CMS 录入

入口：[CMS 详情页](https://resm.chivoxapp.com/detail.html?courseId=637)

## 目录结构（每个 Unit）

```
Unit X
├── Lead-in
├── Words
├── Cartoon Time
└── Story Time
```

## 推荐用法（直接批量导入）

### 重跑全册

1. 如需清空现有内容，先运行 `console/00-delete-units.js`
2. 控制台运行 `console/01-create-units.js`
3. 控制台运行 `console/04-create-sections.js`
4. 控制台粘贴 `console/03-inject-tagged-editor.js` 回车

### 导入内容

运行 `03` 后，直接在控制台执行：

```javascript
importYilinBook()
importYilinUnit(1)
```

注意：同一个子章节重复执行会再次提交内容。导入前先确认该章节是否已经有旧内容，必要时先在 CMS 里清空。

会自动按顺序导入 Unit 1 下已有内容：

| 子章节 | 内容 |
|------|------|
| Lead-in | 单元导入韵文 / 歌谣 |
| Words | 单词表 |
| Cartoon Time | 对话 |
| Story Time | 句子 / 段落 / 旁白 |

只导入某个子章节：

```javascript
importYilinSection(1, 'Lead-in')
importYilinSection(1, 'Words')
importYilinSection(1, 'Cartoon Time')
importYilinSection(1, 'Story Time')
```

预览将要提交的数据：

```javascript
previewYilinSection(1, 'Words')
```

兼容别名：`fill(1, 'Words')` 仍可用，但现在也是直接批量导入，不需要打开「文本录入」弹窗。

## 自动打标签规则

| 类型 | 规则 |
|------|------|
| 单词 | Words 章节 |
| 对话 | `Sam: ...` / `Bobby: ...` 格式（Cartoon Time） |
| 段落 | 长文（>25 词或多句） |
| 旁白 | Story 里短感叹句 |
| 句子 | 其余 |

## 数据文件

| 文件 | 用途 |
|------|------|
| `unit-XX/sections/words.txt` | 单词表 |
| `unit-XX/sections/lead-in.txt` | 导入韵文 / 歌谣 |
| `unit-XX/sections/cartoon.txt` | 漫画（`角色: 台词`） |
| `unit-XX/sections/story.txt` | 故事/儿歌 |
| `translations.tsv` | 正文翻译覆盖表 |

改完后重新生成脚本：

```bash
python3 scripts/build-chivox-inject-tagged.py
```

再粘贴新的 `03-inject-tagged-editor.js`。
