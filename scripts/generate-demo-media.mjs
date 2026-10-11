/**
 * Generates royalty-free demo media for the store so a fresh install looks
 * (and sounds) alive: six instrumentals + preview clips + one promo video.
 *
 * Everything is synthesised locally with ffmpeg — no downloads, no samples,
 * nothing you'd need to clear rights for. Replace these with real uploads from
 * the admin dashboard whenever you're ready.
 *
 *   node scripts/generate-demo-media.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FFMPEG =
  process.env.FFMPEG_PATH ||
  path.join(ROOT, "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg");
const STORAGE = path.join(ROOT, process.env.STORAGE_DIR || "storage");
// Public assets (covers, tagged previews, promo video) ship with the repo so a
// fresh clone has something to look at; the full beat files stay outside the
// public folder and are only served through token-protected download links.
const PUBLIC_DEMO = path.join(ROOT, "public", "demo");
const BEAT_ARCHIVE = path.join(ROOT, "demo-assets", "beats");

const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const A4 = 69;

/** midi offsets from the root, one bar each */
const BEATS = [
  {
    slug: "midnight-in-accra",
    bpm: 102,
    root: 54, // F#
    chords: [
      [0, 3, 7],
      [5, 8, 12],
      [-2, 2, 5],
      [3, 7, 10],
    ],
    melody: [12, 15, 19, 15, 12, 10, 12, 7, 12, 15, 19, 22],
    seconds: 78,
    kickEvery: 0.5,
    snareEvery: 1,
    hatDiv: 4,
    swing: true,
  },
  {
    slug: "kumerica-drums",
    bpm: 142,
    root: 50, // D
    chords: [
      [0, 3, 7],
      [0, 3, 7],
      [-4, 0, 3],
      [-5, -2, 2],
    ],
    melody: [12, 12, 15, 12, 10, 12, 15, 17, 15, 12, 10, 7],
    seconds: 72,
    kickEvery: 0.5,
    snareEvery: 0.5,
    hatDiv: 8,
    swing: false,
  },
  {
    slug: "soft-life",
    bpm: 112,
    root: 57, // A
    chords: [
      [0, 4, 7],
      [-3, 2, 5],
      [-5, 0, 4],
      [-1, 2, 7],
    ],
    melody: [12, 16, 19, 24, 19, 16, 12, 16, 19, 21, 19, 16],
    seconds: 84,
    kickEvery: 0.5,
    snareEvery: 1,
    hatDiv: 4,
    swing: true,
    logDrum: true,
  },
  {
    slug: "odo-love",
    bpm: 96,
    root: 60, // C
    chords: [
      [0, 4, 7],
      [5, 9, 12],
      [7, 11, 14],
      [5, 9, 12],
    ],
    melody: [12, 14, 16, 19, 16, 14, 12, 9, 12, 14, 16, 19],
    seconds: 84,
    kickEvery: 1,
    snareEvery: 1,
    hatDiv: 4,
    swing: true,
    soft: true,
  },
  {
    slug: "trap-pastor",
    bpm: 138,
    root: 55, // G
    chords: [
      [0, 3, 7],
      [0, 3, 7],
      [-2, 1, 5],
      [-2, 1, 5],
    ],
    melody: [12, 15, 10, 15, 12, 19, 15, 10, 12, 15, 22, 19],
    seconds: 72,
    kickEvery: 0.5,
    snareEvery: 0.5,
    hatDiv: 8,
    swing: false,
    dark: true,
  },
  {
    slug: "golden-hour",
    bpm: 105,
    root: 52, // E
    chords: [
      [0, 4, 7],
      [2, 5, 9],
      [4, 7, 11],
      [0, 4, 7],
    ],
    melody: [12, 16, 19, 23, 19, 16, 19, 23, 26, 23, 19, 16],
    seconds: 78,
    kickEvery: 0.5,
    snareEvery: 1,
    hatDiv: 4,
    swing: true,
  },
];

function n(beat, semitone) {
  return freq(A4 + (beat.root - A4 + semitone));
}

function buildFilterGraph(beat) {
  const beatLen = 60 / beat.bpm;
  const bar = beatLen * 4;
  const dur = beat.seconds;

  // ── kick ────────────────────────────────────────────────────
  const kick = `0.85*exp(-13*mod(t,${beat.kickEvery.toFixed(3)}))*sin(2*PI*${(
    48 + (beat.root - 48) * 0.15
  ).toFixed(1)}*t)`;

  // ── snare / clap (noise burst on the backbeat) ───────────────
  const snare = `0.30*exp(-26*mod(t-${(beat.snareEvery / 2).toFixed(3)},${beat.snareEvery.toFixed(
    3
  )}))*random(0)`;

  // ── hats ────────────────────────────────────────────────────
  const hatPeriod = bar / (beat.hatDiv * 2);
  const hatSwing = beat.swing ? `+0.012*sin(2*PI*t*2)` : "";
  const hat = `0.075*exp(-80*mod(t${hatSwing},${hatPeriod.toFixed(4)}))*random(0)`;

  // ── bass: root note per bar ─────────────────────────────────
  const bassParts = beat.chords
    .map((chord, i) => {
      const f = n(beat, chord[0] - 24);
      return `between(t,${(i * bar).toFixed(2)},${((i + 1) * bar).toFixed(2)})*sin(2*PI*${f.toFixed(2)}*t)`;
    })
    .join("+");
  const bass = `0.42*(0.55+0.45*exp(-1.6*mod(t,${bar.toFixed(2)})))*(${bassParts})`;

  // ── pad: triads, held per bar, slow tremolo ─────────────────
  const padParts = beat.chords
    .map((chord, i) => {
      const notes = chord.map((s) => `sin(2*PI*${n(beat, s).toFixed(2)}*t)`).join("+");
      return `between(t,${(i * bar).toFixed(2)},${((i + 1) * bar).toFixed(2)})*(${notes})`;
    })
    .join("+");
  const padGain = beat.dark ? 0.075 : beat.soft ? 0.11 : 0.095;
  const pad = `${padGain}*(0.55+0.45*sin(2*PI*t/${(bar * 2).toFixed(2)}))*(${padParts})`;

  // ── melody: plucked bell line ───────────────────────────────
  const step = bar / 3;
  const melodyParts = beat.melody
    .map((semitone, i) => {
      const start = (i * step).toFixed(2);
      const f = n(beat, semitone);
      return `between(t,${start},${(i * step + step * 1.6).toFixed(2)})*exp(-2.6*(t-${start}))*sin(2*PI*${f.toFixed(
        2
      )}*t)`;
    })
    .join("+");
  const melody = `0.3*(${melodyParts})`;

  // ── log drum (amapiano signature) ───────────────────────────
  const logDrum = beat.logDrum
    ? `0.34*exp(-9*mod(t-0.16,0.5))*sin(2*PI*${n(beat, -12).toFixed(2)}*t)+0.22*exp(-9*mod(t-0.34,0.5))*sin(2*PI*${n(
        beat,
        -5
      ).toFixed(2)}*t)`
    : "0";

  const sources = [
    ["kick", kick],
    ["snare", snare],
    ["hat", hat],
    ["bass", bass],
    ["pad", pad],
    ["melody", melody],
    ["log", logDrum],
  ];

  const inputs = sources.map(
    ([name, expr]) => `-f lavfi -i aevalsrc='${name === "pad" || name === "melody" ? expr : expr}':s=44100:d=${dur}`
  );

  const mixInputs = sources.map((_, i) => `[${i}:a]`).join("");
  const reverb = beat.dark ? "aecho=0.7:0.6:120|260:0.25|0.15" : "aecho=0.8:0.55:90|220:0.22|0.12";

  const filter = `${mixInputs}amix=inputs=${sources.length},volume=2.4,${reverb},highpass=f=35,lowpass=f=15000,acompressor=threshold=0.12:ratio=3:attack=8:release=180,alimiter=limit=0.92,loudnorm=I=-13:TP=-1.2:LRA=9`;

  return { inputs, filter };
}

function synthBeat(beat) {
  const { inputs, filter } = buildFilterGraph(beat);
  const archiveDir = BEAT_ARCHIVE;
  const previewDir = path.join(PUBLIC_DEMO, "previews");
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });

  const fullPath = path.join(archiveDir, `${beat.slug}.mp3`);
  const previewPath = path.join(previewDir, `${beat.slug}.mp3`);
  const args = inputs.join(" ").split(" ");

  execFileSync(
    FFMPEG,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      ...args,
      "-filter_complex",
      filter,
      "-t",
      String(beat.seconds),
      "-c:a",
      "libmp3lame",
      "-b:a",
      "192k",
      "-ar",
      "44100",
      fullPath,
    ],
    { stdio: "inherit" }
  );

  execFileSync(
    FFMPEG,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      fullPath,
      "-t",
      "32",
      "-af",
      "afade=t=in:st=0:d=0.6,afade=t=out:st=30.5:d=1.5,loudnorm=I=-14:TP=-1.5:LRA=9",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      previewPath,
    ],
    { stdio: "inherit" }
  );

  console.log(`  ♪ ${beat.slug}  (${beat.bpm} BPM, ${beat.seconds}s + 32s preview)`);
}

function renderVideo() {
  const videoDir = path.join(PUBLIC_DEMO, "videos");
  fs.mkdirSync(videoDir, { recursive: true });
  const out = path.join(videoDir, "studio-session.mp4");
  const cover = path.join(ROOT, "public", "demo", "covers", "soft-life.jpg");
  const audio = path.join(STORAGE, "beats", "soft-life.mp3");
  const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

  if (!fs.existsSync(cover) || !fs.existsSync(audio)) {
    console.log("  (skipping promo video — cover or audio missing)");
    return;
  }

  const fontArg = fs.existsSync(font) ? `fontfile=${font}:` : "";
  const drawtext = (text, y, size, color) =>
    `drawtext=${fontArg}text='${text}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=${y}`;

  const filter = [
    "scale=1600:1600",
    "zoompan=z='1.06+0.06*sin(on/240)':x='iw/2-(iw/zoom/2)+sin(on/400)*30':y='ih/2-(ih/zoom/2)+cos(on/520)*20':d=1:s=1280x720:fps=30",
    "format=yuv420p",
    drawtext("NSO BEATS", "h*0.16", 46, "0xe23108"),
    drawtext("Soft Life  -  Amapiano  -  112 BPM", "h*0.74", 30, "0xffffff"),
    drawtext("nsobeats.example", "h*0.81", 22, "0xd9d5c8"),
  ].join(",");

  execFileSync(
    FFMPEG,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-loop",
      "1",
      "-i",
      cover,
      "-i",
      audio,
      "-filter_complex",
      `[0:v]${filter}[v]`,
      "-map",
      "[v]",
      "-map",
      "1:a",
      "-t",
      "24",
      "-af",
      "afade=t=out:st=22:d=2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "26",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      out,
    ],
    { stdio: "inherit" }
  );

  console.log("  🎬 studio-session.mp4");
}

/** Copies the demo beat files into the (private) storage folder so the app serves them. */
function publishToStorage() {
  const dest = path.join(STORAGE, "beats");
  fs.mkdirSync(dest, { recursive: true });
  for (const beat of BEATS) {
    const from = path.join(BEAT_ARCHIVE, `${beat.slug}.mp3`);
    const to = path.join(dest, `${beat.slug}.mp3`);
    if (fs.existsSync(from) && !fs.existsSync(to)) fs.copyFileSync(from, to);
  }
}

function findFfmpeg() {
  if (fs.existsSync(FFMPEG)) {
    fs.chmodSync(FFMPEG, 0o755);
    return FFMPEG;
  }
  return "ffmpeg";
}

console.log("Generating demo media with ffmpeg…");
const ffmpegPath = findFfmpeg();
process.env.FFMPEG_PATH = ffmpegPath;
for (const beat of BEATS) synthBeat(beat);
renderVideo();
publishToStorage();
console.log(
  `\nDone.\n  public/demo/       → covers, tagged previews, promo video (public)\n  demo-assets/beats/ → full beat files (served only with a download token)\n  storage/beats/     → copy used by the running app`
);
