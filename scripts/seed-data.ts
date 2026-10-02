/**
 * Demo content definitions used by scripts/setup.ts.
 * Media filenames line up with what scripts/generate-demo-media.mjs produces.
 */

export type DemoBeat = {
  slug: string;
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  musicalKey: string;
  duration: number;
  plays: number;
  featured?: boolean;
  tags: string;
  description: string;
  cover: string;
  audio: string;
  prices: Record<"basic" | "premium" | "exclusive", number>;
};

export const DEMO_BEATS: DemoBeat[] = [
  {
    slug: "midnight-in-accra",
    title: "Midnight in Accra",
    genre: "Afrobeats",
    mood: "Bouncy",
    bpm: 102,
    musicalKey: "F# min",
    duration: 78,
    plays: 1840,
    featured: true,
    tags: "afrobeats, accra, night drive, groovy, dance",
    description:
      "Late-night Afrobeats with a rolling bassline, airy keys and a guitar lick that sits right behind the vocal. Built for a summer hook — leave the top end open for your engineer.",
    cover: "midnight-in-accra.jpg",
    audio: "midnight-in-accra.mp3",
    prices: { basic: 12000, premium: 25000, exclusive: 120000 },
  },
  {
    slug: "kumerica-drums",
    title: "Kumerica Drums",
    genre: "Afro-drill",
    mood: "Street",
    bpm: 142,
    musicalKey: "D min",
    duration: 72,
    plays: 1320,
    featured: true,
    tags: "drill, kumerica, asakaa, street, hard",
    description:
      "Asakaa-flavoured drill: sliding 808s, talking-drum fills and a snare that cuts through on phone speakers. Perfect for a hard verse, cameo-ready.",
    cover: "kumerica-drums.jpg",
    audio: "kumerica-drums.mp3",
    prices: { basic: 10000, premium: 22000, exclusive: 100000 },
  },
  {
    slug: "soft-life",
    title: "Soft Life",
    genre: "Amapiano",
    mood: "Chill",
    bpm: 112,
    musicalKey: "A min",
    duration: 84,
    plays: 2260,
    featured: true,
    tags: "amapiano, log drum, soft life, lounge, smooth",
    description:
      "The log drum does the talking. Deep amapiano groove with warm pads and a shaker pattern that keeps the pocket loose. Great for a smooth brag-rap or a soul vocal.",
    cover: "soft-life.jpg",
    audio: "soft-life.mp3",
    prices: { basic: 12000, premium: 25000, exclusive: 150000 },
  },
  {
    slug: "odo-love",
    title: "Odo",
    genre: "Highlife",
    mood: "Romantic",
    bpm: 96,
    musicalKey: "C maj",
    duration: 84,
    plays: 980,
    tags: "highlife, love, odo, rnb, wedding, acoustic",
    description:
      "Highlife guitar, soft keys and a gentle kick — proper 'odo' energy for a love record, a wedding first dance, or the slow part of your EP.",
    cover: "odo-love.jpg",
    audio: "odo-love.mp3",
    prices: { basic: 10000, premium: 20000, exclusive: 90000 },
  },
  {
    slug: "trap-pastor",
    title: "Trap Pastor",
    genre: "Trap",
    mood: "Dark",
    bpm: 138,
    musicalKey: "G min",
    duration: 72,
    plays: 1510,
    tags: "trap, dark, organ, cinematic, hard, 808",
    description:
      "Church organ meets dark trap. Heavy 808 slides, eerie bells and a cathedral reverb — for the introspective, dangerous verse.",
    cover: "trap-pastor.jpg",
    audio: "trap-pastor.mp3",
    prices: { basic: 12000, premium: 25000, exclusive: 130000 },
  },
  {
    slug: "golden-hour",
    title: "Golden Hour",
    genre: "Afrobeats",
    mood: "Uplifting",
    bpm: 105,
    musicalKey: "E maj",
    duration: 78,
    plays: 1130,
    tags: "afro fusion, pop, uplifting, radio, summer, happy",
    description:
      "Radio-ready Afro-fusion with bright plucks, a wide chorus and a bassline that lifts the whole record. Made for the chorus you can't unhear.",
    cover: "golden-hour.jpg",
    audio: "golden-hour.mp3",
    prices: { basic: 12000, premium: 25000, exclusive: 140000 },
  },
];

export const DEMO_VIDEO = {
  title: "Studio session — Soft Life (behind the beat)",
  description:
    "A quick look at how Soft Life came together: the log drum pattern, the pad stack and the mix chain I use on every beat in the store.",
  file: "studio-session.mp4",
  thumbnail: "soft-life.jpg",
};

export const DEMO_MESSAGES = [
  {
    name: "Kwame Bright",
    email: "kwame.bright@example.com",
    subject: "Need a custom Afrobeats beat for my EP",
    topic: "custom-beat",
    body: "Yo! I'm dropping a 5-track EP in December and I need two custom Afrobeats joints in the Midnight in Accra lane. Budget is flexible — what's your turnaround and do you include mixing?",
  },
  {
    name: "Ama Serwaa",
    email: "ama.serwaa@example.com",
    subject: "Question about the exclusive licence",
    topic: "licence",
    body: "Hi Nathaniel, if I buy the exclusive licence for Soft Life, does the beat get removed from the store immediately? Also do I get the stems for a proper mix?",
  },
];
