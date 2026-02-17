import puppeteer from "puppeteer";
import { readdirSync, mkdirSync, rmSync, unlinkSync } from "fs";
import { resolve, basename } from "path";

const WIDTH = 1270;
const HEIGHT = 760;
const SLIDES_DIR = resolve(import.meta.dirname, "slides");
const OUTPUT_DIR = resolve(import.meta.dirname, "output");

mkdirSync(OUTPUT_DIR, { recursive: true });

async function screenshot(browser, htmlPath, outputName) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
  // Small delay for any CSS transitions / font loading
  await new Promise((r) => setTimeout(r, 500));
  const outputPath = resolve(OUTPUT_DIR, `${outputName}.png`);
  await page.screenshot({ path: outputPath, type: "png" });
  await page.close();
  console.log(`  ✓ ${outputName}.png (${WIDTH}x${HEIGHT} @2x)`);
}

async function main() {
  const slideArg = process.argv.find((a) => a.startsWith("--slide="));
  const specificSlide = slideArg ? slideArg.split("=")[1] : null;

  const files = readdirSync(SLIDES_DIR)
    .filter((f) => f.endsWith(".html"))
    .sort();

  if (specificSlide) {
    const match = files.find((f) => f.includes(specificSlide));
    if (!match) {
      console.error(`No slide matching "${specificSlide}" found.`);
      process.exit(1);
    }
    // Delete just this one output file before regenerating
    const outFile = resolve(OUTPUT_DIR, `${basename(match, ".html")}.png`);
    try { unlinkSync(outFile); } catch {}
    console.log(`Screenshotting: ${match}`);
    const browser = await puppeteer.launch();
    await screenshot(browser, resolve(SLIDES_DIR, match), basename(match, ".html"));
    await browser.close();
  } else {
    // Full run — wipe output directory first
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Screenshotting ${files.length} slides...`);
    const browser = await puppeteer.launch();
    for (const file of files) {
      await screenshot(browser, resolve(SLIDES_DIR, file), basename(file, ".html"));
    }
    await browser.close();
  }

  console.log(`\nDone! Output in: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
