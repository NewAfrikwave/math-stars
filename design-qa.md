# Design QA: Public storybook landing page

## Evidence

- Source visual truth: the full-page homepage direction selected by the user in the conversation, grounded by the production storybook hero artwork at `/workspace/scratch/2fa07fdec928/math-stars/public/storybook-adventure-map.webp`.
- Source hero pixels: 1716 × 916.
- Implementation URL: `http://terminal.local:4173/` in the Work Mode cloud browser.
- Browser viewport: 1363 × 936 CSS pixels at device scale factor 1.
- Browser captures:
  - `/workspace/scratch/2fa07fdec928/math-stars/qa-artifacts/landing-hero-desktop.jpg` (1348 × 926 pixels after browser scrollbar exclusion)
  - `/workspace/scratch/2fa07fdec928/math-stars/qa-artifacts/landing-arcade-desktop.jpg` (1348 × 926 pixels)
  - `/workspace/scratch/2fa07fdec928/math-stars/qa-artifacts/landing-parent-desktop.jpg` (1348 × 926 pixels)
- Combined focused comparison: `/workspace/scratch/2fa07fdec928/math-stars/qa-artifacts/landing-hero-comparison.jpg` (1320 × 540 pixels).
- Density normalization: source and implementation were rendered at 1× density, then each was fit within an equal 660 × 540 comparison panel without stretching.
- State: signed-out public landing page, default motion preference, family-story carousel advanced once, and registration CTA opened in create-account mode.

## Findings

- No actionable P0, P1, or P2 visual differences remain in the inspected desktop experience.
- Typography matches the selected friendly storybook direction through the existing Fredoka variable family, with clear display hierarchy and readable supporting text.
- Spacing and layout rhythm are consistent across the hero, Arcade, grade path, toolkit, rewards, parent view, trust sections, family stories, final CTA, and footer. The rendered page has no horizontal overflow.
- Colors and visual tokens preserve the selected forest green, parchment, burgundy, gold, and purple Arcade palette with sufficient foreground contrast in inspected states.
- Image quality and asset fidelity pass: the production storybook map, Pip, Luna, journey art, and three-doorway environment are used directly. No custom illustration was replaced by CSS or placeholder art.
- Copy and content match the current product: Preschool through 4th Grade, three Arcade games, saved grade-aware play, rewards, companions, parent progress, read-aloud support, and family-managed privacy.

## Full-view comparison evidence

- The combined hero comparison confirms that the selected map remains the visual center of the page and retains its original crop, color, detail, and sign text.
- Browser captures confirm the map-first hero, high-contrast Arcade transition, full-width grade path, and parent dashboard have the same calm storybook-to-game-world progression as the chosen direction.
- The hero visual is not stretched or clipped at the inspected desktop viewport. The Arcade cards align evenly and the parent dashboard remains readable without overlap.

## Focused region comparison evidence

- The hero artwork was compared side by side with its rendered placement. Subject order, crop, star mountain, castle, treehouse, signs, and parchment background remain intact.
- Arcade cards were inspected at their section anchor. All three game titles, skills, descriptions, and calls to action are visible with consistent elevation and no clipping.
- Parent progress was inspected as a focused browser capture. Count-up metrics, all three skill bars, growth/next-skill cards, and the explanatory checklist are visible and aligned.

## Interaction and accessibility checks

- Hero, Arcade, parent, privacy, sign-in, and registration links resolve to the intended routes or section anchors.
- The family-story next control changes the visible story and its dot state.
- The registration CTA opens `/signin?mode=register` with the create-account form selected.
- Scroll parallax, floating stars, portal glow, card reactions, count-up metrics, skill bars, character motion, and story transitions are active in the default-motion experience.
- Framer Motion uses the app-level `reducedMotion="user"` preference, and CSS animation/transition fallbacks are disabled by the existing reduced-motion media query.
- All inspected images have an `alt` attribute. Decorative images use empty alt text.
- No application warnings or errors appeared in the browser console. Browser-extension messages were excluded because they do not originate from Math Stars.

## Comparison history

### Pass 1

- Earlier finding: the first cloud-browser navigation timed out before a page capture could be created.
- Fix/recovery: reused the selected cloud browser, opened a fresh tab, and loaded the same local preview successfully.
- Post-fix evidence: hero, Arcade, parent dashboard, final CTA, and registration form all rendered and were inspected. No product-code visual fix was required after the successful capture.

## Validation

- Automated tests: 61 passed.
- TypeScript: passed.
- ESLint: passed.
- Production build: passed for all 33 routes.
- Primary interactions: passed for landing navigation, family-story transition, and registration CTA.
- Browser console: no app-originated warnings or errors.

## Follow-up polish

- Capture an additional narrow-phone screenshot during a future iteration if the cloud browser adds viewport resizing. The responsive breakpoints and stacked layouts are implemented, but the selected source visual is desktop-first and this QA run used the available desktop cloud-browser viewport.

final result: passed
