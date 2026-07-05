# 控制台脚本

在 [CMS 四上详情页](https://resm.chivoxapp.com/detail.html?courseId=637) 打开 F12 控制台，按顺序粘贴运行：

| 步骤 | 文件 | 作用 |
|------|------|------|
| 0（可选） | `00-delete-units.js` | 删掉四上所有单元 |
| 1 | `01-create-units.js` | 建 8 个 Unit |
| 2 | `04-create-sections.js` | 每单元建 Lead-in / Words / Cartoon Time / Story Time |
| 3 | `03-inject-tagged-editor.js` | 加载直接批量导入脚本 |

层级：`书本 → 单元 → Lead-in / Words / Cartoon Time / Story Time`

运行 `03` 后执行：

```javascript
importYilinBook()
importYilinUnit(1)
importYilinSection(1, 'Words')
```

`03` 直接调用 `/resources/batch`，自动使用对应子章节的 `sectionId`，不需要打开「文本录入」弹窗。
同一章节重复执行会再次提交内容，导入前先确认是否需要清空旧内容。
旧版 `02-batch-upload.js`（`sectionId=0` 扁平导入）已被 `03` 取代。
