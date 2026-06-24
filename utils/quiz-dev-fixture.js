// 关卡小测联调词表：覆盖「三步全」与「无听填、仅背诵+拼写」两种场景。测完关闭 listen.js 里的 USE_QUIZ_DEV_FIXTURE。
const { buildVoiceUrl } = require('./voice-url')

const QUIZ_DEV_UNIT_ID = 'quiz-dev-fixture'
const QUIZ_DEV_UNIT_SORT = 1

function isQuizDevFixtureEnabled(flag) {
  if (!flag) {
    return false
  }
  try {
    return wx.getAccountInfoSync().miniProgram.envVersion !== 'release'
  } catch (error) {
    return true
  }
}

function buildQuizDevUnitResource() {
  return [
    {
      needVip: 0,
      unit: {
        unitId: QUIZ_DEV_UNIT_ID,
        sort: QUIZ_DEV_UNIT_SORT,
        unitName: '联调·三步骤',
        wordTotal: 2
      },
      word: {
        sort: 1,
        content: 'planet',
        symbol: 'ˈplænɪt',
        attribute: 'n.',
        translation: '行星',
        audio: buildVoiceUrl('planet')
      },
      proverb: [{
        content: '明亮的行星划过天空。',
        label: 'Bright planets cross the sky.',
        translation: '明亮的行星划过天空。',
        audio: buildVoiceUrl('Bright planets cross the sky.')
      }]
    },
    {
      needVip: 0,
      unit: {
        unitId: QUIZ_DEV_UNIT_ID,
        sort: QUIZ_DEV_UNIT_SORT,
        unitName: '联调·两步无听填',
        wordTotal: 2
      },
      word: {
        sort: 2,
        content: 'spade',
        symbol: 'speɪd',
        attribute: 'n.',
        translation: '铲子',
        audio: buildVoiceUrl('spade')
      },
      exercises: {
        recite: {
          meaning: 'n.铲子',
          audioUrl: buildVoiceUrl('spade')
        },
        wordSpell: {
          prefix: 'sp',
          answer: 'ade',
          suffix: '',
          audioUrl: buildVoiceUrl('spade'),
          options: ['ade', 'aid', 'ide', 'ode']
        }
      },
      proverb: [{
        content: '他在花园里用了一把铲子。',
        label: 'He used a spade in the garden.',
        translation: '他在花园里用了一把铲子。',
        audio: buildVoiceUrl('He used a spade in the garden.')
      }]
    }
  ]
}

function buildQuizDevUnitsList() {
  return [{
    unitId: QUIZ_DEV_UNIT_ID,
    sort: QUIZ_DEV_UNIT_SORT,
    wordTotal: 2,
    unitName: '联调小测',
    completed: false,
    needVip: 0
  }]
}

module.exports = {
  QUIZ_DEV_UNIT_ID,
  QUIZ_DEV_UNIT_SORT,
  isQuizDevFixtureEnabled,
  buildQuizDevUnitResource,
  buildQuizDevUnitsList
}
