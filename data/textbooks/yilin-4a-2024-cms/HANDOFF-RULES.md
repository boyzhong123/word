# CMS 录入交接规则

目标：把牛津译林四上(24版)整本书内容稳定录入 Chivox CMS，避免手工 UI 和文本录入弹窗的角色/翻译同步问题。

## 结论先说

不要再依赖 CMS 的「文本录入」弹窗。

原因：
- 「自动识别」会把对话行误判成单词/句子。
- 角色名输入框必须真实失焦才刷新，自动化工具很容易只改了显示值，没有改到内部数据。
- UI 里自动翻译触发很快，内容容易闪掉或残留，不适合整本书批量录。

整本书正确流程：

1. 先准备英文内容和中文释义。
2. 人工校验中文释义。
3. 生成 `console/03-inject-tagged-editor.js`。
4. 在 CMS 控制台粘贴整段 JS。
5. 用 `importYilinUnit(n)` 或 `importYilinSection(n, name)` 导入。

## 当前关键文件

| 文件 | 用途 |
| --- | --- |
| `data/textbooks/yilin-primary-4a-2024.json` | 单词、基础释义、例句释义的数据源 |
| `data/textbooks/yilin-4a-2024-cms/unit-XX/sections/words.txt` | Words 英文内容 |
| `data/textbooks/yilin-4a-2024-cms/unit-XX/sections/cartoon.txt` | Cartoon Time，格式为 `角色: 台词` |
| `data/textbooks/yilin-4a-2024-cms/unit-XX/sections/story.txt` | Story Time 英文内容 |
| `scripts/build-chivox-inject-tagged.py` | 生成导入脚本 |
| `data/textbooks/yilin-4a-2024-cms/console/03-inject-tagged-editor.js` | 粘贴到 CMS 控制台的最终脚本 |

## 接手 AI 必须遵守

### 1. 不要用 UI 自动识别导入对话

不要用这些路线：
- 不要让用户一行行点「文本录入」。
- 不要靠「自动识别」识别 `Sam: ...` / `Bobby: ...`。
- 不要靠编辑器里的角色输入框保存真实角色名。

正确方式是让生成脚本提交结构化数据：

```js
{
  type: 'dialog',
  list: [
    { role: 'Sam', content: '...', translation: '...', gender: '0' },
    { role: 'Bobby', content: '...', translation: '...', gender: '0' }
  ]
}
```

### 2. 先翻译，后导入

CMS 的自动翻译不稳定，整本书录入必须在本地先准备中文释义。

翻译规则：
- Words：用教材词汇表释义，不要自由发挥。
- Cartoon Time：每句台词都要有中文释义。
- Story Time：每句/每段/旁白都要有中文释义。
- 中文要适合小学生教材口吻，短、自然、可读。
- 人名保留英文或按教材习惯，不要乱译。
- 专有课名统一：
  - Chinese：语文
  - English：英语
  - Maths：数学
  - PE：体育
  - Art：美术
  - Science：科学
  - IT：信息科技
  - Music：音乐
  - Labour：劳动

建议交付给用户校验的格式：

```tsv
unit	section	type	role	content	translation
1	Cartoon Time	dialog	Sam	What subject do you like best, Bobby?	鲍比，你最喜欢什么科目？
1	Cartoon Time	dialog	Bobby	I like Music best.	我最喜欢音乐。
```

用户确认后，再写入数据源并生成导入脚本。

### 3. 数据格式规则

`cartoon.txt` 必须保留角色前缀：

```text
Sam: What subject do you like best, Bobby?
Bobby: I like Music best.
```

`story.txt` 不写角色，按教材顺序一行一条。长段落可以一整段一行。

类型判断规则在 `scripts/build-chivox-inject-tagged.py`：
- Words 固定为 `word`
- `角色: 台词` 自动合并成一个 `dialog`
- 长句/多句自动归为 `para`
- Story 里很短的感叹句可归为 `asides`
- 其他为 `sent`

如果自动分类不对，改生成脚本，不要手工在 CMS 里修。

### 4. 导入脚本使用规则

重新生成：

```bash
python3 scripts/build-chivox-inject-tagged.py
```

复制最终脚本：

```bash
pbcopy < data/textbooks/yilin-4a-2024-cms/console/03-inject-tagged-editor.js
```

在 CMS 控制台粘贴整段代码，不是输入文件路径。

加载成功后运行：

```js
previewYilinSection(1, 'Cartoon Time')
importYilinSection(1, 'Cartoon Time')
importYilinUnit(1)
```

注意：重复导入会追加重复内容。导入前确认该子章节为空。

### 5. 整本书推荐节奏

每个 Unit 都按这个顺序：

1. 整理 Words / Cartoon Time / Story Time 英文。
2. 生成待校验翻译表。
3. 用户校验中文释义。
4. 回填翻译。
5. 生成 `03-inject-tagged-editor.js`。
6. 在 CMS 先 `previewYilinSection(...)`。
7. 确认无误后 `importYilinSection(...)`。
8. CMS 页面抽查：
   - Words 数量对不对
   - Cartoon Time 是否是一个对话块，角色是否正确
   - Story Time 类型是否合理
   - 中文释义是否完整

## 下一步建议给接手 AI

优先补一个“翻译覆盖表”机制。

建议新建：

```text
data/textbooks/yilin-4a-2024-cms/unit-XX/translations.tsv
```

格式：

```tsv
content	translation
What subject do you like best, Bobby?	鲍比，你最喜欢什么科目？
I like Music best.	我最喜欢音乐。
```

然后修改 `scripts/build-chivox-inject-tagged.py`：
- 读取每个 Unit 的 `translations.tsv`
- 覆盖/补充 `data/textbooks/yilin-primary-4a-2024.json` 里的释义
- 所有 dialog / sent / para / asides 都从覆盖表取中文
- 没有翻译的内容生成 warning，禁止静默空释义

这样用户只需要审核 TSV，就能整本书稳定导入。

