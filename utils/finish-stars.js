const HEADER_IMAGES = {
  1: '../../images/finish/finish-today-header-1star.png',
  2: '../../images/finish/finish-today-header-2star.png',
  3: '../../images/finish/finish-today-header-3star.png'
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

  const fillCorrect = recordsList.filter(record => record && record.fillCorrect).length
  const fillRate = Math.round(fillCorrect * 100 / total)
  const reciteScores = recordsList
    .map(record => record && record.reciteScore)
    .filter(score => score != null && score !== '')
    .map(score => Number(score))

  if (!reciteScores.length) {
    return fillRate
  }

  const avgRecite = Math.round(
    reciteScores.reduce((sum, score) => sum + score, 0) / reciteScores.length
  )
  return Math.round((fillRate + avgRecite) / 2)
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
