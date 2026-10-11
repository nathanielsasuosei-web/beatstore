# NSO Beats — beat store with instant email delivery

A complete storefront for a music producer: the admin uploads beats and videos, artists
create accounts, pay with **mobile money, bank transfer or card**, and receive the beat
files, licence PDF and receipts **by email** — automatically.

Built with Next.js (App Router) + React + Tailwind, Node's built-in SQLite for storage,
Paystack for payments and Resend for email. No native build steps, no ORM binaries —
`npm install && npm run db:setup && npm run dev` and you're trading.

---

## What's included

**Public store**
- Landing page with an animated hero — drifting accent aurora, pointer spotlight, masked headline
  reveal, a spinning record that carries the featured beat, and counters that add themselves up
- Catalogue with search, genre/mood filters and sort — **every published beat is listed with a playable
  tagged preview** (paged with a "Load more" button, so nothing is hidden no matter how big the store grows)
- Beat pages with a global sticky audio player, tagged previews, licence picker and facts (BPM, key, duration)
- Videos page (YouTube/Vimeo embeds or uploaded files)
- **Studio booking page** (`/studio`) — recording, mixing and mastering sessions with live availability
- Licensing/FAQ page written in plain English
- About + Contact (writes to the producer's inbox and auto-acknowledges the sender)

**Buying & delivery**
- Cart with per-beat licence selection, stored in the browser
- Checkout with three payment rails:
  - **Paystack** — mobile money (MTN MoMo, Telecel Cash, AT), card and bank for supported currencies
  - **Mobile Money transfer** — artist sends money to your MoMo number and submits the transaction ID
  - **Bank transfer** — artist transfers and submits the reference
- Live Paystack webhook (`charge.success`) plus browser-return verification, both idempotent
- On payment: secure per-item download links (30 days / 15 downloads), a **signed PDF licence agreement**
  with the buyer's name on it, a delivery email and a receipt — all logged
- Exclusive purchases automatically pull the beat off the store

**Artist account**
- Register / sign in / password reset (verified by email)
- Dashboard: every order, every download, licence PDFs, spend summary, message history
- Profile editing (the name that lands on licences) and password change
- Guest checkout still works — emails carry the downloads

**Studio bookings** (`/studio`, meetbeatz-style)
- Services (Recording / Mixing / Mastering by default) priced **per hour**, each with min/max session
  lengths — managed from Admin → Bookings
- Artists pick a service, a date, a duration and a free start time (taken slots are greyed out live;
  opening hours are set per weekday in Settings)
- **50% deposit locks the slot** — a small configurable service fee is shown up front, the balance is
  settled at the studio
- Same three payment rails as beats: Paystack (MoMo/card/bank, instant confirmation), or manual MoMo /
  bank transfer with a transaction-ID claim the producer verifies
- Double-booking is impossible: overlapping slots are rejected server-side, and unpaid slots stay held
- Confirmation, instruction, cancellation and admin notification emails for every booking — all in the outbox
- Artist dashboard lists upcoming sessions; admin dashboard shows the next sessions and deposits to verify

**Admin dashboard** (`/admin`)
- Sales overview: revenue, paid/pending/awaiting counts, best sellers, recent orders, upcoming studio sessions
- Beat uploader: drag in audio + tagged preview + cover + stems, set BPM/key/genre/mood/tags,
  price the basic/premium/exclusive tiers, feature or unpublish
- Videos manager, orders manager (verify MoMo/bank payments in one click, resend delivery,
  refunds), **studio bookings manager** (verify deposits, complete/cancel sessions, edit bookable
  services), inbox (reply by email without leaving the page), artist list with roles,
  **email outbox** (read the exact email every customer received), settings
- Settings covers the studio too: deposit %, service fee %, opening hours per weekday and the booking policy
- Everything is protected server-side; admin pages redirect non-admins to their own dashboard

---

## Storefront experience

The shop is built to feel like a record sleeve rather than a template: condensed poster type on
warm ink, one spot colour, motion used to introduce content — never to decorate it.

**The hero** (`components/hero-stage.tsx`)
- Accent aurora that drifts behind the page, a fine printed grid, and a spotlight that follows your
  pointer (CSS variables written on rAF, so scrolling stays smooth)
- The headline rises out of a mask line by line; the genre line rotates through the genres you
  actually sell
- The featured beat sits on a vinyl that spins only while it plays, with a 12-bar visualiser driven
  by playback state
- Facts underneath count themselves up the first time they scroll into view

**The navbar** (`components/site-header.tsx`)
- Glass, with a hairline that lights up in your accent once you scroll
- The bar compresses, the top strip and ticker fold away, and the bar steps out of the way while
  you scroll down — it comes straight back when you scroll up
- One indicator glides between nav links, the cart badge pops on every change, and whatever is
  playing shows up as a live equaliser you can pause from the bar
- Reading progress is drawn along the bottom edge

**Colour you can adjust** (`lib/theme.ts`, `components/theme-picker.tsx`)
- Ten accent presets, a colour wheel, and four backdrop tints (Ink, Obsidian, Slate, Moss) — pick
  any hex
- Glow strength, corner radius and a calm-motion toggle, all live
- The floating **Colour** panel saves a visitor's choice in their browser; the studio default lives
  in **Admin → Settings → Studio colour** and applies to everyone
- Nothing is baked into the CSS: the accent ramp (`--accent-200 … 700`), the ink ramp
  (`--ink-950 … 600`), glass values, radii and motion timings are all custom properties written onto
  `<html>`, with a no-flash script that re-applies a returning visitor's colour before first paint

**Sign in / create account** (`components/auth-shell.tsx`, `components/auth-forms.tsx`)
- Split screen: the pitch sheet blurs in, the form rises a beat later, bullets stagger
- A thumb slides between the Sign in / Create account tabs (they are links, so they work without JS)
- Focus rails draw under fields, passwords get a reveal toggle and a strength meter, errors shake,
  and a success tick draws itself before you are redirected

**Producer dashboard — v12** (`app/admin`)
- Glass sidebar with a rail that glides between items, live badge pops, a running GMT clock and a
  page title that animates on every navigation
- Revenue chart with 7 / 30 / 90-day ranges, drawn on mount, with a hover readout and a best-day line
- KPI tiles that count up, each with a delta against the previous period and an inline sparkline
- Payment-mix donut, licence-mix and genre bar lists, delivery health (emails sent, links issued,
  files pulled, links expiring), payments to verify, upcoming sessions, recent orders and the inbox
- All of it aggregated in SQL (`lib/data/analytics.ts`), not in JavaScript

Every animation is driven by two variables — `--motion-scale` and `--loop-play` — so the calm-motion
toggle and `prefers-reduced-motion` snap content into place instead of hiding it.

---

## Quick start

```bash
npm install          # installs dependencies
npm run db:setup     # creates dev.db, seeds settings, accounts, demo beats/videos/orders
npm run dev          # http://localhost:3000
```

Open http://localhost:3000 and sign in to the admin at `/admin`:

| Role | Email | Password |
| --- | --- | --- |
| Producer (admin) | `admin@nsobeats.test` | `Admin123!` |
| Artist | `artist@nsobeats.test` | `Artist123!` |

> Change these immediately from **Admin → Artists** and the account page before going live.

`npm run db:setup -- --force` wipes and reseeds the store at any time.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on 0.0.0.0:3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:setup` | Create/seed the database (add `-- --force` to reset) |
| `npm run media:demo` | Regenerate the sample audio/video with ffmpeg (needs `@ffmpeg-installer/linux-x64`) |
| `npm run lint` | ESLint |

---

## Configuration

Copy `.env.example` to `.env` and fill in what you have. Everything is optional except
`DATABASE_URL` and `AUTH_SECRET` — without payment/email keys the store runs in a clearly
labelled **test mode** so you can rehearse the whole flow.

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<64-char random string>"   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Payments — Paystack

1. Create an account at [dashboard.paystack.com](https://dashboard.paystack.com) and complete KYC.
2. Settings → API Keys & Webhooks → copy the secret and public keys.
3. Add them to `.env`:

```bash
PAYSTACK_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_..."
ENABLE_PAYMENT_SIMULATION="false"   # turn the demo gateway off
```

4. Add the webhook URL (so payments confirm even if the buyer closes the tab):

```
https://your-domain.com/api/webhooks/paystack
```

Real mobile money/card/bank checkout switches on automatically — no code changes.
Supported channels per currency are in `lib/paystack.ts` (`channelsForCurrency`).

**Manual mobile money and bank transfers need no keys at all** — the numbers shown at
checkout come from **Admin → Settings** (MoMo numbers, bank account details).

### Email — Resend

1. Create a key at [resend.com/api-keys](https://resend.com/api-keys) and verify your sending domain.
2. Add:

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="NSO Beats <beats@yourdomain.com>"
ADMIN_NOTIFICATION_EMAIL="you@yourdomain.com"   # where order/message alerts go
```

Without a key every email is still fully rendered and stored — read them in
**Admin → Email outbox**, which is the fastest way to see exactly what buyers receive.

---

## How a purchase flows

```
artist picks a licence
   └─ POST /api/checkout        prices re-read from the DB, order created (pending)
       ├─ Paystack            → hosted payment page → /api/payments/verify (and webhook)
       ├─ Mobile money/bank   → /checkout/pay/<ref> → buyer submits the transaction ID
       │                        → /api/orders/claim → status "awaiting verification"
       └─ admin marks it paid → /api/admin/orders/<id>  (Mark as paid & deliver)
                                 │
                                 ├─ download tokens created (30 days / 15 downloads)
                                 ├─ delivery email + receipt queued (Resend or outbox)
                                 ├─ signed licence PDF generated per item
                                 └─ exclusive tiers unpublish the beat
```

Files are never public: full beat files live in `storage/beats/` and are only served through
`/api/media/beats/...?token=...` with a valid, unexpired download token. Previews are public.

Because of that split, a beat needs its own preview clip: the store can't play a beat's master
file (that URL only answers with a token), so **Admin → Beats** asks for a tagged 30–45s excerpt
and won't publish a beat without one. Uploads and edits never delete a file a beat still
references, so replacing a preview can't cost you the master your buyers download.

---

## Deploying

### Requirements (any host)

- **Node.js 22.13 or newer** — the data layer uses the built-in `node:sqlite` module, which
  only exists without a flag from 22.13+ (also fine on Node 24). On Node 20 or 22.0–22.12
  every database route crashes at import time.
- The env vars from `.env.example` (only `DATABASE_URL` + `AUTH_SECRET` are mandatory).

### Vercel

Push the repo, import it in Vercel, and add the environment variables above. Then:

1. **Project → Settings → General → Node.js Version: 22.x or 24.x** (the requirement above).
2. **Plan note:** this store takes payments, which Vercel classifies as commercial use —
   the [Hobby plan is for non-commercial use only](https://vercel.com/docs/plans/hobby),
   so a paying store belongs on Pro (otherwise the account can be paused).

Serverless specifics — already handled, but important to understand:

- Vercel's function filesystem is **read-only outside `/tmp`**. The app detects this and
  automatically moves the SQLite database to `/tmp/beatstore/dev.db` and uploads to
  `/tmp/beatstore/storage` (a warning is logged). It boots and serves, **but data in `/tmp`
  is ephemeral** — it resets on every cold start/redeploy. That's fine to preview the site,
  not fine for real sales.
- For production, either:
  - **Stay on Vercel** and swap the data layer: every query is plain SQL in `lib/data/*.ts`
    and `lib/db.ts` is the only file that knows about `node:sqlite` (see the note at the
    bottom of that file). Turso/libSQL is a drop-in SQLite-in-the-cloud replacement; use
    Vercel Blob or S3/R2 for uploads (`saveUpload()` in `lib/storage.ts`).
  - **Or run it on a host with a real disk** (below) and keep everything as-is.

### VPS / Docker (recommended for this app)

`npm run build && npm start` behind Nginx works as-is — SQLite and `storage/` behave exactly
as they do locally. Keep `storage/` and the database file on a persistent volume, back them
up, and set `NEXT_PUBLIC_SITE_URL` to your public domain (emails use it for links).

---

## Project structure

```
app/
  page.tsx                 landing page (animated hero, featured beats, licences, videos)
  beats/                   catalogue + beat detail pages
  videos, licensing, about, contact
  cart, checkout/          cart → checkout → pay / test / success / failed → download
  login, register, forgot-password, reset-password
  account/                 artist dashboard (orders, downloads, profile, messages)
  admin/                   dashboard, beats, videos, orders, messages, users, outbox, settings
  api/                     auth, beats, checkout, payments, webhooks, downloads, media, admin
components/
  site-header.tsx          glass navbar, ticker, account menu
  hero-stage.tsx           animated hero + featured-beat deck
  theme-picker.tsx         the Colour panel (visitors + admin settings)
  theme-provider.tsx       applies theme variables to <html>
  count-up.tsx             numbers that count into view
  auth-shell.tsx, auth-forms.tsx   animated sign in / register / reset
  admin/charts.tsx         revenue chart, KPI tiles, donut, bar lists
  admin/admin-shell.tsx    sidebar, rail, live header
  player, cart, beat cards, forms, checkout
lib/
  theme.ts               accent + surface ramps, presets, settings bridge
  data/analytics.ts      dashboard reporting queries
  db.ts                    node:sqlite connection + query helpers
  sql/schema.sql           the whole schema (money = integer minor units, dates = epoch ms)
  data/                    users, catalog (beats/licenses/videos), sales (orders/downloads), inbox
  auth.ts, password.ts     scrypt hashing + jose JWT session cookie
  paystack.ts, email.ts    payment + email providers
  fulfilment.ts            the "order paid → files + emails" routine
  license-pdf.ts, storage.ts, settings.ts, orders.ts, downloads.ts
scripts/
  setup.ts                 database + demo content seeder
  generate-demo-media.mjs  synthesises demo beats/video with ffmpeg
demo-assets/beats/         full demo beat files (served only with a download token)
public/demo/               public demo covers, tagged previews, promo video
storage/                   your uploads (git-ignored)
```

---

## Security notes

- Passwords are hashed with scrypt (`lib/password.ts`); sessions are signed JWTs in an
  httpOnly cookie — no secrets in the browser.
- Cart prices are never trusted: `/api/checkout` re-reads every licence from the database.
- Uploads are validated by extension/MIME and size per media kind (`lib/storage.ts`), filenames
  are randomised, and path traversal is blocked in the resolver.
- Paystack webhooks are verified with an HMAC-SHA512 signature (timing-safe comparison).
- Download links are random 48-char tokens, single-item scoped, expiring and rate-limited by count.

## Ideas for a v2

- Delivery to S3/R2 with signed URLs, so uploads survive redeploys
- Email marketing (new-drop broadcasts) and abandoned-cart nudges
- Paystack split payments for collaborators, plus multi-currency pricing per beat
- A beat pack/bundle product and discount codes
- Per-genre accent themes (the theme engine already carries a surface + accent pair)
