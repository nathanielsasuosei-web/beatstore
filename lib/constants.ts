export const LICENSE_TIERS = ["basic", "premium", "exclusive"] as const;
export type LicenseTier = (typeof LICENSE_TIERS)[number];

export const TIER_META: Record<
  LicenseTier,
  { label: string; blurb: string; accent: string; files: string; defaultPrice: number }
> = {
  basic: {
    label: "Basic Lease",
    blurb: "Untagged MP3 for demos, mixtapes and non-monetised releases.",
    accent: "sky",
    files: "MP3 320kbps",
    defaultPrice: 12000,
  },
  premium: {
    label: "Premium Lease",
    blurb: "WAV + MP3 for streaming releases and monetised YouTube.",
    accent: "violet",
    files: "WAV + MP3",
    defaultPrice: 25000,
  },
  exclusive: {
    label: "Exclusive Rights",
    blurb: "Full ownership transfer — beat is removed from the store.",
    accent: "amber",
    files: "WAV + MP3 + Trackout/Stems",
    defaultPrice: 120000,
  },
};

export const ORDER_STATUS = {
  pending: { label: "Pending payment", tone: "zinc" },
  awaiting_verification: { label: "Awaiting verification", tone: "amber" },
  paid: { label: "Paid", tone: "lime" },
  failed: { label: "Failed", tone: "red" },
  cancelled: { label: "Cancelled", tone: "zinc" },
  refunded: { label: "Refunded", tone: "sky" },
} as const;

export const BOOKING_STATUS = {
  pending: { label: "Awaiting deposit", tone: "zinc" },
  awaiting_verification: { label: "Verifying deposit", tone: "amber" },
  confirmed: { label: "Confirmed", tone: "lime" },
  completed: { label: "Completed", tone: "sky" },
  cancelled: { label: "Cancelled", tone: "red" },
} as const;

/** Statuses that keep a studio slot blocked on the calendar. */
export const BOOKING_SLOT_HOLDING_STATUSES = ["pending", "awaiting_verification", "confirmed"] as const;

export const PAYMENT_METHODS = {
  paystack: {
    label: "Mobile Money / Card / Bank",
    short: "Pay online",
    blurb: "Pay instantly with MTN MoMo, Telecel Cash, AT, card or bank. Instant delivery.",
  },
  mobile_money: {
    label: "Mobile Money transfer",
    short: "MoMo transfer",
    blurb: "Send the amount to the producer's MoMo number, then submit your transaction ID.",
  },
  bank_transfer: {
    label: "Bank transfer",
    short: "Bank transfer",
    blurb: "Pay into the producer's bank account and submit your transfer reference.",
  },
} as const;

export const MESSAGE_TOPICS = [
  "general",
  "custom-beat",
  "support",
  "order",
  "licence",
  "collab",
] as const;

export const GENRES = [
  "Afrobeats",
  "Afro-drill",
  "Amapiano",
  "Hip Hop",
  "Trap",
  "Drill",
  "R&B",
  "Dancehall",
  "Highlife",
  "Gospel",
  "Reggaeton",
  "Pop",
  "Lo-fi",
] as const;

export const MOODS = [
  "Dark",
  "Chill",
  "Energetic",
  "Emotional",
  "Street",
  "Romantic",
  "Uplifting",
  "Bouncy",
] as const;

export const KEYS = [
  "C maj", "C min", "C# maj", "C# min", "D maj", "D min", "D# maj", "D# min",
  "E maj", "E min", "F maj", "F min", "F# maj", "F# min", "G maj", "G min",
  "G# maj", "G# min", "A maj", "A min", "A# maj", "A# min", "B maj", "B min",
] as const;

export const SESSION_COOKIE = "bs_session";
export const SESSION_DAYS = 30;

export const DOWNLOAD_TTL_DAYS = 30;
export const DOWNLOAD_MAX = 15;

export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "Project 1",
  producer_name: "Nathaniel Sasu Osei",
  tagline: "Afrobeats, drill & amapiano instrumentals — mixed, mastered, ready.",
  bio: "I'm Nathaniel, a producer and mixing engineer from Accra. For the last eight years I've been building beats for artists across West Africa — from street anthems to late-night R&B. Every beat in this store is mixed and mastered, licensed properly, and delivered to your inbox within seconds of payment.",
  support_email: "beats@nsobeats.example",
  support_phone: "+233 24 000 0000",
  whatsapp: "+233 24 000 0000",
  instagram: "nsobeats",
  twitter: "nsobeats",
  youtube: "@nsobeats",
  tiktok: "nsobeats",
  currency: "GHS",
  bank_name: "Ecobank Ghana",
  bank_account_name: "Nathaniel Sasu Osei",
  bank_account_number: "1441 0000 0000",
  bank_branch: "Accra Main",
  momo_name: "Nathaniel Sasu Osei",
  momo_mtn: "+233 24 000 0000",
  momo_telecel: "+233 20 000 0000",
  momo_at: "+233 27 000 0000",
  pay_instructions:
    "Send the exact amount and use your order reference as the payment reference. Then submit the transaction ID below — beats are released as soon as the payment is confirmed (usually within an hour, same day at the latest).",
  delivery_note:
    "Downloads are emailed to you immediately and also stay available in your artist dashboard for 30 days.",
  announcement: "New pack: 6 fresh Afrobeats + amapiano beats just dropped.",
  // ── Studio bookings ──
  studio_tagline:
    "Recording, mixing and mastering with the producer. Pick a slot, pay the deposit with Mobile Money, and your confirmation is emailed instantly.",
  studio_deposit_percent: "50",
  studio_service_fee_percent: "10",
  studio_policy:
    "Please arrive 10 minutes before your session. The balance is payable at the studio before the session starts. Reschedule at least 24 hours in advance to keep your deposit.",
  hours_sun: "Closed",
  hours_mon: "10:00-20:00",
  hours_tue: "10:00-20:00",
  hours_wed: "10:00-20:00",
  hours_thu: "10:00-20:00",
  hours_fri: "10:00-20:00",
  hours_sat: "12:00-20:00",
};

export const DEMO_ACCOUNTS = {
  admin: { email: "admin@nsobeats.test", password: "Admin123!" },
  artist: { email: "artist@nsobeats.test", password: "Artist123!" },
};
