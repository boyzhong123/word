// 演示/兜底发音：有道 TTS（与入门测 voiceUrl 同源）。
// 播放媒体资源不受小程序 request 合法域名限制。
function buildVoiceUrl(text, type) {
  const value = String(text || '').trim()
  if (!value) {
    return ''
  }
  return 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(value) + '&type=' + (type || 1)
}

module.exports = {
  buildVoiceUrl
}
