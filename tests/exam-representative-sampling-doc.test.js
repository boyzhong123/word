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
