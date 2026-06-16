#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMAGE_HOST_PATH = path.join(ROOT, 'utils/image-host.js')
const PROJECT_CONFIG_PATH = path.join(ROOT, 'project.config.json')
const PRIVATE_CONFIG_PATH = path.join(ROOT, 'project.private.config.json')

const mode = process.argv[2]
if (mode !== 'local' && mode !== 'remote') {
  console.error('Usage: node scripts/toggle-image-mode.mjs <local|remote>')
  process.exit(1)
}

function extractRemoteImageGlobs() {
  const source = fs.readFileSync(IMAGE_HOST_PATH, 'utf8')
  return Array.from(source.matchAll(/'(\/images\/[^']+)': true/g), match => match[1].slice(1))
}

function setUseRemoteImages(enabled) {
  const source = fs.readFileSync(IMAGE_HOST_PATH, 'utf8')
  const next = source.replace(
    /const USE_REMOTE_IMAGES = (true|false)/,
    `const USE_REMOTE_IMAGES = ${enabled ? 'true' : 'false'}`
  )
  if (next === source) {
    throw new Error('Failed to update USE_REMOTE_IMAGES in utils/image-host.js')
  }
  fs.writeFileSync(IMAGE_HOST_PATH, next)
}

function buildPrivateConfig(remoteGlobs) {
  const projectConfig = JSON.parse(fs.readFileSync(PROJECT_CONFIG_PATH, 'utf8'))
  const ignore = (projectConfig.packOptions?.ignore || []).filter(entry => {
    if (entry.type !== 'glob') return true
    return !remoteGlobs.includes(entry.value)
  })

  let privateConfig = {}
  if (fs.existsSync(PRIVATE_CONFIG_PATH)) {
    privateConfig = JSON.parse(fs.readFileSync(PRIVATE_CONFIG_PATH, 'utf8'))
  }

  privateConfig.description = privateConfig.description || 'Local overrides (gitignored)'
  privateConfig.packOptions = Object.assign({}, privateConfig.packOptions, { ignore, include: [] })
  privateConfig.setting = Object.assign({}, privateConfig.setting, { urlCheck: false })
  return privateConfig
}

function clearPrivatePackOverrides() {
  if (!fs.existsSync(PRIVATE_CONFIG_PATH)) return

  const privateConfig = JSON.parse(fs.readFileSync(PRIVATE_CONFIG_PATH, 'utf8'))
  delete privateConfig.packOptions
  if (privateConfig.setting) {
    delete privateConfig.setting.urlCheck
    if (!Object.keys(privateConfig.setting).length) {
      delete privateConfig.setting
    }
  }

  const hasContent = Object.keys(privateConfig).some(key => key !== 'description')
  if (!hasContent) {
    fs.unlinkSync(PRIVATE_CONFIG_PATH)
    return
  }
  fs.writeFileSync(PRIVATE_CONFIG_PATH, JSON.stringify(privateConfig, null, 2) + '\n')
}

const remoteGlobs = extractRemoteImageGlobs()

if (mode === 'local') {
  setUseRemoteImages(false)
  fs.writeFileSync(PRIVATE_CONFIG_PATH, JSON.stringify(buildPrivateConfig(remoteGlobs), null, 2) + '\n')
  console.log('Local image mode enabled.')
  console.log('- USE_REMOTE_IMAGES = false')
  console.log(`- Removed ${remoteGlobs.length} remote image globs from pack ignore via project.private.config.json`)
  console.log('- setting.urlCheck = false')
  console.log('Recompile the mini program in WeChat DevTools.')
} else {
  setUseRemoteImages(true)
  clearPrivatePackOverrides()
  console.log('Remote image mode enabled.')
  console.log('- USE_REMOTE_IMAGES = true')
  console.log('- Cleared local packOptions override from project.private.config.json')
  console.log('Recompile the mini program in WeChat DevTools.')
}
