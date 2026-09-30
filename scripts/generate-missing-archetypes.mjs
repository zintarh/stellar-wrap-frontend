#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, parse } from "node:path";
import sharp from "sharp";

const archetypesDir = "public/archetypes";
const ogDir = join(archetypesDir, "og");
const responsiveDir = join(archetypesDir, "responsive");

// Ensure target directories exist
await mkdir(ogDir, { recursive: true });
await mkdir(join(responsiveDir, "64"), { recursive: true });
await mkdir(join(responsiveDir, "128"), { recursive: true });
await mkdir(join(responsiveDir, "256"), { recursive: true });

const missingArchetypes = ["architect", "patron", "collector", "trader"];

for (const baseName of missingArchetypes) {
  const inputPath = join(archetypesDir, `${baseName}.svg`);
  const inputBuffer = await readFile(inputPath);

  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  const maxDim = Math.min(metadata.width || 512, metadata.height || 512, 512);

  // 1. Generate modern format (.webp) at max 512x512
  const webpBuffer = await sharp(inputBuffer)
    .resize({ width: maxDim, height: maxDim, fit: "cover" })
    .webp({ quality: 82, effort: 6 })
    .toBuffer();
  const webpPath = join(archetypesDir, `${baseName}.webp`);
  await writeFile(webpPath, webpBuffer);

  // 2. Generate optimized fallback (.png) at max 512x512
  const pngBuffer = await sharp(inputBuffer)
    .resize({ width: maxDim, height: maxDim, fit: "cover" })
    .png({ quality: 85, compressionLevel: 9, palette: true })
    .toBuffer();
  const pngPath = join(archetypesDir, `${baseName}.png`);
  await writeFile(pngPath, pngBuffer);

  // 3. Generate pre-sized OG asset (200x200 PNG) for OG route
  const ogBuffer = await sharp(inputBuffer)
    .resize({ width: 200, height: 200, fit: "cover" })
    .png({ quality: 85, compressionLevel: 9, palette: true })
    .toBuffer();
  const ogPath = join(ogDir, `${baseName}.png`);
  await writeFile(ogPath, ogBuffer);

  // 4. Generate responsive sizes (64x64, 128x128, 256x256) in webp and png
  for (const size of [64, 128, 256]) {
    const respWebp = await sharp(inputBuffer)
      .resize({ width: size, height: size, fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
    await writeFile(join(responsiveDir, String(size), `${baseName}.webp`), respWebp);

    const respPng = await sharp(inputBuffer)
      .resize({ width: size, height: size, fit: "cover" })
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toBuffer();
    await writeFile(join(responsiveDir, String(size), `${baseName}.png`), respPng);
  }

  console.log(`✅ Generated assets for ${baseName}`);
}

console.log("\n📦 All missing archetype assets generated!");