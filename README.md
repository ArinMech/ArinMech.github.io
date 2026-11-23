# Arin's Break Room — Interactive Portfolio

A zero-dependency personal portfolio built with HTML, CSS, and JavaScript.

## Run locally

1. Extract the ZIP.
2. Open a terminal in `arin-portfolio`.
3. Run `python -m http.server 8000` (Windows: `py -m http.server 8000`).
4. Open http://localhost:8000.

## How the pool game works

- Drag back from the white cue ball, then release to shoot. Balls have collision, friction, cushions, and pockets.
- When a numbered chapter ball enters a pocket, a chapter modal opens. Choose **Explore this chapter** or **Keep playing**.
- For a quick, accessible route, choose a labeled ball from the dropdown and press **Pocket this ball**. This plays a guided shot.
- **Pause & Explore** scrolls directly down to the traditional portfolio.
- **Reset** restores the table.

## Customize

- `index.html`: About Me, six personal fact cards, professional experience, projects, links.
- `pool.js`: Chapter mapping, ball colors, physics, and game behavior.
- `pool.css`: Pool table UI, personal section design.
- `styles.css`: Remaining portfolio sections and project page styling.
- `assets/arin-portrait.jpeg`: Your portrait.
- `assets/Arin_Chaudhary_Resume.pdf`: Downloadable résumé.

ME 370 and ME 371 project pages are still placeholders. The link on the FEA-solver fact currently points to the projects section until you provide the truss solver's own project page or repository link.

## Publish to GitHub Pages

Commit the extracted folder contents to a GitHub repository and enable **Settings → Pages → Deploy from a branch**, using your main branch and root folder.

## Color theme
Monochrome accents: charcoal #191919 and warm off-white #fafaf8. The traditional green pool table and ball colors are unchanged.

Experience section updated: bullet text copied from the uploaded resume, skills tags customized, Tesla symbol fetched from Wikimedia Commons when online. The logo requires an internet connection.

## Chassis project case study update

`project-fsae.html` has been rebuilt as a full project case study, using four uploaded CAD and test images saved under `assets/chassis-*.png`, with its own stylesheet `fsae.css`. The original screenshot of the prior case-study page was used as a content reference, not embedded as a site image. The composite repair work is intentionally excluded.
