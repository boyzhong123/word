const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const homeScript = fs.readFileSync(path.join(projectRoot, 'pages/home/home.js'), 'utf8')
const listenScript = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.js'), 'utf8')
const listenTemplate = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.wxml'), 'utf8')
const listenStyle = fs.readFileSync(path.join(projectRoot, 'pages/listen/listen.wxss'), 'utf8')

const {
  buildListeningQuizQuestions,
  buildLearningWords,
  instantiateQuizQuestion
} = require('../pages/listen/listen-quiz')

test('listening quiz builds fill-in questions from unit example sentences', () => {
  const questions = buildListeningQuizQuestions([
    {
      word: { content: 'beverage', translation: '饮料' },
      proverb: [{
        content: 'A new study finds that beverages containing added sugar might be harmful.',
        translation: '一项新研究发现，含有添加糖的饮料可能有害。',
        audio: 'https://example.test/sentence.mp3'
      }]
    }
  ])

  assert.equal(questions.length, 1)
  assert.equal(questions[0].audio, 'https://example.test/sentence.mp3')
  assert.equal(questions[0].translation, '一项新研究发现，含有添加糖的饮料可能有害。')
  assert.equal(questions[0].word, 'beverage')
  assert.ok(Array.isArray(questions[0].matches))

  const viewQuestion = instantiateQuizQuestion(questions[0], () => 0.1)
  assert.ok(viewQuestion.parts.some(part => part.type === 'blank'))
  assert.ok(viewQuestion.gaps.length >= 1)
  assert.ok(viewQuestion.options.length >= viewQuestion.gaps.length)
  assert.deepEqual(
    viewQuestion.gaps.map(gap => gap.answer).sort(),
    viewQuestion.options.slice(0, viewQuestion.gaps.length).map(option => option.text).sort()
  )
})

test('listening quiz instantiates random front-end blanks for the same sentence', () => {
  const question = buildListeningQuizQuestions([
    {
      word: { content: 'planet', translation: '行星' },
      proverb: [{
        content: 'Bright planets slowly cross the quiet winter sky.',
        translation: '明亮的行星慢慢穿过安静的冬夜天空。'
      }]
    }
  ])[0]

  let ascIndex = 0
  let descIndex = 0
  const first = instantiateQuizQuestion(question, () => {
    ascIndex += 1
    return ascIndex / 20
  })
  const second = instantiateQuizQuestion(question, () => {
    descIndex += 1
    return 1 - descIndex / 20
  })

  assert.notDeepEqual(
    first.gaps.map(gap => gap.answer),
    second.gaps.map(gap => gap.answer)
  )
})

test('listening quiz exposes newly learned words from the same unit resource', () => {
  const words = buildLearningWords([
    { word: { content: 'study', translation: '学习', attribute: 'n.', symbol: 'studi' } },
    { word: { content: 'beverage', translation: '饮料', attribute: 'n.' } },
    { word: { content: 'study', translation: '研究' } }
  ])

  assert.deepEqual(words, [
    { content: 'study', translation: 'n.学习', symbol: '[studi]' },
    { content: 'beverage', translation: 'n.饮料', symbol: '' }
  ])
})

test('home listening task navigates to the listen quiz mode', () => {
  assert.match(homeScript, /taskType !== 'word' && taskType !== 'recitation' && taskType !== 'listening'/)
  assert.match(homeScript, /navigateToListeningUnit\(unit\)/)
  assert.match(homeScript, /pages\/listen\/listen\?/)
  assert.match(homeScript, /mode=quiz/)
})

test('listen page renders a home-styled fill-in quiz with top progress and new words', () => {
  assert.match(listenScript, /quizMode/)
  assert.match(listenScript, /buildListeningQuizQuestions/)
  assert.match(listenScript, /onQuizOptionTap/)
  assert.match(listenScript, /onQuizBlankTap/)
  assert.match(listenScript, /quizProgressPercent/)
  assert.match(listenScript, /instantiateQuizQuestion/)
  assert.match(listenScript, /rememberQuizWordResult/)
  assert.match(listenScript, /reportListeningQuizResult/)
  assert.match(listenTemplate, /wx:if="{{!loading && quizMode}}"/)
  assert.match(listenTemplate, /正在准备听力小测/)
  assert.match(listenTemplate, /随机生成填空中/)
  assert.match(listenTemplate, /listen-top-progress/)
  assert.match(listenTemplate, /quizMode \? quizProgressPercent : progress/)
  assert.match(listenTemplate, /class="quiz-new-words"/)
  assert.match(listenTemplate, /bindtap="onQuizOptionTap"/)
  assert.match(listenTemplate, /bindtap="onQuizBlankTap"/)
  assert.match(listenTemplate, /listen-quiz-shell/)
  assert.match(listenStyle, /\.listen-page\s*{[^}]*background:\s*linear-gradient\(180deg,\s*#eaf4ff/s)
  assert.match(listenStyle, /\.listen-quiz-shell\s*{[^}]*background:\s*linear-gradient\(180deg,\s*#e7e1f3/s)
  assert.match(listenStyle, /\.quiz-page\s*{[^}]*background:\s*linear-gradient\(180deg,\s*#e7e1f3/s)
  assert.match(listenStyle, /\.quiz-card\s*{[^}]*border-radius:\s*29rpx/s)
  assert.match(listenStyle, /\.listen-quiz-shell \.listen-top-progress-fill\s*{[^}]*background:\s*#111318/s)
  assert.match(listenStyle, /\.quiz-option\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.42\)/s)
  assert.match(listenStyle, /\.loading-panel\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.34\)/s)
})
