# CLAUDE.md — Barbershop Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

---

## Project Context

This is a **premium barbershop website**. The design language is:
- **Dark luxury** — primary color is deep black (`#0a0a0a`) with warm off-white (`#f0ece4`) text
- **Modern & editorial** — think high-end grooming brand, not a local corner shop
- **Croatian language** — ALL copy, labels, navigation, CTAs, placeholders, and UI text must be in Croatian. No English on the front end.
- **Refined masculinity** — geometric precision, strong typography, restrained gold or warm amber accents

---

## Language Rule (CRITICAL)
- Every visible word on the page **must be in Croatian**
- Navigation, headings, body copy, buttons, form labels, footer — all Croatian
- Example translations for common UI elements:
  - "Book Now" → **"Rezerviraj"** or **"Zakaži termin"**
  - "Services" → **"Usluge"**
  - "About Us" → **"O nama"**
  - "Gallery" → **"Galerija"**
  - "Contact" → **"Kontakt"**
  - "Our Team" → **"Naš tim"**
  - "Prices" → **"Cjenik"**
  - "Home" → **"Početna"**
  - "Opening Hours" → **"Radno vrijeme"**
  - "Address" → **"Adresa"**
  - "Phone" → **"Telefon"**

---

## Color Palette
- **Background (base):** `#0a0a0a` — near-black
- **Surface (elevated):** `#141414`
- **Surface (floating/cards):** `#1c1c1c`
- **Primary accent:** `#c9a96e` — warm gold/amber
- **Accent hover:** `#e8c88a`
- **Text primary:** `#f0ece4` — warm off-white
- **Text muted:** `#888077`
- **Border subtle:** `rgba(255,255,255,0.07)`

Do **not** use default Tailwind colors (blue, indigo, purple, etc.). Use only the palette above.

---

## Typography
- **Heading font:** A high-contrast serif or editorial display font — suggestions: `Playfair Display`, `Cormorant Garamond`, `DM Serif Display`
- **Body font:** A clean, refined sans — suggestions: `DM Sans`, `Outfit`, `Figtree`
- **Never:** Inter, Roboto, Arial, or system fonts
- Headings: tight tracking (`letter-spacing: -0.03em`), bold weight
- Body: generous line-height (`1.75`), slightly muted color
- Gold accent text for subheadings, labels, and decorative elements

---

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, Croatian placeholder copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

---

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

---

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/nateh/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

---

## Required Sections 
1. **Navigacija** — sticky top nav, logo left, links right, gold CTA button ("Zakaži termin")
2. **Hero** — full-viewport, dark background, large serif headline in Croatian, gold accent detail, CTA
3. **Usluge** — service cards with prices (Šišanje, Brijanje, Fade, itd.)
4. **O nama** — short barbershop story/mission, image + text layout
5. **Galerija** — image grid, dark overlay treatment on hover
6. **Naš tim** — barber profile cards
7. **Cjenik** — clean price list table or card layout
8. **Kontakt** — address, phone, working hours, optional map embed
9. **Footer** — dark, minimal, copyright in Croatian

---

## Output Defaults
- Single `index.html` file, all styles inline (plus Tailwind CDN), unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT/141414/c9a96e` (dark themed)
- Mobile-first responsive

---

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

---

## Anti-Generic Guardrails
- **Colors:** Use only the defined palette above. Never default Tailwind colors.
- **Shadows:** No flat `shadow-md`. Use layered, dark, color-tinted shadows: `box-shadow: 0 4px 24px rgba(0,0,0,0.6), 0 1px 4px rgba(201,169,110,0.08)`
- **Typography:** Never use the same font for headings and body. Serif display + clean sans. Tight tracking on large headings, generous line-height on body.
- **Gradients:** Layer multiple radial gradients on dark backgrounds. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. Gold accent on hover.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/70`) and subtle color treatment. Never raw unprocessed placeholders.
- **Spacing:** Intentional, consistent spacing — large sections get generous padding (`py-24` or `py-32`).
- **Depth:** Three-layer surface system: `#0a0a0a` (base) → `#141414` (elevated) → `#1c1c1c` (cards/floating).
- **Gold accents:** Use sparingly — on CTAs, dividers, icon strokes, hover underlines, and key labels. Not everywhere.

---

## Hard Rules
- **ALL text must be in Croatian.** If you write any English UI text, that is a bug.
- Do not add sections not in the reference (if one is provided)
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo/purple as primary color
- Do not use light backgrounds — the site is dark by default
- Do not use generic stock-photo-style placeholder aspect ratios — match the design's intended image proportions
