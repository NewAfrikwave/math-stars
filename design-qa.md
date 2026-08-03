# Design QA: Daily Mission Board

**Source visual truth**

- Path: `/workspace/scratch/a3be78015eb6/generated_images/exec-f4f8bea0-896f-4063-bee5-daa03328aed3.png`
- Pixel dimensions: 1488 × 1058
- Intended CSS viewport: 1440 × 1024 desktop
- Density normalization: source is treated as a 1× desktop reference and compared by proportional layout because its exported dimensions are 3.3% larger than the intended CSS viewport.
- State: fresh 3rd-grade learner named Fefe with zero stars and zero completed lessons.

**Implementation evidence**

- Local implementation: child home in `src/components/game/HomeView.tsx`
- Times Table Lab: `src/components/game/TimesTableView.tsx`
- Browser-rendered screenshot path: unavailable
- Requested browser viewport: cloud-browser desktop viewport; the browser connection timed out before page capture.
- Preview state: the preview service reported running after a bounded restart, but no page could be reached from the cloud browser.

**Full-view comparison evidence**

- Blocked. The source image was opened at original resolution, but the required same-state browser-rendered implementation screenshot could not be captured. No claim of visual equivalence is made from source code or build output.

**Focused region comparison evidence**

- Blocked for the mission board, Pip character placement, journey rail, bottom navigation, and Times Table Lab because browser-rendered evidence is unavailable.

**Findings**

- [P0] Browser verification is unavailable.
  - Location: local preview and cloud browser connection.
  - Evidence: the production build, TypeScript check, and lint pass, but cloud-browser navigation and tab inspection timed out. The preview service did not expose a capturable page.
  - Impact: responsive layout, image masking, text wrapping, navigation, practice interactions, read-aloud behavior, and console errors cannot be truthfully verified.
  - Fix: recover the cloud-browser preview connection, capture the home at the matching desktop state, exercise primary interactions, capture the Times Table Lab, compare the reference and implementation in one combined image, and resolve any P0/P1/P2 visual differences.

**Primary interactions pending browser test**

- Begin mission
- Daily Challenge
- Times Tables navigation
- 2× through 12× table selection
- Read aloud
- Quick-practice correct and retry states
- Ask Pip
- More menu and switch learner
- Browser console error check

**Comparison history**

- Iteration 1: implementation completed and passed TypeScript, lint, and production build. Browser-rendered capture was blocked by the preview/browser environment, so no visual-fix iteration could begin.

**Implementation checklist**

- [x] Faithful explorer-study structure implemented.
- [x] Generated background, Pip, and equal-groups assets integrated.
- [x] Existing learner progress and lesson routing retained.
- [x] Interactive Times Table Lab from 2× through 12× implemented.
- [x] TypeScript check passed.
- [x] ESLint passed.
- [x] Production build passed.
- [ ] Capture browser-rendered desktop home.
- [ ] Compare source and implementation in one combined image.
- [ ] Test primary interactions and console errors.
- [ ] Resolve any P0/P1/P2 visual issues.

final result: blocked
