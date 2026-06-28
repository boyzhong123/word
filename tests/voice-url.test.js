const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildVoiceUrl,
  resolveEdgeTtsUrl,
  resolveVoiceUrl,
  clearVoiceUrlCache
} = require('../utils/voice-url')

test('resolveEdgeTtsUrl extracts audio url from numeric success response', async () => {
  const requests = []
  const wxMock = {
    request(options) {
      requests.push(options)
      options.success({
        statusCode: 200,
        data: {
          status: 1,
          data: {
            url: 'https://17ks.chivoxapp.com/tts_edge/hello.mp3'
          }
        }
      })
      return { abort() {} }
    }
  }

  const url = await resolveEdgeTtsUrl('hello', { wx: wxMock })

  assert.equal(url, 'https://17ks.chivoxapp.com/tts_edge/hello.mp3')
  assert.equal(requests.length, 1)
  assert.equal(requests[0].method, 'POST')
  assert.equal(requests[0].data.text, 'hello')
})

test('resolveVoiceUrl falls back to youdao when edge tts fails', async () => {
  const wxMock = {
    request(options) {
      options.fail({ errMsg: 'request:fail' })
      return { abort() {} }
    }
  }

  const url = await resolveVoiceUrl('planet', { wx: wxMock })

  assert.equal(url, buildVoiceUrl('planet'))
})

test('resolveVoiceUrl caches successful edge tts urls by text', async () => {
  clearVoiceUrlCache()
  let calls = 0
  const wxMock = {
    request(options) {
      calls += 1
      options.success({
        statusCode: 200,
        data: {
          status: 1,
          data: {
            url: 'https://17ks.chivoxapp.com/tts_edge/cached.mp3'
          }
        }
      })
      return { abort() {} }
    }
  }

  const first = await resolveVoiceUrl('cached', { wx: wxMock })
  const second = await resolveVoiceUrl('cached', { wx: wxMock })

  assert.equal(first, 'https://17ks.chivoxapp.com/tts_edge/cached.mp3')
  assert.equal(second, first)
  assert.equal(calls, 1)
})
