// 学生学习档案：首访引导采集 年级 / 学期 / 教材版本；可选 学习形象 / 手机号。
// 用于今日模块展示与后续推荐；不自动切换当前教材（默认仍为格言谚语词典）。
const STORAGE_KEY = 'studentProfile'

// 年级列表（按学段分组），grade.id 用于存储，stage 关联教材版本
const GRADE_GROUPS = [
  {
    stage: 'primary',
    stageName: '小学',
    grades: [
      { id: 'g1', name: '一年级' },
      { id: 'g2', name: '二年级' },
      { id: 'g3', name: '三年级' },
      { id: 'g4', name: '四年级' },
      { id: 'g5', name: '五年级' },
      { id: 'g6', name: '六年级' }
    ]
  },
  {
    stage: 'junior',
    stageName: '初中',
    grades: [
      { id: 'g7', name: '七年级' },
      { id: 'g8', name: '八年级' },
      { id: 'g9', name: '九年级' }
    ]
  },
  {
    stage: 'senior',
    stageName: '高中',
    grades: [
      { id: 'g10', name: '高一' },
      { id: 'g11', name: '高二' },
      { id: 'g12', name: '高三' }
    ]
  }
]

const SEMESTERS = [
  { id: 'first', name: '上学期' },
  { id: 'second', name: '下学期' }
]

// 教材版本（按学段，复用首页选教材弹窗的目录）
const VERSIONS_BY_STAGE = {
  primary: ['人教版PEP', '人教精通版', '人教版新起点', '牛津译林版', '外研版一起', '外研版三起', '北师大版', '沪教版'],
  junior: ['人教版', '外研版', '牛津译林版', '仁爱版', '北师大版', '冀教版'],
  senior: ['人教版', '外研版', '牛津译林版', '北师大版']
}

function getStageByGradeId(gradeId) {
  for (let i = 0; i < GRADE_GROUPS.length; i++) {
    const group = GRADE_GROUPS[i]
    if (group.grades.some(grade => grade.id === gradeId)) {
      return group.stage
    }
  }
  return ''
}

function getGradesByStage(stage) {
  const group = GRADE_GROUPS.find(item => item.stage === stage)
  return group ? group.grades : GRADE_GROUPS[0].grades
}

function getGradeName(gradeId) {
  for (let i = 0; i < GRADE_GROUPS.length; i++) {
    const grade = GRADE_GROUPS[i].grades.find(item => item.id === gradeId)
    if (grade) {
      return grade.name
    }
  }
  return ''
}

function getSemesterName(semesterId) {
  const semester = SEMESTERS.find(item => item.id === semesterId)
  return semester ? semester.name : ''
}

function getVersionsByStage(stage) {
  return VERSIONS_BY_STAGE[stage] || []
}

function getStudentProfile() {
  const raw = wx.getStorageSync(STORAGE_KEY)
  return raw && typeof raw === 'object' ? raw : null
}

function hasStudentProfile() {
  const profile = getStudentProfile()
  return !!(profile && profile.gradeId && profile.semesterId && profile.version)
}

function saveStudentProfile(profile) {
  const next = Object.assign({}, getStudentProfile(), profile, {
    updatedAt: Date.now()
  })
  next.stage = getStageByGradeId(next.gradeId)
  next.gradeName = getGradeName(next.gradeId)
  next.semesterName = getSemesterName(next.semesterId)
  wx.setStorageSync(STORAGE_KEY, next)
  return next
}

function clearStudentProfile() {
  wx.removeStorageSync(STORAGE_KEY)
}

// 组合一句教材描述，如「三年级上册 · 人教版PEP」
function describeProfile(profile) {
  if (!profile) {
    return ''
  }
  const semesterShort = profile.semesterId === 'second' ? '下册' : '上册'
  const grade = profile.gradeName || ''
  return [grade ? grade + semesterShort : '', profile.version || ''].filter(Boolean).join(' · ')
}

// 「我的」页头部标签：如「五年级下学期  外研版一起」
function describeProfileChip(profile) {
  const parts = getProfileChipParts(profile)
  return [parts.gradeSemesterText, parts.versionText].filter(Boolean).join('  ')
}

function getProfileChipParts(profile) {
  if (!profile) {
    return { gradeSemesterText: '', versionText: '' }
  }
  const grade = profile.gradeName || ''
  const semester = profile.semesterName || getSemesterName(profile.semesterId) || ''
  const gradeSemester = grade && semester ? grade + semester : (grade || semester)
  return {
    gradeSemesterText: gradeSemester,
    versionText: profile.version || ''
  }
}

module.exports = {
  GRADE_GROUPS,
  SEMESTERS,
  VERSIONS_BY_STAGE,
  getStageByGradeId,
  getGradesByStage,
  getGradeName,
  getSemesterName,
  getVersionsByStage,
  getStudentProfile,
  hasStudentProfile,
  saveStudentProfile,
  clearStudentProfile,
  describeProfile,
  describeProfileChip,
  getProfileChipParts
}
