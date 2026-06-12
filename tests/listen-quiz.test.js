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

test('listening quiz shuffles option order instead of keeping sentence order', () => {
  const question = buildListeningQuizQuestions([
    {
      word: { content: 'thief' },
      proverb: [{
        content: 'Set a thief to catch a thief.',
        translation: '以贼捉贼。'
      }]
    }
  ])[0]

  const viewQuestion = instantiateQuizQuestion(question, () => 0.42)
  const gapAnswers = viewQuestion.gaps.map(gap => gap.answer)
  const optionTexts = viewQuestion.options.map(option => option.text)

  assert.deepEqual(gapAnswers.slice().sort(), optionTexts.slice().sort())
  if (gapAnswers.length > 1) {
    assert.notDeepEqual(gapAnswers, optionTexts)
  }
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

test('listening quiz prefers English proverb.label over Chinese proverb.content', () => {
  const questions = buildListeningQuizQuestions([
    {
      word: { content: 'apple' },
      proverb: [{
        content: '桌子上有一个苹果。',
        label: 'There is an apple on the table.',
        translation: '桌子上有一个苹果。',
        audio: 'https://example.test/apple.mp3'
      }]
    }
  ])

  assert.equal(questions.length, 1)
  assert.equal(questions[0].sentence, 'There is an apple on the table.')
  assert.equal(questions[0].audio, 'https://example.test/apple.mp3')
})

test('listening quiz falls back to word audio when proverb audio is missing', () => {
  const questions = buildListeningQuizQuestions([
    {
      word: {
        content: 'apple',
        sentenceAudio: 'https://example.test/word-sentence.mp3'
      },
      proverb: [{
        content: 'There is an apple on the table.',
        label: 'There is an apple on the table.',
        translation: '桌子上有一个苹果。'
      }]
    }
  ])

  assert.equal(questions.length, 1)
  assert.equal(questions[0].audio, 'https://example.test/word-sentence.mp3')
})

test('listening quiz strips pronunciation markers from proverb.label', () => {
  const questions = buildListeningQuizQuestions([
    {
      word: { content: 'apple' },
      proverb: [{
        content: '桌子上有一个苹果。',
        label: '(s:1)There (g:1)is an apple on the table.',
        translation: '桌子上有一个苹果。'
      }]
    }
  ])

  assert.equal(questions.length, 1)
  assert.equal(questions[0].sentence, 'There is an apple on the table.')
})

test('listening quiz only blanks non-target words from the same unit sentence', () => {
  const questions = buildListeningQuizQuestions([
    {
      word: { content: 'apple' },
      proverb: [{ content: 'The apple is on the table.', translation: '苹果在桌子上。' }]
    },
    {
      word: { content: 'table' },
      proverb: [{ content: 'The apple is on the table.', translation: '苹果在桌子上。' }]
    }
  ])

  assert.equal(questions.length, 2)
  assert.equal(questions[0].word, 'apple')
  assert.equal(questions[1].word, 'table')
  assert.ok(questions[0].matches.some(match => match.text === 'table'))
  assert.ok(questions[1].matches.some(match => match.text === 'apple'))
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

test('quiz mode uses standard page navigation instead of bottom sheet animation', () => {
  assert.match(listenScript, /确认退出当前学习/)
  assert.match(listenScript, /学习贵在坚持，每天进步一点点/)
  assert.match(listenScript, /if \(this\.data\.quizMode\)\s*{[\s\S]*?wx\.navigateBack\(\)/)
  assert.match(listenScript, /if \(this\.data\.quizMode\)\s*{\s*return\s*}/)
  assert.match(listenTemplate, /quizMode \? 'listen-quiz-shell' : pageAnimState/)
  assert.match(listenTemplate, /<dialog dialog="{{dialog}}"><\/dialog>/)
  assert.match(listenStyle, /\.listen-quiz-shell\s*{[^}]*position:\s*relative/s)
  assert.match(listenStyle, /\.listen-quiz-shell\s*{[^}]*transform:\s*none/s)
})

test('quiz recite media is reset before switching questions', () => {
  assert.match(listenScript, /cancelQuizReciteMedia\(\)/)
  assert.match(listenScript, /if\s*\(\s*this\.data\.quizPhase\s*===\s*'recite'\s*\)\s*{[\s\S]*cancelQuizReciteMedia\(\)/)
  assert.match(listenTemplate, /wx:key="{{quizIndex}}"/)
})

test('recite countdown advances without treating a zero score as missing', () => {
  const scheduleReciteToNext = listenScript.match(/scheduleReciteToNext\(\)\s*{[\s\S]*?^  },/m)
  assert.ok(scheduleReciteToNext)
  assert.match(scheduleReciteToNext[0], /goToNextQuizQuestion\(\)/)
  assert.doesNotMatch(scheduleReciteToNext[0], /quizReciteScore/)
  assert.match(listenTemplate, /wx:if="{{quizNextCountdown > 0 && \(quizChecked \|\| quizPhase === 'recite'\)}}"/)
  assert.match(listenTemplate, /{{quizNextCountdown}} 秒后进入下一步/)
  assert.doesNotMatch(listenTemplate, /wx:if="{{quizReciteScore && quizNextCountdown > 0}}"/)
})

test('fill and recite countdown use the same auto-advance copy', () => {
  const countdownCopies = [...listenTemplate.matchAll(/>{{quizNextCountdown}} 秒后进入下一步<\/view>/g)]
  assert.equal(countdownCopies.length, 1)
  assert.doesNotMatch(listenTemplate, /秒后自动进入背诵/)
  assert.doesNotMatch(listenTemplate, /秒后即将切换下一单词/)
})

test('listen page renders a home-styled fill-in quiz with top progress and new words', () => {
  assert.match(listenScript, /quizMode/)
  assert.match(listenScript, /buildListeningQuizQuestions/)
  assert.match(listenScript, /onQuizOptionTap/)
  assert.match(listenScript, /onQuizBlankTap/)
  assert.match(listenScript, /quizProgressPercent/)
  assert.match(listenScript, /instantiateQuizQuestion/)
  assert.match(listenScript, /rememberQuizWordResult/)
  assert.match(listenScript, /postListeningQuizResult/)
  assert.match(listenScript, /setQuizViewQuestion\(question, true[\s\S]*rememberQuizWordResult/)
  assert.match(listenTemplate, /word-new\/hint-bulb\.png/)
  assert.match(listenTemplate, /wx:if="{{!loading && quizMode}}"/)
  assert.match(listenTemplate, /正在准备关卡小测/)
  assert.match(listenTemplate, /随机生成填空中/)
  assert.match(listenTemplate, /listen-quiz-top-progress/)
  assert.match(listenTemplate, /quizProgressPercent/)
  assert.match(listenTemplate, /bindtap="onQuizOptionTap"/)
  assert.match(listenTemplate, /bindtap="onQuizBlankTap"/)
  assert.match(listenTemplate, /listen-quiz-shell/)
  assert.match(listenStyle, /\.listen-page\s*{[^}]*background:\s*linear-gradient\(180deg,\s*#dfd8ee 0%,\s*#ddd9f1 22%,\s*#ddddf7 38%,\s*#bdd0fb 56%,\s*#a5c5fe 76%,\s*#8bb6fa 100%\)/s)
  assert.match(listenStyle, /\.listen-quiz-shell\s*{[^}]*background:\s*linear-gradient\(180deg,\s*#dfd8ee 0%,\s*#ddd9f1 22%,\s*#ddddf7 38%,\s*#bdd0fb 56%,\s*#a5c5fe 76%,\s*#8bb6fa 100%\)/s)
  assert.match(listenStyle, /\.quiz-page\s*{[^}]*background:\s*transparent/s)
  assert.match(listenStyle, /\.quiz-card\s*{[^}]*border-radius:\s*29rpx/s)
  assert.match(listenStyle, /\.listen-quiz-top-progress-fill\s*{[^}]*background:\s*#111318/s)
  assert.match(listenStyle, /\.quiz-option\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.42\)/s)
  assert.match(listenTemplate, /bindbeforeplay="onQuizMediaBeforePlay"/)
  assert.match(listenStyle, /\.quiz-recite-panel\.listen-full-bleed\s*{[^}]*margin-left:\s*-29rpx/s)
  assert.match(listenStyle, /\.quiz-recite-media \.recording\s*{[^}]*left:\s*-48rpx/s)
  assert.match(listenStyle, /\.quiz-recite-media \.recording-wave\s*{[^}]*min-width:\s*0/s)
  assert.match(listenStyle, /\.loading-panel\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.62\)/s)
})

test('quiz hint action aligns with the word-new hint placement', () => {
  assert.match(listenTemplate, /class="quiz-audio-hint"/)
  assert.match(listenTemplate, /word-new\/hint-bulb\.png/)
  assert.match(listenStyle, /\.quiz-audio-hint\s*{[^}]*margin-top:\s*auto/s)
  assert.match(listenStyle, /\.quiz-audio-hint\s*{[^}]*padding-top:\s*60rpx/s)
  assert.match(listenStyle, /\.quiz-audio-hint\s*{[^}]*padding-bottom:\s*126rpx/s)
  assert.match(listenStyle, /\.quiz-hint-btn\s*{[^}]*width:\s*108rpx/s)
  assert.match(listenStyle, /\.quiz-hint-icon\s*{[^}]*width:\s*66rpx/s)
  assert.match(listenStyle, /\.quiz-hint-label\s*{[^}]*margin-top:\s*32rpx/s)
  assert.match(listenStyle, /\.quiz-hint-label\s*{[^}]*font-size:\s*26rpx/s)
})

test('auto-advance countdown renders below the quiz card with one shared style', () => {
  assert.match(listenTemplate, /<\/view>\s*<view\s+wx:if="{{quizNextCountdown > 0 && \(quizChecked \|\| quizPhase === 'recite'\)}}"\s+class="quiz-countdown"/)
  assert.doesNotMatch(listenTemplate, /quiz-countdown-fill/)
  assert.doesNotMatch(listenTemplate, /quiz-countdown-recite/)
  assert.doesNotMatch(listenStyle, /\.quiz-countdown-fill/)
  assert.doesNotMatch(listenStyle, /\.quiz-countdown-recite/)
  assert.doesNotMatch(listenStyle, /\.quiz-countdown\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\)/s)
})

test('quiz screen keeps instructional copy and answer text lightly weighted', () => {
  assert.match(listenStyle, /\.quiz-guide\s*{[^}]*font-weight:\s*400/s)
  assert.match(listenStyle, /\.quiz-sentence\s*{[^}]*font-weight:\s*500/s)
  assert.match(listenStyle, /\.quiz-recite-sentence\s*{[^}]*font-weight:\s*500/s)
  assert.match(listenStyle, /\.quiz-option\s*{[^}]*font-weight:\s*500/s)
  assert.doesNotMatch(listenStyle, /\.quiz-guide\s*{[^}]*font-weight:\s*[678]00/s)
  assert.doesNotMatch(listenStyle, /\.quiz-option\s*{[^}]*font-weight:\s*[678]00/s)
})
