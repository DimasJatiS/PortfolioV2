// Synthesises the site's sound design from code, so every sample is original
// and there is no third-party licence to track (PRD 7.3, F-18).
//
//   public/audio/ambient.m4a      calm pad, written as a seamless loop
//   public/audio/glass-click.m4a  short glass "tink" for clicks
//   public/audio/glass-hover.m4a  softer, higher tick for hover
//
// Usage: `pnpm audio` (add `--wav` to keep the uncompressed masters as well).
//
// Encoding uses `afconvert` (ships with macOS) or `ffmpeg` if that is on PATH.
// The files are committed, so nobody needs either tool to build the site.
//
// Looping the ambient track: AAC adds a few milliseconds of encoder padding, so
// looping the whole file can leave an audible gap. The pad is strictly periodic
// with period LOOP_SECONDS and the file carries one extra second on each side of
// that, so loop a region inside the file instead of the file itself. The exact
// values are printed at the end and exported from `lib/audio-manifest.json`.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/audio");
const MANIFEST = path.join(ROOT, "lib/audio-manifest.json");
const KEEP_WAV = process.argv.includes("--wav");

const SAMPLE_RATE = 44_100;
const LOOP_SECONDS = 16;
/** Extra periodic material before and after the loop region. */
const LOOP_PAD_SECONDS = 1;
/** PRD 9.1: all audio together stays under 300 KB. */
const BUDGET_BYTES = 300 * 1024;

const TAU = Math.PI * 2;
const dbToGain = (db) => 10 ** (db / 20);

/** Small deterministic PRNG, so re-running the script reproduces the same files. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* Ambient pad                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A D major add9 pad without a hard attack anywhere: light is steady, not
 * rhythmic. Every oscillator and every LFO completes a whole number of cycles
 * in LOOP_SECONDS, which is what makes the result loop without a seam.
 */
function renderAmbient() {
  const period = LOOP_SECONDS * SAMPLE_RATE;
  const random = mulberry32(20261112);
  /** Snap a frequency to the nearest one that is periodic over the loop. */
  const snap = (hz) => Math.max(1, Math.round(hz * LOOP_SECONDS)) / LOOP_SECONDS;

  // [note frequency, level in dB, LFO cycles per loop]
  const voices = [
    [73.42, -11, 1], // D2
    [110.0, -12, 2], // A2
    [146.83, -12, 1], // D3
    [220.0, -15, 3], // A3
    [329.63, -19, 2], // E4 (the ninth)
    [369.99, -21, 3], // F#4
    [587.33, -27, 5], // D5, a faint shimmer
  ];

  const left = new Float64Array(period);
  const right = new Float64Array(period);

  for (const [hz, db, lfoCycles] of voices) {
    const gain = dbToGain(db);
    // Two slightly detuned partials per channel beat slowly against each other.
    const detune = 0.1875 + random() * 0.25;
    const fLeft = [snap(hz - detune), snap(hz + detune * 0.5)];
    const fRight = [snap(hz + detune), snap(hz - detune * 0.5)];
    const lfoPhase = random() * TAU;
    const phases = [random() * TAU, random() * TAU, random() * TAU, random() * TAU];

    for (let i = 0; i < period; i++) {
      const t = i / SAMPLE_RATE;
      // Swell between 35% and 100%.
      const swell =
        0.675 + 0.325 * Math.sin((TAU * lfoCycles * t) / LOOP_SECONDS + lfoPhase);
      const voice = (f, p) =>
        Math.sin(TAU * f * t + p) + 0.12 * Math.sin(TAU * 2 * f * t + p * 1.7);
      left[i] +=
        gain * swell * 0.5 * (voice(fLeft[0], phases[0]) + voice(fLeft[1], phases[1]));
      right[i] +=
        gain * swell * 0.5 * (voice(fRight[0], phases[2]) + voice(fRight[1], phases[3]));
    }
  }

  // "Air": band-limited noise, filtered circularly so that it is periodic too.
  for (const channel of [left, right]) {
    const noise = new Float64Array(period);
    for (let i = 0; i < period; i++) noise[i] = random() * 2 - 1;
    const air = circularBandpass(noise, 350, 1400);
    const phase = random() * TAU;
    const gain = dbToGain(-33);
    for (let i = 0; i < period; i++) {
      const t = i / SAMPLE_RATE;
      const breath = 0.6 + 0.4 * Math.sin((TAU * 2 * t) / LOOP_SECONDS + phase);
      channel[i] += gain * breath * air[i];
    }
  }

  normalise([left, right], -10);

  // Lay the period out as: [last second][full loop][first second].
  const pad = LOOP_PAD_SECONDS * SAMPLE_RATE;
  const total = period + pad * 2;
  const wrap = (source) => {
    const out = new Float64Array(total);
    for (let i = 0; i < total; i++) out[i] = source[(i - pad + period * 2) % period];
    // Only the very first and last 30 ms are faded, to avoid a click when the
    // file is started or stopped outside the loop region.
    const edge = Math.round(0.03 * SAMPLE_RATE);
    for (let i = 0; i < edge; i++) {
      const g = i / edge;
      out[i] *= g;
      out[total - 1 - i] *= g;
    }
    return out;
  };
  return [wrap(left), wrap(right)];
}

/** One-pole high-pass followed by one-pole low-pass, run around the buffer twice. */
function circularBandpass(input, lowHz, highHz) {
  const n = input.length;
  const out = new Float64Array(n);
  const aLow = 1 - Math.exp((-TAU * highHz) / SAMPLE_RATE);
  const aHigh = 1 - Math.exp((-TAU * lowHz) / SAMPLE_RATE);
  let low = 0;
  let slow = 0;
  // The first lap only settles the filter state; the second lap is kept.
  for (let lap = 0; lap < 2; lap++) {
    for (let i = 0; i < n; i++) {
      low += aLow * (input[i] - low);
      slow += aHigh * (low - slow);
      out[i] = low - slow;
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Glass one-shots                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A struck-glass tone: a few inharmonic partials (ratios close to the bending
 * modes of a thin plate) with fast exponential decays, plus a 2 ms noise
 * transient for the contact itself.
 */
function renderGlass({ seconds, baseHz, partials, transientDb, peakDb, seed }) {
  const n = Math.round(seconds * SAMPLE_RATE);
  const random = mulberry32(seed);
  const left = new Float64Array(n);
  const right = new Float64Array(n);

  for (const [ratio, db, decay] of partials) {
    const hz = baseHz * ratio;
    const gain = dbToGain(db);
    const phase = random() * TAU;
    // A hair of stereo spread: each partial leans slightly to one side.
    const pan = 0.5 + (random() - 0.5) * 0.5;
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const sample = gain * Math.exp(-t / decay) * Math.sin(TAU * hz * t + phase);
      left[i] += sample * Math.cos((pan * Math.PI) / 2);
      right[i] += sample * Math.sin((pan * Math.PI) / 2);
    }
  }

  const transient = Math.round(0.002 * SAMPLE_RATE);
  const transientGain = dbToGain(transientDb);
  for (let i = 0; i < transient; i++) {
    const shape = 1 - i / transient;
    const sample = transientGain * shape * shape * (random() * 2 - 1);
    left[i] += sample;
    right[i] += sample;
  }

  // 0.5 ms attack and a short release, so the sample starts and ends at zero.
  const attack = Math.round(0.0005 * SAMPLE_RATE);
  const release = Math.round(0.02 * SAMPLE_RATE);
  for (const channel of [left, right]) {
    for (let i = 0; i < attack; i++) channel[i] *= i / attack;
    for (let i = 0; i < release; i++) channel[n - 1 - i] *= i / release;
  }

  normalise([left, right], peakDb);
  return [left, right];
}

/* -------------------------------------------------------------------------- */
/* Output                                                                      */
/* -------------------------------------------------------------------------- */

function normalise(channels, peakDb) {
  let peak = 0;
  for (const channel of channels) {
    for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  }
  const gain = peak > 0 ? dbToGain(peakDb) / peak : 1;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i++) channel[i] *= gain;
  }
}

/** 16-bit PCM stereo WAV with triangular dither. */
function encodeWav([left, right]) {
  const frames = left.length;
  const dataBytes = frames * 4;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(2, 22); // stereo
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);

  const random = mulberry32(7);
  const toInt = (sample) => {
    const dithered = sample * 32767 + (random() - random());
    return Math.max(-32768, Math.min(32767, Math.round(dithered)));
  };
  for (let i = 0; i < frames; i++) {
    buffer.writeInt16LE(toInt(left[i]), 44 + i * 4);
    buffer.writeInt16LE(toInt(right[i]), 46 + i * 4);
  }
  return buffer;
}

/** True when the binary exists; its exit code for the probe arguments is irrelevant. */
function hasCommand(command, args) {
  try {
    execFileSync(command, args, { stdio: "ignore" });
    return true;
  } catch (error) {
    return error?.code !== "ENOENT";
  }
}

function encodeAac(wavPath, m4aPath, bitrate) {
  if (hasCommand("afconvert", ["-h"])) {
    execFileSync("afconvert", [
      "-f",
      "m4af",
      "-d",
      "aac",
      "-b",
      String(bitrate),
      "-q",
      "127",
      wavPath,
      m4aPath,
    ]);
    return;
  }
  if (hasCommand("ffmpeg", ["-version"])) {
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      wavPath,
      "-c:a",
      "aac",
      "-b:a",
      String(bitrate),
      m4aPath,
    ]);
    return;
  }
  throw new Error(
    "No AAC encoder found. Run this on macOS (afconvert) or install ffmpeg; the WAV masters were kept.",
  );
}

const SOUNDS = [
  { name: "ambient", bitrate: 96_000, render: renderAmbient },
  {
    name: "glass-click",
    bitrate: 128_000,
    render: () =>
      renderGlass({
        seconds: 0.5,
        baseHz: 1870,
        // [frequency ratio, level dB, decay seconds]
        partials: [
          [1, 0, 0.11],
          [1.594, -5, 0.075],
          [2.136, -9, 0.06],
          [2.653, -11, 0.045],
          [3.731, -15, 0.03],
          [5.02, -20, 0.018],
        ],
        transientDb: -10,
        peakDb: -6,
        seed: 11,
      }),
  },
  {
    name: "glass-hover",
    bitrate: 128_000,
    render: () =>
      renderGlass({
        seconds: 0.28,
        baseHz: 2794,
        partials: [
          [1, 0, 0.05],
          [1.594, -8, 0.032],
          [2.653, -15, 0.02],
        ],
        transientDb: -24,
        peakDb: -14,
        seed: 23,
      }),
  },
];

mkdirSync(OUT_DIR, { recursive: true });

let totalBytes = 0;
const manifest = {};
for (const sound of SOUNDS) {
  const channels = sound.render();
  const wavPath = path.join(OUT_DIR, `${sound.name}.wav`);
  const m4aPath = path.join(OUT_DIR, `${sound.name}.m4a`);
  writeFileSync(wavPath, encodeWav(channels));
  encodeAac(wavPath, m4aPath, sound.bitrate);
  if (!KEEP_WAV) rmSync(wavPath);

  const bytes = statSync(m4aPath).size;
  totalBytes += bytes;
  const seconds = channels[0].length / SAMPLE_RATE;
  manifest[sound.name] = {
    src: `/audio/${sound.name}.m4a`,
    durationMs: Math.round(seconds * 1000),
    bytes,
  };
  console.info(
    `[audio] ${sound.name}.m4a  ${seconds.toFixed(2)} s  ${(bytes / 1024).toFixed(1)} KB`,
  );
}

// Howler sprite format: [offset ms, duration ms, loop].
manifest.ambient.loop = [LOOP_PAD_SECONDS * 1000, LOOP_SECONDS * 1000, true];
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.info(
  `[audio] total ${(totalBytes / 1024).toFixed(1)} KB of ${BUDGET_BYTES / 1024} KB`,
);
console.info(
  `[audio] ambient loop region: start ${LOOP_PAD_SECONDS * 1000} ms, length ${LOOP_SECONDS * 1000} ms`,
);
if (totalBytes > BUDGET_BYTES) {
  console.error(
    "[audio] over the 300 KB budget (PRD 9.1) — lower the bitrate or loop length.",
  );
  process.exit(1);
}
