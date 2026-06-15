#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const DEFAULT_THRESHOLD_KB = 150
const DEFAULT_MAX_PACKAGE_KB = 4096
const GENERATED_IMAGE_DIRS = ['/.jelly-build/', '/.build/']

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
const maxPackageKb = Number(args.get('max-kb') || DEFAULT_MAX_PACKAGE_KB)
const jsonOutput = Boolean(args.get('json'))

function toRelative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/')
}

function toImageHostPath(relPath) {
  return '/' + relPath
}

function walk(dir, options = {}) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    const relPath = toRelative(fullPath)
    if (options.skip?.(relPath, entry)) continue
    if (entry.isDirectory()) {
      out.push(...walk(fullPath, options))
    } else {
      out.push(fullPath)
    }
  }
  return out
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'))
}

function escapeRegExp(char) {
  return char.replace(/[\\^$+?.()|[\]{}]/g, '\\$&')
}

function globToRegExp(glob) {
  let regex = '^'
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i]
    if (char === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          regex += '(?:.*/)?'
          i += 2
        } else {
          regex += '.*'
          i += 1
        }
      } else {
        regex += '[^/]*'
      }
    } else if (char === '?') {
      regex += '[^/]'
    } else {
      regex += escapeRegExp(char)
    }
  }
  regex += '$'
  return new RegExp(regex)
}

function getIgnoreMatchers(projectConfig) {
  return (projectConfig.packOptions?.ignore || []).map(item => {
    if (item.type === 'folder') {
      const folder = item.value.replace(/^\/+|\/+$/g, '')
      return relPath => relPath === folder || relPath.startsWith(folder + '/')
    }
    if (item.type === 'glob') {
      const matcher = globToRegExp(item.value)
      return relPath => matcher.test(relPath)
    }
    if (item.type === 'regexp') {
      const matcher = new RegExp(item.value)
      return relPath => matcher.test(relPath)
    }
    return () => false
  })
}

function isIgnored(relPath, matchers) {
  return matchers.some(matcher => matcher(relPath))
}

function extractRemoteImagePaths() {
  const filePath = path.join(ROOT, 'utils/image-host.js')
  const source = fs.readFileSync(filePath, 'utf8')
  const matches = source.matchAll(/['"]((?:\/images\/)[^'"]+)['"]\s*:\s*true/g)
  return new Set(Array.from(matches, match => match[1]))
}

function formatKb(bytes) {
  return Math.round(bytes / 1024)
}

function sumFiles(files) {
  return files.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0)
}

const projectConfig = readJson('project.config.json')
const ignoreMatchers = getIgnoreMatchers(projectConfig)
const remoteImagePaths = extractRemoteImagePaths()

const imageFiles = walk(path.join(ROOT, 'images'), {
  skip: relPath => GENERATED_IMAGE_DIRS.some(dir => `/${relPath}/`.includes(dir))
})
  .filter(filePath => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
  .map(filePath => {
    const relPath = toRelative(filePath)
    return {
      relPath,
      hostPath: toImageHostPath(relPath),
      bytes: fs.statSync(filePath).size
    }
  })

const largeImages = imageFiles
  .filter(file => file.bytes >= thresholdKb * 1024)
  .sort((a, b) => b.bytes - a.bytes || a.relPath.localeCompare(b.relPath))

const missingRemoteWhitelist = largeImages.filter(file => !remoteImagePaths.has(file.hostPath))
const missingPackIgnore = largeImages.filter(file => !isIgnored(file.relPath, ignoreMatchers))
const missingMirrorCopy = largeImages.filter(file => !fs.existsSync(path.join(ROOT, 'vercel-assets', file.relPath)))
const remoteImageFiles = imageFiles.filter(file => remoteImagePaths.has(file.hostPath))
const missingRemotePackIgnore = remoteImageFiles.filter(file => !isIgnored(file.relPath, ignoreMatchers))
const missingRemoteMirrorCopy = remoteImageFiles.filter(file => !fs.existsSync(path.join(ROOT, 'vercel-assets', file.relPath)))
const staleRemoteWhitelist = Array.from(remoteImagePaths)
  .filter(hostPath => !fs.existsSync(path.join(ROOT, hostPath.slice(1))))
  .sort()

const packageFiles = walk(ROOT, {
  skip: (relPath, entry) => {
    if (relPath === '') return false
    if (relPath === '.git') return true
    return entry.isDirectory() && isIgnored(relPath, ignoreMatchers)
  }
}).filter(filePath => !isIgnored(toRelative(filePath), ignoreMatchers))

const packageBytes = sumFiles(packageFiles)
const packageKb = formatKb(packageBytes)

const result = {
  thresholdKb,
  maxPackageKb,
  packageKb,
  packageOk: packageKb < maxPackageKb,
  largeImages: largeImages.map(file => ({
    path: file.relPath,
    kb: formatKb(file.bytes),
    remoteWhitelisted: remoteImagePaths.has(file.hostPath),
    packIgnored: isIgnored(file.relPath, ignoreMatchers),
    mirrorCopied: fs.existsSync(path.join(ROOT, 'vercel-assets', file.relPath))
  })),
  missingRemoteWhitelist: missingRemoteWhitelist.map(file => file.relPath),
  missingPackIgnore: missingPackIgnore.map(file => file.relPath),
  missingMirrorCopy: missingMirrorCopy.map(file => file.relPath),
  missingRemotePackIgnore: missingRemotePackIgnore.map(file => file.relPath),
  missingRemoteMirrorCopy: missingRemoteMirrorCopy.map(file => file.relPath),
  staleRemoteWhitelist
}

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log(`Image asset check`)
  console.log(`- Threshold: ${thresholdKb}KB`)
  console.log(`- Estimated mini program package: ${packageKb}KB / ${maxPackageKb}KB`)
  console.log(`- Large local images: ${largeImages.length}`)
  console.log(`- Missing utils/image-host.js whitelist: ${missingRemoteWhitelist.length}`)
  console.log(`- Missing project.config.json pack ignore: ${missingPackIgnore.length}`)
  console.log(`- Missing vercel-assets mirror copy: ${missingMirrorCopy.length}`)
  console.log(`- Remote whitelist missing pack ignore: ${missingRemotePackIgnore.length}`)
  console.log(`- Remote whitelist missing mirror copy: ${missingRemoteMirrorCopy.length}`)
  console.log(`- Stale whitelist entries: ${staleRemoteWhitelist.length}`)

  const sections = [
    ['Missing remote whitelist', missingRemoteWhitelist],
    ['Missing pack ignore', missingPackIgnore],
    ['Missing mirror copy', missingMirrorCopy],
    ['Remote whitelist missing pack ignore', missingRemotePackIgnore],
    ['Remote whitelist missing mirror copy', missingRemoteMirrorCopy],
    ['Stale remote whitelist', staleRemoteWhitelist.map(hostPath => ({ relPath: hostPath }))],
  ]

  for (const [title, files] of sections) {
    if (!files.length) continue
    console.log(`\n${title}:`)
    for (const file of files) {
      const relPath = typeof file === 'string' ? file : file.relPath
      const image = imageFiles.find(item => item.relPath === relPath || item.hostPath === relPath)
      const suffix = image ? ` (${formatKb(image.bytes)}KB)` : ''
      console.log(`- ${relPath}${suffix}`)
    }
  }
}

const hasFailures = (
  packageKb >= maxPackageKb ||
  missingRemoteWhitelist.length > 0 ||
  missingPackIgnore.length > 0 ||
  missingMirrorCopy.length > 0 ||
  missingRemotePackIgnore.length > 0 ||
  missingRemoteMirrorCopy.length > 0 ||
  staleRemoteWhitelist.length > 0
)

process.exitCode = hasFailures ? 1 : 0
