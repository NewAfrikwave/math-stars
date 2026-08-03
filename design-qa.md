# Design QA: Guided Math Studio lesson system

## Evidence

- Source visual truth: `/workspace/scratch/a3be78015eb6/generated_images/exec-5deab9aa-df19-4cbc-b5ea-49a5499fec5c.png`
- Source pixels: 1488 × 1056.
- Intended desktop CSS viewport: approximately 1488 × 1056 at device scale factor 1.
- Implementation screenshot: unavailable.
- Implementation URL attempted: local Work Mode preview on port 4173.
- State: Grade 3 equal-groups lesson and practice question.
- Browser evidence: blocked. The required cloud browser returned `net::ERR_BLOCKED_BY_CLIENT` for the Work Mode preview URL.
- Full-view comparison evidence: unavailable because the implementation could not be captured in the required browser.
- Focused region comparison evidence: unavailable for the same reason.

## Findings

- [P1] Browser-rendered visual verification is unavailable
  - Location: complete lesson and practice flow.
  - Evidence: the source mock opens successfully, but the required local implementation preview is blocked by the cloud browser before the app renders.
  - Impact: typography, responsive wrapping, generated basket compositing, interactions, and console state cannot be signed off visually.
  - Fix: restore cloud-browser access to the local preview, capture desktop and mobile states, compare them with the source in one combined view, and address any visible P0/P1/P2 differences.

## Static and Build Validation

- TypeScript: passed.
- ESLint: passed.
- Production build: passed.
- Automated Bun tests: not run because Bun is unavailable in this environment.
- Primary browser interactions: not tested due to the browser preview blocker.
- Browser console errors: not checked due to the browser preview blocker.

## Implementation Scope Completed

- Shared guided-studio teaching layout for every curriculum and grade level.
- Shared two-column practice layout with age-aware learning steps.
- Prominent lesson and question read-aloud controls.
- Server TTS with browser speech-synthesis fallback, stop state, retry state, timeout, and accessible labels.
- Real woven basket asset for equal-group questions.
- Spoken object names separated from visual emoji so narration says “apples,” “cookies,” and similar words naturally.
- Responsive desktop and stacked mobile CSS structure.
- Existing answer inputs, hints, feedback, progress, results, difficulty modes, worksheets, and Pip tutor navigation retained.

## Implementation Checklist

- [x] Apply the selected Guided Math Studio information architecture.
- [x] Repair read-aloud failure behavior and accessibility labels.
- [x] Replace rectangle group placeholders with recognizable baskets.
- [x] Apply the redesign through shared components used by all grades.
- [x] Pass TypeScript, ESLint, and production build.
- [ ] Capture and compare browser-rendered desktop practice state.
- [ ] Test Read aloud, hint, answer, feedback, next question, and restart interactions.
- [ ] Capture and inspect the mobile layout.
- [ ] Confirm no application console errors.

## Follow-up Polish

- Consider a future custom object-illustration library so every countable object uses the same premium 3D art direction as the baskets and Pip.

final result: blocked
