/**
 * One-command setup: creates the SQLite database, applies the schema, adds the
 * site settings, the producer's admin account and demo store content.
 *
 *   npm run db:setup            # set up whatever is missing
 *   npm run db:setup -- --force # wipe the store and re-seed from scratch
 *
 * The database file lives at ./dev.db (see DATABASE_URL) and uploads live in
 * ./storage — both are git-ignored.
 */
import fs from "node:fs";
import { loadEnvFile } from "./env-loader";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashPassword } from "../lib/password";
import { DEMO_BEATS, DEMO_MESSAGES, DEMO_VIDEO } from "./seed-data";
import { DEFAULT_SETTINGS, TIER_META } from "../lib/constants";

loadEnvFile();

const ROOT = process.cwd();
const FORCE = process.argv.includes("--force");

function dbPath() {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const cleaned = url.replace(/^file:/, "").replace(/^\/\//, "");
  return path.isAbsolute(cleaned) ? cleaned : path.join(ROOT, cleaned);
}

const storageDir = path.join(ROOT, process.env.STORAGE_DIR || "storage");
const demoAssets = path.join(ROOT, "demo-assets", "beats");
const publicDemo = path.join(ROOT, "public", "demo");
const db = new DatabaseSync(dbPath());
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(path.join(ROOT, "lib", "sql", "schema.sql"), "utf8"));

const now = Date.now();
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);

function one(sql: string, params: (string | number | null)[] = []) {
  return db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
}
function run(sql: string, params: (string | number | null)[] = []) {
  db.prepare(sql).run(...params);
}

async function main() {
/* ── optional wipe ─────────────────────────────────────────── */
if (FORCE) {
  for (const table of [
    "downloads",
    "order_items",
    "orders",
    "bookings",
    "studio_services",
    "messages",
    "email_logs",
    "beat_licenses",
    "beats",
    "videos",
    "settings",
    "users",
  ]) {
    run(`DELETE FROM ${table}`);
  }
  console.log("• wiped existing data");
}

const existingBeats = one("SELECT COUNT(*) AS n FROM beats")?.n as number;
if (existingBeats > 0 && !FORCE) {
  console.log("• store already has beats — nothing to do. Use `npm run db:setup -- --force` to reseed.");
  process.exit(0);
}

/* ── settings ──────────────────────────────────────────────── */
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  run(
    `INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)
     ON CONFLICT(key) DO NOTHING`,
    [key, value, now]
  );
}
console.log(`• settings ready (${Object.keys(DEFAULT_SETTINGS).length} keys)`);

/* ── accounts ──────────────────────────────────────────────── */
async function upsertUser({
  name,
  email,
  password,
  role,
  stageName,
  country,
}: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "artist";
  stageName?: string;
  country?: string;
}) {
  const existing = one("SELECT id FROM users WHERE lower(email) = lower(?)", [email]);
  const passwordHash = await hashPassword(password);
  if (existing) {
    run("UPDATE users SET passwordHash = ?, role = ?, emailVerified = 1, updatedAt = ? WHERE id = ?", [
      passwordHash,
      role,
      now,
      existing.id as string,
    ]);
    return existing.id as string;
  }
  const id = newId();
  run(
    `INSERT INTO users (id, name, email, passwordHash, role, country, stageName, emailVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, name, email, passwordHash, role, country ?? null, stageName ?? null, now, now]
  );
  return id;
}

await upsertUser({
  name: "Nathaniel Sasu Osei",
  email: "admin@nsobeats.test",
  password: "Admin123!",
  role: "admin",
  stageName: "NSO",
  country: "Ghana",
});
const artistId = await upsertUser({
  name: "Kojo Wavez",
  email: "artist@nsobeats.test",
  password: "Artist123!",
  role: "artist",
  stageName: "Kojo Wavez",
  country: "Ghana",
});
console.log("• accounts: admin@nsobeats.test / Admin123!  ·  artist@nsobeats.test / Artist123!");

/* ── beats + licences ──────────────────────────────────────── */
let sorted = 0;
for (const [index, beat] of DEMO_BEATS.entries()) {
  // newest first: index 0 is the latest drop, so the store order is deliberate
  const created = now - index * 36 * 60 * 60 * 1000;
  const existing = one("SELECT id FROM beats WHERE slug = ?", [beat.slug]);
  const id = (existing?.id as string) ?? newId();
  // Covers, previews and the promo video ship in /public/demo; the full beat
  // files live in demo-assets and are copied into the private storage folder.
  const cover = fs.existsSync(path.join(publicDemo, "covers", beat.cover))
    ? `/demo/covers/${beat.cover}`
    : null;
  const preview = fs.existsSync(path.join(publicDemo, "previews", beat.audio))
    ? `/demo/previews/${beat.audio}`
    : null;

  fs.mkdirSync(path.join(storageDir, "beats"), { recursive: true });
  const archived = path.join(demoAssets, beat.audio);
  const inStorage = path.join(storageDir, "beats", beat.audio);
  if (fs.existsSync(archived) && !fs.existsSync(inStorage)) fs.copyFileSync(archived, inStorage);
  const audio = fs.existsSync(inStorage) ? `/api/media/beats/${beat.audio}` : null;

  if (existing) {
    run(
      `UPDATE beats SET title=?, description=?, genre=?, mood=?, bpm=?, musicalKey=?, tags=?, coverImage=?,
       audioFile=?, previewFile=?, duration=?, plays=?, featured=?, published=1, createdAt=?, updatedAt=? WHERE id=?`,
      [
        beat.title,
        beat.description,
        beat.genre,
        beat.mood,
        beat.bpm,
        beat.musicalKey,
        beat.tags,
        cover,
        audio,
        preview,
        beat.duration,
        beat.plays,
        beat.featured ? 1 : 0,
        created,
        now,
        id,
      ]
    );
  } else {
    run(
      `INSERT INTO beats (id, slug, title, description, genre, mood, bpm, musicalKey, tags, coverImage,
        audioFile, previewFile, duration, plays, featured, published, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        beat.slug,
        beat.title,
        beat.description,
        beat.genre,
        beat.mood,
        beat.bpm,
        beat.musicalKey,
        beat.tags,
        cover,
        audio,
        preview,
        beat.duration,
        beat.plays,
        beat.featured ? 1 : 0,
        created,
        created,
      ]
    );
  }

  for (const [tier, meta] of Object.entries(TIER_META)) {
    const price = (beat.prices as Record<string, number>)[tier] ?? meta.defaultPrice;
    const licenseId = newId();
    const existingLicense = one("SELECT id FROM beat_licenses WHERE beatId = ? AND tier = ?", [id, tier]);
    if (existingLicense) {
      run("UPDATE beat_licenses SET name=?, price=?, description=?, fileFormat=?, popular=?, active=1 WHERE id=?", [
        meta.label,
        price,
        meta.blurb,
        meta.files,
        tier === "premium" ? 1 : 0,
        existingLicense.id as string,
      ]);
    } else {
      run(
        `INSERT INTO beat_licenses (id, beatId, tier, name, price, description, fileFormat, popular, active, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [licenseId, id, tier, meta.label, price, meta.blurb, meta.files, tier === "premium" ? 1 : 0, ["basic", "premium", "exclusive"].indexOf(tier)]
      );
    }
  }
  sorted++;
}
console.log(`• ${sorted} beats with basic / premium / exclusive licences`);

/* ── studio services (for /studio bookings) ────────────────── */
const STUDIO_SERVICES = [
  {
    slug: "recording",
    name: "Recording",
    description: "Vocal recording in a treated booth with a session engineer. Includes a rough mix at the end of your session.",
    pricePerHour: 15000,
    minHours: 1,
    maxHours: 8,
  },
  {
    slug: "mixing",
    name: "Mixing",
    description: "Full mix-down of your record — levels, EQ, compression, effects and a radio-ready master bus.",
    pricePerHour: 20000,
    minHours: 2,
    maxHours: 6,
  },
  {
    slug: "mastering",
    name: "Mastering",
    description: "Final polish for streaming and distribution. Loudness-matched, with a free revision within 7 days.",
    pricePerHour: 30000,
    minHours: 1,
    maxHours: 4,
  },
];
let serviceSort = 0;
for (const service of STUDIO_SERVICES) {
  const existing = one("SELECT id FROM studio_services WHERE slug = ?", [service.slug]);
  if (existing) {
    run(
      "UPDATE studio_services SET name=?, description=?, pricePerHour=?, minHours=?, maxHours=?, active=1, updatedAt=? WHERE id=?",
      [service.name, service.description, service.pricePerHour, service.minHours, service.maxHours, now, existing.id as string]
    );
  } else {
    run(
      `INSERT INTO studio_services (id, slug, name, description, pricePerHour, minHours, maxHours, active, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [newId(), service.slug, service.name, service.description, service.pricePerHour, service.minHours, service.maxHours, serviceSort, now, now]
    );
  }
  serviceSort++;
}
console.log("• studio services: recording, mixing, mastering (50% deposit bookings on /studio)");

/* ── video ─────────────────────────────────────────────────── */
const videoFile = path.join(publicDemo, "videos", DEMO_VIDEO.file);
if (fs.existsSync(videoFile) && !one("SELECT id FROM videos LIMIT 1")) {
  run(
    `INSERT INTO videos (id, title, description, source, fileUrl, thumbnail, featured, published, createdAt, updatedAt)
     VALUES (?, ?, ?, 'file', ?, ?, 1, 1, ?, ?)`,
    [
      newId(),
      DEMO_VIDEO.title,
      DEMO_VIDEO.description,
      `/demo/videos/${DEMO_VIDEO.file}`,
      `/demo/covers/${DEMO_VIDEO.thumbnail}`,
      now,
      now,
    ]
  );
  console.log("• promo video");
}

/* ── demo orders, so the dashboard has real data ───────────── */
if (!one("SELECT id FROM orders LIMIT 1")) {
  const softLife = one("SELECT id, title FROM beats WHERE slug = 'soft-life'") as
    | { id: string; title: string }
    | undefined;
  const trapPastor = one("SELECT id, title FROM beats WHERE slug = 'trap-pastor'") as
    | { id: string; title: string }
    | undefined;

  if (softLife) {
    const premium = one("SELECT id, price, name, fileFormat FROM beat_licenses WHERE beatId = ? AND tier = 'premium'", [
      softLife.id,
    ]) as { id: string; price: number; name: string; fileFormat: string };

    const orderId = newId();
    const reference = `NSO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const itemId = newId();
    run(
      `INSERT INTO orders (id, reference, userId, email, name, phone, country, subtotal, total, currency, status,
        paymentMethod, paymentRef, paidAt, deliveredAt, createdAt, updatedAt)
       VALUES (?, ?, ?, 'artist@nsobeats.test', 'Kojo Wavez', '+233 24 111 2222', 'Ghana', ?, ?, 'GHS', 'paid',
        'mobile_money', 'MOMO-DEMO-8842', ?, ?, ?, ?)`,
      [orderId, reference, artistId, premium.price, premium.price, now - 86400000, now - 86400000, now - 86400000, now - 86400000]
    );
    run(
      `INSERT INTO order_items (id, orderId, beatId, licenseId, title, tier, licenseName, price, currency, fileFormat)
       VALUES (?, ?, ?, ?, ?, 'premium', ?, ?, 'GHS', ?)`,
      [itemId, orderId, softLife.id, premium.id, softLife.title, premium.name, premium.price, premium.fileFormat]
    );

    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const beat = one("SELECT audioFile FROM beats WHERE id = ?", [softLife.id]) as { audioFile: string };
    run(
      `INSERT INTO downloads (id, token, orderId, orderItemId, userId, fileUrl, licenseUrl, downloads, maxDownloads,
        expiresAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 15, ?, ?)`,
      [
        newId(),
        token,
        orderId,
        itemId,
        artistId,
        beat.audioFile,
        `/api/download/${token}/license`,
        now + 30 * 86400000,
        now - 86400000,
      ]
    );

    run(
      `INSERT INTO email_logs (id, "to", "from", subject, type, html, text, status, orderId, createdAt)
       VALUES (?, 'artist@nsobeats.test', 'NSO Beats <onboarding@resend.dev>', ?, 'order-delivered', ?, ?, 'preview', ?, ?)`,
      [
        newId(),
        `Your beats are ready — order ${reference}`,
        `<p>Demo delivery email for order ${reference}. In the live store this contains the WAV/MP3 download links for <strong>${softLife.title}</strong> plus the PDF licence.</p>`,
        `Demo delivery email for order ${reference}.`,
        orderId,
        now - 86400000,
      ]
    );
    console.log(`• demo paid order ${reference} (with working download link for the artist account)`);
  }

  if (trapPastor) {
    const basic = one("SELECT id, price, name, fileFormat FROM beat_licenses WHERE beatId = ? AND tier = 'basic'", [
      trapPastor.id,
    ]) as { id: string; price: number; name: string; fileFormat: string };
    const orderId = newId();
    const reference = `NSO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    run(
      `INSERT INTO orders (id, reference, email, name, phone, country, subtotal, total, currency, status,
        paymentMethod, payerNote, createdAt, updatedAt)
       VALUES (?, ?, 'kwame.bright@example.com', 'Kwame Bright', '+233 20 555 1212', 'Ghana', ?, ?, 'GHS',
        'awaiting_verification', 'mobile_money', 'MTN MoMo ref 90214478 · from Kwame B.', ?, ?)`,
      [orderId, reference, basic.price, basic.price, now - 5400000, now - 5400000]
    );
    run(
      `INSERT INTO order_items (id, orderId, beatId, licenseId, title, tier, licenseName, price, currency, fileFormat)
       VALUES (?, ?, ?, ?, ?, 'basic', ?, ?, 'GHS', ?)`,
      [newId(), orderId, trapPastor.id, basic.id, trapPastor.title, basic.name, basic.price, basic.fileFormat]
    );
    console.log(`• demo order ${reference} awaiting MoMo verification (try "Mark as paid" in admin)`);
  }
}

/* ── demo studio bookings, so the calendar has real data ───── */
if (!one("SELECT id FROM bookings LIMIT 1")) {
  const recording = one("SELECT id, name FROM studio_services WHERE slug = 'recording'") as
    | { id: string; name: string }
    | undefined;

  if (recording) {
    // Next weekday that isn't Sunday (the studio is closed then in the defaults).
    function futureDate(daysAhead: number) {
      const d = new Date(now + daysAhead * 86400000);
      if (d.getUTCDay() === 0) d.setTime(d.getTime() + 86400000);
      return d.toISOString().slice(0, 10);
    }

    // 1) Confirmed booking for the artist account (deposit paid).
    {
      const date = futureDate(3);
      const startHour = 14;
      const hours = 2;
      const pricePerHour = 15000;
      const sessionTotal = pricePerHour * hours;
      const depositAmount = Math.round(sessionTotal * 0.5);
      const serviceFeeAmount = Math.round(depositAmount * 0.1);
      const bookingId = newId();
      const reference = `BKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      run(
        `INSERT INTO bookings (id, reference, serviceId, serviceName, userId, email, name, phone, date, startHour,
          hours, endHour, pricePerHour, sessionTotal, depositPercent, depositAmount, serviceFeePercent,
          serviceFeeAmount, amountDue, balanceAmount, currency, notes, status, paymentMethod, paymentRef, paidAt,
          createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'artist@nsobeats.test', 'Kojo Wavez', '+233 24 111 2222', ?, ?, ?, ?, ?, ?, 50, ?,
          10, ?, ?, ?, 'GHS', 'Tracking vocals for a two-song EP — rough mix at the end please.', 'confirmed',
          'paystack', ?, ?, ?, ?)`,
        [
          bookingId,
          reference,
          recording.id,
          recording.name,
          artistId,
          date,
          startHour,
          hours,
          startHour + hours,
          pricePerHour,
          sessionTotal,
          depositAmount,
          serviceFeeAmount,
          depositAmount + serviceFeeAmount,
          sessionTotal - depositAmount,
          `TEST-${reference}`,
          now - 3600000,
          now - 3600000,
          now - 3600000,
        ]
      );
      console.log(`• demo studio booking ${reference} confirmed (${date} ${startHour}:00)`);
    }

    // 2) Booking with a deposit claim waiting for verification.
    {
      const date = futureDate(5);
      const startHour = 11;
      const hours = 3;
      const pricePerHour = 15000;
      const sessionTotal = pricePerHour * hours;
      const depositAmount = Math.round(sessionTotal * 0.5);
      const serviceFeeAmount = Math.round(depositAmount * 0.1);
      const bookingId = newId();
      const reference = `BKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      run(
        `INSERT INTO bookings (id, reference, serviceId, serviceName, email, name, phone, date, startHour,
          hours, endHour, pricePerHour, sessionTotal, depositPercent, depositAmount, serviceFeePercent,
          serviceFeeAmount, amountDue, balanceAmount, currency, status, paymentMethod, payerNote, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'efya.mensah@example.com', 'Efya Mensah', '+233 20 777 3311', ?, ?, ?, ?, ?, ?, 50, ?,
          10, ?, ?, ?, 'GHS', 'awaiting_verification', 'mobile_money', 'MTN MoMo ref 77319022 · from Efya M.', ?, ?)`,
        [
          bookingId,
          reference,
          recording.id,
          recording.name,
          date,
          startHour,
          hours,
          startHour + hours,
          pricePerHour,
          sessionTotal,
          depositAmount,
          serviceFeeAmount,
          depositAmount + serviceFeeAmount,
          sessionTotal - depositAmount,
          now - 1800000,
          now - 1800000,
        ]
      );
      console.log(`• demo studio booking ${reference} awaiting deposit verification (try "Confirm deposit" in admin)`);
    }
  }
}

/* ── inbox ─────────────────────────────────────────────────── */
if (!one("SELECT id FROM messages LIMIT 1")) {
  for (const message of DEMO_MESSAGES) {
    run(
      `INSERT INTO messages (id, name, email, subject, body, topic, direction, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'inbound', 'new', ?)`,
      [newId(), message.name, message.email, message.subject, message.body, message.topic, now - 7200000]
    );
  }
  console.log(`• ${DEMO_MESSAGES.length} demo messages in the admin inbox`);
}

console.log("\n✅ Store is ready. Start it with:  npm run dev\n");
}

main().catch((error) => {
  console.error("\n✖ Setup failed:", error);
  process.exit(1);
});
