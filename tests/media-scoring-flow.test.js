const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const scoringSession = require('../components/media/scoring-session')

const projectRoot = path.resolve(__dirname, '..')
const mediaScript = fs.readFileSync(path.join(projectRoot, 'components/media/media.js'), 'utf8')

function createMediaStub(id) {
  return {
    id,
    _scoringActive: false,
    data: { media_state: 0 },
    resetMarkingState() {
      this._scoringActive = false
      this.data.media_state = 0
      scoringSession.clearMediaPointers(this)
    }
  }
}

test('scoring session routes results to the active scorer and fallback media', () => {
  const first = createMediaStub('first')
  const second = createMediaStub('second')

  scoringSession.setFallbackMedia(first)
  scoringSession.setActiveMedia(first)
  assert.equal(scoringSession.routeMediaTarget(), first)

  scoringSession.setActiveMedia(null)
  assert.equal(scoringSession.routeMediaTarget(), first)

  scoringSession.setFallbackMedia(second)
  assert.equal(scoringSession.routeMediaTarget(), second)
})

test('beginScoring protects a scorer until the session is cleared', () => {
  const media = createMediaStub('quiz')
  scoringSession.setActiveMedia(media)
  scoringSession.beginScoring(media)

  assert.equal(scoringSession.shouldProtectFromCancel(media), true)
  assert.equal(scoringSession.isScoringMedia(media), true)

  scoringSession.clearMediaPointers(media)
  assert.equal(scoringSession.shouldProtectFromCancel(media), false)
})

test('late cancel during async marking does not drop the scoring target', () => {
  const media = createMediaStub('quiz')
  media.data.media_state = 2

  scoringSession.setActiveMedia(media)
  scoringSession.beginScoring(media)

  assert.equal(scoringSession.shouldProtectFromCancel(media), true)
  assert.equal(scoringSession.routeMediaTarget(), media)

  scoringSession.setActiveMedia(null)
  assert.equal(scoringSession.routeMediaTarget(), media)
})

test('media binds engine and recorder once at module load', () => {
  assert.match(mediaScript, /bindEngineEvents\(\)\s*\n\s*bindRecorderEvents\(\)/)
  assert.match(mediaScript, /function bindEngineEvents\(\)/)
  assert.match(mediaScript, /require\('\.\/scoring-session\.js'\)/)
  assert.match(mediaScript, /scoringSession\.beginScoring\(target\)/)
  assert.match(mediaScript, /scoringSession\.shouldProtectFromCancel\(this\)/)
  assert.match(mediaScript, /scoringSession\.setActiveMedia\(this\)/)
})

test('media sets active scorer before async signature fetch', () => {
  assert.match(mediaScript, /this\.preparingRecord = true[\s\S]*scoringSession\.setActiveMedia\(this\)[\s\S]*ensureSigReady\(start, true\)/)
  assert.match(mediaScript, /if \(isValidSig\(this\.data\._sig\)\) {[\s\S]*start\(\)[\s\S]*return/)
})
