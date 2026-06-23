const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const listenScript = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.js'), 'utf8')
const listenTemplate = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.wxml'), 'utf8')
const listenPlayerTemplate = fs.readFileSync(path.join(projectRoot, 'components/listen-player/listen-player.wxml'), 'utf8')
const listenPlayerScript = fs.readFileSync(path.join(projectRoot, 'components/listen-player/listen-player.js'), 'utf8')
const playerScript = fs.readFileSync(path.join(projectRoot, 'utils/player.js'), 'utf8')
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

test('follow-read recording overlay aligns to follow-recite-panel and uses canvas wave', () => {
  assert.match(listenScript, /syncFollowRecordingOverlay\(/)
  assert.match(listenScript, /mediaSelector:\s*'\.follow-media'/)
  assert.match(listenScript, /utils\/recording-overlay/)
  assert.match(listenTemplate, /<wave-line wx:key="frw-\{\{followRecordingOverlay\.waveSession\}\}" class="follow-recording-wave" \/>/)
  assert.doesNotMatch(listenTemplate, /<wave-line[^>]*variant="css"/)
  assert.match(listenTemplate, /catchtouchmove="\{\{followRecordingOverlay\.active \? 'noop' : ''\}\}"/)
  assert.match(listenTemplate, /follow-recording-overlay-root/)
  assert.doesNotMatch(listenScript, /restartFollowRecordingWave/)
  const finishGuideBody = listenScript.match(/finishListenGuide\(\)\s*{([\s\S]*?)\n  },/)
  assert.ok(finishGuideBody)
  assert.doesNotMatch(finishGuideBody[1], /hideFollowRecordingOverlay/)
  assert.match(listenPlayerScript, /mediaSelector:\s*'\.follow-media'/)
  assert.match(listenPlayerTemplate, /<wave-line wx:key="frw-\{\{followRecordingOverlay\.waveSession\}\}" class="follow-recording-wave" \/>/)
  assert.doesNotMatch(listenPlayerTemplate, /<wave-line[^>]*variant="css"/)
  assert.match(listenPlayerTemplate, /follow-recording-overlay-root/)
})

test('follow-read panel embeds media wired with the track audio / refText / coreType', () => {
  assert.match(listenTemplate, /<view wx:if="{{expandedIndex == index}}" class="follow-panel" catchtap="noop">/)
  assert.match(listenTemplate, /overlay-record="{{true}}"/)
  assert.match(listenTemplate, /_audio="{{item\.audio}}"/)
  assert.match(listenTemplate, /_refText="{{item\.refText \|\| item\.content}}"/)
  assert.match(listenTemplate, /_coreType="{{item\.type == 'word' \? 'en\.word\.score' : 'en\.sent\.score'}}"/)
  assert.match(listenTemplate, /bindresult="onMediaResult"/)
  assert.match(listenTemplate, /bindmediaStateChange="onMediaStateChange"/)
  assert.match(listenTemplate, /bindunauthorized="onMediaUnauthorized"/)
  assert.match(listenTemplate, /score="{{trackScores\[index\] && trackScores\[index\]\.score != undefined \? trackScores\[index\]\.score : ''}}"/)
  assert.match(listenTemplate, /follow-recording-overlay/)
})

test('follow-read lyrics paint scored words with the shared practice color helper', () => {
  assert.match(listenTemplate, /paintHandler\.splitText/)
  assert.match(listenTemplate, /paintHandler\.paintColor/)
  assert.match(listenPlayerTemplate, /paintHandler\.splitText/)
  assert.match(listenPlayerTemplate, /paintHandler\.paintColor/)
})

test('follow-read panel uses full-bleed white mask without action labels', () => {
  assert.doesNotMatch(listenTemplate, /follow-label/)
  assert.doesNotMatch(listenTemplate, /听示范/)
  assert.doesNotMatch(listenTemplate, /点击跟读/)
  assert.doesNotMatch(listenTemplate, /我的跟读/)
  assert.match(listenTemplate, /follow-card/)
  assert.match(listenStyle, /\.follow-card\s*{/)
  assert.match(listenStyle, /justify-content:\s*space-around/)
  assert.match(listenStyle, /margin:\s*24rpx 0 0/)
  assert.match(listenStyle, /\.follow-media \.recording\s*{[^}]*display:\s*none !important/s)
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
  assert.match(listenScript, /score:\s*score/)
  assert.match(listenScript, /detail:\s*detail/)
  assert.match(listenPlayerScript, /detail:\s*detail/)
})

test('listen tracks use proverb label for display and English refText for scoring', () => {
  assert.match(playerScript, /resolveProverbDisplayText\(p\)/)
  assert.match(playerScript, /resolveProverbRefText\(p\)/)
  assert.match(playerScript, /wordContent:\s*\(item\.word && item\.word\.content\)/)
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

test('first visit listen guide walks swipe, expand sentence, and auto record', () => {
  const guideUtil = fs.readFileSync(path.join(projectRoot, 'utils/listen-guide.js'), 'utf8')
  assert.match(guideUtil, /listen-first-guide-done/)
  assert.match(guideUtil, /findGuideTrackIndex/)
  assert.match(guideUtil, /item\.type === 'sentence'/)
  assert.match(listenScript, /maybeStartListenGuide\(\)/)
  assert.match(listenScript, /listenGuideStep:\s*'swipe'/)
  assert.match(listenScript, /advanceListenGuideToEvaluate\(\)/)
  assert.match(listenScript, /onListenGuideAudioEnd\(\)/)
  assert.match(listenScript, /media\.startRecord\(\)/)
  assert.match(listenScript, /finishListenGuide\(\)/)
  assert.match(listenTemplate, /listen-guide-swipe/)
  assert.match(listenTemplate, /listen-guide-coach-mascot/)
  assert.match(listenTemplate, /bindaudioEnd="onFollowMediaAudioEnd"/)
  assert.match(listenStyle, /\.listen-guide-controls-block\s*{/)
})
