/**
 * Copy pdf.worker.min.mjs from the installed pdfjs-dist version into /public
 * so the browser worker always matches the API used by react-pdf.
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function resolveWorker() {
  // Prefer the pdfjs-dist that react-pdf resolves (same major as API)
  try {
    const pkg = require.resolve("pdfjs-dist/package.json");
    const dir = dirname(pkg);
    const candidates = [
      join(dir, "build", "pdf.worker.min.mjs"),
      join(dir, "legacy", "build", "pdf.worker.min.mjs"),
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
  } catch {
    /* fall through */
  }
  return null;
}

const src = resolveWorker();
if (!src) {
  console.warn("[copy-pdf-worker] pdf.worker.min.mjs not found — skip");
  process.exit(0);
}

const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);

const ver = require("pdfjs-dist/package.json").version;
console.log(`[copy-pdf-worker] pdfjs-dist@${ver} → public/pdf.worker.min.mjs`);
