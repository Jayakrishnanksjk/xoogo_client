# Design System Specification (`DESIGN.md`)

## Visual Philosophy
- **Aesthetic Direction**: [e.g., Clean, high-contrast, modern dark mode with vibrant accents.]
- **Micro-Interactions**: Subtle hover states, smooth transitions, skeleton loading states for every async boundary. Zero layout shifts.

---

## 1. Color Tokens & Theme Matrix

### Dark Mode (Default)
- `--bg-primary`: `#0A0A0C` (Primary background)
- `--bg-secondary`: `#121216` (Elevated card/surface background)
- `--bg-tertiary`: `#1C1C22` (Borders, subtle fills, interactive surfaces)
- `--text-primary`: `#F4F4F6` (High-contrast primary typography)
- `--text-secondary`: `#8E8EA0` (Muted labels, metadata, secondary text)
- `--accent-primary`: `{{ACCENT_COLOR}}` (Electric brand highlight / action color)
- `--accent-hover`: `{{ACCENT_HOVER}}` (Active / hover action color)
- `--border-subtle`: `#262630` (Clean structural divider lines)

> **RULE**: Arbitrary, hardcoded hex values (e.g. `text-[#888888]`, `bg-[#181818]`) are strictly forbidden in application code. All colors must resolve through these tokens.

---

## 2. Typography Hierarchy

| Token Class | Font Size | Weight | Line Height | Usage Context |
| :--- | :--- | :--- | :--- | :--- |
| `text-display` | `2.25rem` (`36px`) | `700` Bold | `1.2` | Hero headlines, primary section titles |
| `text-heading` | `1.5rem` (`24px`) | `600` Semi-Bold | `1.3` | Card headers, modal titles, subheadings |
| `text-body` | `0.875rem` (`14px`) | `400` Regular | `1.5` | Body copy, descriptions, list items |
| `text-caption` | `0.75rem` (`12px`) | `500` Medium | `1.4` | Badges, tags, metadata, timestamps |

---

## 3. Atomic Component Inventory Specifications (`cva` Standard)

Every primitive component below is the **sole source of truth** for its UI family. All visual states and sizes must be managed via Class Variance Authority (`cva`) inside that single file. **Never create fragmented duplicates or write native HTML tags (e.g., raw `<button>`).**

### `Button` Component (`src/components/ui/button.tsx`)
- **Single Source of Truth**: All buttons, links, icon buttons, and pill tabs across the entire project must derive from this component.
- **Variants (`cva`)**:
  - `primary`: Accent background, white text.
  - `secondary`: Secondary background, subtle border.
  - `outline`: Border subtle, transparent fill.
  - `ghost`: Transparent background, hover fill.
  - `link`: Underlined text link with zero padding.
  - `pill` / `pillActive`: Rounded-full tab filters and toggle pills.
- **Sizes (`cva`)**: `xs` (`h-6 px-2 text-[11px]`), `sm` (`h-8 px-3 text-xs`), `md` (`h-10 px-4 text-sm`), `lg` (`h-12 px-6 text-base`), `icon` (`h-8 w-8 p-0`).
- **Behavior**: Built-in loading spinner, disables automatically during async actions.

### `Card` Component (`src/components/ui/card.tsx`)
- **Structure**: Rounded corners (`rounded-xl`), background `--bg-secondary`, border `--border-subtle`.
- **Variants (`cva`)**: `default`, `interactive` (hover border glow), `flat` (borderless).

### `Skeleton` Component (`src/components/ui/skeleton.tsx`)
- **Purpose**: Animated pulsing loader matching exact content dimensions to guarantee zero layout shifts (CLS = 0).

---

## 4. Layout & Spacing Rules
- **Grid Layouts**: Standardized 8pt grid (`gap-2`, `gap-4`, `gap-6`, `gap-8`).
- **Container Padding**: Mobile (`p-4`), Desktop (`p-8`). Max width container capped at `1280px` (`max-w-7xl`).
