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
- Landing page with a featured-beat player, how-it-works, licence comparison and producer bio
- Catalogue with search, genre/mood filters and sort
- Beat pages with a global sticky audio player, tagged previews, licence picker and facts (BPM, key, duration)
- Videos page (YouTube/Vimeo embeds or uploaded files)
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

**Admin dashboard** (`/admin`)
- Sales overview: revenue, paid/pending/awaiting counts, best sellers, recent orders
- Beat uploader: drag in audio + tagged preview + cover + stems, set BPM/key/genre/mood/tags,
  price the basic/premium/exclusive tiers, feature or unpublish
- Videos manager, orders manager (verify MoMo/bank payments in one click, resend delivery,
  refunds), inbox (reply by email without leaving the page), artist list with roles,
  **email outbox** (read the exact email every customer received), settings
- Everything is protected server-side; admin pages redirect non-admins to their own dashboard

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

**Vercel** (easiest): push the repo, import it in Vercel, add the environment variables above.
Two things to change for production:

1. **Database** — serverless filesystems are ephemeral. Use a managed Postgres and swap the
   data layer: every query is plain SQL in `lib/data/*.ts` and `lib/db.ts` is the only file that
   knows about `node:sqlite` (see the note at the bottom of that file). For SQLite-in-the-cloud,
   Turso/libSQL is a drop-in alternative.
2. **Uploads** — `storage/` is local disk. Point `saveUpload()` in `lib/storage.ts` at S3,
   Cloudflare R2 or Supabase Storage, or run the app on a VPS with a mounted volume.

**VPS / Docker**: `npm run build && npm start` behind Nginx works as-is; keep `storage/` on a
persistent volume and set `NEXT_PUBLIC_SITE_URL` to your public domain (emails use it for links).

---

## Project structure

```
app/
  page.tsx                 landing page (hero player, featured beats, licences, videos)
  beats/                   catalogue + beat detail pages
  videos, licensing, about, contact
  cart, checkout/          cart → checkout → pay / test / success / failed → download
  login, register, forgot-password, reset-password
  account/                 artist dashboard (orders, downloads, profile, messages)
  admin/                   dashboard, beats, videos, orders, messages, users, outbox, settings
  api/                     auth, beats, checkout, payments, webhooks, downloads, media, admin
components/                UI (player, cart, beat cards, forms) + components/admin/*
lib/
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
- Waveform previews and “tagged” auto-preview generation with ffmpeg on upload
- Email marketing (new-drop broadcasts) and abandoned-cart nudges
- Paystack split payments for collaborators, plus multi-currency pricing per beat
- A beat pack/bundle product and discount codes
