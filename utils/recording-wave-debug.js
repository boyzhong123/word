// 录音波浪线调试：真机 vConsole / 远程调试里执行
//   wx.setStorageSync('debugRecordingWave', true)
// 关闭：wx.removeStorageSync('debugRecordingWave')
function enabled() {
  try {
    return !!wx.getStorageSync('debugRecordingWave')
  } catch (e) {
    return false
  }
}

function log(step, detail) {
  if (!enabled()) {
    return
  }
  const payload = detail == null ? '' : detail
  console.log('[recording-wave]', step, payload)
}

module.exports = {
  enabled,
  log
}
