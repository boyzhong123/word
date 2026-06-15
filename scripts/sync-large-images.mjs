#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const DEFAULT_THRESHOLD_KB = 150
const SKIP_PATH_PARTS = ['/.jelly-build/', '/.build/']

const args = new Map()
for (const arg of process.argv.slice(2)) {
  const match = arg.match(/^--([^=]+)=(.*)$/)
  if (match) {
    args.set(match[1], match[2])
  } else {
    args.set(arg.replace(/^--/, ''), true)
  }
}

const thresholdKb = Number(args.get('threshold-kb') || DEFAULT_THRESHOLD_KB)
const dryRun = Boolean(args.get('dry-run'))
const noUpload = Boolean(args.get('no-upload'))

function toRelative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/')
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    const relPath = toRelative(fullPath)
    if (SKIP_PATH_PARTS.some(part => `/${relPath}/`.includes(part))) continue
    if (entry.isDirectory()) {
      out.push(...walk(fullPath))
    } else {
      out.push(fullPath)
    }
  }
  return out
}

function readRemotePaths() {
  const filePath = path.join(ROOT, 'utils/image-host.js')
  const source = fs.readFileSync(filePath, 'utf8')
  const matches = source.matchAll(/['"]((?:\/images\/)[^'"]+)['"]\s*:\s*true/g)
  return new Set(Array.from(matches, match => match[1]))
}

function writeRemotePaths(remotePaths) {
  const filePath = path.join(ROOT, 'utils/image-host.js')
  const source = fs.readFileSync(filePath, 'utf8')
  const body = Array.from(remotePaths)
    .sort()
    .map(hostPath => `  '${hostPath}': true`)
    .join(',\n')
  const nextSource = source.replace(
    /const REMOTE_IMAGE_PATHS = \{\n[\s\S]*?\n\}/,
    `const REMOTE_IMAGE_PATHS = {\n${body}\n}`
  )
  if (nextSource === source) return false
  if (!dryRun) fs.writeFileSync(filePath, nextSource)
  return true
}

function readProjectConfig() {
  const filePath = path.join(ROOT, 'project.config.json')
  return {
    filePath,
    data: JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }
}

function writeProjectConfig(filePath, data) {
  if (!dryRun) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
  }
}

function ensurePackIgnore(projectConfig, relPath) {
  const ignore = projectConfig.data.packOptions?.ignore || []
  projectConfig.data.packOptions = projectConfig.data.packOptions || {}
  projectConfig.data.packOptions.ignore = ignore
  const exists = ignore.some(item => item.type === 'glob' && item.value === relPath)
  if (!exists) {
    ignore.push({ type: 'glob', value: relPath })
    return true
  }
  return false
}

function copyMirror(relPath) {
  const sourcePath = path.join(ROOT, relPath)
  const targetPath = path.join(ROOT, 'vercel-assets', relPath)
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size === fs.statSync(sourcePath).size) {
    return false
  }
  if (!dryRun) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(sourcePath, targetPath)
  }
  return true
}

const imageFiles = walk(path.join(ROOT, 'images'))
  .filter(filePath => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
  .map(filePath => ({
    relPath: toRelative(filePath),
    hostPath: `/${toRelative(filePath)}`,
    kb: Math.round(fs.statSync(filePath).size / 1024)
  }))
  .filter(file => file.kb >= thresholdKb)
  .sort((a, b) => b.kb - a.kb || a.relPath.localeCompare(b.relPath))

const remotePaths = readRemotePaths()
const projectConfig = readProjectConfig()
const promoted = []
let remoteChanged = false
let configChanged = false
let mirrorChanged = false

for (const image of imageFiles) {
  const missingRemote = !remotePaths.has(image.hostPath)
  const mirrorWasChanged = copyMirror(image.relPath)
  const ignoreWasChanged = ensurePackIgnore(projectConfig, image.relPath)

  if (missingRemote) {
    remotePaths.add(image.hostPath)
    remoteChanged = true
  }
  if (ignoreWasChanged) configChanged = true
  if (mirrorWasChanged) mirrorChanged = true

  if (missingRemote || ignoreWasChanged || mirrorWasChanged) {
    promoted.push(image)
  }
}

if (remoteChanged) writeRemotePaths(remotePaths)
if (configChanged) writeProjectConfig(projectConfig.filePath, projectConfig.data)

console.log(`Large image sync`)
console.log(`- Threshold: ${thresholdKb}KB`)
console.log(`- Large runtime images: ${imageFiles.length}`)
console.log(`- Promoted/updated: ${promoted.length}`)
console.log(`- Remote whitelist changed: ${remoteChanged ? 'yes' : 'no'}`)
console.log(`- Pack ignore changed: ${configChanged ? 'yes' : 'no'}`)
console.log(`- Mirror changed: ${mirrorChanged ? 'yes' : 'no'}`)
console.log(`- Dry run: ${dryRun ? 'yes' : 'no'}`)

for (const image of promoted) {
  console.log(`- ${image.relPath} (${image.kb}KB)`)
}

if (!dryRun && promoted.length && !noUpload) {
  const uploadArgs = [
    path.join(ROOT, 'scripts/upload-image-assets.mjs'),
    ...promoted.map(image => image.relPath)
  ]
  const result = spawnSync(process.execPath, uploadArgs, {
    cwd: ROOT,
    stdio: 'inherit'
  })
  process.exitCode = result.status || 0
}
