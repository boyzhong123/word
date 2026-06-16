function isPrivacyError(error) {
  const errno = error && error.errno
  if (errno === 112 || errno === 103 || errno === 104) {
    return true
  }
  const message = String((error && error.errMsg) || error || '').toLowerCase()
  return message.indexOf('privacy') >= 0
}

function isPhotosAlbumPermissionError(error) {
  if (isPrivacyError(error)) {
    return true
  }
  const message = String((error && error.errMsg) || error || '').toLowerCase()
  return message.indexOf('auth') >= 0 ||
    message.indexOf('authorize') >= 0 ||
    message.indexOf('deny') >= 0 ||
    message.indexOf('denied') >= 0 ||
    message.indexOf('permission') >= 0
}

function isUserCancel(error) {
  const message = String((error && error.errMsg) || error || '').toLowerCase()
  return message.indexOf('cancel') >= 0
}

function retryPrivacyAuthorize(onDone) {
  if (typeof wx.requirePrivacyAuthorize !== 'function') {
    if (typeof onDone === 'function') {
      onDone(false)
    }
    return
  }
  wx.requirePrivacyAuthorize({
    success: () => {
      if (typeof onDone === 'function') {
        onDone(true)
      }
    },
    fail: () => {
      if (typeof onDone === 'function') {
        onDone(false)
      }
    }
  })
}

function showPrivacyRetryDialog(onRetry) {
  wx.showModal({
    title: '需要你的同意',
    content: '保存打卡图需要你的授权，请点「同意并保存」，在弹窗中选择允许后再试一次。',
    confirmText: '同意并保存',
    cancelText: '取消',
    success: res => {
      if (!res.confirm) {
        return
      }
      retryPrivacyAuthorize(authorized => {
        if (authorized && typeof onRetry === 'function') {
          onRetry()
        }
      })
    }
  })
}

function showAlbumSettingDialog(onRetry) {
  wx.showModal({
    title: '需要相册权限',
    content: '请允许保存图片到相册。可点右上角「···」→ 设置中开启。',
    confirmText: '去设置',
    cancelText: '取消',
    success: res => {
      if (!res.confirm) {
        return
      }
      wx.openSetting({
        success: setting => {
          const authSetting = (setting && setting.authSetting) || {}
          if (authSetting['scope.writePhotosAlbum'] === true && typeof onRetry === 'function') {
            onRetry()
          }
        }
      })
    }
  })
}

function handleSaveImageError(error, onRetry) {
  if (isUserCancel(error)) {
    return
  }
  if (isPrivacyError(error)) {
    showPrivacyRetryDialog(onRetry)
    return
  }
  if (isPhotosAlbumPermissionError(error)) {
    showAlbumSettingDialog(onRetry)
    return
  }
  wx.showToast({ title: '保存失败，请重试', icon: 'none' })
}

function saveImageToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    })
  })
}

function saveImageWithAlbumPermission(filePath) {
  const attemptSave = () => {
    saveImageToAlbum(filePath)
      .then(() => {
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      })
      .catch(error => {
        handleSaveImageError(error, attemptSave)
      })
  }
  attemptSave()
}

module.exports = {
  handleSaveImageError,
  isPhotosAlbumPermissionError,
  isPrivacyError,
  isUserCancel,
  saveImageToAlbum,
  saveImageWithAlbumPermission
}
