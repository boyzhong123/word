const test = require('node:test')
const assert = require('node:assert/strict')

const {
  resolveProverbRefText,
  resolveProverbSentence,
  normalizeProverb
} = require('../utils/proverb-text')

test('proverb refText prefers English label over Chinese content for scoring', () => {
  const proverb = {
    content: '有利必有弊。',
    label: 'Every (s:1)advantage has its disadvantage.',
    translation: '有利必有弊。'
  }

  assert.equal(
    resolveProverbRefText(proverb),
    'Every (s:1)advantage has its disadvantage.'
  )
})

test('proverb refText keeps English content when label is missing', () => {
  const proverb = {
    content: 'With each advantage is a disadvantage.',
    translation: '有一利必有一弊。'
  }

  assert.equal(
    resolveProverbRefText(proverb),
    'With each advantage is a disadvantage.'
  )
})

test('proverb refText falls back to Chinese content when no English is available', () => {
  const proverb = {
    content: '实事求是。',
    translation: '实事求是。'
  }

  assert.equal(resolveProverbRefText(proverb), '实事求是。')
})

test('normalizeProverb attaches refText for practice recitation', () => {
  const proverb = normalizeProverb({
    content: '桌子上有一个苹果。',
    label: '(s:1)There (g:1)is an apple on the table.',
    translation: '桌子上有一个苹果。'
  })

  assert.equal(proverb.refText, '(s:1)There (g:1)is an apple on the table.')
  assert.equal(
    resolveProverbSentence(proverb),
    'There is an apple on the table.'
  )
})
