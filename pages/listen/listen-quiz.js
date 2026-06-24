const { buildVoiceUrl } = require('../../utils/voice-url')

const WORD_PATTERN = /[A-Za-z]+(?:['’-][A-Za-z]+)?/g
const MARKER_PATTERN = /\((?:s:1,t:1,g:1|s:1,t:1|g:1,s:1|s:1|t:1|g:1)\)|(?:s:1,t:1,g:1|s:1,t:1|g:1,s:1|s:1|t:1|g:1)/g
const ENGLISH_PATTERN = /[A-Za-z]/

const STOP_WORDS = {
  a: true,
  an: true,
  and: true,
  are: true,
  as: true,
  at: true,
  be: true,
  been: true,
  by: true,
  do: true,
  does: true,
  did: true,
  find: true,
  finds: true,
  for: true,
  from: true,
  has: true,
  have: true,
  in: true,
  is: true,
  it: true,
  might: true,
  new: true,
  of: true,
  on: true,
  or: true,
  that: true,
  the: true,
  to: true,
  was: true,
  were: true,
  will: true,
  with: true
}

function normalizeWord(word) {
  return String(word || '')
    .toLowerCase()
    .replace(/^[^a-z]+|[^a-z]+$/g, '')
    .replace(/s$/, '')
}

function stripSentenceMarkers(sentence) {
  return String(sentence || '')
    .replace(MARKER_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasEnglishText(sentence) {
  return ENGLISH_PATTERN.test(sentence)
}

function resolveProverbSentence(proverb) {
  if (!proverb) {
    return ''
  }

  const label = stripSentenceMarkers(proverb.label || '')
  const content = stripSentenceMarkers(proverb.content || '')

  if (hasEnglishText(label)) {
    return label
  }
  if (hasEnglishText(content)) {
    return content
  }

  return label || content
}

function buildLearningWords(source) {
  const seen = {}
  const words = []
  const list = Array.isArray(source) ? source : []

  list.forEach(item => {
    const word = item && item.word
    const content = word && word.content ? String(word.content).trim() : ''
    const key = normalizeWord(content)

    if (!content || !key || seen[key]) {
      return
    }

    seen[key] = true
    words.push({
      content,
      translation: (word.attribute || '') + (word.translation || ''),
      symbol: word.symbol ? '[' + word.symbol + ']' : ''
    })
  })

  return words
}

function getWordMatches(sentence) {
  const matches = []
  let match

  WORD_PATTERN.lastIndex = 0
  while ((match = WORD_PATTERN.exec(sentence))) {
    matches.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      key: normalizeWord(match[0])
    })
  }

  return matches
}

function getCandidateMatches(sentence, learningWordKeys) {
  return getWordMatches(sentence).filter(match => (
    match.key &&
    match.text.length > 2 &&
    !STOP_WORDS[match.key] &&
    !learningWordKeys[match.key]
  ))
}

function buildParts(sentence, gapMatches) {
  const parts = []
  let cursor = 0

  gapMatches.forEach((match, gapIndex) => {
    if (match.start > cursor) {
      parts.push({
        type: 'text',
        text: sentence.slice(cursor, match.start)
      })
    }

    parts.push({
      type: 'blank',
      gapIndex,
      answer: match.text
    })
    cursor = match.end
  })

  if (cursor < sentence.length) {
    parts.push({
      type: 'text',
      text: sentence.slice(cursor)
    })
  }

  return parts
}

function normalizeUnitResource(data) {
  if (Array.isArray(data)) {
    return data
  }
  if (!data || typeof data !== 'object') {
    return []
  }
  if (Array.isArray(data.list)) {
    return data.list
  }
  if (Array.isArray(data.items)) {
    return data.items
  }
  if (Array.isArray(data.words)) {
    return data.words
  }
  return []
}

function buildItemLearningWordKeys(item) {
  const keys = {}
  const word = item && item.word
  const content = word && word.content ? String(word.content).trim() : ''
  const key = normalizeWord(content)

  if (key) {
    keys[key] = true
  }

  const exchange = word && word.exchange ? String(word.exchange).trim() : ''
  const exchangeKey = normalizeWord(exchange)
  if (exchangeKey) {
    keys[exchangeKey] = true
  }

  return keys
}

function getItemProverbs(item) {
  if (!item) {
    return []
  }
  if (Array.isArray(item.proverb) && item.proverb.length) {
    return item.proverb
  }

  const word = item.word
  const sentence = word && (word.sentence || word.example || '')
  const normalized = sentence ? String(sentence).trim() : ''
  if (!normalized) {
    return []
  }

  return [{
    content: normalized,
    label: normalized,
    translation: (word && (word.sentenceCn || word.sentenceTranslation)) || '',
    audio: (word && (word.sentenceAudio || word.audio)) || ''
  }]
}

function resolveWordContent(word) {
  if (!word) {
    return ''
  }
  return String(word.content || word.word || '').trim()
}

function resolveWordAudio(word, content) {
  const fromApi = word && (word.audio || word.audioUrl || '')
  if (fromApi) {
    return fromApi
  }
  return buildVoiceUrl(content)
}

function normalizeSpellOptions(options, answer) {
  if (!Array.isArray(options) || !options.length) {
    return []
  }

  return options.map(option => {
    if (option && typeof option === 'object') {
      const text = String(option.text || option.content || '').trim()
      return {
        text,
        isAnswer: option.isAnswer != null ? !!option.isAnswer : (!!answer && text === answer)
      }
    }

    const text = String(option || '').trim()
    return {
      text,
      isAnswer: !!answer && text === answer
    }
  }).filter(option => option.text)
}

function hasSpellStep(spell) {
  return !!(spell && Array.isArray(spell.options) && spell.options.length)
}

function resolveServerSpell(item, wordMeta) {
  const exercises = item && item.exercises
  const raw = (exercises && (exercises.wordSpell || exercises.spell)) ||
    (item && item.spell) ||
    null

  if (!raw || typeof raw !== 'object') {
    return null
  }

  const answer = String(raw.answer || '').trim()
  const options = normalizeSpellOptions(raw.options, answer)
  if (!options.length) {
    return null
  }

  const resolvedAnswer = answer || ((options.find(option => option.isAnswer) || {}).text || '')

  return {
    prefix: String(raw.prefix != null ? raw.prefix : '').trim(),
    answer: resolvedAnswer,
    suffix: String(raw.suffix != null ? raw.suffix : '').trim(),
    options: options.map(option => Object.assign({}, option, {
      isAnswer: option.text === resolvedAnswer
    })),
    word: wordMeta.content,
    audio: raw.audio || raw.audioUrl || wordMeta.audio || '',
    symbol: wordMeta.symbol || '',
    translation: wordMeta.translation || ''
  }
}

function normalizeFillOptions(raw) {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map(option => {
    if (option && typeof option === 'object') {
      return {
        text: String(option.text || option.letter || option.content || '').trim()
      }
    }
    return { text: String(option || '').trim() }
  }).filter(option => option.text)
}

function normalizeServerGaps(raw) {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map((gap, index) => ({
    gapIndex: gap && gap.gapIndex != null ? Number(gap.gapIndex) : index,
    answer: String((gap && gap.answer) || '').trim()
  })).filter(gap => gap.answer)
}

function normalizeServerParts(raw, gaps) {
  if (!Array.isArray(raw) || !raw.length) {
    return []
  }

  const gapByIndex = {}
  gaps.forEach(gap => {
    gapByIndex[gap.gapIndex] = gap.answer
  })

  return raw.map(part => {
    if (!part || part.type !== 'blank') {
      return {
        type: 'text',
        text: String((part && part.text) || '')
      }
    }

    const gapIndex = part.gapIndex != null ? Number(part.gapIndex) : 0
    return {
      type: 'blank',
      gapIndex,
      answer: String(part.answer || gapByIndex[gapIndex] || '').trim()
    }
  }).filter(part => part.type === 'text' || part.answer)
}

function buildPartsFromMaskedText(masked, gaps) {
  const text = String(masked || '')
  const parts = []
  let textBuf = ''
  let gapCursor = 0

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '_' && gapCursor < gaps.length) {
      if (textBuf) {
        parts.push({ type: 'text', text: textBuf })
        textBuf = ''
      }
      while (index + 1 < text.length && text[index + 1] === '_') {
        index += 1
      }
      const gap = gaps[gapCursor]
      parts.push({
        type: 'blank',
        gapIndex: gap.gapIndex != null ? gap.gapIndex : gapCursor,
        answer: gap.answer
      })
      gapCursor += 1
      continue
    }
    textBuf += text[index]
  }

  if (textBuf) {
    parts.push({ type: 'text', text: textBuf })
  }

  return parts
}

function resolveServerListenFill(item, proverb, wordMeta) {
  const exercises = item && item.exercises
  const raw = exercises && exercises.listenFill
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const gaps = normalizeServerGaps(raw.gaps)
  if (!gaps.length) {
    return null
  }

  const options = normalizeFillOptions(raw.options || raw.letterTiles)
  if (!options.length) {
    return null
  }

  let parts = normalizeServerParts(raw.parts, gaps)
  if (!parts.some(part => part.type === 'blank')) {
    const masked = raw.sentence || raw.masked || ''
    parts = buildPartsFromMaskedText(masked, gaps)
  }
  if (!parts.some(part => part.type === 'blank')) {
    return null
  }

  const proverbData = proverb || {}
  return {
    sentence: String(raw.sentence || raw.masked || '').trim(),
    translation: raw.translation || proverbData.translation || wordMeta.translation || '',
    audio: raw.audioUrl || raw.audio || proverbData.audio || wordMeta.audio || '',
    parts,
    gaps,
    options
  }
}

function resolveServerRecite(item, proverb, wordMeta) {
  const proverbData = proverb || {}
  const exercises = item && item.exercises
  const raw = exercises && exercises.recite
  if (!raw || typeof raw !== 'object') {
    return {
      meaning: proverbData.translation || wordMeta.translation || '',
      refText: wordMeta.content,
      audio: proverbData.audio || wordMeta.audio || ''
    }
  }

  return {
    meaning: raw.meaning || proverbData.translation || wordMeta.translation || '',
    refText: String(raw.refText || raw.text || wordMeta.content || '').trim(),
    audio: raw.audioUrl || raw.audio || proverbData.audio || wordMeta.audio || ''
  }
}

function shouldSkipListenFill(item) {
  const exercises = item && item.exercises
  if (!exercises || typeof exercises !== 'object') {
    return false
  }
  if (exercises.listenFill && typeof exercises.listenFill === 'object') {
    return false
  }
  return !!(exercises.recite || exercises.wordSpell || exercises.spell)
}

function hasFillStep(question) {
  return !!(question &&
    Array.isArray(question.gaps) &&
    question.gaps.length &&
    Array.isArray(question.options) &&
    question.options.length)
}

function buildQuizStepList(hasFill, hasRecite, hasSpell) {
  const defs = [
    { key: 'fill', label: '听音填空' },
    { key: 'recite', label: '背诵评测' },
    { key: 'spell', label: '单词拼写' }
  ]
  const flags = {
    fill: !!hasFill,
    recite: !!hasRecite,
    spell: !!hasSpell
  }

  return defs
    .filter(step => flags[step.key])
    .map((step, index) => Object.assign({}, step, { no: index + 1 }))
}

function decorateQuizStepList(stepList, quizPhase) {
  const list = Array.isArray(stepList) ? stepList : []
  const currentIndex = list.findIndex(step => step.key === quizPhase)

  return list.map((step, index) => Object.assign({}, step, {
    stepClass: step.key === quizPhase
      ? 'quiz-step-active'
      : (currentIndex > index ? 'quiz-step-done' : '')
  }))
}

function buildSourceQuestion(sentence, proverb, item, learningWordKeys) {
  const word = item && item.word
  const wordContent = resolveWordContent(word)
  const wordMeta = {
    content: wordContent,
    audio: resolveWordAudio(word, wordContent),
    symbol: word && word.symbol ? '[' + word.symbol + ']' : '',
    translation: word ? ((word.attribute || '') + (word.translation || '')) : ''
  }
  const recite = resolveServerRecite(item, proverb, wordMeta)
  const serverFill = resolveServerListenFill(item, proverb, wordMeta)
  const exercises = item && item.exercises
  const hasExercisesPlan = !!(exercises && typeof exercises === 'object')
  const base = {
    sentence: serverFill && serverFill.sentence ? serverFill.sentence : sentence,
    translation: recite.meaning || proverb.translation || '',
    audio: (serverFill && serverFill.audio) || recite.audio || proverb.audio || (word && (word.sentenceAudio || word.audio)) || '',
    reciteRefText: recite.refText || sentence || wordContent,
    word: wordContent,
    wordId: word && (word.wordId || word.id || word.sort || ''),
    wordAudio: wordMeta.audio,
    wordSymbol: wordMeta.symbol,
    wordTranslation: wordMeta.translation,
    page: word && word.page ? word.page : '',
    unitId: item && item.unit && item.unit.unitId ? String(item.unit.unitId) : '',
    spell: resolveServerSpell(item, wordMeta),
    serverFill: !!serverFill,
    prefilledParts: serverFill ? serverFill.parts : null,
    prefilledGaps: serverFill ? serverFill.gaps : null,
    fillOptions: serverFill ? serverFill.options : null,
    matches: [],
    gaps: serverFill ? serverFill.gaps : [],
    // 后端已下发 exercises 规划时，未带 wordSpell 则不做本地拼写兜底
    allowLocalSpell: !hasExercisesPlan || !!(exercises.wordSpell || exercises.spell)
  }

  if (shouldSkipListenFill(item)) {
    return Object.assign({}, base, { skipFill: true })
  }

  if (serverFill) {
    return base
  }

  const matches = getCandidateMatches(sentence, learningWordKeys)
  if (!matches.length) {
    return null
  }

  return Object.assign({}, base, {
    matches,
    gaps: matches.map((match, gapIndex) => ({
      gapIndex,
      answer: match.text
    }))
  })
}

function buildSourceQuestionFromItemOnly(item, learningWordKeys) {
  const word = item && item.word
  const wordContent = resolveWordContent(word)
  const recite = resolveServerRecite(item, {}, {
    content: wordContent,
    audio: resolveWordAudio(word, wordContent),
    symbol: word && word.symbol ? '[' + word.symbol + ']' : '',
    translation: word ? ((word.attribute || '') + (word.translation || '')) : ''
  })
  const sentence = recite.refText || wordContent
  if (!sentence) {
    return null
  }
  return buildSourceQuestion(sentence, {}, item, learningWordKeys)
}

function buildListeningQuizQuestions(source) {
  const list = normalizeUnitResource(source)

  return list.reduce((questions, item) => {
    const learningWordKeys = buildItemLearningWordKeys(item)
    let added = false

    getItemProverbs(item).forEach(proverb => {
      const normalized = resolveProverbSentence(proverb)
      const question = normalized
        ? buildSourceQuestion(normalized, proverb, item, learningWordKeys)
        : null

      if (question) {
        questions.push(question)
        added = true
      }
    })

    if (!added) {
      const question = buildSourceQuestionFromItemOnly(item, learningWordKeys)
      if (question) {
        questions.push(question)
      }
    }

    return questions
  }, [])
}

function shuffleList(list, random = Math.random) {
  const next = list.slice()

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = current
  }

  return next
}

// 单词拼写：从单词中抽掉一整段连续字母（保留首字母），生成正确段 + 干扰段
function preserveCase(orig, repl) {
  return orig === orig.toUpperCase() && orig !== orig.toLowerCase()
    ? repl.toUpperCase()
    : repl
}

function buildSpellOptions(answer, random = Math.random) {
  const vowels = ['a', 'e', 'i', 'o', 'u']
  const seen = {}
  seen[answer.toLowerCase()] = true
  const distractors = []
  const chars = answer.split('')

  const tryPush = cand => {
    if (!cand || cand.length !== answer.length) {
      return
    }
    const key = cand.toLowerCase()
    if (seen[key]) {
      return
    }
    seen[key] = true
    distractors.push(cand)
  }

  // ① 换元音（听→拼最常见混淆）
  chars.forEach((ch, i) => {
    const low = ch.toLowerCase()
    if (vowels.indexOf(low) >= 0) {
      vowels.forEach(v => {
        if (v !== low) {
          const arr = chars.slice()
          arr[i] = preserveCase(ch, v)
          tryPush(arr.join(''))
        }
      })
    }
  })

  // ② 易混辅音
  const confuse = { b: 'd', d: 'b', p: 'q', q: 'p', m: 'n', n: 'm', u: 'v', v: 'w', g: 'j', c: 'k', k: 'c', s: 'z', z: 's' }
  chars.forEach((ch, i) => {
    const c = confuse[ch.toLowerCase()]
    if (c) {
      const arr = chars.slice()
      arr[i] = preserveCase(ch, c)
      tryPush(arr.join(''))
    }
  })

  // ③ 打乱顺序兜底
  let guard = 0
  while (distractors.length < 3 && guard++ < 24) {
    tryPush(shuffleList(chars, random).join(''))
  }

  // ④ 随机替换字母兜底
  const alpha = 'abcdefghijklmnopqrstuvwxyz'
  guard = 0
  while (distractors.length < 3 && guard++ < 60) {
    const arr = chars.slice()
    const i = Math.floor(random() * arr.length)
    arr[i] = preserveCase(arr[i], alpha[Math.floor(random() * 26)])
    tryPush(arr.join(''))
  }

  const picks = shuffleList(distractors, random).slice(0, 3)
  return shuffleList([answer].concat(picks), random).map(text => ({
    text,
    isAnswer: text === answer
  }))
}

function buildSpellChallenge(word, random = Math.random) {
  const raw = String(word || '').trim()
  if (raw.length < 3) {
    return null
  }

  const length = raw.length
  const segLen = length <= 4 ? 2 : 3
  if (segLen >= length) {
    return null
  }

  const starts = []
  for (let s = 1; s <= length - segLen; s += 1) {
    starts.push(s)
  }
  if (!starts.length) {
    return null
  }

  const vowels = 'aeiou'
  const withVowel = starts.filter(s => {
    const seg = raw.slice(s, s + segLen).toLowerCase()
    for (let i = 0; i < seg.length; i += 1) {
      if (vowels.indexOf(seg[i]) >= 0) {
        return true
      }
    }
    return false
  })
  const pool = withVowel.length ? withVowel : starts
  const start = pool[Math.floor(random() * pool.length)]
  const answer = raw.slice(start, start + segLen)

  return {
    prefix: raw.slice(0, start),
    answer,
    suffix: raw.slice(start + segLen),
    options: buildSpellOptions(answer, random)
  }
}

function instantiateQuizQuestion(source, random = Math.random) {
  const skipFill = !!(source && source.skipFill)
  const matches = source && Array.isArray(source.matches) ? source.matches.slice() : []

  let parts = []
  let gaps = []
  let options = []

  if (!skipFill && source && source.serverFill) {
    parts = Array.isArray(source.prefilledParts) ? source.prefilledParts.slice() : []
    gaps = Array.isArray(source.prefilledGaps) ? source.prefilledGaps.slice() : []
    options = (Array.isArray(source.fillOptions) ? source.fillOptions : []).map(option => ({
      text: option.text,
      used: false
    }))
  } else if (!skipFill) {
    if (!matches.length) {
      return null
    }

    const limit = Math.min(4, matches.length)
    const scored = matches.map(match => ({ match, score: random() }))
    scored.sort((a, b) => a.score - b.score)
    const gapMatches = scored
      .slice(-limit)
      .map(item => item.match)
      .sort((a, b) => a.start - b.start)

    parts = buildParts(source.sentence, gapMatches)
    gaps = gapMatches.map((match, gapIndex) => ({
      gapIndex,
      answer: match.text
    }))
    options = shuffleList(gapMatches, random).map(match => ({
      text: match.text,
      used: false
    }))
  }

  // 后端已下发拼写题则直接用；否则在听音填空 RNG 全部消费完之后再本地生成
  let spell = hasSpellStep(source.spell) ? source.spell : null
  if (!spell && source.allowLocalSpell !== false) {
    const spellChallenge = buildSpellChallenge(source.word, random)
    spell = spellChallenge
      ? Object.assign(spellChallenge, {
          word: source.word,
          audio: source.wordAudio || buildVoiceUrl(source.word),
          symbol: source.wordSymbol || '',
          translation: source.wordTranslation || ''
        })
      : null
  }

  if (skipFill && !spell && !source.sentence && !source.reciteRefText) {
    return null
  }

  return {
    sentence: source.sentence,
    translation: source.translation,
    audio: source.audio,
    reciteRefText: source.reciteRefText || source.sentence,
    word: source.word,
    wordId: source.wordId,
    page: source.page,
    unitId: source.unitId,
    skipFill,
    parts,
    gaps,
    options,
    spell
  }
}

function buildReciteParts(sentence) {
  const matches = getWordMatches(sentence)
  const parts = []
  let cursor = 0

  matches.forEach(match => {
    if (match.start > cursor) {
      parts.push({
        type: 'text',
        text: sentence.slice(cursor, match.start)
      })
    }

    if (match.key && match.text.length > 2 && !STOP_WORDS[match.key]) {
      parts.push({
        type: 'blank',
        width: match.text.length
      })
    } else {
      parts.push({
        type: 'text',
        text: match.text
      })
    }

    cursor = match.end
  })

  if (cursor < sentence.length) {
    parts.push({
      type: 'text',
      text: sentence.slice(cursor)
    })
  }

  return parts
}

module.exports = {
  buildLearningWords,
  normalizeUnitResource,
  resolveProverbSentence,
  buildListeningQuizQuestions,
  instantiateQuizQuestion,
  buildReciteParts,
  buildSpellChallenge,
  hasSpellStep,
  hasFillStep,
  buildQuizStepList,
  decorateQuizStepList,
  resolveServerListenFill,
  resolveServerRecite,
  resolveServerSpell
}
