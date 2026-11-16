---
description: Full verification pass before committing
---

1. `npm test` - all unit tests green.
2. `node e2e/smoke.mjs --shots=/tmp/lfb-shots` (prefix `PW_CHANNEL=chrome` if Playwright browsers are not installed). Zero console errors is a hard requirement.
3. Open the screenshots in /tmp/lfb-shots and check the views you changed for layout breaks, clipped text, and the 390px mobile shot.
4. Re-read the Invariants section of CLAUDE.md against your diff (`git diff`). Report any you touched and why they still hold.
5. Confirm CHANGELOG.md has an entry under Unreleased.
