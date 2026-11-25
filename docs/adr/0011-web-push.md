# ADR 0011: Web Push reminders

Status: accepted (2026-11-25)

## Context

Stage F7 of `docs/PLAN.md`. The rules for reminders are pure and channel-agnostic
(`src/js/data/notifications.js`), and the bell shows them while the site is open. A bell reaches
only someone already on the site, so "your streak ends tonight" and "you have not been here for a
few days" need a push. The site is static on GitHub Pages (ADR 0001) with no secrets in the client
(invariant 10); Supabase already runs auth, the database and two Edge Functions (ADR 0006, 0007);
everything must stay on free tiers.

Constraints found:
- **iPhone**: Web Push works only for a site added to the Home Screen (iOS 16.4 and later), which
  needs a web app manifest with `display: standalone`; permission can only be asked from a tap.
  Safari in a tab cannot subscribe, and a refused permission is not asked again by iOS. Since iOS 26
  a site added to the Home Screen opens as a web app by default.
- **Every browser**: permission must come from a user gesture; asking on arrival gets the site
  quietly blocked by Chrome.
- **The server runs in UTC**, while every rule works on the user's local calendar days and hours.

## Decision

1. **Opt in per device, signed in only.** A "Notifications on this device" switch in the
   Reminders section of `#/me`. It asks for permission from that click and subscribes with the
   site's VAPID public key (from the function's `GET /key`, public by design). Signed out, it says to sign
   in; where the browser has no Push API it says so.
2. **iPhone: a guide, not a dead end.** In Safari on an iPhone the switch opens a three-step guide
   instead: tap Share, tap Add to Home Screen, open the site from its icon and tap the switch
   there. Each step names the button and shows its icon; the guide is one screen, opens where the
   switch is, and recognises when the site already runs from the Home Screen.
3. **A push-only service worker** (`sw.js` at the site root, scope `/leet-for-berger/`): it
   handles `push` (shows the notification) and `notificationclick` (focuses an open tab or opens
   the link). **No `fetch` handler**: it never caches, so a deploy is never hidden behind a stale
   page. Plus `manifest.webmanifest` (name, icons, `display: standalone`, theme colour).
4. **When (owner's decision).** Two send hours a day by default, **16:00 and 20:00** in the user's
   time zone. The user chooses the hours, and so how many pushes a day (1 to 6, or none): **at most
   one push per send hour, so at most two a day** unless they choose more. **Nothing on the user's
   rest day.**
5. **What (owner's decision), at each send hour, in this order:**
   - **Streaks that end tonight.** Both the coding and the quiz streak at risk: one push for each,
     the one not yet pushed today first. Only one at risk: that one at every send hour. Neither:
     no streak push.
   - Otherwise, each at most once: **a return** after `AWAY_DAYS` (3) days without any practice;
     **a problem left unsolved**, `UNFINISHED_AFTER_HOURS` (3) hours after its last submission
     (up to 14 days); **a new streak** after `RESTART_DAYS` (2) days with no streak at all.
   - The bell uses the same rules and thresholds (`data/notifications.js`), so a reminder reads the
     same on the page and on the phone. `data/push-plan.js` adds only the order and the count.
6. **Per user, not per device.** `push_settings` (user, send hours, kinds turned off, time zone),
   `push_subscriptions` (one row per device: endpoint, keys), `push_log` (user, day, hour, kind,
   key). A send hour pushes the same reminder to every device of the user and counts once, so a
   phone and a laptop never double the count. RLS: a user reads and deletes their own rows; writes
   go through the function.
7. **One Edge Function, `push`**: `POST /subscribe`, `POST /unsubscribe`, `POST /settings` (with
   the user's session), and `POST /run`, called hourly by **pg_cron** through pg_net with a secret
   header. `/run` takes the users whose local hour is a send hour with nothing logged for it today,
   reads their synced record (`user_state`: progress with the rest day, and quiz), turns `now` and
   stored timestamps into their wall-clock time (`toWallClock`, so the rules see their calendar),
   picks the reminder (`pickPush`), logs it and sends it with **`jsr:@negrel/webpush`** (RFC 8291
   and 8292 on Web APIs, no Node crypto). A `404` or `410` from a push service deletes that
   subscription; five failures in a row delete it too. The pure modules are copied into the
   function by a build step, as `bank.js` is, with the problem titles they name; a test fails
   when the copies are stale.
8. **Drafts never leave the device**, so on the phone "a problem left unsolved" means one that
   was submitted and not solved; a problem only opened or typed into is never pushed.
9. **Secrets that no person handles** (changed in part B, 2026-11-25: the connector's secret tool
   asks a person to type the value, so it would have passed through a chat): the function makes the
   VAPID key pair on first use and keeps it in `push_keys`, a table only the service role reads, and
   serves the public half at `GET /key`; the cron header secret is generated inside the database, in
   Vault, and the function reads it through `push_cron_secret()`, which only the service role may
   call. Nothing secret is in the repository, the client, an Edge Function secret or a chat.

## Consequences

- $0: pg_cron and pg_net are on the free plan; 24 cron calls a day plus a few calls per push stay
  far inside the Edge Function quota; the push services are free.
- The site gets a service worker and a manifest. The worker does nothing but push, so caching and
  deploys are unchanged; it must stay on the same origin and path.
- An iPhone user adds the site to the Home Screen once; the guide makes that three taps.
- Reminders are only as fresh as the synced record: practice on a device that has not synced yet
  can be missed for one send hour.
- Signing out on a device deletes that device's subscription first, so no push reaches a shared
  device for the previous user.
- Testing: the plan, wall-clock, settings and payload logic is pure and unit-tested in Node; the
  e2e test covers the switch and the guide (no real push service runs in CI).

## Alternatives

- **A native iPhone app**: real push without the Home Screen step, but an Apple developer account
  ($99 a year) and App Store review; against the $0 principle.
- **Email** (a free tier such as 100 a day): reaches every phone with no install, but another
  vendor, consent and unsubscribe handling, and deliverability work. Kept as a possible second
  channel if iPhone users do not add the site.
- **A Telegram bot**: free and instant, but only for people who use Telegram. Same status as email.
- **WhatsApp**: business-initiated messages are paid per message and need a verified business.
- **Firebase Cloud Messaging or a vendor (OneSignal and the like)**: a Google project or a third
  party's script and data on the page, for what the standard protocol already does.
- **Sending from the browser on a timer**: only while the site is open, which is the bell.
