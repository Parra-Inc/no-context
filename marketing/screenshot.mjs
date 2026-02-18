import puppeteer from "puppeteer";
import { readdirSync, readFileSync, mkdirSync, rmSync, unlinkSync } from "fs";
import { resolve, relative, dirname, join } from "path";

const DEFAULT_WIDTH = 1270;
const DEFAULT_HEIGHT = 760;
const ASSETS_DIR = resolve(import.meta.dirname, "assets");
const OUTPUT_DIR = resolve(import.meta.dirname, "output");

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function parseDimensions(htmlPath) {
  const html = readFileSync(htmlPath, "utf-8");
  const widthMatch = html.match(/body\s*\{[^}]*width:\s*(\d+)px/);
  const heightMatch = html.match(/body\s*\{[^}]*height:\s*(\d+)px/);
  return {
    width: widthMatch ? parseInt(widthMatch[1], 10) : DEFAULT_WIDTH,
    height: heightMatch ? parseInt(heightMatch[1], 10) : DEFAULT_HEIGHT,
  };
}

async function screenshot(browser, htmlPath, outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  const { width, height } = parseDimensions(htmlPath);
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
  // Small delay for any CSS transitions / font loading
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: outputPath, type: "png" });
  await page.close();
  const relPath = relative(OUTPUT_DIR, outputPath);
  console.log(`  ✓ ${relPath} (${width}x${height} @2x)`);
}

async function main() {
  const slideArg = process.argv.find((a) => a.startsWith("--slide="));
  const specificSlide = slideArg ? slideArg.split("=")[1] : null;

  const files = findHtmlFiles(ASSETS_DIR);

  if (specificSlide) {
    const match = files.find((f) => f.includes(specificSlide));
    if (!match) {
      console.error(`No asset matching "${specificSlide}" found.`);
      process.exit(1);
    }
    const relPath = relative(ASSETS_DIR, match).replace(/\.html$/, ".png");
    const outFile = resolve(OUTPUT_DIR, relPath);
    try { unlinkSync(outFile); } catch {}
    console.log(`Screenshotting: ${relative(ASSETS_DIR, match)}`);
    const browser = await puppeteer.launch();
    await screenshot(browser, match, outFile);
    await browser.close();
  } else {
    // Full run — wipe output directory first
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Screenshotting ${files.length} assets...`);
    const browser = await puppeteer.launch();
    for (const file of files) {
      const relPath = relative(ASSETS_DIR, file).replace(/\.html$/, ".png");
      const outFile = resolve(OUTPUT_DIR, relPath);
      await screenshot(browser, file, outFile);
    }
    await browser.close();
  }

  console.log(`\nDone! Output in: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
