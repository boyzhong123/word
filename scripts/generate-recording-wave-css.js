/**
 * 按 canvas 波纹算法导出逐帧 SVG 精灵图（相位与 drawFrame 一致）。
 * 用法：node scripts/generate-recording-wave-css.js
 */
const fs = require('node:fs')
const path = require('node:path')
const {
  CSS_TILE_WIDTH,
  CSS_TILE_HEIGHT,
  CSS_FRAME_COUNT,
  buildFrameSvgPaths
} = require('../utils/recording-wave-math')

const tileW = CSS_TILE_WIDTH
const height = CSS_TILE_HEIGHT
const frameCount = CSS_FRAME_COUNT
const totalW = tileW * frameCount

const groups = []
for (let frame = 0; frame < frameCount; frame++) {
  const offsetVal = (frame / frameCount) * 2
  const xShift = frame * tileW
  const paths = buildFrameSvgPaths(tileW, height, offsetVal)
  const inner = paths.map(function (pathInfo) {
    return '<path fill="none" stroke="' + pathInfo.stroke + '" stroke-width="' + pathInfo.strokeWidth +
      '" stroke-linecap="round" stroke-linejoin="round" d="' + pathInfo.d + '"/>'
  }).join('\n')
  groups.push('<g transform="translate(' + xShift + ' 0)">\n' + inner + '\n</g>')
}

const svg = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalW + '" height="' + height +
  '" viewBox="0 0 ' + totalW + ' ' + height + '">',
  groups.join('\n'),
  '</svg>',
  ''
].join('\n')

const outDir = path.resolve(__dirname, '../images/listen')
fs.writeFileSync(path.join(outDir, 'recording-wave-css-frames.svg'), svg)
console.log('[generate-recording-wave-css] wrote recording-wave-css-frames.svg (' + frameCount + ' frames)')
