#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const COS = require('cos-nodejs-sdk-v5')
const mime = require('mime-types')

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_ENV_PATH = '/Users/zhong/.config/proverbs/cos.env'
const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const args = new Map()
const positional = []
for (const arg of process.argv.slice(2)) {
  const match = arg.match(/^--([^=]+)=(.*)$/)
  if (match) {
    args.set(match[1], match[2])
  } else if (arg.startsWith('--')) {
    args.set(arg.slice(2), true)
  } else {
    positional.push(arg)
  }
}

const envPath = String(args.get('env') || process.env.TENCENT_COS_ENV || DEFAULT_ENV_PATH)
const dryRun = Boolean(args.get('dry-run'))
const force = Boolean(args.get('force'))

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing COS env file: ${filePath}`)
  }

  const values = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
  return values
}

function extractRemoteImagePaths() {
  const filePath = path.join(ROOT, 'utils/image-host.js')
  const source = fs.readFileSync(filePath, 'utf8')
  const matches = source.matchAll(/['"]((?:\/images\/)[^'"]+)['"]\s*:\s*true/g)
  return Array.from(matches, match => match[1]).sort()
}

function normalizeHostPath(input) {
  const value = String(input || '').trim()
  if (!value) return ''
  return ('/' + value)
    .replace(/^\/+/, '/')
    .replace(/^\/vercel-assets\//, '/')
    .replace(/^\/images\//, '/images/')
}

function assertEnv(values, key) {
  if (!values[key]) {
    throw new Error(`Missing ${key} in ${envPath}`)
  }
  return values[key]
}

function headObject(cos, params) {
  return new Promise(resolve => {
    cos.headObject(params, (err, data) => {
      if (err) {
        resolve({ exists: false, err })
        return
      }
      resolve({ exists: true, data })
    })
  })
}

function putObject(cos, params) {
  return new Promise((resolve, reject) => {
    cos.putObject(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

function getRemoteSize(headData) {
  const headers = headData?.headers || {}
  const value = headData?.ContentLength || headers['content-length'] || headers['Content-Length']
  const size = Number(value)
  return Number.isFinite(size) ? size : null
}

function getRemoteEtag(headData) {
  const headers = headData?.headers || {}
  const value = headData?.ETag || headers.etag || headers.ETag
  return String(value || '')
    .replace(/^W\//, '')
    .replace(/^"|"$/g, '')
    .toLowerCase()
}

function getFileMd5(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex')
}

const env = loadEnv(envPath)
const SecretId = assertEnv(env, 'TENCENT_SECRET_ID')
const SecretKey = assertEnv(env, 'TENCENT_SECRET_KEY')
const Bucket = assertEnv(env, 'TENCENT_COS_BUCKET')
const Region = assertEnv(env, 'TENCENT_COS_REGION')
const allowedPrefix = env.TENCENT_COS_PREFIX || 'images/'

const cos = new COS({ SecretId, SecretKey })
const remotePaths = extractRemoteImagePaths()
const selectedPaths = positional.length
  ? positional.map(normalizeHostPath).filter(Boolean)
  : remotePaths

const invalidPaths = selectedPaths.filter(hostPath => !remotePaths.includes(hostPath))
if (invalidPaths.length) {
  throw new Error(`Refusing to upload paths outside REMOTE_IMAGE_PATHS:\n${invalidPaths.join('\n')}`)
}

const targets = selectedPaths.map(hostPath => {
  const key = hostPath.slice(1)
  if (!key.startsWith(allowedPrefix)) {
    throw new Error(`Refusing to upload outside ${allowedPrefix}: ${key}`)
  }
  return {
    hostPath,
    key,
    filePath: path.join(ROOT, 'vercel-assets', key)
  }
})

const missingMirror = targets.filter(target => !fs.existsSync(target.filePath))
if (missingMirror.length) {
  throw new Error(`Missing mirror files under vercel-assets:\n${missingMirror.map(target => target.key).join('\n')}`)
}

let uploaded = 0
let skipped = 0
let failed = 0

console.log(`Tencent COS image upload`)
console.log(`- Bucket: ${Bucket}`)
console.log(`- Region: ${Region}`)
console.log(`- Source: vercel-assets/`)
console.log(`- Targets: ${targets.length}`)
console.log(`- Dry run: ${dryRun ? 'yes' : 'no'}`)

for (const target of targets) {
  const stat = fs.statSync(target.filePath)
  const params = {
    Bucket,
    Region,
    Key: target.key
  }

  try {
    if (!force) {
      const head = await headObject(cos, params)
      const remoteSize = head.exists ? getRemoteSize(head.data) : null
      const remoteEtag = head.exists ? getRemoteEtag(head.data) : ''
      const localMd5 = getFileMd5(target.filePath)
      if (remoteSize === stat.size && remoteEtag === localMd5) {
        skipped += 1
        console.log(`skip ${target.key} (${Math.round(stat.size / 1024)}KB)`)
        continue
      }
    }

    if (dryRun) {
      console.log(`would upload ${target.key} (${Math.round(stat.size / 1024)}KB)`)
      continue
    }

    await putObject(cos, {
      ...params,
      Body: fs.createReadStream(target.filePath),
      ContentType: mime.lookup(target.filePath) || 'application/octet-stream',
      CacheControl: DEFAULT_CACHE_CONTROL
    })
    uploaded += 1
    console.log(`uploaded ${target.key} (${Math.round(stat.size / 1024)}KB)`)
  } catch (error) {
    failed += 1
    console.error(`failed ${target.key}: ${error.message || error}`)
  }
}

console.log(`Done: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed.`)
process.exitCode = failed ? 1 : 0
