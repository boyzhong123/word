const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

test('app.wxss exposes shared primary and secondary button tokens', () => {
  const appStyle = read('app.wxss')
  assert.match(appStyle, /\.app-btn-primary\s*{[^}]*background:\s*#111318/s)
  assert.match(appStyle, /\.app-btn-secondary\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.55\)/s)
})

test('primary action buttons across pages use black fill and white text', () => {
  const checks = [
    ['pages/plan/plan.wxss', /\.save-btn\s*{[^}]*background:\s*#111318/s],
    ['pages/checkin/calendar.wxss', /\.power-button\s*{[^}]*background:\s*#111318/s],
    ['pages/advertisement/advertisement.wxss', /\.purchase-button\s*{[^}]*background:\s*#111318/s],
    ['pages/catalogue/catalogue.wxss', /\.vip-btn\s*{[^}]*background:\s*#111318/s],
    ['components/book-content/book-content.wxss', /\.btn\s*{[^}]*background:\s*#111318/s],
    ['pages/finish/today.wxss', /\.btn\s*{[^}]*background:\s*#111318/s],
  ]

  checks.forEach(([file, pattern]) => {
    assert.match(read(file), pattern, `${file} should use black primary buttons`)
  })
})

test('secondary action buttons use translucent white fill and dark text', () => {
  const finishStyle = read('pages/finish/today.wxss')
  const reportStyle = read('pages/report/report.wxss')
  const dialogStyle = read('components/dialog/dialog.wxss')

  assert.match(finishStyle, /\.btn-secondary\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.55\)/s)
  assert.match(reportStyle, /\.action-btn-ghost\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.55\)/s)
  assert.match(dialogStyle, /\.negetive\s*{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.55\)/s)
})
