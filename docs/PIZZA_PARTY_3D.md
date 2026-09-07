# Pizza Party: hands-on 3D pilot

## Scope

The first playable 3D upgrade is Pizza Party, inside the existing Arcade. The other five games are unchanged. It uses real Three.js meshes, lighting, raycast selection, drag-and-drop, and short movement animations. No model downloads, remote textures, AI generation, or external runtime services are required.

Preschool practices sharing between two friends. Grade 1 shares between two or three friends. Grade 2 alternates equal sharing and halves/quarters. Grade 3 builds varied fractions and equivalent representations. Grade 4 serves the result of same-denominator fraction addition/subtraction.

## Controls and accessibility

- Pick a 3D slice, then tap a plate; dragging is optional.
- Numbered slice buttons and labeled plate buttons provide the same gameplay with touch or keyboard.
- Undo, return-to-board, and start-over are available before submission.
- Every plate's slice count is visible as text; announcements describe moves.
- Keyboard focus returns to a slice after a move, the order heading for a new question, and Next order after feedback.
- Reduced motion removes movement interpolation. No continuous rendering loop runs when idle. Hidden tabs stop drawing. Meshes, materials, listeners, and the renderer are disposed on exit.
- Simple view turns off WebGL. If WebGL creation fails or its context is lost, the slice/plate controls remain playable.

## Scoring and compatibility

The client sends a slice-to-plate array, not a claimed score. The online endpoint, offline game, and offline reconciliation use the same evaluator. Sharing requires every plate to contain the correct amount. Fraction orders require the correct number of equal slices on the order plate. Malformed arrays are rejected.

No database migration is needed. Task metadata and placements use the existing question/answer JSON. Existing attempts without metadata keep their multiple-choice UI. Numeric choices remain available to older installed clients. Existing attempt IDs, server-authoritative rewards, duplicate protection, profile scoping, and per-answer saves are retained.

Offline-started rounds use the existing offline queue. If a round started online cannot be found in offline storage after losing the network, its arrangement remains on the current screen and can be submitted after reconnecting. **Unsubmitted slice movements are local UI state, not cross-device checkpoints**; refreshing before submission resets that arrangement. After submission, the existing saved-next-question behavior applies.

## Verification

- `bun test` includes a five-grade puzzle matrix, invalid payloads, legacy compatibility, scoring, immutable moves, varied fractions, and narration coverage.
- `bun scripts/qa-pizza-party.ts` targets **only http://localhost:3050**. It creates a synthetic local family and five learners, then exercises online saves/resume/retries, malformed payloads, offline reconciliation, distrust of claimed scores, profile isolation, and exact coin balances.
- Use a disposable SQLite file (for example `db/local-pizza-qa.db`), never the production database. Set DATABASE_URL and a test-only SESSION_SECRET before starting the local server. The script's example.test credentials are fixtures, not production credentials.
- `bun run build` now uses a cross-platform filesystem copy step, run with Bun (also available in Railway's Docker image), for standalone assets. The tracing/build root is explicitly this project so unrelated ancestor lockfiles do not change the output layout.

## Follow-up after family playtesting

Validate independent play with real touch devices and children across all supported grades before expanding this interaction model to other Arcade games. Consider more story variety, optional cosmetics, and evidence-based challenge adjustment after observing the pilot. This implementation does not add purchases, leaderboards, advertising, or punitive streak mechanics.
