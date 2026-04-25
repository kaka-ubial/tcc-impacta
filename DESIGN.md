---
name: Impacta
description: Donation platform connecting donors and institutions — warm, human, purposeful.
colors:
  terracota: "oklch(0.556 0.162 41.0)"
  terracota-light: "oklch(0.72 0.12 41.0)"
  brand-cream: "oklch(0.929 0.028 60.0)"
  sage-green: "oklch(0.571 0.071 152.0)"
  warm-canvas: "oklch(0.970 0.012 70.0)"
  warm-stone: "oklch(0.552 0.022 53.0)"
  warm-card: "oklch(0.990 0.006 68.0)"
  warm-border: "oklch(0.910 0.014 68.0)"
  ink: "oklch(0.145 0 0)"
  paper-white: "oklch(0.985 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  pending-amber: "oklch(0.760 0.130 73.0)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  "2xl": "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.terracota}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "oklch(0.500 0.162 41.0)"
  button-outline:
    backgroundColor: "{colors.warm-canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-default:
    backgroundColor: "{colors.warm-canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card-default:
    backgroundColor: "{colors.warm-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  badge-pending:
    backgroundColor: "oklch(0.760 0.130 73.0 / 0.15)"
    textColor: "{colors.pending-amber}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-success:
    backgroundColor: "oklch(0.571 0.071 152.0 / 0.12)"
    textColor: "{colors.sage-green}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Impacta

## 1. Overview

**Creative North Star: "The Community Hearth"**

Impacta is a gathering place — warm and welcoming enough that a first-time donor feels at home, structured and reliable enough that an institution trusts it with their daily operations. The visual system reflects this duality: a terracota-and-areia palette that feels handmade and human, paired with a product shell that is unambiguously clear and efficient. Playfair Display gives the brand surfaces editorial presence; Instrument Sans gives the app surfaces the quiet confidence of a well-built tool.

The system does not decorate. Every color, weight, and radius earns its place by serving a functional or emotional purpose. The terracota is not used because it is pretty — it is used because it makes every primary action feel warm and intentional instead of corporate and cold. The sage green is not used for decoration — it marks verified trust. The areia canvas is not white — it is the color of paper, of something made by human hands.

The system explicitly rejects: the blue-and-white NGO template (earnest but forgettable), the enterprise SaaS shell (efficient but alienating), and the dense marketplace (chaotic, trust-destroying). A screen in this system should be calm on first glance and obvious on second.

**Key Characteristics:**
- Terracota primary on a warm areia canvas — warm without being earthy-craft-shop
- Playfair Display for headings — editorial gravitas on brand surfaces, used sparingly in the product
- Instrument Sans body — humanist, readable, not technical
- Restrained decoration — borders and backgrounds do the structural work; no shadows as decoration
- Status colors are functional, never ambient — pending amber and sage green only appear on status indicators

## 2. Colors: The Areia Palette

A restrained palette built around one warm accent and two functional secondaries. The terracota is the voice; the areia is the room it speaks in.

### Primary
- **Terracota** (`oklch(0.556 0.162 41.0)`): The brand accent. Used on primary buttons, active sidebar items, focus rings, and the register landing panel. At full saturation, it should occupy no more than 10–15% of any given product screen. On brand (landing) surfaces, it may dominate.
- **Terracota Light** (`oklch(0.72 0.12 41.0)`): Dark-mode version of Terracota. Lighter and slightly desaturated so it stays comfortable on dark backgrounds.

### Secondary
- **Sage Green** (`oklch(0.571 0.071 152.0)`): Trust and verification. Used exclusively for the "Instituição Verificada" badge, the `AlertSuccess` component, and success state indicators. Its low chroma makes it feel earned, not decorative.
- **Pending Amber** (`oklch(0.760 0.130 73.0)`): Waiting states. Used only on institution approval status badges. Never used as a general warning color — that role belongs to Destructive.

### Tertiary
- **Brand Cream** (`oklch(0.929 0.028 60.0)`): A soft warm tint used as a hover/soft background on brand surfaces, the register panel's text wash, and subtle separators where a full border would be too heavy.

### Neutral
- **Warm Canvas** (`oklch(0.970 0.012 70.0)`): Page background. Not pure white — tinted toward warm amber (chroma 0.012). The difference from `#fff` is subtle but prevents the clinical sterility of pure white.
- **Warm Card** (`oklch(0.990 0.006 68.0)`): Card and popover background. Slightly lighter than the canvas to create low-contrast lift without a shadow.
- **Warm Stone** (`oklch(0.552 0.022 53.0)`): Muted foreground — labels, placeholder text, secondary descriptions. Warm and readable without the heaviness of ink.
- **Warm Border** (`oklch(0.910 0.014 68.0)`): Dividers, input strokes, card borders. Barely visible on the canvas; its job is to provide structure, not weight.
- **Ink** (`oklch(0.145 0 0)`): Primary text. Near-black with zero chroma — clean, but use the tinted neutrals where full contrast is not needed.
- **Paper White** (`oklch(0.985 0 0)`): Text on dark/accent backgrounds (button labels on terracota, foreground in dark mode).
- **Destructive** (`oklch(0.577 0.245 27.325)`): Error and delete. High chroma, clearly different from Terracota.

### Named Rules
**The Restraint Rule.** Terracota is reserved for primary actions and the brand panel. It must not appear on informational elements, backgrounds, borders, or decorative shapes in the product app. Its presence should feel deliberate every time.

**The No-Pure-White Rule.** Never use `#ffffff` or `oklch(1 0 0)`. Every neutral must carry the warm 68–70° tint (chroma ≥ 0.005). This applies to cards, modals, inputs, and the page canvas in both registers.

## 3. Typography

**Display Font:** Playfair Display (Georgia, Times New Roman, serif fallback)
**Body Font:** Instrument Sans (ui-sans-serif, system-ui, sans-serif fallback)

**Character:** Playfair Display brings editorial authority — it is a typeface associated with considered, long-form communication, not software. Instrument Sans counters it with warmth and clarity. The pairing says: this product thinks carefully, but it speaks plainly.

### Hierarchy
- **Display** (700, clamp(2.25rem→3.75rem), line-height 1.1, tracking −0.01em): Landing page hero only. The Playfair. Never in the app shell.
- **Headline** (600, clamp(1.5rem→2rem), line-height 1.2): Section headings on brand surfaces. May appear in modal titles and dashboard section headers in Playfair. Instrument Sans `text-xl font-semibold` is the product-register equivalent.
- **Title** (Instrument Sans, 600, 1.125rem, line-height 1.4): Card headings, page titles, sidebar section labels. The workhorse of the product shell.
- **Body** (Instrument Sans, 400, 0.875rem, line-height 1.6): All body copy and form labels. Max line length 65–75ch where reading is sustained.
- **Label** (Instrument Sans, 500, 0.75rem, line-height 1.4, tracking 0.01em): Badge text, table column headers, helper text, microcopy.

### Named Rules
**The Playfair Boundary Rule.** Playfair Display lives in the brand register (landing, register page right panel, marketing sections). It must not appear inside the authenticated app shell — sidebar, dashboard, data tables, settings — where it reads as decorative noise. The boundary is the login event.

## 4. Elevation

This system is **tonal-first, not shadow-first**. Depth is expressed by lightness contrast between surfaces — the warm canvas (`0.970`) under warm card (`0.990`) under modal overlay — not by box shadows. Shadows are state-responsive, not ambient.

### Shadow Vocabulary
- **Ambient Low** (`0 1px 3px oklch(0.145 0 0 / 0.06), 0 1px 2px oklch(0.145 0 0 / 0.04)`): Cards and containers at rest (`shadow-sm` in Tailwind). Present to clarify surface separation, invisible as decoration.
- **Ambient XS** (`0 1px 2px oklch(0.145 0 0 / 0.05)`): Buttons at rest (`shadow-xs`). Provides slight lift to interactive elements.
- **No shadows on hover.** State changes on buttons use background-color shift only (`hover:bg-primary/90`). Hover does not add a new shadow.

### Named Rules
**The Flat-By-Default Rule.** A surface is flat at rest. Shadows appear only to disambiguate layers — modals above app shell, cards above canvas. If adding a shadow is purely decorative, remove it.

## 5. Components

### Buttons
Clean, rounded, tactile. Primary buttons feel warm and intentional; ghosts and outlines feel unobtrusive.

- **Shape:** Gently rounded (8px / `rounded-md`). Not pill-shaped — roundness signals approachability, not playfulness.
- **Size defaults:** Height 36px, padding 8px 16px. Small: 32px tall. Large: 40px tall.
- **Primary:** Terracota background (`oklch(0.556 0.162 41.0)`), paper-white text, shadow-xs. Hover: 90% opacity. Focus: 3px terracota ring at 50% opacity.
- **Outline:** Warm border stroke, warm-canvas background, ink text. Hover: accent/muted background fill. Used for secondary actions within a group.
- **Ghost:** No border, no background. Hover: accent/muted background. Used in table rows, icon buttons, and sidebar items.
- **Destructive:** High-chroma red background, white text. Appears only for irreversible actions (delete, reject). Should appear in a confirming dialog, not as a default action.
- **Loading state:** Inline `<Spinner>` icon prepended. Label unchanged — do not change "Enviar" to "Enviando..." (motion communicates state).

### Cards / Containers
- **Corner Style:** Softly rounded (12px / `rounded-xl`). Larger containers (welcome sections, auth panels) use 16px (`rounded-2xl`).
- **Background:** Warm Card (`oklch(0.990 0.006 68.0)`)
- **Shadow Strategy:** `shadow-sm` — ambient low only. Never elevated on hover unless the card is itself a button.
- **Border:** Warm Border (`oklch(0.910 0.014 68.0)`) — always present on cards. Its lightness contrast with the canvas is the primary surface cue, not the shadow.
- **Internal Padding:** 16px (`p-4`) standard, 24px (`p-6`) for content-heavy cards and modals.

### Inputs / Fields
- **Style:** Warm-border stroke (1px), warm-canvas background, ink text. Height 36px. Radius 8px (`rounded-md`).
- **Focus:** Terracota ring (3px, 50% opacity). The border shifts to terracota at full opacity. No background tint on focus — the ring is sufficient.
- **Error:** Destructive border + destructive ring. Error message in destructive color below the field.
- **Disabled:** 50% opacity. No background change.
- **Placeholder:** Warm Stone color — readable but clearly secondary.

### Navigation
- **Sidebar:** Warm sidebar background (`oklch(0.978 0.010 68.0)`), slightly lighter than the canvas. Sidebar border separates it from the content area.
- **Nav items:** Instrument Sans body size (0.875rem), Warm Stone foreground at rest. Hover: accent/muted background fill, foreground shifts to ink.
- **Active state:** Terracota background tint (`bg-primary/10`) with terracota text. No left-stripe border — full background indicates active state.
- **Sidebar header:** App logo in sidebar-primary-foreground on terracota background.

### Status Badges
Functional only. Rounded-full pill shape, muted tinted backgrounds, text in the functional color.

- **Pendente:** Warm amber background tint (15% opacity), pending-amber text.
- **Aprovada:** Sage green tint (12% opacity), sage-green text.
- **Rejeitada:** Destructive tint (10% opacity), destructive text.
- **Rule:** Status badges are never decorative. If an item has no meaningful status, use no badge.

### DataTable (Signature Component)
The DataTable is the core product pattern — donors and institutions interact with lists of needs, donations, queues.

- **Container:** rounded-xl, warm-card background, warm-border, shadow-sm. Horizontally scrollable below 480px viewport width.
- **Header row:** muted/50% background tint, warm-stone column labels (label scale, medium weight).
- **Data rows:** no background at rest; `hover:bg-muted/40` on hover; warm-border top divider between rows.
- **Empty state:** Centered, 64px top/bottom padding. `PackageOpen` lucide icon at 40px, 40% opacity. Portuguese empty message in warm-stone body text.
- **Loading state:** 4 skeleton rows, each cell with a 16px-tall skeleton capped at 180px wide.

## 6. Do's and Don'ts

### Do:
- **Do** keep terracota to primary actions and the brand panel. Its rarity is what makes it feel warm and deliberate.
- **Do** use tonal surface contrast (canvas → card → popover) as the primary depth signal. Shadows clarify layers, they do not create personality.
- **Do** use Playfair Display only on brand/landing surfaces. The app shell speaks in Instrument Sans.
- **Do** write UI copy in PT-BR throughout. Labels, error messages, empty states, confirmation dialogs — everything the user reads should be in Portuguese.
- **Do** include explicit empty states and loading skeletons for every data-driven list. An empty DataTable must explain why it is empty and what to do next.
- **Do** use rounded-full pill badges for status indicators with muted tinted backgrounds. Status is functional; the muted tint keeps it from screaming.
- **Do** give every interactive element a visible focus ring (3px terracota ring). Keyboard navigation must be obvious.

### Don't:
- **Don't** use blue-and-white as a color scheme. The "generic NGO" look — blue primary, white background, stock photography — is explicitly forbidden. Impacta should be immediately distinguishable from every charity website built in WordPress.
- **Don't** use an app-corporate-cold aesthetic: heavy enterprise shadows, gray-heavy palettes, clinical whites, mechanical interactions. The product is for people donating goods to neighbors, not enterprise procurement.
- **Don't** use marketplace density: never compete multiple CTAs on the same screen, never reduce card padding to fit more items, never use a busy grid that reads as a product catalog.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe accent on any element. Rewrite with full borders, background tints, or nothing.
- **Don't** use gradient text (`background-clip: text`). All text is a single solid color.
- **Don't** use glassmorphism. Blurs and frosted cards are decorative, not purposeful.
- **Don't** use `#ffffff` or `#000000`. Every neutral carries the warm tint.
- **Don't** place Playfair Display in dashboards, tables, sidebars, or settings pages. It reads as a design mistake, not brand consistency, in data-dense product screens.
- **Don't** use pending-amber or sage-green outside of their functional roles (institution status, success states). They are not general-purpose accent colors.
