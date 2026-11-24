# Stonix landing — how we work

General rules: `CLAUDE-universal.md`. This file holds what is specific to Stonix.

## Figma
- File "Stonix — Landing (Copy)", key `lv9Mc3EtqTmKMzO49on28l` (v2, Nov 2026; the first version was `N3lw6CuNH1tAFxmHa8NqoY`, same node ids). Desktop frame `4:18` (1920×9485). Popups: `13:123` "Get a free quote" (modal `13:154`), `13:188` "Request sent" (modal `13:219`). Mobile (v3 file `Y1XFh9NFPysHl10N7wKPAI`, same desktop): frame `52:229` (360×11119), menu `52:621`, popups as bottom sheets `52:673` (quote) / `52:735` (sent). No tablet frame: tablets use the mobile frame × `--m` with column layouts.
- Section map (Figma y → section, height): 0 Header 88 · 88 Hero 992 · 1080 Why 880 · 1960 Materials 878 · 2838 Services 1233 · 4071 Our work 973 · 5044 Process 869 · 5913 Remnants 780 · 6693 Quote form 951 · 7644 FAQ 931 · 8575 Final CTA 493 · 9068 Footer 417.
- v2 raised the type scale (body 16 → 18, leads 18 → 20, titles 64 → 72, buttons 16 → 18) and moved the Why content to x 940.
- Image originals: `../stonix-originals/images` (PNG exports), `../stonix-originals/figma` and `figma-v2` (raw downloads, icons), `../stonix-originals/fonts`.

## Typography
- Onest (SIL OFL, Google Fonts), one variable WOFF2 (latin subset, weights 300–500) in `assets/fonts/onest-latin.woff2`, preloaded.
- Chrome's `line-height: normal` for Onest differs from Figma's by ±1px, so "normal" text uses explicit values: 15px → 1.27, 16px → 1.25, 18px → 1.28, 20px → 1.3.

## Build
- `npm run build` = laptop generator (`tools/scale-laptop.py`, 1280–1919) + compact generator (`tools/build-compact.py`: `tools/compact.tpl.css` → `css/media.css`, `m(N)` = `calc(Npx * var(--m))`, taken from AMK Construction) + `css/site.min.css` + `js/site.min.js`. Edit the template, never the generated blocks.
- Compact (≤1279): `--m` 1.25 (1024–1279), 1.15 (769–1023), 1.1 (481–768), 1 (≤480), 0.889 (≤359); gutter 20 × m on phones, 40 × m on tablets. Phones follow the 360 frame (text widths from Figma, so lines break the same); tablets (769–1279) lay the same blocks out in columns (2-col points and steps, 3-col services and remnants, 2-col form rows and contacts, 4-col footer) with buttons sized to their label.
- Text that differs between the desktop and mobile frames: `.d-only` / `.m-only` spans; mobile-only line breaks `<br class="br-compact">`, desktop-only `<br class="br-design">`.
- `npm run build:images` → `assets/images/*-<w>.webp|avif` from `tools/images.config.json` (widths = cover width at 1920 and ×0.75, ×2 for retina).
- Remnant swatches reuse the material images where Figma uses the same file (md5-identical): marble, granite, porcelain, quartz.

## Components
- `.btn` + `--primary/--outline`, `--sm` (header), `--block` (full width). Arrow variant = `.btn--outline` + `.icon--arrow`.
- `.round-btn`: 56px circle (slider arrows); `.modal__close` and compact slider arrows make it 44px. `.icon-btn`: 44px bare icon button (compact header call / burger / close).
- `.icon icon--{phone-sm,arrow,phone,mail,pin,clock,chevron,clip,toggle,prev,next,close,check}`: SVG masks from `assets/icons/`.
- Sliders `[data-slider="name"]` (`initSlider`): Our work (node 41:154 / 52:336) everywhere, Materials tiles (52:280) on compact only. Native horizontal scroll + scroll snap, mouse drag, arrows `[data-<name>-prev|next]` (several sets allowed: the desktop head arrows and the compact `.slider-controls`), dots `[data-dots-for="<name>"]` built from the snap positions (positions near the end merge into the end). Work cards `.work-card` + `--wide` (760) / `--narrow` (440), default 620; 280 × m on compact.
- Mobile menu `[data-mobile-menu]` (node 52:621): `[data-menu-open]` burger, `[data-menu-close]` links/buttons; clip-path unroll + staggered items; page scroll locked; Esc closes.
- Quote modal (nodes 13:154 / 13:219): native `<dialog data-modal>` with two `[data-modal-view]`s, `form` and `sent`. Any `[data-modal-open]` opens it (the links keep `href="#quote"` as a fallback); `[data-modal-close]`, Esc and a backdrop click close it with an animation; focus returns to the trigger; page scroll is locked (`html.is-locked`). On compact it is a bottom sheet sliding up (Web Animation in `openModal`), focus goes to the title (not a field) so the keyboard does not jump; the attach field and the privacy sentence are desktop-only, as in the mobile frame.
- FAQ: `[data-accordion]`, items `.faq-item(.is-open)`, buttons with `aria-expanded`; one open at a time (main.js).
- Forms: `[data-form="inline"]` (quote section) and `[data-form="modal"]`, `data-validate` = required | phone | email | zip, `[data-attach]` + `[data-attach-hint]` (`data-default` = idle hint). A valid submit of either form opens the modal's "sent" view. Phone fields format as you type: (206) 555-0100.

## Status (November 2026)

| Page | Desktop 1920 | Laptop ×0.75 | Tablet | Mobile 360 |
|---|---|---|---|---|
| index (v2 + popups) | done (node 4:18, 13:154, 13:219) | done (generated) | done (from the mobile frame × --m, 769–1279) | done (52:229, 52:621, 52:673, 52:735) |

Checked in Chromium and WebKit: no horizontal overflow and no clipped text at 1279, 1024, 900, 769, 768, 600, 480, 390, 375, 360, 359, 320.

## Deviations from Figma
- Mobile: Figma rounds text boxes up, so sections sit up to ~1–2px off within themselves and the page ends 27px shorter (11092 vs 11119). The hero content frame (412 tall) clips its own 32px bottom gap in Figma; the build has no gap there either.
- Mobile "Also" list: Figma's box is 254 wide; Onest renders a little wider in browsers, so the list is 280 wide to keep the same three lines.
- Mobile footer hours: "Mon–Fri, 8:00–17:00" breaks after the comma, as in Figma's narrow text box.
- Hero is one screen tall (`--fixed-vh` − header, min 660px) instead of a fixed 992px; content pinned 120px from the bottom.
- Popups are centred on the screen; in Figma they sit 13px (form) and 8px (sent) below centre.
- How it works: the longest step line (287px) is wider than its 284px column, as in Figma; the text may run into the 24px gap.
- Final CTA title: Figma's text box clips the "y" descenders; shown in full.
- Text-box heights in Figma are rounded (70.6 → 71 etc.), so some sections sit 2–3px off Figma at 1920 (page 9484 vs 9485). Section-internal positions are within ~1.5px.
- Wide screens (>1920): content stays in a 1920 frame; hero and Why photos extend to the screen edge.

## Content flagged to the client
- FAQ answers 2–8 are draft copy (Figma has only the first answer). Check facts: timelines, free measuring, removal, service area.
- Phone `(206) 000-0000` is a placeholder (`tel:+12060000000`).
- Privacy policy links point to `#`.
- Quote forms (section and popup) have no backend: they validate and show the "sent" popup. Set `action` and wire submit in `js/main.js`.
- Our work photos and captions come from Figma as they are; confirm they are Stonix's own projects.
- "108 pieces in stock" is static; the remnant cards are static too (live stock is at stonixwa.com/stock).
