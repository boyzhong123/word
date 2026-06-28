const EDGE_TTS_URL = 'https://aiserver.91tszx.com/api/dictionary-ai/tts-edge'
const EDGE_TTS_CACHE_KEY = 'edgeTtsVoiceUrlCache'
const memoryCache = {}

// 演示/兜底发音：有道 TTS（与入门测 voiceUrl 同源）。
// 播放媒体资源不受小程序 request 合法域名限制。
function buildVoiceUrl(text, type) {
  const value = String(text || '').trim()
  if (!value) {
    return ''
  }
  return 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(value) + '&type=' + (type || 1)
}

function getWx(options) {
  if (options && options.wx) {
    return options.wx
  }
  if (typeof wx !== 'undefined') {
    return wx
  }
  return null
}

function normalizeText(text) {
  return String(text || '').trim()
}

function normalizeCacheKey(text, type) {
  return normalizeText(text).toLowerCase() + '::' + (type || 1)
}

function readStorageCache(wxApi) {
  if (!wxApi || typeof wxApi.getStorageSync !== 'function') {
    return {}
  }
  try {
    return wxApi.getStorageSync(EDGE_TTS_CACHE_KEY) || {}
  } catch (err) {
    return {}
  }
}

function writeStorageCache(wxApi, cache) {
  if (!wxApi || typeof wxApi.setStorageSync !== 'function') {
    return
  }
  try {
    wxApi.setStorageSync(EDGE_TTS_CACHE_KEY, cache)
  } catch (err) {}
}

function pickEdgeUrl(data) {
  const payload = data && data.data ? data.data : data
  const url = payload && (payload.url || payload.audioUrl || payload.audio)
  return typeof url === 'string' && /^https:\/\//.test(url) ? url : ''
}

function isEdgeSuccess(data) {
  if (!data || typeof data !== 'object') {
    return false
  }
  return data.status === 1 || data.status === 'success' || data.code === 0
}

function resolveEdgeTtsUrl(text, options) {
  const value = normalizeText(text)
  const wxApi = getWx(options)
  const timeoutMs = options && options.timeoutMs ? options.timeoutMs : 8000

  if (!value || !wxApi || typeof wxApi.request !== 'function') {
    return Promise.resolve('')
  }

  return new Promise((resolve) => {
    let settled = false
    let req
    const finish = (url) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      resolve(url || '')
    }
    const timer = setTimeout(() => {
      if (req && typeof req.abort === 'function') {
        req.abort()
      }
      finish('')
    }, timeoutMs)

    req = wxApi.request({
      url: EDGE_TTS_URL,
      method: 'POST',
      data: { text: value },
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (!res || res.statusCode !== 200 || !isEdgeSuccess(res.data)) {
          finish('')
          return
        }
        finish(pickEdgeUrl(res.data))
      },
      fail() {
        finish('')
      }
    })
  })
}

async function resolveVoiceUrl(text, options) {
  const value = normalizeText(text)
  const opts = options || {}
  const type = opts.type || 1
  const fallbackUrl = opts.fallbackUrl || buildVoiceUrl(value, type)
  const wxApi = getWx(opts)
  const cacheKey = normalizeCacheKey(value, type)

  if (!value) {
    return ''
  }
  if (opts.preferredUrl && !/dict\.youdao\.com\/dictvoice/.test(opts.preferredUrl)) {
    return opts.preferredUrl
  }
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey]
  }

  const storageCache = readStorageCache(wxApi)
  if (storageCache[cacheKey]) {
    memoryCache[cacheKey] = storageCache[cacheKey]
    return storageCache[cacheKey]
  }

  const edgeUrl = await resolveEdgeTtsUrl(value, opts)
  if (edgeUrl) {
    memoryCache[cacheKey] = edgeUrl
    storageCache[cacheKey] = edgeUrl
    writeStorageCache(wxApi, storageCache)
    return edgeUrl
  }

  return fallbackUrl
}

function clearVoiceUrlCache() {
  Object.keys(memoryCache).forEach(key => {
    delete memoryCache[key]
  })
}

module.exports = {
  buildVoiceUrl,
  resolveEdgeTtsUrl,
  resolveVoiceUrl,
  clearVoiceUrlCache
}
