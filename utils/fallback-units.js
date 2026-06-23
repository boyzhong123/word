// 后端暂未返回关卡时的本地演示关卡，与成长页 / 今日页共用。
const FALLBACK_UNITS = [
  {
    unitId: 'demo-unit-1',
    sort: 1,
    levelWords: 12,
    subtitle: '千里之行，始于足下。',
    subtitleColor: '#111318',
    stageColor: '#111318',
    doneStages: 3,
    mascot: '../../images/home/mascot-progress.png',
    mascotSprite: '../../images/home/mascot-progress-sprite.png',
    mascotDuration: 2.4,
    locked: false,
    tasks: [
      { type: 'word', label: '单词新学', current: 12, total: 12, percent: 100, color: '#111318', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 12, total: 12, percent: 100, color: '#ff8200', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '关卡小测', current: 12, total: 12, percent: 100, color: '#111318', icon: '../../images/home/task-listening.png' }
    ]
  },
  {
    unitId: 'demo-unit-2',
    sort: 2,
    levelWords: 12,
    subtitle: '实践出真知。',
    subtitleColor: '#111318',
    stageColor: '#111318',
    doneStages: 1,
    mascot: '../../images/home/mascot-alert.png',
    mascotSprite: '../../images/home/mascot-alert-sprite.png',
    mascotDuration: 2.4,
    locked: false,
    tasks: [
      { type: 'word', label: '单词新学', current: 0, total: 12, percent: 0, color: '#111318', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 0, total: 12, percent: 0, color: '#ff8200', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '关卡小测', current: 0, total: 12, percent: 0, color: '#111318', icon: '../../images/home/task-listening.png' }
    ]
  },
  {
    unitId: 'demo-unit-3',
    sort: 3,
    levelWords: 12,
    subtitle: '积跬步，至千里。',
    subtitleColor: '#5c636a',
    stageColor: '#5c636a',
    doneStages: 0,
    mascot: '../../images/home/mascot-sleep.png',
    mascotSprite: '../../images/home/mascot-sleep-sprite.png',
    mascotDuration: 3.2,
    locked: true,
    tasks: [
      { type: 'word', label: '单词新学', current: 0, total: 12, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-word.png' },
      { type: 'recitation', label: '跟读背诵', current: 0, total: 12, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-recitation.png' },
      { type: 'listening', label: '关卡小测', current: 0, total: 12, percent: 0, color: '#9a9a9a', icon: '../../images/home/task-listening.png' }
    ]
  }
]

module.exports = {
  FALLBACK_UNITS
}
