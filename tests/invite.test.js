const test = require('node:test')
const assert = require('node:assert/strict')

// invite → student-profile → mock-store 都依赖 wx Storage，统一用内存假实现
function loadInvite(initialStorage) {
  const storage = Object.assign({}, initialStorage || {})
  global.wx = {
    getStorageSync: key => storage[key],
    setStorageSync: (key, value) => { storage[key] = value },
    removeStorageSync: key => { delete storage[key] },
    getStorageInfoSync: () => ({ keys: Object.keys(storage) })
  }
  delete require.cache[require.resolve('../utils/invite')]
  delete require.cache[require.resolve('../utils/student-profile')]
  delete require.cache[require.resolve('../utils/mock/mock-store')]
  return {
    invite: require('../utils/invite'),
    storage
  }
}

function withProfileState(profile) {
  return { __mock_state__: { studentProfile: profile } }
}

test('invite code normalization uppercases and rejects malformed input', () => {
  const { invite } = loadInvite()

  assert.equal(invite.normalizeInviteCode(' a7k2mq '), 'A7K2MQ')
  assert.equal(invite.normalizeInviteCode('A7K2MQ'), 'A7K2MQ')
  assert.equal(invite.normalizeInviteCode('abc'), '')
  assert.equal(invite.normalizeInviteCode('has space'), '')
  assert.equal(invite.normalizeInviteCode(''), '')
})

test('poster qrcode scene and share query both resolve to an invite code', () => {
  const { invite } = loadInvite()

  // 小程序码 scene（可能被 encodeURIComponent）
  assert.equal(invite.parseSceneInviteCode('i=A7K2MQ'), 'A7K2MQ')
  assert.equal(invite.parseSceneInviteCode(encodeURIComponent('i=A7K2MQ')), 'A7K2MQ')
  assert.equal(invite.parseSceneInviteCode('foo=1&i=a7k2mq'), 'A7K2MQ')
  assert.equal(invite.parseSceneInviteCode('foo=1'), '')

  assert.deepEqual(
    invite.parseInviteFromLaunchOptions({ query: { inviteCode: 'A7K2MQ' } }),
    { code: 'A7K2MQ', source: invite.INVITE_SOURCE_SHARE }
  )
  assert.deepEqual(
    invite.parseInviteFromLaunchOptions({ query: { scene: 'i%3DA7K2MQ' } }),
    { code: 'A7K2MQ', source: invite.INVITE_SOURCE_QRCODE }
  )
  assert.equal(invite.parseInviteFromLaunchOptions({ query: {} }), null)
  assert.equal(invite.parseInviteFromLaunchOptions(null), null)
})

test('launch capture stores a pending invite for new users only', () => {
  const { invite, storage } = loadInvite()

  const pending = invite.captureInviteLaunch({ query: { inviteCode: 'A7K2MQ' } })

  assert.equal(pending.code, 'A7K2MQ')
  assert.equal(pending.source, invite.INVITE_SOURCE_SHARE)
  assert.equal(storage.pendingInvite.code, 'A7K2MQ')
  assert.equal(invite.getPendingInvite().code, 'A7K2MQ')
})

test('launch capture ignores users who already finished onboarding', () => {
  const { invite, storage } = loadInvite(withProfileState({
    gradeId: 'g3',
    semesterId: 's1',
    version: '人教PEP'
  }))

  const pending = invite.captureInviteLaunch({ query: { inviteCode: 'A7K2MQ' } })

  assert.equal(pending, null)
  assert.equal(storage.pendingInvite, undefined)
})

test('a later scan overwrites the pending invite and clear removes it', () => {
  const { invite } = loadInvite()

  invite.captureInviteLaunch({ query: { inviteCode: 'A7K2MQ' } })
  invite.captureInviteLaunch({ query: { scene: 'i=B8XY3N' } })

  const pending = invite.getPendingInvite()
  assert.equal(pending.code, 'B8XY3N')
  assert.equal(pending.source, invite.INVITE_SOURCE_QRCODE)

  invite.clearPendingInvite()
  assert.equal(invite.getPendingInvite(), null)
})

test('invite sources map to display labels for the invite records list', () => {
  const { invite } = loadInvite()

  assert.equal(invite.describeInviteSource(invite.INVITE_SOURCE_QRCODE), '扫海报码')
  assert.equal(invite.describeInviteSource(invite.INVITE_SOURCE_SHARE), '分享卡片')
  assert.equal(invite.describeInviteSource(invite.INVITE_SOURCE_MANUAL), '填邀请码')
  assert.equal(invite.describeInviteSource(''), '填邀请码')
})
