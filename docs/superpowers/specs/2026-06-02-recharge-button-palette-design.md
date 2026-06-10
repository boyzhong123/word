# Recharge Button Palette Design

## Scope

Refresh the two visible recharge CTAs on the billing overview without changing
their click handlers, labels, or layout responsibilities:

- the primary recharge action in the billing page header
- the recharge action inside the dark wallet card

## Visual Direction

Use a restrained deep-navy palette with a small mint accent. The navy connects
the CTA to the wallet card; the mint highlight connects it to the trial card.
Avoid the previous saturated violet gradient.

The page-header action keeps the full treatment: navy gradient, mint plus tile,
subtle mint edge highlight, and a soft navy-teal shadow. The wallet-card action
uses a light inverse treatment so it remains legible against the dark card while
sharing the same mint accent.

## Behavior

Both buttons preserve their existing `onClick` handlers and labels. Hover,
active, and keyboard focus states remain visible.

## Verification

Run lint and a production build, then inspect the billing page in a browser.
# Recharge Button Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the billing recharge CTAs' saturated violet styling with a deep-navy and mint visual system.

**Architecture:** Keep both existing interactive buttons and their click handlers intact. Update only Tailwind utility classes in the billing header and wallet-card CTA so the visual refresh stays local to the existing components.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, lucide-react

---

### Task 1: Refresh The Recharge CTAs

**Files:**
- Modify: `src/app/dev-en/dashboard/billing/page.tsx`
- Modify: `src/app/dev-en/_components/account-wallet-strip.tsx`

- [ ] **Step 1: Update the billing-page CTA**

Replace the violet gradient and shadow with deep navy, a mint plus tile, and a
navy-teal hover shadow while preserving the existing label and click handler.

- [ ] **Step 2: Update the wallet-card CTA**

Use a light inverse button with a mint plus tile and navy text so the action
remains clear on the dark wallet card.

- [ ] **Step 3: Run static verification**

Run: `pnpm lint && pnpm build`

Expected: both commands exit with status `0`.

- [ ] **Step 4: Inspect the billing page**

Open the local billing page and confirm both recharge buttons remain legible,
balanced, and visually related to the wallet and trial cards.
        <button
          type="button"
          onClick={openAddCredits}
          className="group inline-flex h-10 items-center gap-2 rounded-xl border border-[#4fc9a3]/25 bg-gradient-to-r from-[#10233f] via-[#123047] to-[#153d4c] px-2.5 pr-3.5 text-sm font-semibold text-white shadow-[0_9px_20px_-11px_rgba(13,86,91,0.9)] transition-all hover:-translate-y-px hover:border-[#72dbbd]/45 hover:from-[#132b4b] hover:via-[#15384f] hover:to-[#174b54] hover:shadow-[0_13px_24px_-12px_rgba(24,131,120,0.85)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ed7b2]/55 focus-visible:ring-offset-2"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5ed7b2]/18 text-[#9aefd5] ring-1 ring-[#8be4c9]/30 transition-colors group-hover:bg-[#5ed7b2]/25">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <span>{t('Add credits', '充值')}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#a8ead7]/75 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#c4f4e6]" />
        </button>
          <button
            type="button"
            onClick={onAddCredits}
            className="group mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-100/80 bg-white/95 px-2.5 pr-3.5 text-[13px] font-semibold text-[#10233f] shadow-[0_8px_18px_-12px_rgba(45,212,191,0.75)] transition-all hover:-translate-y-px hover:bg-white hover:shadow-[0_11px_20px_-12px_rgba(45,212,191,0.9)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ed7b2]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#dff9f0] text-[#0f766e] ring-1 ring-[#5ed7b2]/35 transition-colors group-hover:bg-[#cef5e8]">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            {tx('Add credits')}
          </button>