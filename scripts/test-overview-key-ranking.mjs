scripts/build.sh
scripts/community.html
scripts/pricing.html
scripts/render-community.mjs
scripts/render-pricing.mjs
scripts/render-stats.mjs
scripts/render-transport.mjs
scripts/stats.html
scripts/test-overview-key-ranking.mjs
scripts/test-smtp.mjs
scripts/transport.html

-- overview test style --
import assert from 'node:assert/strict';
import test from 'node:test';
import { rankActiveKeysThisMonth } from '../src/app/dev-en/_lib/overview-key-ranking.mjs';

test('keeps a zero-call starter key visible in the overview ranking', () => {
  const keys = [
    { id: 'starter', status: 'active', isStarter: true },
    { id: 'production', status: 'active', isStarter: false },
  ];

  const ranked = rankActiveKeysThisMonth(keys, () => 0);

  assert.deepEqual(
    ranked.map(({ key }) => key.id),
    ['starter', 'production'],
  );
});

test('ranks active keys by this-month calls and omits paused keys', () => {
  const keys = [
    { id: 'starter', status: 'active', isStarter: true },
    { id: 'paused', status: 'paused', isStarter: false },
    { id: 'production', status: 'active', isStarter: false },
  ];
  const calls = new Map([
    ['starter', 10],
    ['paused', 999],
    ['production', 20],
  ]);

  const ranked = rankActiveKeysThisMonth(keys, (keyId) => calls.get(keyId) ?? 0);

  assert.deepEqual(
    ranked.map(({ key }) => key.id),
    ['production', 'starter'],
  );
});

-- tsconfig --
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "next.config.ts",
    "postcss.config.mjs",
    "eslint.config.mjs",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "*.mts"
  ],
  "exclude": [
    "node_modules",
    ".claude",
    "ChivoxMCP全球"
  ]
}
