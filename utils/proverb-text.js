const MARKER_PATTERN = /\((?:s:1,t:1,g:1|s:1,t:1|g:1,s:1|s:1|t:1|g:1)\)|(?:s:1,t:1,g:1|s:1,t:1|g:1,s:1|s:1|t:1|g:1)/g
const ENGLISH_PATTERN = /[A-Za-z]/

function stripSentenceMarkers(sentence) {
  return String(sentence || '')
    .replace(MARKER_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasEnglishText(sentence) {
  return ENGLISH_PATTERN.test(sentence)
}

function resolveProverbDisplayText(proverb) {
  if (!proverb) {
    return ''
  }
  return proverb.label || proverb.content || ''
}

function resolveProverbRefText(proverb) {
  if (!proverb) {
    return ''
  }

  const label = String(proverb.label || '').trim()
  const content = String(proverb.content || '').trim()

  if (label && hasEnglishText(label)) {
    return label
  }
  if (content && hasEnglishText(content)) {
    return content
  }
  return content || label
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

function normalizeProverb(proverb) {
  if (!proverb) {
    return proverb
  }
  proverb.refText = resolveProverbRefText(proverb)
  return proverb
}

module.exports = {
  stripSentenceMarkers,
  hasEnglishText,
  resolveProverbDisplayText,
  resolveProverbRefText,
  resolveProverbSentence,
  normalizeProverb
}
