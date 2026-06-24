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
  instantiateQuizQuestion,
  buildSpellChallenge
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

test('word-spelling challenge keeps the first letter and offers one correct segment', () => {
  const challenge = buildSpellChallenge('planet', () => 0.42)
  assert.ok(challenge)
  // 首字母不抽（前缀非空）
  assert.ok(challenge.prefix.length >= 1)
  // 抽段 + 前后缀拼回原词
  assert.equal(challenge.prefix + challenge.answer + challenge.suffix, 'planet')
  // 四选一、长度一致、恰有一个正确
  assert.equal(challenge.options.length, 4)
  challenge.options.forEach(option => assert.equal(option.text.length, challenge.answer.length))
  assert.equal(challenge.options.filter(option => option.isAnswer).length, 1)
  const answerOption = challenge.options.find(option => option.isAnswer)
  assert.equal(answerOption.text, challenge.answer)
  // 干扰项互不重复、且都不等于正确段
  const texts = challenge.options.map(option => option.text.toLowerCase())
  assert.equal(new Set(texts).size, texts.length)
})

test('word-spelling challenge is skipped for words shorter than 3 letters', () => {
  assert.equal(buildSpellChallenge('it'), null)
  assert.equal(buildSpellChallenge(''), null)
})

test('listening quiz spell step uses voice fallback when word audio is missing', () => {
  const source = buildListeningQuizQuestions([
    {
      word: { content: 'planet', translation: '行星', attribute: 'n.', symbol: 'ˈplænɪt' },
      proverb: [{ content: 'Bright planets cross the sky.', translation: 'X', audio: 'sentence.mp3' }]
    }
  ])[0]
  const view = instantiateQuizQuestion(source, () => 0.3)
  assert.ok(view.spell)
  assert.match(view.spell.audio, /dictvoice/)
})

test('listening quiz uses backend listenFill exercise payload', () => {
  const source = buildListeningQuizQuestions([
    {
      word: { content: 'computer', translation: '电脑', audio: 'word.mp3' },
      exercises: {
        listenFill: {
          audioUrl: 'fill.mp3',
          sentence: 'c_mp_t_r',
          translation: '电脑',
          gaps: [
            { gapIndex: 0, answer: 'o' },
            { gapIndex: 1, answer: 'u' },
            { gapIndex: 2, answer: 'e' }
          ],
          letterTiles: ['o', 'u', 'e', 'a', 'i']
        }
      },
      proverb: [{ content: 'I use a computer.', translation: '我用电脑。', audio: 'sentence.mp3' }]
    }
  ])[0]

  assert.equal(source.serverFill, true)
  const view = instantiateQuizQuestion(source, () => 0.5)
  assert.equal(view.parts.filter(part => part.type === 'blank').length, 3)
  assert.equal(view.options.length, 5)
  assert.equal(view.audio, 'fill.mp3')
  assert.deepEqual(view.gaps.map(gap => gap.answer), ['o', 'u', 'e'])
})

test('listening quiz uses backend listenFill parts array directly', () => {
  const source = buildListeningQuizQuestions([
    {
      word: { content: 'planet', translation: '行星' },
      exercises: {
        listenFill: {
          audioUrl: 'fill.mp3',
          parts: [
            { type: 'text', text: 'Bright ' },
            { type: 'blank', gapIndex: 0, answer: 'planets' },
            { type: 'text', text: ' cross the sky.' }
          ],
          gaps: [{ gapIndex: 0, answer: 'planets' }],
          options: [{ text: 'planets' }, { text: 'stars' }]
        }
      },
      proverb: [{ content: 'Bright planets cross the sky.', translation: 'X', audio: 'sentence.mp3' }]
    }
  ])[0]
  const view = instantiateQuizQuestion(source, () => 0.5)

  assert.equal(source.serverFill, true)
  assert.equal(view.parts.length, 3)
  assert.equal(view.options.length, 2)
})

test('listening quiz uses backend recite exercise fields', () => {
  const source = buildListeningQuizQuestions([
    {
      word: { content: 'planet', translation: '行星' },
      exercises: {
        recite: {
          meaning: 'n.行星（后端）',
          refText: 'planet',
          audioUrl: 'recite.mp3'
        }
      },
      proverb: [{ content: 'Bright planets cross the sky.', translation: '旧翻译', audio: 'sentence.mp3' }]
    }
  ])[0]

  assert.equal(source.translation, 'n.行星（后端）')
  assert.equal(source.reciteRefText, 'planet')
})

test('listening quiz accepts backend wordSpell exercise payload', () => {
  const source = buildListeningQuizQuestions([
    {
      word: { content: 'spade', translation: '铲子', attribute: 'n.' },
      exercises: {
        wordSpell: {
          prefix: 'sp',
          answer: 'ade',
          suffix: '',
          options: ['ade', 'aid', 'ide', 'ode']
        }
      },
      proverb: [{ content: 'He used a spade in the garden.', translation: 'X', audio: 'sentence.mp3' }]
    }
  ])[0]
  const view = instantiateQuizQuestion(source, () => 0.3)
  assert.ok(view.spell)
  assert.equal(view.spell.answer, 'ade')
  assert.equal(view.spell.options.length, 4)
})

test('listening quiz skips fill when backend only sends recite and wordSpell', () => {
  const {
    buildQuizStepList,
    hasFillStep
  } = require('../pages/listen/listen-quiz')
  const source = buildListeningQuizQuestions([
    {
      word: { content: 'planet', translation: '行星', attribute: 'n.' },
      exercises: {
        recite: { meaning: 'n.行星' },
        wordSpell: {
          prefix: 'pla',
          answer: 'net',
          suffix: '',
          options: ['net', 'nat', 'nit', 'not']
        }
      },
      proverb: [{ content: 'Bright planets cross the sky.', translation: 'X', audio: 'sentence.mp3' }]
    }
  ])[0]
  const view = instantiateQuizQuestion(source, () => 0.3)

  assert.ok(source.skipFill)
  assert.ok(view)
  assert.equal(view.skipFill, true)
  assert.equal(hasFillStep(view), false)
  assert.ok(view.spell)
  assert.deepEqual(
    buildQuizStepList(false, true, true).map(step => step.key),
    ['recite', 'spell']
  )
})

test('instantiated quiz question carries a spell challenge with word audio and symbol', () => {
  const source = buildListeningQuizQuestions([
    {
      word: { content: 'planet', translation: '行星', attribute: 'n.', audio: 'word.mp3', symbol: 'ˈplænɪt' },
      proverb: [{ content: 'Bright planets cross the sky.', translation: 'X', audio: 'sentence.mp3' }]
    }
  ])[0]
  const view = instantiateQuizQuestion(source, () => 0.3)
  assert.ok(view.spell)
  assert.equal(view.spell.word, 'planet')
  assert.equal(view.spell.audio, 'word.mp3')
  assert.equal(view.spell.symbol, '[ˈplænɪt]')
  assert.equal(view.spell.translation, 'n.行星')
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
  assert.match(listenStyle, /\.listen-quiz-shell\s*{[^}]*position:\s*fixed/s)
  assert.match(listenStyle, /\.listen-quiz-shell\s*{[^}]*transform:\s*none/s)
})

test('quiz recite media is reset before switching questions', () => {
  assert.match(listenScript, /cancelQuizReciteMedia\(\)/)
  assert.match(listenScript, /if\s*\(\s*this\.data\.quizPhase\s*===\s*'recite'\s*\)\s*{[\s\S]*cancelQuizReciteMedia\(\)/)
  assert.match(listenTemplate, /wx:key="{{quizIndex}}"/)
})

test('recite countdown advances without treating a zero score as missing', () => {
  // 背诵后改由 scheduleAfterRecite 分流（有拼写题进拼写，否则下一题）
  const scheduleAfterRecite = listenScript.match(/scheduleAfterRecite\(\)\s*{[\s\S]*?^  },/m)
  assert.ok(scheduleAfterRecite)
  assert.match(scheduleAfterRecite[0], /goToNextQuizQuestion\(\)/)
  assert.match(scheduleAfterRecite[0], /startQuizSpell\(\)/)
  assert.doesNotMatch(scheduleAfterRecite[0], /quizReciteScore/)
  assert.match(listenTemplate, /wx:if="{{quizNextCountdown > 0 && !quizNextPaused && \(quizChecked \|\| quizPhase === 'recite' \|\| \(quizPhase === 'spell' && quizSpellSelectedIndex != null\)\)}}"/)
  assert.match(listenTemplate, /{{quizNextCountdown}} 秒后{{quizNextIsSubmit \? '提交' : '进入下一步'}}/)
  assert.doesNotMatch(listenTemplate, /wx:if="{{quizReciteScore && quizNextCountdown > 0}}"/)
})

test('fill, recite and spell countdown use the same auto-advance copy', () => {
  const countdownCopies = [...listenTemplate.matchAll(/>{{quizNextCountdown}} 秒后{{quizNextIsSubmit \? '提交' : '进入下一步'}}，/g)]
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
  assert.match(listenScript, /quizHasSpell/)
  assert.match(listenScript, /quizHasFill/)
  assert.match(listenScript, /quizStepList/)
  assert.match(listenTemplate, /wx:for="{{quizStepList}}"/)
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

test('quiz page badge uses a dedicated class so it does not mask the whole screen', () => {
  assert.match(listenTemplate, /class="quiz-page-tag"/)
  assert.doesNotMatch(listenTemplate, /class="quiz-page">P/)
  assert.match(listenStyle, /\.quiz-page\s*{[^}]*background:\s*transparent/s)
  assert.match(listenStyle, /\.quiz-page-tag\s*{[^}]*background:\s*rgba\(38,\s*63,\s*69,\s*0\.08\)/s)
  assert.match(listenStyle, /\.quiz-body\s*{[^}]*flex:\s*1/s)
  assert.match(listenTemplate, /class="quiz-body"/)
  assert.doesNotMatch(listenTemplate, /quiz-help-icon/)
  assert.doesNotMatch(listenTemplate, /bindtap="showMarkTip"/)
})

test('quiz hint action aligns with the word-new hint placement', () => {
  assert.match(listenTemplate, /class="quiz-audio-hint"/)
  assert.match(listenTemplate, /word-new\/hint-bulb\.png/)
  assert.match(listenStyle, /\.quiz-bottom-area\s*{[^}]*margin-top:\s*auto/s)
  assert.match(listenStyle, /\.quiz-audio-hint\s*{[^}]*padding-top:\s*60rpx/s)
  assert.match(listenStyle, /\.quiz-bottom-area\s*{[^}]*padding-bottom:\s*calc\(env\(safe-area-inset-bottom\) \+ 24rpx\)/s)
  assert.match(listenStyle, /\.quiz-hint-btn\s*{[^}]*width:\s*108rpx/s)
  assert.match(listenStyle, /\.quiz-hint-icon\s*{[^}]*width:\s*66rpx/s)
  assert.match(listenStyle, /\.quiz-hint-label\s*{[^}]*margin-top:\s*32rpx/s)
  assert.match(listenStyle, /\.quiz-hint-label\s*{[^}]*font-size:\s*26rpx/s)
})

test('auto-advance countdown renders in the bottom area below the quiz card with one shared style', () => {
  assert.match(listenTemplate, /<view class="quiz-bottom-area">[\s\S]*<view\s+wx:if="{{quizNextCountdown > 0 && !quizNextPaused && \(quizChecked \|\| quizPhase === 'recite' \|\| \(quizPhase === 'spell' && quizSpellSelectedIndex != null\)\)}}"\s+class="quiz-countdown"/)
  // 暂停态复用同一个 quiz-countdown 容器（不引入独立样式），点按可恢复自动切换
  assert.match(listenTemplate, /<view\s+wx:elif="{{quizNextPaused && \(quizChecked \|\| quizPhase === 'recite' \|\| \(quizPhase === 'spell' && quizSpellSelectedIndex != null\)\)}}"\s+class="quiz-countdown"/)
  assert.match(listenTemplate, /catchtap="pauseQuizCountdown"/)
  assert.match(listenTemplate, /catchtap="resumeQuizNext"/)
  assert.match(listenTemplate, /已暂停自动切换/)
  assert.doesNotMatch(listenTemplate, /quiz-countdown-fill/)
  assert.doesNotMatch(listenTemplate, /quiz-countdown-recite/)
  assert.doesNotMatch(listenTemplate, /quiz-countdown-paused/)
  assert.doesNotMatch(listenStyle, /\.quiz-countdown-fill/)
  assert.doesNotMatch(listenStyle, /\.quiz-countdown-recite/)
  assert.doesNotMatch(listenStyle, /\.quiz-countdown-paused/)
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
