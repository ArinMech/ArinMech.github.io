# Arin Chaudhary — Portfolio

Personal portfolio site. Plain HTML, CSS, and JS — no framework, no build step.

Live at **https://arinmech.github.io/**

## Structure

- `index.html` — homepage: hero, highlights, selected work, about, skills, contact
- `projects/` — one case-study page per project (`panel`, `sensor`, `chess`)
- `styles.css` — the whole design system (light technical theme, CSS custom properties at `:root`)
- `script.js` — mobile nav, footer year, scroll reveal, nav scrollspy
- `assets/` — résumé PDF and project imagery

## Design notes

- Palette, type, spacing, and radii are all CSS variables at the top of `styles.css` — change the theme there.
- CAD renders with black backgrounds are shown in dark "viewport" panels (`.work-shot.viewport`, `figure.viewport`); photographs use the light frame.
- Motion is opt-out safe: everything respects `prefers-reduced-motion`.

## Local preview

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Hosting

Deployed via GitHub Pages from the `main` branch.
