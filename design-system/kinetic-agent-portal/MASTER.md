# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/kinetic-agent-portal/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.
>
> **Source of truth for values:** `assets/design-tokens.json` (generated CSS: `assets/design-tokens.css`).
> Do not restyle from the ui-ux-pro-max catalog output. Surfaces use the warm grey palette (Bleached Silk / First Star). Never use black or navy as a page or sidebar background. Black Olive is text only.

---

**Project:** Kinetic Agent Portal
**Updated:** 2026-08-21
**Category:** Agent onboarding / document review workspace (SaaS admin + agent portals)
**Design Dials:** Variance 4/10 (Balanced) | Motion 3/10 (Subtle) | Density 7/10 (Dashboard)

---

## Global Rules

### Color Palette

Implemented as OKLCH in tokens. Approximate roles:

| Role | Token | Look |
|------|--------|------|
| Page background | `--background` | First Star `#DBDAD6` |
| Cards / sidebar / inputs | `--card` / `--sidebar` | Bleached Silk `#F7F7F6` |
| Foreground | `--foreground` | Black Olive `#373736` (text only) |
| Primary buttons | `--primary` | Welded Iron `#6E6E6C` |
| Muted text | `--muted-foreground` | Welded Iron |
| Borders / disabled | `--border` | Mountain Mist `#A4A3A0` |
| Accent / ring | `--accent` / `--ring` | Gold |
| Success / warning / destructive | semantic status tokens | Green / amber / red washes |

Never use Black Olive, navy, or pure black as a page, sidebar, or card background. Gold remains the heading mark and focus ring.

### Typography

- **Heading / UI:** IBM Plex Sans (`--font-sans`)
- **IDs, money, app numbers:** IBM Plex Mono (`--font-mono`)
- **Page title:** xl / 2xl, semibold, tracking-tight, gold mark (`.portal-heading-mark`)
- **Section title:** `.portal-section-title` (base, 1rem) inside cards and table headers
- **Card title:** `.portal-card-title` (base, semibold) for chart and nested headings
- **Body:** 16px base; most chrome is `text-sm`
- **Kickers:** `.portal-kicker` (xs, uppercase, tracking-wider)

Do not switch to Fira Code / Fira Sans or oversized display headlines.

### Spacing

4px base. Semantic:

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-component` | 1.5rem | Card padding |
| `--spacing-section` / `--spacing-page` | 2rem | Page gap and desktop horizontal padding |

Page shell: `.portal-page` (max 1400px). Narrow forms: `.portal-page-narrow` / `.portal-page-form`.

### Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` / input | 0.5rem | Inputs, selects |
| `--primitive-radius-2xl` | 1.5rem | Compact cards (stat tiles) |
| `--card-radius` / `--shell-radius` | 1.75rem | Cards, tables, app shell (`rounded-3xl`) |
| `--button-radius` / `--badge-radius` | 9999px | Buttons, nav items, status pills |

### Shadows

Use `--primitive-shadow-sm` on cards/tables and `--primitive-shadow-md` on auth/dialogs. Prefer `ring-1 ring-border/60` over heavy drop shadows.

---

## Layout primitives

Use these instead of one-off wrappers:

- `.portal-page` — dashboard and list pages
- `.portal-page-narrow` — help, profile
- `.portal-page-form` — apply wizard
- `.portal-card` — padded surface
- `.portal-card-muted` — First Star inset
- `.portal-stat-card` / `.portal-stat-grid` — compact metric tiles
- `.portal-toolbar` — search + filter row
- `.portal-section-head` — table/card section header row
- `.portal-table` — unpadded table/list shell (horizontal scroll on small screens)
- `.portal-table-head` / `.portal-table-row`
- `.portal-callout` — success / warning / destructive banners
- `.portal-empty` — table and list empty states
- `PageHeader` — title + optional back/action
- `TablePagination` — shared pager with a visible page window

---

## Component Specs

### Buttons

Pills. Default height `--button-height` (2.25rem / `h-9`). Primary is Welded Iron, not green. Outline/ghost for secondary. Destructive is tinted, not solid red fill.

Disabled: `--button-disabled-bg` + `--button-disabled-fg`, full opacity, not a faded outline. Explain why with a tooltip — not hover-only as the sole message.

### Inputs

Height `--input-height` (2.25rem). Visible `<Label>`. Focus: gold ring (`--ring`). Errors: `--destructive` border + message under the field.

### Cards / tables

`rounded-3xl`, Bleached Silk, light ring. Table headers: uppercase muted xs. Row hover: `--secondary` wash.

### Status badges

Pills (`--badge-radius`), 11px (`--badge-font-size`) uppercase with `--badge-tracking`. Never wrap. Status color **and** label text (do not rely on color alone). Use `.status-badge` plus a tone class:

| Status | Class | Tokens |
|--------|--------|--------|
| Approved / verified | `.status-badge-success` | `--badge-success-bg/fg` |
| Pending | `.status-badge-warning` | `--badge-warning-bg/fg` |
| Rejected | `.status-badge-destructive` | `--badge-destructive-bg/fg` |
| Required / missing | `.status-badge-muted` | `--badge-muted-bg/fg` |
| Admin uploaded | `.status-badge-accent` | `--badge-accent-bg/fg` |

Use `DocumentStatusLabel` — do not invent one-off badge classes on documents.

### Menus (3-dot / dropdown)

White popover (`--menu-bg` / Bleached Silk), 1rem radius (`--menu-radius`), First Star row hover (`--menu-hover-bg`). Gold is the focus ring, not the menu highlight. Disabled items use `--opacity-disabled` and `--button-disabled-fg`.

### Sidebar

Bleached Silk rail, pill nav, Welded Iron brand mark. Collapsed width `--sidebar-width-collapsed`. Never black or navy.

---

## Style Guidelines

**Style:** Editorial operations workspace — First Star canvas, Bleached Silk cards and sidebar, Black Olive text, gold accent, large type, pill controls.

**Not this product:** Glassmorphism, frosted overlays on the main canvas, full-page dark mode as default, green primary buttons, marketing “hero + live ticker” landing patterns.

**Motion:** 150ms color/background (`--primitive-duration-fast`). Respect `prefers-reduced-motion` (already in `globals.css`). No GSAP scroll reveals on app chrome.

---

## UX rules (from ui-ux-pro-max, keep)

- Visible labels on every input; no placeholder-only fields
- Inline errors near the field; after failed submit, keep them (do not toast-only)
- Badge labels stay on one line (`whitespace-nowrap`)
- Tables: `overflow-x-auto` or card layout on small screens
- Touch targets: ≥8px gap
- Lucide SVG icons only — no emoji icons
- Focus rings visible; contrast ≥4.5:1 on Bleached Silk / First Star

---

## Anti-Patterns (Do NOT Use)

- ❌ Restyling to the catalog dark-slate / glassmorphism / Fira / green CTA system
- ❌ Mixing `rounded-lg` bordered tables with 1.75rem ringed cards on the same app
- ❌ Page titles without the shared `PageHeader` / gold mark
- ❌ Raw hex in components — use semantic tokens
- ❌ Gold fill as dropdown/menu row hover (gold is ring/mark only)
- ❌ One-off document status chips instead of `.status-badge` / `DocumentStatusLabel`
- ❌ Emojis as icons
- ❌ Layout-shifting hover scales
- ❌ Invisible focus states

---

## Pre-Delivery Checklist

- [ ] Tokens from `assets/design-tokens.json`, not hardcoded hex
- [ ] Page uses `.portal-page` (or narrow/form variant) + `PageHeader`
- [ ] Surfaces use `.portal-card` or `.portal-table`
- [ ] Buttons and status chips are pills
- [ ] Lucide icons, visible focus, reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
