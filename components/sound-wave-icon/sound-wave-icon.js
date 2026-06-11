const THEMES = {
  'sound-wave-dark': {
    tone: 'dark',
    width: 28,
    height: 20
  },
  'sound-wave-light': {
    tone: 'light',
    width: 28,
    height: 20
  },
  'sound-wave-light-lg': {
    tone: 'example',
    width: 36,
    height: 26
  }
}

Component({
  properties: {
    playing: {
      type: Boolean,
      value: false
    },
    theme: {
      type: String,
      value: 'sound-wave-light'
    }
  },

  data: {
    tone: THEMES['sound-wave-light'].tone,
    frameWidth: 28,
    frameHeight: 20
  },

  observers: {
    theme: function (theme) {
      const assets = THEMES[theme] || THEMES['sound-wave-light']
      this.setData({
        tone: assets.tone,
        frameWidth: assets.width,
        frameHeight: assets.height
      })
    }
  }
})
