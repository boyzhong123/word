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

function buildSourceQuestion(sentence, proverb, item, learningWordKeys) {
  const matches = getCandidateMatches(sentence, learningWordKeys)

  if (!matches.length) {
    return null
  }

  const word = item && item.word

  return {
    sentence,
    translation: proverb.translation || '',
    audio: proverb.audio || (word && (word.sentenceAudio || word.audio)) || '',
    word: word && word.content ? String(word.content).trim() : '',
    wordId: word && (word.wordId || word.id || word.sort || ''),
    unitId: item && item.unit && item.unit.unitId ? String(item.unit.unitId) : '',
    matches,
    gaps: matches.map((match, gapIndex) => ({
      gapIndex,
      answer: match.text
    }))
  }
}

function buildListeningQuizQuestions(source) {
  const list = normalizeUnitResource(source)

  return list.reduce((questions, item) => {
    const learningWordKeys = buildItemLearningWordKeys(item)

    getItemProverbs(item).forEach(proverb => {
      const normalized = resolveProverbSentence(proverb)
      const question = normalized
        ? buildSourceQuestion(normalized, proverb, item, learningWordKeys)
        : null

      if (question) {
        questions.push(question)
      }
    })

    return questions
  }, [])
}

function instantiateQuizQuestion(source, random = Math.random) {
  const matches = source && Array.isArray(source.matches) ? source.matches.slice() : []
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

  return {
    sentence: source.sentence,
    translation: source.translation,
    audio: source.audio,
    word: source.word,
    wordId: source.wordId,
    unitId: source.unitId,
    parts: buildParts(source.sentence, gapMatches),
    gaps: gapMatches.map((match, gapIndex) => ({
      gapIndex,
      answer: match.text
    })),
    options: gapMatches.map(match => ({
      text: match.text,
      used: false
    }))
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
  buildReciteParts
}
