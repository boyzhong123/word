const WORD_PATTERN = /[A-Za-z]+(?:['’-][A-Za-z]+)?/g

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

function chooseGapMatches(matches, learningWordKeys) {
  const candidates = matches.filter(match => (
    match.key &&
    match.text.length > 2 &&
    !STOP_WORDS[match.key] &&
    !learningWordKeys[match.key]
  ))
  const limit = Math.min(4, candidates.length)

  return candidates.slice(Math.max(candidates.length - limit, 0))
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

function buildQuestion(sentence, proverb, learningWordKeys) {
  const matches = getWordMatches(sentence)
  const gaps = chooseGapMatches(matches, learningWordKeys)

  if (!gaps.length) {
    return null
  }

  return {
    sentence,
    translation: proverb.translation || '',
    audio: proverb.audio || '',
    parts: buildParts(sentence, gaps),
    gaps: gaps.map((match, gapIndex) => ({
      gapIndex,
      answer: match.text
    })),
    options: gaps.map(match => ({
      text: match.text,
      used: false
    }))
  }
}

function buildListeningQuizQuestions(source) {
  const list = Array.isArray(source) ? source : []
  const learningWordKeys = {}

  buildLearningWords(list).forEach(word => {
    learningWordKeys[normalizeWord(word.content)] = true
  })

  return list.reduce((questions, item) => {
    const proverbs = item && Array.isArray(item.proverb) ? item.proverb : []

    proverbs.forEach(proverb => {
      const sentence = proverb && (proverb.content || proverb.label)
      const normalized = sentence ? String(sentence).trim() : ''
      const question = normalized ? buildQuestion(normalized, proverb, learningWordKeys) : null

      if (question) {
        questions.push(question)
      }
    })

    return questions
  }, [])
}

module.exports = {
  buildLearningWords,
  buildListeningQuizQuestions
}
