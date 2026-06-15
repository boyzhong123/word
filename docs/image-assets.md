# Image Assets

This mini program keeps original images in `images/`, but large runtime images are served from Tencent COS so the WeChat package stays under 4MB.

## Current Remote Host

Remote image host:

```text
https://proverbs-assets-1259216952.cos.ap-nanjing.myqcloud.com
```

The mini program backend must include this host in `downloadFile` legal domains:

```text
https://proverbs-assets-1259216952.cos.ap-nanjing.myqcloud.com
```

## Rules

- Do not delete local originals in `images/`.
- Keep small UI assets local, especially buttons, icons, small sprites, and SVG-like decorative pieces.
- Treat images around `150KB` or larger as remote candidates.
- Keep dynamic `frame-animation` sprites remote when they must work on real devices, even if an individual state image is smaller than `150KB`.
- A remote image needs all three local signals:
  - It exists locally under `images/...`.
  - It is listed in `utils/image-host.js` inside `REMOTE_IMAGE_PATHS`.
  - It is ignored from the mini program package in `project.config.json` `packOptions.ignore`.
- Keep a mirror copy under `vercel-assets/images/...`; despite the old folder name, this directory is the upload staging mirror.

## Switching Local And Remote

`utils/image-host.js` owns switching:

```js
const USE_REMOTE_IMAGES = true
```

- `true`: WeChat runtime uses Tencent COS for paths listed in `REMOTE_IMAGE_PATHS`.
- `false`: WeChat runtime uses local files.
- Node tests still use local paths because `wx` is undefined.

## Check Before Preview

Run:

```bash
npm run check:images
```

or:

```bash
node scripts/check-image-assets.mjs
```

The checker reports:

- estimated mini program package size
- large images missing from `utils/image-host.js`
- large images missing from `project.config.json`
- large images missing from `vercel-assets`
- stale remote whitelist paths that no longer exist locally

Use JSON output when another agent needs structured data:

```bash
node scripts/check-image-assets.mjs --json
```

## Upload Remote Images

Tencent COS upload credentials live outside the repo:

```text
/Users/zhong/.config/proverbs/cos.env
```

That file is local-only and must never be committed or pasted into chat. It uses the limited CAM subuser `proverbs-cos-uploader`, scoped to the `proverbs-assets-1259216952/images/*` objects.

Upload all remote-whitelisted mirror images:

```bash
npm run upload:images
```

Upload one or more specific remote images:

```bash
npm run upload:images -- images/listen/loading-mascot-sprite.png
```

Preview what would upload without changing COS:

```bash
npm run upload:images -- --dry-run
```

## Auto-Promote Newly Generated Large Images

When new runtime images are generated, run:

```bash
npm run sync:large-images
```

This command scans `images/` for files at least `150KB`, skips build intermediates such as `.jelly-build`, then:

- adds missing paths to `utils/image-host.js`
- adds missing package ignores to `project.config.json`
- copies files into `vercel-assets/images/...`
- uploads newly promoted or changed files to Tencent COS

Preview the changes first:

```bash
npm run sync:large-images -- --dry-run
```

## When The Package Exceeds 4MB Again

1. Run `npm run sync:large-images`.
2. Run `npm run check:images`.
3. If the checker still reports missing whitelist, pack ignore, or mirror entries, inspect those paths manually; they may be intentionally generated build intermediates or very small dynamic sprites that need a case-by-case decision.
4. Confirm at least one uploaded image returns `HTTP 200`.

## Tencent COS Notes

- Bucket: `proverbs-assets-1259216952`
- Region: `ap-nanjing`
- Access: public read, private write
- Recommended object cache:

```text
Cache-Control: public, max-age=31536000, immutable
```

Temporary main-account API keys should not be used for routine image uploads. Use the limited `proverbs-cos-uploader` subuser saved in the local env file instead.
