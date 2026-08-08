# Math Stars Anywhere pilot protocol

## Pilot shape

- 5 to 10 families in Iowa and 5 to 10 families in Liberia
- At least two shared-device households
- One school, church, or community computer lab when available
- Preschool through 4th Grade represented
- Four weeks of use, with a check-in after days 2, 7, 14, and 28

## Required test conditions

1. Slow connection: throttle to 2G/3G while downloading a grade pack.
2. Interrupted download: close the app halfway through, reopen it, and confirm the pack resumes.
3. Airplane mode: finish lessons, a daily challenge, and an Arcade round without service.
4. Shared device: switch between at least two learners and confirm progress never crosses profiles.
5. Multi-day outage: remain offline for three to seven days, restart the device, and continue learning.
6. Reconnection: restore service and confirm queued work syncs once without duplicate stars, coins, or streak days.
7. Low storage: remove and reinstall a grade pack without deleting learner progress.
8. Update: install a newer pack version while prior offline work is still queued.

## Success measures

- 95% or better successful grade-pack completion after an interrupted download
- Zero cross-learner data leakage on shared devices
- Zero duplicate awards after reconnection
- 95% or better queued-event synchronization within 24 hours of restored service
- A learner can resume after a device restart without repeating a completed answer
- Parents can unlock the last saved report offline with their PIN
- Median grade-pack data payload remains below 1 MB, excluding reusable artwork

## Safety and consent

- Obtain parent or guardian consent before pilot enrollment.
- Use learner first names or nicknames only.
- Do not collect precise location, photos, advertising identifiers, or open-text child feedback.
- Keep donation and partnership communication in adult-facing channels.
- Record technical failures by anonymous event type, delay, and grade pack version.

## Expansion gate

Do not expand to more communities until all P1/P2 data-integrity findings are resolved, the multi-day reconnection test passes twice on Android and once on a shared Windows/ChromeOS device, and pilot families understand how to remove local data.
