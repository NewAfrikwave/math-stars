# Pip's Orchard: first hands-on lesson pilot

Scope: Grade 3, `mult-concept` (Multiplication: Equal Groups). The existing `manipulativesEnabled` setting controls visibility. Other lessons and grades are unchanged pending playtesting.

1. Watch Pip: advance one apple at a time, or play/pause a short demonstration of three groups of four.
2. Build it: tap real 3D apples and baskets, or use the equivalent keyboard/touch buttons. Return apples, undo moves, and retry uneven groups. Every object remains countable above the low basket walls.
3. Solve it: a different independent question (four groups of two), without a picture or displayed total. Optional hint, gentle retry feedback, and celebration.

Continue to saved practice opens the existing six-question practice/checkpoint flow with the selected difficulty. This introductory warm-up does not award stars, change mastery, or write learning results. Its demonstration, arrangements and rehearsal answer reset when the component is left/reloaded; the existing scored practice retains its normal durable saving. State is keyed by learner profile.

The scene uses the already-installed Three.js package with procedural assets. No remote models, textures, or new services are required. Simple view and a WebGL-unavailable fallback keep all tasks usable without 3D. Motion respects reduced-motion preferences, stops drawing when hidden, and renders only during short transitions. Geometry, materials, shadow maps, listeners, timers and WebGL context are cleaned up on exit. Narration has a Stop control and stops on stage changes, mute and exit.

Verification: regression tests cover demonstration counts, conservation/undo immutability, invalid input, uneven groups with the correct total, independent answer checking, profile-keyed integration, feature-setting isolation, and keyboard-focus wiring. Browser QA uses synthetic local learners only. Physical-device/child playtesting remains the next step.

Browser checks: keyboard-only building focuses Check my groups after the twelfth apple and Try on my own after success; independent answers 12 and 8 respectively retry and pass, with focus on Continue to saved practice. That control opens the existing six-question session. Narration explicitly stops and cancels on stage changes. Simple view removes the canvas; simulated WebGL context loss leaves working basket controls and toggling views restores 3D. The demonstration can pause with reduced motion enabled. No browser console errors were reported during these checks. The shared learner header and footer now wrap at phone widths instead of overflowing horizontally.

Release scope: user-approved Grade 3 pilot, published through a reviewed PR to main. Other grades and lessons remain unchanged. Deployment status is verified separately in Railway rather than inferred from a successful local build.
