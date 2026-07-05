const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')

function read(file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8')
}

test('two-line level navigation reserves room for progress below subtitle', () => {
  const listenStyle = read('pages/listen/listen.wxss')
  const practiceStyle = read('pages/practice/practice.wxss')
  const examStyle = read('pages/exam/exam.wxss')

  assert.match(listenStyle, /\.listen-quiz-nav\s*{[^}]*padding-bottom:\s*32rpx/s)
  assert.match(listenStyle, /\.listen-quiz-top-progress\s*{[^}]*bottom:\s*0/s)

  assert.match(practiceStyle, /\.practice-nav\s*{[^}]*padding-bottom:\s*32rpx/s)
  assert.match(practiceStyle, /\.practice-top-progress\s*{[^}]*bottom:\s*0/s)

  assert.match(examStyle, /\.exam-nav\s*{[^}]*padding-bottom:\s*32rpx/s)
  assert.match(examStyle, /\.exam-top-progress\s*{[^}]*bottom:\s*0/s)
})
