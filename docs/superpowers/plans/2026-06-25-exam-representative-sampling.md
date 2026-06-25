# Exam Representative Sampling Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the main mini-app API document so backend exam generation maximizes representative coverage, avoids repeated tested words across word and sentence questions, and degrades predictably when content is insufficient.

**Architecture:** Keep the approved rules in the existing “内容系统导入规则” section of `mini-app-tech-doc.html`, close to the current exam sampling and fallback rules. Add machine-readable question metadata and paper-level coverage metadata to the existing `exam-paper` example. Add a focused static documentation test so the key contract cannot silently disappear.

**Tech Stack:** HTML documentation, Node.js built-in test runner, CommonJS test files.

---

## File Structure

- Modify `docs/mini-app-tech-doc.html`: canonical API and backend question-generation contract.
- Create `tests/exam-representative-sampling-doc.test.js`: static assertions for the representative-sampling contract.

### Task 1: Lock the documentation contract with a failing test

**Files:**
- Create: `tests/exam-representative-sampling-doc.test.js`
- Test: `tests/exam-representative-sampling-doc.test.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const techDoc = fs.readFileSync(path.join(projectRoot, 'docs/mini-app-tech-doc.html'), 'utf8')

test('exam documentation defines tested-word deduplication and coverage-first sampling', () => {
  assert.match(techDoc, /testedWordRefs/)
  assert.match(techDoc, /主考点去重/)
  assert.match(techDoc, /覆盖优先/)
  assert.match(techDoc, /普通上下文/)
})

test('exam documentation defines insufficient-content degradation and audit metadata', () => {
  assert.match(techDoc, /EXAM_MIN_TOTAL/)
  assert.match(techDoc, /MAX_TESTED_WORD_REPEAT/)
  assert.match(techDoc, /repeatedTargetCount/)
  assert.match(techDoc, /isRepeatedTarget/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test tests/exam-representative-sampling-doc.test.js
```

Expected: FAIL because the main API document does not yet contain `testedWordRefs`, the explicit deduplication contract, or coverage audit fields.

### Task 2: Add representative sampling and fallback rules to the main API document

**Files:**
- Modify: `docs/mini-app-tech-doc.html:613-665`
- Test: `tests/exam-representative-sampling-doc.test.js`

- [ ] **Step 1: Extend the exam sampling table**

Add explicit rows to the “八、入门测 / 结业测怎么组卷（抽样）” table:

```html
<tr><td style="padding:6px 8px">覆盖优先</td><td colspan="2">先覆盖未考单元，再覆盖未考目标单词，最后满足模块与题型配比；素材充足时不得为凑题型重复主考点</td></tr>
<tr><td style="padding:6px 8px">主考点去重</td><td colspan="2">每题用 <code>testedWordRefs</code> 标记真正计分的目标词；同一词原则上只进入一次。已考词可作为句子普通上下文出现，但不得再次作为挖空答案、翻译代表词或其他计分考点</td></tr>
<tr><td style="padding:6px 8px">句子选材</td><td colspan="2">优先选择能考查尚未覆盖目标词的句子；同一句不重复出题。若一句同时包含已考词和未考词，可选未考词为主考点继续使用</td></tr>
<tr><td style="padding:6px 8px">前后测可比</td><td colspan="2">使用相同抽样蓝图保持单元、词性、难度、模块与题型结构一致；优先使用同层级的不同目标词或句子，不要求两套卷考完全相同的具体词</td></tr>
```

- [ ] **Step 2: Add a dedicated tested-word definition below the table**

Add:

```html
<div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(148,163,184,.3)">
  <strong>主考点 <code>testedWordRefs</code> 定义</strong><br/>
  单词题标记目标单词；句子挖空标记被挖词；句子翻译或连词成句标记后端选定的代表词。只作为语境出现、不要求用户识别或填写的词不计入主考点。
</div>
```

- [ ] **Step 3: Extend insufficient-content degradation**

Add an exam-specific row to “十、缺数据兜底”:

```html
<tr><td style="padding:6px 8px">测评素材不足以主考点去重</td><td>先调整词/句题比例并使用未考素材，再允许减少题量；仍需满足最低题量时才可换题型复用已考目标词一次，并标记 <code>isRepeatedTarget=true</code>。有效题低于 <code>EXAM_MIN_TOTAL</code> 时返回测评不可用，不生成空题或劣质题</td></tr>
```

- [ ] **Step 4: Add configurable constants**

Add to “十一、数量 / 常量速查”:

```html
<tr><td style="padding:6px 8px"><code>EXAM_MIN_TOTAL</code></td><td>5</td><td>低于此有效题量时测评不可用</td></tr>
<tr><td style="padding:6px 8px"><code>MAX_TESTED_WORD_REPEAT</code></td><td>1</td><td>素材不足时同一主考点最多额外复用一次</td></tr>
```

- [ ] **Step 5: Run the focused test**

Run:

```bash
node --test tests/exam-representative-sampling-doc.test.js
```

Expected: PASS.

### Task 3: Extend the `exam-paper` interface example

**Files:**
- Modify: `docs/mini-app-tech-doc.html:2278-2310`
- Test: `tests/exam-representative-sampling-doc.test.js`

- [ ] **Step 1: Add question provenance and tested-target fields**

Extend the example question with:

```json
"sourceUnitId": "unit-1",
"sourceWordId": "word-brave",
"testedWordRefs": ["word-brave"],
"isRepeatedTarget": false
```

For sentence questions, document `sourceSentenceId` in place of `sourceWordId`.

- [ ] **Step 2: Add paper-level coverage metadata**

Add beside `sections` and `questions`:

```json
"coverage": {
  "unitCount": 8,
  "coveredUnitCount": 8,
  "uniqueTestedWordCount": 27,
  "repeatedTargetCount": 0
}
```

Add a note:

```text
// 素材充足时 repeatedTargetCount 必须为 0；coverage 用于后端质检与联调，不参与前端答题交互。
```

- [ ] **Step 3: Add unavailable-paper response semantics**

Document:

```json
{
  "status": "success",
  "data": {
    "examAvailable": false,
    "unavailableReason": "INSUFFICIENT_VALID_CONTENT",
    "availableQuestionCount": 4,
    "minimumQuestionCount": 5
  }
}
```

The frontend must display a non-error “本书内容暂不足以生成测评” state and must not enter the quiz.

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
node --test tests/exam-representative-sampling-doc.test.js
npm test
```

Expected: the focused test passes; the full suite passes or any unrelated pre-existing failures are reported separately.

- [ ] **Step 5: Validate documentation formatting**

Run:

```bash
git diff --check -- docs/mini-app-tech-doc.html tests/exam-representative-sampling-doc.test.js
```

Expected: no output and exit code `0`.

- [ ] **Step 6: Commit only the scoped files**

```bash
git add docs/mini-app-tech-doc.html tests/exam-representative-sampling-doc.test.js
git commit -m "docs: clarify representative exam sampling"
```

Before committing, inspect `git diff -- docs/mini-app-tech-doc.html` because the file already contains unrelated user changes. Stage only the representative-sampling hunks; do not overwrite or revert the existing edits.
