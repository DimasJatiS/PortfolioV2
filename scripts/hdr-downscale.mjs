#!/usr/bin/env node
/**
 * Downscale a Radiance .hdr (RGBE) environment map by an integer factor.
 *
 *   node scripts/hdr-downscale.mjs <input.hdr> <output.hdr> [factor=2]
 *
 * Poly Haven's smallest download is 1k (about 1.7 MB). An environment that is
 * only used for lighting and soft reflections does not need that, and the 3D
 * asset budget is 2.5 MB in total (PRD 9.1). Pixels are averaged in linear
 * light, then written back as run-length encoded RGBE.
 */
import { readFile, writeFile } from "node:fs/promises";

const [input, output, factorArg = "2"] = process.argv.slice(2);
const factor = Number.parseInt(factorArg, 10);

if (!input || !output || !Number.isInteger(factor) || factor < 1) {
  console.error(
    "Usage: node scripts/hdr-downscale.mjs <input.hdr> <output.hdr> [factor=2]",
  );
  process.exit(1);
}

function parseHeader(buffer) {
  let offset = 0;
  const lines = [];
  for (;;) {
    const end = buffer.indexOf(0x0a, offset);
    if (end === -1) throw new Error("Unexpected end of file while reading the header.");
    const line = buffer.subarray(offset, end).toString("latin1");
    offset = end + 1;
    lines.push(line);
    if (/^[-+][YX] \d+ [-+][YX] \d+$/.test(line)) break;
    if (lines.length > 64)
      throw new Error("Header is too long; is this a Radiance file?");
  }
  if (!lines[0]?.startsWith("#?"))
    throw new Error("Missing Radiance signature (#?RADIANCE).");
  if (!lines.some((line) => line === "FORMAT=32-bit_rle_rgbe")) {
    throw new Error("Only FORMAT=32-bit_rle_rgbe is supported.");
  }
  const size = /^-Y (\d+) \+X (\d+)$/.exec(lines.at(-1) ?? "");
  if (!size) throw new Error("Only the standard -Y <h> +X <w> orientation is supported.");
  return { height: Number(size[1]), width: Number(size[2]), dataOffset: offset };
}

/** Decode new-style RLE scanlines into a flat RGBE byte array. */
function decodeRle(buffer, offset, width, height) {
  const out = new Uint8Array(width * height * 4);
  const scanline = new Uint8Array(width * 4);
  let pos = offset;
  for (let y = 0; y < height; y++) {
    if (buffer[pos] !== 2 || buffer[pos + 1] !== 2 || buffer[pos + 2] & 0x80) {
      throw new Error("Unsupported scanline encoding (expected new-style RLE).");
    }
    if (((buffer[pos + 2] << 8) | buffer[pos + 3]) !== width) {
      throw new Error("Scanline width does not match the header.");
    }
    pos += 4;
    for (let channel = 0; channel < 4; channel++) {
      let x = 0;
      while (x < width) {
        let count = buffer[pos++];
        if (count > 128) {
          count -= 128;
          const value = buffer[pos++];
          if (x + count > width) throw new Error("Corrupt RLE run.");
          scanline.fill(value, channel * width + x, channel * width + x + count);
        } else {
          if (count === 0 || x + count > width) throw new Error("Corrupt RLE literal.");
          scanline.set(buffer.subarray(pos, pos + count), channel * width + x);
          pos += count;
        }
        x += count;
      }
    }
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      out[i] = scanline[x];
      out[i + 1] = scanline[width + x];
      out[i + 2] = scanline[2 * width + x];
      out[i + 3] = scanline[3 * width + x];
    }
  }
  return out;
}

function downscale(rgbe, width, height, k) {
  const w = Math.floor(width / k);
  const h = Math.floor(height / k);
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let dy = 0; dy < k; dy++) {
        for (let dx = 0; dx < k; dx++) {
          const i = ((y * k + dy) * width + (x * k + dx)) * 4;
          const e = rgbe[i + 3];
          if (e === 0) continue;
          const scale = 2 ** (e - 136);
          r += rgbe[i] * scale;
          g += rgbe[i + 1] * scale;
          b += rgbe[i + 2] * scale;
        }
      }
      const n = k * k;
      r /= n;
      g /= n;
      b /= n;
      const max = Math.max(r, g, b);
      const o = (y * w + x) * 4;
      if (max < 1e-32) continue;
      let e = Math.ceil(Math.log2(max));
      // The mantissa must fit in a byte after rounding.
      if (max / 2 ** e >= 255.5 / 256) e += 1;
      const scale = 256 / 2 ** e;
      out[o] = Math.min(255, Math.round(r * scale));
      out[o + 1] = Math.min(255, Math.round(g * scale));
      out[o + 2] = Math.min(255, Math.round(b * scale));
      out[o + 3] = e + 128;
    }
  }
  return { data: out, width: w, height: h };
}

/** Encode one channel of a scanline: runs of 3+ equal bytes, literals otherwise. */
function encodeChannel(bytes, chunks) {
  const n = bytes.length;
  let i = 0;
  while (i < n) {
    let run = 1;
    while (i + run < n && run < 127 && bytes[i + run] === bytes[i]) run++;
    if (run >= 3) {
      chunks.push(Uint8Array.of(128 + run, bytes[i]));
      i += run;
      continue;
    }
    const start = i;
    while (i < n && i - start < 128) {
      let ahead = 1;
      while (i + ahead < n && ahead < 3 && bytes[i + ahead] === bytes[i]) ahead++;
      if (ahead >= 3) break;
      i++;
    }
    chunks.push(Uint8Array.of(i - start), bytes.subarray(start, i));
  }
}

function encode(rgbe, width, height) {
  if (width < 8 || width > 0x7fff)
    throw new Error("Output width is outside the RLE range.");
  const chunks = [
    Buffer.from(
      `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`,
      "latin1",
    ),
  ];
  const channel = new Uint8Array(width);
  for (let y = 0; y < height; y++) {
    chunks.push(Uint8Array.of(2, 2, width >> 8, width & 0xff));
    for (let c = 0; c < 4; c++) {
      for (let x = 0; x < width; x++) channel[x] = rgbe[(y * width + x) * 4 + c];
      encodeChannel(channel.slice(), chunks);
    }
  }
  return Buffer.concat(chunks);
}

try {
  const source = await readFile(input);
  const header = parseHeader(source);
  const pixels = decodeRle(source, header.dataOffset, header.width, header.height);
  const scaled = downscale(pixels, header.width, header.height, factor);
  const encoded = encode(scaled.data, scaled.width, scaled.height);

  // Round-trip the result to prove the file we are about to ship is readable.
  const check = parseHeader(encoded);
  decodeRle(encoded, check.dataOffset, check.width, check.height);

  await writeFile(output, encoded);
  console.info(
    `[hdri] ${header.width}x${header.height} (${(source.length / 1024).toFixed(0)} KB) -> ` +
      `${scaled.width}x${scaled.height} (${(encoded.length / 1024).toFixed(0)} KB): ${output}`,
  );
} catch (error) {
  console.error(`[hdri] ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
