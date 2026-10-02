-- ─────────────────────────────────────────────────────────────
-- Beatstore schema (SQLite, applied automatically on first run)
--
-- Money is stored as INTEGER minor units (pesewas / kobo / cents).
-- Dates are stored as INTEGER epoch milliseconds.
-- Booleans are stored as INTEGER 0 / 1.
--
-- Sticking to these three conversions keeps the data portable: a move to
-- Postgres is a re-typable change (INTEGER → BIGINT/NUMERIC, TEXT → TEXT).
-- ─────────────────────────────────────────────────────────────

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  passwordHash  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'artist',
  phone         TEXT,
  country       TEXT,
  stageName     TEXT,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  verifyToken   TEXT,
  resetToken    TEXT,
  resetExpires  INTEGER,
  lastLoginAt   INTEGER,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS beats (
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT,
  genre       TEXT,
  mood        TEXT,
  bpm         INTEGER,
  musicalKey  TEXT,
  tags        TEXT,
  coverImage  TEXT,
  audioFile   TEXT,
  previewFile TEXT,
  stemsFile   TEXT,
  duration    INTEGER,
  plays       INTEGER NOT NULL DEFAULT 0,
  featured    INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  createdAt   INTEGER NOT NULL,
  updatedAt   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_beats_published ON beats(published, createdAt);
CREATE INDEX IF NOT EXISTS idx_beats_genre ON beats(genre);

CREATE TABLE IF NOT EXISTS beat_licenses (
  id          TEXT PRIMARY KEY,
  beatId      TEXT NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
  tier        TEXT NOT NULL,
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL,
  description TEXT,
  fileFormat  TEXT,
  popular     INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  sortOrder   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_licenses_beat ON beat_licenses(beatId);

CREATE TABLE IF NOT EXISTS videos (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  source      TEXT NOT NULL DEFAULT 'youtube',
  url         TEXT,
  fileUrl     TEXT,
  thumbnail   TEXT,
  featured    INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  createdAt   INTEGER NOT NULL,
  updatedAt   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  reference     TEXT NOT NULL UNIQUE,
  userId        TEXT REFERENCES users(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  country       TEXT,
  note          TEXT,
  subtotal      INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'GHS',
  status        TEXT NOT NULL DEFAULT 'pending',
  paymentMethod TEXT NOT NULL DEFAULT 'paystack',
  paymentRef    TEXT,
  payerNote     TEXT,
  paidAt        INTEGER,
  deliveredAt   INTEGER,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(userId);

CREATE TABLE IF NOT EXISTS order_items (
  id          TEXT PRIMARY KEY,
  orderId     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  beatId      TEXT REFERENCES beats(id) ON DELETE SET NULL,
  licenseId   TEXT REFERENCES beat_licenses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  tier        TEXT NOT NULL,
  licenseName TEXT NOT NULL,
  price       INTEGER NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'GHS',
  fileFormat  TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(orderId);

CREATE TABLE IF NOT EXISTS downloads (
  id             TEXT PRIMARY KEY,
  token          TEXT NOT NULL UNIQUE,
  orderId        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  orderItemId    TEXT NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  userId         TEXT REFERENCES users(id) ON DELETE SET NULL,
  fileUrl        TEXT,
  licenseUrl     TEXT,
  downloads      INTEGER NOT NULL DEFAULT 0,
  maxDownloads   INTEGER NOT NULL DEFAULT 15,
  expiresAt      INTEGER NOT NULL,
  lastDownloadAt INTEGER,
  createdAt      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_downloads_order ON downloads(orderId);

CREATE TABLE IF NOT EXISTS messages (
  id        TEXT PRIMARY KEY,
  userId    TEXT REFERENCES users(id) ON DELETE SET NULL,
  orderId   TEXT REFERENCES orders(id) ON DELETE SET NULL,
  name      TEXT NOT NULL,
  email     TEXT NOT NULL,
  subject   TEXT NOT NULL,
  body      TEXT NOT NULL,
  topic     TEXT NOT NULL DEFAULT 'general',
  direction TEXT NOT NULL DEFAULT 'inbound',
  status    TEXT NOT NULL DEFAULT 'new',
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_messages_email ON messages(email);

CREATE TABLE IF NOT EXISTS email_logs (
  id         TEXT PRIMARY KEY,
  "to"       TEXT NOT NULL,
  "from"     TEXT,
  subject    TEXT NOT NULL,
  type       TEXT NOT NULL,
  html       TEXT,
  text       TEXT,
  status     TEXT NOT NULL DEFAULT 'queued',
  providerId TEXT,
  error      TEXT,
  orderId    TEXT,
  createdAt  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(createdAt);

CREATE TABLE IF NOT EXISTS settings (
  key       TEXT PRIMARY KEY,
  value     TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);
