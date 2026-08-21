# Documents review page

Overrides Master for `/admin/documents`. Source of truth for values remains `assets/design-tokens.json`.

## Status

Use `DocumentStatusLabel` (`.status-badge` tokens). Do not restyle with `bg-[var(--color-success)]` or shadcn `Badge` one-offs.

| State | Visual |
|-------|--------|
| Approved | Success muted wash + emphasis text |
| Pending | Warning muted wash + warning-foreground (dark amber, not pale amber-on-cream) |
| Rejected | Destructive muted wash + emphasis text |
| Required | Muted cream + muted-foreground |
| Admin uploaded | Accent muted wash + gold emphasis |

Labels stay uppercase, 11px, nowrap.

## Bulk Download

- Enabled when at least one document with a file is selected (approved, pending, or rejected).
- Disabled look: `--button-disabled-bg` / `--button-disabled-fg` via `.portal-download-btn` when nothing is selected.
- Count on the button is the selected file count.
- Tooltip on the disabled control: “Select documents to download.”

## Row 3-dot menu

- Pill ghost trigger (`rounded-full`).
- Menu uses `--menu-*` tokens: cream hover, not gold fill.
- **Download** is enabled when the row has a file.
- **Upload on behalf of agent** stays available.
- Separate download from upload with a menu separator.
