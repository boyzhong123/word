// utils/exam-data.js
// 入门测 / 结业测的静态题库与组卷逻辑。
// 目前内容由前端写死，后期对接后端时只需替换 getExam()，让它返回相同结构即可，
// 答题页与报告页无需改动。
//
// 数据约定（一道题）：
//   {
//     id, section: 'word' | 'sentence',
//     type, typeLabel,              // 题型机器标识 + 中文标签
//     interaction: 'choice' | 'order',
//     stem, stemSub,                // 题干主文本 / 副文本（音标、提示）
//     audioWord,                    // 听力题朗读的单词（暂用文字占位，接入TTS后播放）
//     options: ['A', 'B', ...],     // 选择题选项
//     answer,                       // choice: 正确选项下标；order: 正确词序数组
//     tokens,                       // order 题打乱后的词块
//     explain                       // 解析
//   }

// ----------------------------- 静态词库 -----------------------------
// 初中核心词，带音标、词性、释义与一条例句（例句用于「词汇运用」填空题）。
var WORD_POOL = [
  { spell: 'brave', phonetic: '/breɪv/', pos: 'adj.', meaning: '勇敢的', sentence: 'A ___ heart never gives up.', sentenceCn: '勇敢的心永不放弃。' },
  { spell: 'honest', phonetic: '/ˈɒn.ɪst/', pos: 'adj.', meaning: '诚实的', sentence: 'An ___ man keeps his word.', sentenceCn: '诚实的人信守诺言。' },
  { spell: 'effort', phonetic: '/ˈef.ət/', pos: 'n.', meaning: '努力', sentence: 'Success comes from hard ___.', sentenceCn: '成功源于努力。' },
  { spell: 'wisdom', phonetic: '/ˈwɪz.dəm/', pos: 'n.', meaning: '智慧', sentence: 'Knowledge is the source of ___.', sentenceCn: '知识是智慧的源泉。' },
  { spell: 'patient', phonetic: '/ˈpeɪ.ʃənt/', pos: 'adj.', meaning: '有耐心的', sentence: 'Be ___ and you will win.', sentenceCn: '耐心一点，你会赢的。' },
  { spell: 'courage', phonetic: '/ˈkʌr.ɪdʒ/', pos: 'n.', meaning: '勇气', sentence: '___ opens every door.', sentenceCn: '勇气能打开每一扇门。' },
  { spell: 'friendship', phonetic: '/ˈfrend.ʃɪp/', pos: 'n.', meaning: '友谊', sentence: 'True ___ lasts forever.', sentenceCn: '真正的友谊天长地久。' },
  { spell: 'progress', phonetic: '/ˈprəʊ.ɡres/', pos: 'n.', meaning: '进步', sentence: 'Every day brings new ___.', sentenceCn: '每天都有新的进步。' },
  { spell: 'promise', phonetic: '/ˈprɒm.ɪs/', pos: 'n.', meaning: '承诺', sentence: 'Always keep your ___.', sentenceCn: '永远信守你的承诺。' },
  { spell: 'knowledge', phonetic: '/ˈnɒl.ɪdʒ/', pos: 'n.', meaning: '知识', sentence: '___ is power.', sentenceCn: '知识就是力量。' },
  { spell: 'mistake', phonetic: '/mɪˈsteɪk/', pos: 'n.', meaning: '错误', sentence: 'We learn from every ___.', sentenceCn: '我们从每个错误中学习。' },
  { spell: 'confident', phonetic: '/ˈkɒn.fɪ.dənt/', pos: 'adj.', meaning: '自信的', sentence: 'Stay ___ in hard times.', sentenceCn: '困难时也要保持自信。' },
  { spell: 'respect', phonetic: '/rɪˈspekt/', pos: 'n.', meaning: '尊重', sentence: '___ others to earn respect.', sentenceCn: '尊重别人才能赢得尊重。' },
  { spell: 'dream', phonetic: '/driːm/', pos: 'n.', meaning: '梦想', sentence: 'Hold fast to your ___.', sentenceCn: '紧紧抓住你的梦想。' },
  { spell: 'kindness', phonetic: '/ˈkaɪnd.nəs/', pos: 'n.', meaning: '善良', sentence: '___ is a language everyone understands.', sentenceCn: '善良是人人都懂的语言。' },
  { spell: 'success', phonetic: '/səkˈses/', pos: 'n.', meaning: '成功', sentence: '___ belongs to those who try.', sentenceCn: '成功属于勇于尝试的人。' }
]

// 格言谚语库：英文、中文、用于完形填空挖空的关键词。
var PROVERB_POOL = [
  { en: 'Where there is a will, there is a way.', cn: '有志者事竟成。', blank: 'will' },
  { en: 'Practice makes perfect.', cn: '熟能生巧。', blank: 'Practice' },
  { en: 'No pain, no gain.', cn: '不劳无获。', blank: 'pain' },
  { en: 'Time and tide wait for no man.', cn: '岁月不待人。', blank: 'tide' },
  { en: 'Actions speak louder than words.', cn: '事实胜于雄辩。', blank: 'Actions' },
  { en: 'Honesty is the best policy.', cn: '诚实为上策。', blank: 'Honesty' },
  { en: 'A friend in need is a friend indeed.', cn: '患难见真情。', blank: 'need' },
  { en: 'Knowledge is power.', cn: '知识就是力量。', blank: 'Knowledge' },
  { en: 'Well begun is half done.', cn: '良好的开端是成功的一半。', blank: 'begun' },
  { en: 'Many hands make light work.', cn: '人多好办事。', blank: 'hands' },
  { en: 'Every cloud has a silver lining.', cn: '黑暗中总有一线光明。', blank: 'silver' },
  { en: 'Look before you leap.', cn: '三思而后行。', blank: 'leap' }
]

// ----------------------------- 工具函数 -----------------------------
// 轻量可重复随机：同一 seed 产生同一序列，保证一份卷子每次进入都一致。
function makeRandom(seed) {
  var state = (seed || 1) >>> 0
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function shuffle(list, random) {
  var arr = list.slice()
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1))
    var tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

// 从词库里挑 count 个干扰项的某个字段值，排除正确答案。
function pickDistractors(pool, field, excludeValue, count, random) {
  var candidates = pool
    .map(function (item) { return item[field] })
    .filter(function (value) { return value && value !== excludeValue })
  var picked = shuffle(candidates, random).slice(0, count)
  return picked
}

// 把正确答案与干扰项混合成 options，并返回正确下标。
function buildOptions(correct, distractors, random) {
  var all = shuffle([correct].concat(distractors), random)
  return { options: all, answer: all.indexOf(correct) }
}

function stripPunctuation(text) {
  return String(text || '').replace(/[.,!?;:]+$/, '')
}

function normalizePracticeSeconds(value) {
  var seconds = Math.round(Number(value) || 0)
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 0
  }
  return seconds
}

function formatPracticeTime(seconds) {
  seconds = normalizePracticeSeconds(seconds)
  if (!seconds) {
    return ''
  }
  return Math.max(1, Math.ceil(seconds / 60)) + '分'
}

// 单词发音地址。当前用有道词典 TTS（InnerAudioContext 播放媒体不受小程序域名白名单限制），
// 后期对接后端音频时，把这里换成接口返回的 audioUrl 即可，其余逻辑不变。
// type=1 英式，type=2 美式。
function voiceUrl(word) {
  return 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(word) + '&type=1'
}

// ----------------------------- 组卷 -----------------------------
// 单词模块：四种题型轮流覆盖整个词库。
function buildWordQuestions(random) {
  var questions = []
  WORD_POOL.forEach(function (word, index) {
    var typeIndex = index % 4
    var built

    if (typeIndex === 0) {
      // 词义选择：看英文 + 音标，选中文释义
      built = buildOptions(word.meaning, pickDistractors(WORD_POOL, 'meaning', word.meaning, 3, random), random)
      questions.push({
        id: 'w' + index,
        section: 'word',
        type: 'word-cn',
        typeLabel: '词义理解',
        interaction: 'choice',
        stem: word.spell,
        stemSub: word.phonetic,
        options: built.options,
        answer: built.answer,
        explain: word.spell + ' ' + word.pos + ' ' + word.meaning
      })
    } else if (typeIndex === 1) {
      // 看义选词：看中文，选英文单词
      built = buildOptions(word.spell, pickDistractors(WORD_POOL, 'spell', word.spell, 3, random), random)
      questions.push({
        id: 'w' + index,
        section: 'word',
        type: 'word-en',
        typeLabel: '看义选词',
        interaction: 'choice',
        stem: word.meaning,
        stemSub: word.pos,
        options: built.options,
        answer: built.answer,
        explain: word.meaning + ' → ' + word.spell
      })
    } else if (typeIndex === 2) {
      // 听音辨词：朗读单词，选对应拼写（音频后期接入，先给播放按钮）
      built = buildOptions(word.spell, pickDistractors(WORD_POOL, 'spell', word.spell, 3, random), random)
      questions.push({
        id: 'w' + index,
        section: 'word',
        type: 'word-audio',
        typeLabel: '听音辨词',
        interaction: 'choice',
        stem: '',
        stemSub: '点击喇叭听发音，选出正确单词',
        audioWord: word.spell,
        audioUrl: voiceUrl(word.spell),
        options: built.options,
        answer: built.answer,
        explain: word.spell + ' ' + word.phonetic + ' ' + word.meaning
      })
    } else {
      // 词汇运用：例句挖空选词
      built = buildOptions(word.spell, pickDistractors(WORD_POOL, 'spell', word.spell, 3, random), random)
      questions.push({
        id: 'w' + index,
        section: 'word',
        type: 'word-fill',
        typeLabel: '词汇运用',
        interaction: 'choice',
        stem: word.sentence,
        stemSub: word.sentenceCn,
        options: built.options,
        answer: built.answer,
        explain: '正确填入 ' + word.spell + '（' + word.meaning + '）'
      })
    }
  })
  return questions
}

// 句子模块：四种题型轮流覆盖格言库。
function buildSentenceQuestions(random) {
  var questions = []
  PROVERB_POOL.forEach(function (proverb, index) {
    var typeIndex = index % 4
    var built

    if (typeIndex === 0) {
      // 句意理解：看英文格言，选中文意思
      built = buildOptions(proverb.cn, pickDistractors(PROVERB_POOL, 'cn', proverb.cn, 3, random), random)
      questions.push({
        id: 's' + index,
        section: 'sentence',
        type: 'sentence-cn',
        typeLabel: '句意理解',
        interaction: 'choice',
        stem: proverb.en,
        stemSub: '',
        options: built.options,
        answer: built.answer,
        explain: proverb.en + '  ' + proverb.cn
      })
    } else if (typeIndex === 1) {
      // 句子翻译：看中文，选对应英文格言
      built = buildOptions(proverb.en, pickDistractors(PROVERB_POOL, 'en', proverb.en, 3, random), random)
      questions.push({
        id: 's' + index,
        section: 'sentence',
        type: 'sentence-en',
        typeLabel: '句子翻译',
        interaction: 'choice',
        stem: proverb.cn,
        stemSub: '',
        options: built.options,
        answer: built.answer,
        explain: proverb.cn + '  ' + proverb.en
      })
    } else if (typeIndex === 2) {
      // 完形填空：格言挖掉关键词，选词补全
      var blanked = proverb.en.replace(new RegExp('\\b' + proverb.blank + '\\b'), '____')
      var distractors = pickDistractors(PROVERB_POOL, 'blank', proverb.blank, 3, random)
      built = buildOptions(proverb.blank, distractors, random)
      questions.push({
        id: 's' + index,
        section: 'sentence',
        type: 'sentence-cloze',
        typeLabel: '完形填空',
        interaction: 'choice',
        stem: blanked,
        stemSub: proverb.cn,
        options: built.options,
        answer: built.answer,
        explain: '正确填入 ' + proverb.blank
      })
    } else {
      // 连词成句：打乱英文格言的单词，点选排序
      var words = stripPunctuation(proverb.en).split(' ')
      questions.push({
        id: 's' + index,
        section: 'sentence',
        type: 'sentence-order',
        typeLabel: '连词成句',
        interaction: 'order',
        stem: proverb.cn,
        stemSub: '点选下方词块，组成正确的英文句子',
        tokens: shuffle(words, random),
        answer: words,
        explain: proverb.en
      })
    }
  })
  return questions
}

// 组一份完整卷子。type: 'entry' | 'exit'
function buildExam(type) {
  // 入门测与结业测用不同 seed，使题目顺序/选项排布有差异，但考点完全一致，便于对比。
  var random = makeRandom(type === 'exit' ? 20260615 : 13572468)
  var wordQuestions = buildWordQuestions(random)
  var sentenceQuestions = buildSentenceQuestions(random)
  var all = wordQuestions.concat(sentenceQuestions)

  return {
    type: type,
    title: type === 'exit' ? '结业测 · 通关测评' : '入门测 · 摸底测评',
    subtitle: type === 'exit' ? '检验整本书的学习成果' : '了解你的当前水平',
    total: all.length,
    sections: [
      { key: 'word', name: '单词', desc: '词义 · 拼写 · 听辨 · 运用', count: wordQuestions.length },
      { key: 'sentence', name: '句子', desc: '句意 · 翻译 · 完形 · 成句', count: sentenceQuestions.length }
    ],
    questions: all
  }
}

// 暴露给答题页：传 resBookId 是为了后期接口按书取题，目前忽略。
function getExam(resBookId, type) {
  return buildExam(type === 'exit' ? 'exit' : 'entry')
}

// ----------------------------- 评分与存储 -----------------------------
function storageKey(resBookId, type) {
  return 'exam_result_' + (resBookId || 'default') + '_' + type
}

// 判一道题对错。order 题需整句顺序完全一致。
function isCorrect(question, response) {
  if (!question) {
    return false
  }
  if (question.interaction === 'order') {
    var answer = question.answer || []
    var resp = response || []
    if (answer.length !== resp.length) {
      return false
    }
    for (var i = 0; i < answer.length; i++) {
      if (answer[i] !== resp[i]) {
        return false
      }
    }
    return true
  }
  return response === question.answer
}

// 汇总成绩。responses 为 questionId -> 作答。
function scoreExam(exam, responses, options) {
  responses = responses || {}
  options = options || {}
  var sectionAgg = { word: { correct: 0, total: 0 }, sentence: { correct: 0, total: 0 } }
  var typeAgg = {}
  var wrong = []

  exam.questions.forEach(function (q) {
    var ok = isCorrect(q, responses[q.id])
    var seg = sectionAgg[q.section]
    seg.total += 1
    if (ok) {
      seg.correct += 1
    } else {
      wrong.push({ id: q.id, type: q.type, typeLabel: q.typeLabel, stem: q.stem || q.stemSub, explain: q.explain })
    }
    if (!typeAgg[q.type]) {
      typeAgg[q.type] = { type: q.type, label: q.typeLabel, correct: 0, total: 0 }
    }
    typeAgg[q.type].total += 1
    if (ok) {
      typeAgg[q.type].correct += 1
    }
  })

  var correct = sectionAgg.word.correct + sectionAgg.sentence.correct
  var total = exam.total
  var rate = function (seg) { return seg.total ? Math.round((seg.correct / seg.total) * 100) : 0 }

  var byType = Object.keys(typeAgg).map(function (k) {
    var t = typeAgg[k]
    return { type: t.type, label: t.label, correct: t.correct, total: t.total, accuracy: Math.round((t.correct / t.total) * 100) }
  })
  var practiceSeconds = normalizePracticeSeconds(options.durationSeconds)

  return {
    type: exam.type,
    accuracy: Math.round((correct / total) * 100),
    correct: correct,
    total: total,
    wrongCount: wrong.length,
    wordAccuracy: rate(sectionAgg.word),
    wordCorrect: sectionAgg.word.correct,
    wordTotal: sectionAgg.word.total,
    sentenceAccuracy: rate(sectionAgg.sentence),
    sentenceCorrect: sectionAgg.sentence.correct,
    sentenceTotal: sectionAgg.sentence.total,
    byType: byType,
    wrong: wrong,
    practiceSeconds: practiceSeconds,
    practiceTimeText: formatPracticeTime(practiceSeconds),
    ts: Date.now()
  }
}

function saveResult(resBookId, type, result) {
  try {
    wx.setStorageSync(storageKey(resBookId, type), result)
  } catch (e) {}
}

function getResult(resBookId, type) {
  try {
    var data = wx.getStorageSync(storageKey(resBookId, type))
    return data && data.total ? data : null
  } catch (e) {
    return null
  }
}

function hasResult(resBookId, type) {
  return !!getResult(resBookId, type)
}

// ----------------------------- 结业测解锁 -----------------------------
// 取某个关卡的星级。每个关卡有 3 个环节（单词新学 / 跟读背诵 / 关卡小测），
// 满星 = 3 星。优先读后端可能下发的星级字段，兜底用 doneStages / completed。
// 待后端补充每关星级后，前面的字段分支会自然生效。
function unitStarCount(unit) {
  if (!unit) {
    return 0
  }
  if (typeof unit.stars === 'number') return unit.stars
  if (typeof unit.star === 'number') return unit.star
  if (typeof unit.starNum === 'number') return unit.starNum
  if (typeof unit.doneStages === 'number') return unit.doneStages
  if (Array.isArray(unit.stageStars)) return unit.stageStars.filter(Boolean).length
  // 仅有 completed 字段时：通关按满星计，否则 0。
  return unit.completed ? 3 : 0
}

// 单关是否达标：星级 ≥ 2。
// 星级由 unitStarCount 给出（首页用 doneStages/stageStars，接口用 stars/completed 兜底），
// 因此「通关」与「至少 2 星」在这里统一为一个星级门槛。
function isUnitPassed(unit) {
  return !!unit && unitStarCount(unit) >= 2
}

// 结业测解锁状态：所有真实关卡都达标才解锁（排除测评节点本身）。
function getExitLockState(units) {
  const real = (Array.isArray(units) ? units : []).filter(function (u) { return u && !u.isExam })
  const total = real.length
  const passed = real.filter(isUnitPassed).length
  const locked = total === 0 || passed < total
  return {
    locked: locked,
    total: total,
    passed: passed,
    reason: total === 0
      ? '暂未获取到关卡进度'
      : '需先通关全部 ' + total + ' 个关卡且每关至少 2 星（当前 ' + passed + '/' + total + '）'
  }
}

module.exports = {
  getExam: getExam,
  scoreExam: scoreExam,
  isCorrect: isCorrect,
  saveResult: saveResult,
  getResult: getResult,
  hasResult: hasResult,
  getExitLockState: getExitLockState,
  isUnitPassed: isUnitPassed
}
