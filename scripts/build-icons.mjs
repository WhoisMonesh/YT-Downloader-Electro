#!/usr/bin/env node
/**
 * Generates all icon assets from resources/icon.svg.
 *
 * Output:
 *   resources/icon.png            (512x512 master)
 *   resources/icon.ico            (16, 24, 32, 48, 64, 128, 256)
 *   resources/icon.icns           (16, 32, 64, 128, 256, 512, 1024)
 *   resources/icons/{N}x{N}.png   (Linux sizes)
 *
 * Usage: node scripts/build-icons.mjs
 * Requires: sharp, png-to-ico
 */
import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SVG_PATH = join(ROOT, "resources", "icon.svg");
const RES = join(ROOT, "resources");

const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
const LINUX_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

async function renderPng(size) {
  const buf = await sharp(SVG_PATH)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return buf;
}

async function buildIco(buffers) {
  // png-to-ico returns a Promise<Buffer> in modern versions
  return pngToIco(buffers);
}

/**
 * Hand-rolled minimal ICNS writer.
 * Reference: https://en.wikipedia.org/wiki/Apple_Icon_Image_format
 */
function buildIcns(entries) {
  // entries: Array<{ type: string, png: Buffer }>
  const blocks = entries.map(({ type, png }) => {
    const len = png.length + 8;
    return Buffer.concat([Buffer.from(type, "ascii"), Buffer.from([(len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]), png]);
  });
  const body = Buffer.concat(blocks);
  const total = body.length + 8;
  const header = Buffer.concat([
    Buffer.from("icns", "ascii"),
    Buffer.from([(total >> 24) & 0xff, (total >> 16) & 0xff, (total >> 8) & 0xff, total & 0xff]),
  ]);
  return Buffer.concat([header, body]);
}

const ICNS_TYPE_BY_SIZE = {
  16: "icp4",
  32: "icp5",
  64: "icp6",
  128: "ic07",
  256: "ic08",
  512: "ic09",
  1024: "ic10",
};

async function main() {
  console.log("[icons] source:", SVG_PATH);

  // 1. Master PNG (512)
  const master = await renderPng(512);
  await fs.writeFile(join(RES, "icon.png"), master);
  console.log("[icons] wrote icon.png (512)");

  // 2. Linux sizes into resources/icons/
  await ensureDir(join(RES, "icons"));
  for (const s of LINUX_SIZES) {
    const buf = await renderPng(s);
    await fs.writeFile(join(RES, "icons", `${s}x${s}.png`), buf);
  }
  console.log(`[icons] wrote icons/${LINUX_SIZES.map((s) => `${s}x${s}.png`).join(", ")}`);

  // 3. ICO
  const icoPngs = await Promise.all(ICO_SIZES.map((s) => renderPng(s)));
  const ico = await buildIco(icoPngs);
  await fs.writeFile(join(RES, "icon.ico"), ico);
  console.log("[icons] wrote icon.ico");

  // 4. ICNS
  const icnsEntries = [];
  for (const size of Object.keys(ICNS_TYPE_BY_SIZE).map(Number)) {
    const png = await renderPng(size);
    icnsEntries.push({ type: ICNS_TYPE_BY_SIZE[size], png });
  }
  const icns = buildIcns(icnsEntries);
  await fs.writeFile(join(RES, "icon.icns"), icns);
  console.log("[icons] wrote icon.icns");

  console.log("[icons] done");
}

main().catch((err) => {
  console.error("[icons] failed:", err);
  process.exit(1);
});
