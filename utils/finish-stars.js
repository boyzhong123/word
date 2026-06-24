const { imageUrl } = require('./image-host')

// Bump when finish header art changes; COS objects are immutable for 1 year.
const HEADER_IMAGE_VERSION = '20260616-jelly-v2'

function finishHeaderUrl(path) {
  return `${imageUrl(path)}?v=${HEADER_IMAGE_VERSION}`
}

const HEADER_IMAGES = {
  1: finishHeaderUrl('/images/finish/finish-today-header-1star.png'),
  2: finishHeaderUrl('/images/finish/finish-today-header-2star.png'),
  3: finishHeaderUrl('/images/finish/finish-today-header-3star.png')
}

function normalizeScoreRate(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

function starsForScoreRate(scoreRate) {
  const score = normalizeScoreRate(scoreRate)
  if (score < 55) {
    return 1
  }
  if (score < 80) {
    return 2
  }
  return 3
}

function headerImageForScoreRate(scoreRate) {
  const stars = starsForScoreRate(scoreRate)
  return HEADER_IMAGES[stars] || HEADER_IMAGES[1]
}

function computePracticeScoreRate(contents) {
  const list = Array.isArray(contents) ? contents : []
  const scores = []

  list.forEach(item => {
    if (!item) {
      return
    }
    if (item.word && item.word.result && item.word.result.score != null && item.word.result.score !== '') {
      scores.push(Number(item.word.result.score))
    }
    if (Array.isArray(item.proverb)) {
      item.proverb.forEach(proverb => {
        if (proverb && proverb.result && proverb.result.score != null && proverb.result.score !== '') {
          scores.push(Number(proverb.result.score))
        }
      })
    }
  })

  if (!scores.length) {
    return 0
  }
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function computeWordNewScoreRate(contents) {
  const list = Array.isArray(contents) ? contents : []
  if (!list.length) {
    return 0
  }

  let total = 0
  list.forEach(item => {
    if (!item) {
      return
    }
    if (item.mistaken) {
      total += 30
    } else if (item.known) {
      total += 100
    } else {
      total += 50
    }
  })

  return Math.round(total / list.length)
}

function computeQuizScoreRate(records, totalQuestions) {
  const recordsList = Array.isArray(records) ? records : []
  const total = Number(totalQuestions) || recordsList.length
  if (!total) {
    return 0
  }

  // 关卡小测三题加权：背诵 0.4 / 听音填空 0.3 / 单词拼写 0.3
  // 仅按「实际参与」的环节归一化权重，缺失环节不当 0 分（对齐 spec 5.6③ / 5.3）
  // 听填：仅统计实际做了听填的词
  const fillRecords = recordsList.filter(record => record && record.fillCorrect != null)
  const fillCorrect = fillRecords.filter(record => record.fillCorrect === true).length
  const fillRate = fillRecords.length
    ? Math.round(fillCorrect * 100 / fillRecords.length)
    : null

  const reciteScores = recordsList
    .map(record => record && record.reciteScore)
    .filter(score => score != null && score !== '')
    .map(score => Number(score))
  const avgRecite = reciteScores.length
    ? Math.round(reciteScores.reduce((sum, score) => sum + score, 0) / reciteScores.length)
    : null

  const spellRecords = recordsList.filter(record => record && record.spellCorrect != null)
  const spellCorrect = spellRecords.filter(record => record.spellCorrect === true).length
  const spellRate = spellRecords.length
    ? Math.round(spellCorrect * 100 / spellRecords.length)
    : null

  const parts = []
  if (fillRate != null) {
    parts.push({ value: fillRate, weight: 0.3 })
  }
  if (avgRecite != null) {
    parts.push({ value: avgRecite, weight: 0.4 })
  }
  if (spellRate != null) {
    parts.push({ value: spellRate, weight: 0.3 })
  }

  const weightSum = parts.reduce((sum, part) => sum + part.weight, 0)
  if (!weightSum) {
    return fillRate != null ? fillRate : 0
  }
  return Math.round(parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weightSum)
}

module.exports = {
  HEADER_IMAGES,
  normalizeScoreRate,
  starsForScoreRate,
  headerImageForScoreRate,
  computePracticeScoreRate,
  computeWordNewScoreRate,
  computeQuizScoreRate
}
