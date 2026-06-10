<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 部署 / 上线

仓库本身**不绑定任何具体托管平台**。生产部署由公司运维按 `docs/deploy/README.md` 执行（Docker 或裸机均可）。AI 助手不要在未经用户明确指示的情况下执行任何 `deploy` / `publish` 类命令。

## 版本号

用户要求「打版本」时，更新 `package.json` 中 `version`，再用 `git tag -a vX.Y.Z -m "vX.Y.Z"` 标注，并与用户确认是否需要推送到远端。

--- package ---
{
  "name": "chivox-mcp-website",
  "version": "1.1.5",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build",
    "preview": "next build && next start",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@base-ui/react": "^1.3.0",
    "@fontsource-variable/fraunces": "^5.2.9",
    "@fontsource/noto-sans-sc": "^5.2.9",
    "@paypal/react-paypal-js": "^9.2.0",
    "@stripe/stripe-js": "^9.3.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.8.0",
    "next": "^16.2.4",
    "next-themes": "^0.4.6",
    "nodemailer": "^8.0.5",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "shadcn": "^4.2.0",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.0",
    "@types/node": "^20",
    "@types/nodemailer": "^8.0.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.3",
    "playwright": "^1.59.1",
    "tailwindcss": "^4.3.0",
    "typescript": "^5"
  }
}

--- next docs candidates ---
node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md
node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache-private.md
node_modules/next/dist/docs/01-app/03-api-reference/01-directives/index.md
node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache-remote.md
node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md
node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md
node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md
node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md
node_modules/next/dist/docs/01-app/03-api-reference/02-components/index.md
node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md
node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md
node_modules/next/dist/docs/01-app/03-api-reference/02-components/form.md
node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/05-routing-with-next-routing.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/03-api-reference.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/08-invoking-entrypoints.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/index.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/06-implementing-ppr-in-an-adapter.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/04-testing-adapters.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/07-runtime-integration.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/02-creating-an-adapter.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/11-use-cases.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/01-configuration.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/10-routing-information.md
node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/09-output-types.md
node_modules/next/dist/docs/01-app/03-api-reference/index.md
node_modules/next/dist/docs/01-app/03-api-reference/06-cli/create-next-app.md
node_modules/next/dist/docs/01-app/03-api-reference/06-cli/index.md
node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/parallel-routes.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/mdx-components.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/forbidden.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/unauthorized.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/default.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/template.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/intercepting-routes.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/runtime.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/preferredRegion.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/src-folder.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/index.md
node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md
node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md
node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md
node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md
node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md
node_modules/next/dist/docs/01-app/01-getting-started/18-upgrading.md
node_modules/next/dist/docs/01-app/01-getting-started/index.md
node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md
node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md
node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md
node_modules/next/dist/docs/01-app/01-getting-started/01-installation.md
node_modules/next/dist/docs/01-app/01-getting-started/11-css.md
node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md
node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
node_modules/next/dist/docs/01-app/01-getting-started/12-images.md
node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md
node_modules/next/dist/docs/index.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/index.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md
node_modules/next/dist/docs/01-app/04-glossary.md
node_modules/next/dist/docs/01-app/index.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/index.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/public-folder.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/exportPathMap.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/pageExtensions.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopackIgnoreIssue.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/typedRoutes.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/deploymentId.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/onDemandEntries.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/sassOptions.md
node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/appDir.md
