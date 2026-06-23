const samplingSize = 64
const offsetSpeed = 290
const pathFuncs = [0.6, 0.25, 0.1, -0.1]
const CSS_TILE_WIDTH = 375
const CSS_TILE_HEIGHT = 106
const CSS_FRAME_COUNT = 30
const CSS_CYCLE_MS = offsetSpeed * 2

function calcValue(mapX, offsetVal) {
  const o = offsetVal % 2
  const sinFunc = Math.sin(Math.PI * mapX - o * Math.PI)
  return sinFunc * 4 / (4 + Math.pow(mapX, 4))
}

function buildLayerPath(layerIndex, tileW, height, offsetVal) {
  const amplitude = height / 2
  const gap = tileW / samplingSize
  const parts = []
  for (let i = 0; i <= samplingSize; i++) {
    const x = i * gap
    const mapX = (x / tileW) * 4 - 2
    const realY = amplitude * calcValue(mapX, offsetVal) * pathFuncs[layerIndex] * 0.8
    const y = amplitude + realY
    parts.push((i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2))
  }
  return parts.join(' ')
}

function buildFrameSvgPaths(tileW, height, offsetVal) {
  const paths = []
  for (let layer = 3; layer >= 0; layer--) {
    const stroke = layer === 0 ? '#2f80ed' : '#9fc3f5'
    const strokeWidth = layer === 0 ? 3 : 1
    const d = buildLayerPath(layer, tileW, height, offsetVal)
    paths.push({
      stroke,
      strokeWidth,
      d
    })
  }
  return paths
}

module.exports = {
  samplingSize,
  offsetSpeed,
  pathFuncs,
  CSS_TILE_WIDTH,
  CSS_TILE_HEIGHT,
  CSS_FRAME_COUNT,
  CSS_CYCLE_MS,
  calcValue,
  buildLayerPath,
  buildFrameSvgPaths
}
