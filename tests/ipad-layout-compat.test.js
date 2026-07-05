const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')

function read(file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8')
}

test('finish page content is hosted in a vertical scroll view for tablet heights', () => {
  const template = read('pages/finish/today.wxml')
  const style = read('pages/finish/today.wxss')

  assert.match(template, /<scroll-view class="finish-scroll" scroll-y enhanced show-scrollbar="{{false}}" wx:if="{{unitSort < unitCount}}">/)
  assert.match(template, /class='container finish-container'/)
  assert.match(style, /\.finish-scroll\s*{[^}]*height:\s*100vh/s)
  assert.match(style, /\.finish-container\s*{[^}]*height:\s*auto/s)
  assert.match(style, /\.finish-container\s*{[^}]*padding-bottom:\s*calc\(env\(safe-area-inset-bottom\) \+ 40rpx\)/s)
})

test('exam intro and quiz bodies use scroll views instead of clipping overflow', () => {
  const template = read('pages/exam/exam.wxml')
  const style = read('pages/exam/exam.wxss')

  assert.match(template, /<scroll-view wx:if="{{stage === 'intro'}}" class="intro-scroll" scroll-y enhanced show-scrollbar="{{false}}">/)
  assert.match(template, /<scroll-view class="quiz-scroll" scroll-y enhanced show-scrollbar="{{false}}">/)
  assert.match(style, /\.intro-scroll\s*{[^}]*flex:\s*1/s)
  assert.match(style, /\.intro\s*{[^}]*min-height:\s*100%/s)
  assert.match(style, /\.quiz-scroll\s*{[^}]*flex:\s*1/s)
  assert.match(style, /\.quiz-stage\s*{[^}]*min-height:\s*100%/s)
  assert.doesNotMatch(style, /\.quiz-stage\s*{[^}]*overflow:\s*hidden/s)
})

test('listening quiz three-step content scrolls instead of clipping bottom controls', () => {
  const template = read('pages/listen/listen.wxml')
  const style = read('pages/listen/listen.wxss')

  assert.match(template, /<scroll-view class="quiz-scroll" scroll-y enhanced show-scrollbar="{{false}}">/)
  assert.match(style, /\.quiz-scroll\s*{[^}]*flex:\s*1/s)
  assert.match(style, /\.quiz-scroll\s*{[^}]*min-height:\s*0/s)
  assert.match(style, /\.quiz-scroll\s*{[^}]*height:\s*0/s)
  assert.match(style, /\.quiz-body\s*{[^}]*min-height:\s*100%/s)
  assert.match(style, /\.quiz-bottom-area\s*{[^}]*padding-bottom:\s*calc\(env\(safe-area-inset-bottom\) \+ 48rpx\)/s)
  assert.doesNotMatch(style, /\.quiz-body\s*{[^}]*overflow:\s*hidden/s)
})
