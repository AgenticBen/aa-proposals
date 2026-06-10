---
name: agentic-arc-brand
description: >
  Apply the Agentic Arc visual identity system when creating any branded asset — slides, social graphics, PDFs, proposals, workshop materials, web assets, thumbnails, or one-pagers. Use this skill whenever the user asks to create, design, or style something under the Agentic Arc brand, or any time brand consistency is needed across a visual deliverable. Trigger on: "make this on-brand", "Agentic Arc style", "branded slide", "create a deck", "design a graphic", "proposal template", "workshop materials", or any visual asset request where Agentic Arc branding should apply. Also trigger proactively when building UI, HTML artifacts, or React components for Agentic Arc properties. This is the Brand Core — the single source of truth other Agentic Arc skills (e.g. agentic-arc-presentation) build on.
---

# Agentic Arc Brand Skill — Premium Editorial Edition

The single source of truth for the Agentic Arc visual identity. Apply this when creating any visual asset under the brand. Medium-specific skills (presentations, proposals, web) inherit everything here and add their own layout rules.

> **What changed (2026 refresh):** the system evolved toward a **premium editorial** look — deeper near-black navy, a high-contrast serif, generous space, and *treated* photography. This replaces the older "dark-gradient / dot-field / no-photography / no-boxes" rules, which never matched how the brand was actually used.

---

## Brand Positioning

Agentic Arc occupies a precise visual space: **consultant-grade authority with human warmth**, expressed through editorial polish. It signals deep AI expertise without cold tech aesthetics — no cyberpunk, no glowing brains, no robotic abstraction.

**One-sentence identity:** *Trusted intelligence — near-black navy gravitas, a luminous blue horizon, and the calm confidence of a great magazine.*

Key adjectives: **Grounded. Forward-moving. Human-scaled. Premium. Confident without being cold.**

The brand says "future" through polish and restraint, not spectacle. Viewers should feel:
- *"These people understand the future."*
- *"This is credible, premium, and professional."*
- *"AI is being presented as useful, clear, and controlled."*

---

## Color System

A blended palette: the website's sky blue + the deck's electric cyan, anchored by a deeper near-black navy.

| Role | Hex | Usage |
|---|---|---|
| **Near-Black Navy** | `#002139` | Foundation & anchor. Dramatic backgrounds, hero/section fills, headlines, chrome bars. |
| **Sky Blue** | `#51ADDF` | Supporting blue. Links, underlines, secondary highlights, calm accents. |
| **Electric Cyan** | `#2CCBE6` | The pop. ONE emphasized word, stat, or eyebrow per view — used sparingly. |
| **Icy Blue** | `#9DE2F2` | Soft accent. Oversized background numerals, gentle highlights on navy. |
| **White** | `#FFFFFF` | The everyday canvas. Primary background for content + breathing room. |
| **Ivory** | `#E6E3E2` | Warm off-white background alternative when pure white feels clinical. |
| **Charcoal** | `#495050` | Body text and neutral UI detail. |

### Rules
- **Near-Black Navy is the foundation** — use it for hero/section backgrounds and headlines.
- **White (or Ivory) is the canvas.** White backgrounds are encouraged. Lean on generous negative space.
- **Two blues, distinct jobs:** Sky Blue = calm/supporting; Electric Cyan = the single sharp accent. Don't let cyan become a body color — overuse kills it.
- **Charcoal** carries body text. **Icy Blue** is for big background numerals and soft accents.
- **No off-brand decorative colors** (red, green, purple, orange). The only exception is functional/semantic status colors (success/warning/error) inside data or UI contexts.

### Gradient (optional, for navy backgrounds)
A subtle deepening, never a flashy rainbow:
```css
background: linear-gradient(135deg, #013a5e 0%, #002139 70%);
```

### Logo color lock 🔒
The logo is **never recolored**, even though the system foundation is now near-black navy. The mark and wordmark keep their **original** navy `#172F5B` and sky blue `#51ADDF`. Treat the logo as sacred; evolve everything around it.

---

## Typography

| Font | Role | Use For |
|---|---|---|
| **Playfair Display** | Display serif (high-contrast Didone, editorial) | Hero titles, statement words, section titles. The brand's signature face — dramatic, luxury-editorial. |
| **Inter** | Sans-serif body | Body copy, UI labels, eyebrows, bullets, captions — everything functional. |

**Fallbacks:** Cormorant Garamond or Fraunces (softer alternatives), Merriweather (legacy serif). Arial / system sans as last-resort body fallback. Both Playfair Display and Inter are free and available in Google Fonts and Canva.

**Pairing logic:** Inter + Playfair Display only. Playfair earns the most attention and is set large; Inter handles structure.

### Signature device
Inside a headline, set the **single key phrase in Playfair Display italic and color it Electric Cyan**. One emphasis per headline. Example: *"AI that works for **your business.**"* (italic + cyan on the emphasized words).

### Eyebrow labels
Small label above headlines: **Inter, UPPERCASE, bold, +3pt letter-spacing, Electric Cyan.** e.g. `OUR FRAMEWORK`, `WHO WE SERVE`.

### Scale guidance
- Display / hero: 48–96pt Playfair Display, line-height 1.0–1.05
- Section titles: 22–28pt Playfair Display, navy
- Eyebrow: 9–11pt Inter bold caps, +3pt tracking, cyan
- Body: 11–12pt Inter, line-height ≈1.3, charcoal
- Caption: 9–10pt Inter, charcoal at ~70%

---

## Composition & Layout

- **Canvas:** white/ivory for content; near-black navy for hero, section dividers, and dramatic moments. Alternate the two for rhythm.
- **Alignment:** headlines **left-aligned** (editorial), generous size, one dominant idea per view.
- **Negative space:** generous. Never crowded, never over-explained.
- **Containers are allowed.** Cards, panels, and before/after boxes are part of the system — soft rounded corners (~12–16px), light shadow on white, or thin 1px borders. (This corrects the old "no boxes" rule.)
- **One dominant element** per composition — one word, one idea, one focal point.

---

## Signature Visual Elements

### Arc / Trajectory Lines
The brand's core texture (replaces the old "dot field"). Thin curved lines sweeping **upward, left-to-right**, echoing the arc in the mark.
- Color: Sky Blue or Cyan, or white on navy, at 10–30% opacity.
- Position: edges and corners — never behind body text.
- Meaning: forward motion, growth, the "arc."

### Oversized Type as Graphic
Giant Fraunces letters or numerals (a section number, a stat, a single initial) used as a quiet structural graphic. A hallmark of the premium editorial look.

### Arc & "A" Mark
The stylized "A" with the curved sky-blue arc is the logomark. Never distort, never recolor. The arc/curve can be echoed as a directional motif in supporting graphics.

---

## Photography

Photography is **welcome** (this corrects the old ban) — but **always treated, never raw**, so it reads intentional and on-brand:
- Apply a **near-black navy gradient scrim** (image darkened toward navy at one edge) or a **navy + sky duotone**.
- Maintain enough contrast for white text overlay.
- Subjects: real, human, business-focused. People, workplaces, hands-on work.
- **Never:** robots, glowing brains, generic handshakes, neon sci-fi, or AI clichés.
- Leave deliberate negative space in framing for headline overlay.

---

## Components

| Element | Spec |
|---|---|
| **Primary button** | Electric Cyan or Sky Blue fill, navy or white text, ~12px radius, generous padding, optional `→`. |
| **Secondary button** | Near-black navy fill or thin outline, white text, ~12px radius. |
| **Pills / tags** | Light icy-blue `#E6F6FC`-style fill, navy text, fully rounded. |
| **Cards** | White fill, ~16px radius, soft shadow (or thin border); icon in a soft rounded chip. |
| **Eyebrow label** | See Typography. Always cyan, caps, tracked. |

---

## Asset-Specific Guidance

| Asset Type | Key Rules |
|---|---|
| **Slides** | See the `agentic-arc-presentation` skill. Editorial, one idea per slide, navy dividers + white content, treated photos. |
| **Social graphics** | Short high-clarity statements, big Fraunces headline, one cyan emphasis, shareable/polished. |
| **Proposals / PDFs** | Calm authority, structured sections, subtle blue accents, minimal decorative noise. |
| **Web / UI assets** | Modern and spacious, strong typography, light arc cues, cards allowed, credible not flashy. |
| **Workshop materials** | Clear and energizing, executive-appropriate, warm enough for non-technical audiences. |

---

## Prohibited Elements

- Neon, glow, or cyberpunk aesthetics; metallic or sci-fi effects.
- Off-brand decorative colors (purple, green, red, orange) outside functional status use.
- Recoloring or distorting the logo.
- Photography of robots, glowing brains, or generic handshakes; raw/untreated photos.
- Dense patterns behind body text; rainbow or harsh-contrast gradients.
- Using Electric Cyan as a body or fill color (it's an accent only).
- All three+ fonts in one asset; centering long-form headlines.

---

## Quick Reference

```
FOUNDATION
Near-Black Navy  #002139   backgrounds, headlines, chrome
White / Ivory    #FFFFFF / #E6E3E2   canvas

BLUES
Sky Blue         #51ADDF   supporting: links, underlines, calm accents
Electric Cyan    #2CCBE6   the pop: ONE emphasis per view
Icy Blue         #9DE2F2   big numerals, soft accents on navy

TEXT
Charcoal         #495050   body

TYPE
Display:  Playfair Display (Cormorant Garamond / Fraunces fallback)
Body/UI:  Inter
Device:   key phrase in Playfair Display italic + cyan; cyan UPPERCASE tracked eyebrows

LAYOUT
Left-aligned headlines · generous space · one idea per view
Cards & boxes OK (12–16px radius) · navy + white rhythm

TEXTURE
Arc/trajectory lines (edges, 10–30% opacity) · oversized Fraunces type

PHOTOGRAPHY
Allowed, but treated: navy gradient scrim or navy/sky duotone · real human subjects

LOGO 🔒  never recolored — keeps original #172F5B navy + #51ADDF sky
```
