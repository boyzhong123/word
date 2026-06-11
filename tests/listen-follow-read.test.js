const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const listenScript = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.js'), 'utf8')
const listenTemplate = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.wxml'), 'utf8')
const listenStyle = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.wxss'), 'utf8')
const listenConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.json'), 'utf8'))

test('listen page registers the shared media component for follow-read scoring', () => {
  assert.equal(listenConfig.usingComponents.media, '../../components/media/media')
})

test('tapping any lyric expands it directly, pausing the running playback', () => {
  // 点文字直接展开；再点已展开的收起；展开前暂停随身听保留进度
  assert.match(listenScript, /onTrackTap\(e\)\s*{/)
  assert.match(listenScript, /this\.data\.expandedIndex === index/)
  assert.match(listenScript, /if \(this\.data\.playing\)\s*{\s*player\.pause\(\)/)
  assert.match(listenScript, /player\.focusTrack\(index\)/)
  assert.match(listenScript, /this\.scrollToIndex\(index\)/)
})

test('expanded panel auto-plays the standard audio on open', () => {
  assert.match(listenTemplate, /_autoplay="{{true}}"/)
})

test('follow-read panel embeds media wired with the track audio / refText / coreType', () => {
  assert.match(listenTemplate, /<view wx:if="{{expandedIndex == index}}" class="follow-panel" catchtap="noop">/)
  assert.match(listenTemplate, /_audio="{{item\.audio}}"/)
  assert.match(listenTemplate, /_refText="{{item\.content}}"/)
  assert.match(listenTemplate, /_coreType="{{item\.type == 'word' \? 'en\.word\.score' : 'en\.sent\.score'}}"/)
  assert.match(listenTemplate, /bindresult="onMediaResult"/)
  assert.match(listenTemplate, /bindmediaStateChange="onMediaStateChange"/)
  assert.match(listenTemplate, /bindunauthorized="onMediaUnauthorized"/)
  // 未评分时传空串，避免 media 组件误显示哭脸
  assert.match(listenTemplate, /score="{{trackScores\[index\] \? trackScores\[index\] : ''}}"/)
})

test('follow-read panel uses full-bleed white mask without action labels', () => {
  assert.doesNotMatch(listenTemplate, /follow-label/)
  assert.doesNotMatch(listenTemplate, /听示范/)
  assert.doesNotMatch(listenTemplate, /点击跟读/)
  assert.doesNotMatch(listenTemplate, /我的跟读/)
  assert.match(listenTemplate, /follow-card/)
  assert.match(listenStyle, /\.follow-card\s*{/)
  assert.match(listenStyle, /justify-content:\s*center/)
  assert.match(listenStyle, /margin:\s*24rpx 0 0/)
  assert.match(listenStyle, /\.follow-card\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.34\)/s)
})

test('follow-read page shares the lavender-blue reference background', () => {
  assert.match(listenStyle, /\.listen-page\s*{[^}]*background:\s*linear-gradient\(180deg,\s*#dfd8ee 0%,\s*#ddd9f1 22%,\s*#ddddf7 38%,\s*#bdd0fb 56%,\s*#a5c5fe 76%,\s*#8bb6fa 100%\)/s)
})

test('listen page slides up from bottom when opened from tab bar', () => {
  assert.match(listenStyle, /page\s*{[^}]*background:\s*transparent/)
  assert.match(listenStyle, /\.listen-page-preenter\s*{[^}]*transform:\s*translateY\(100%\)/)
  assert.match(listenStyle, /listen-slide-up/)
  assert.match(listenScript, /pageAnimState:\s*'listen-page-preenter'/)
  assert.match(listenScript, /pageAnimState:\s*'listen-page-enter'/)
  assert.match(listenScript, /onShow\(\)\s*{/)
})

test('expanded lyric uses the same font size and blue highlight', () => {
  assert.match(listenStyle, /\.lyric-expanded \.lyric-en/)
  assert.match(listenStyle, /\.lyric-en\s*{[^}]*font-size:\s*36rpx/s)
  assert.doesNotMatch(listenStyle, /lyric-active\.lyric-word \.lyric-en/)
})

test('media result is cached per track and replayed when re-expanded', () => {
  assert.match(listenScript, /onMediaResult\(e\)\s*{/)
  assert.match(listenScript, /\['trackScores\[' \+ index \+ '\]'\]:\s*score/)
})

test('follow-read playback pauses the global player to avoid overlapping audio', () => {
  assert.match(listenScript, /onMediaStateChange\(e\)\s*{/)
  assert.match(listenScript, /e\.detail\.state !== 0 && this\.data\.playing/)
  assert.match(listenScript, /player\.pause\(\)/)
})

test('switching sentence or unit collapses the panel and clears stale scores', () => {
  assert.match(listenScript, /expandedIndex:\s*-1,\s*trackScores:\s*{}/)
  assert.match(listenStyle, /\.follow-panel\s*{/)
})
