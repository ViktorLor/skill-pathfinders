/**
 * Auto-translate locales/en.json into all target languages via the DeepL API.
 *
 * Usage:
 *   DEEPL_API_KEY=your_key_here bun run translate
 *   # or
 *   DEEPL_API_KEY=your_key_here npx tsx scripts/translate.ts
 *
 * Output: locales/{lang}.json  (one file per target language)
 *
 * DeepL language codes: https://www.deepl.com/docs-api/translate-text/translate-text/
 * Languages NOT supported by DeepL (as of 2026) fall back gracefully with a warning.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOCALES_DIR = resolve(ROOT, "locales");

// Supported languages via DeepL.
// 🚧 Hindi (hi) and Bengali (bn) are work in progress — DeepL doesn't support them yet.
const TARGET_LANGUAGES: Array<{ code: string; deepl: string; name: string }> = [
  { code: "zh", deepl: "ZH-HANS", name: "Chinese (Simplified)" },
  { code: "es", deepl: "ES",      name: "Spanish" },
  { code: "fr", deepl: "FR",      name: "French" },
  { code: "ar", deepl: "AR",      name: "Arabic" },
  { code: "pt", deepl: "PT-BR",   name: "Portuguese (Brazil)" },
  { code: "ru", deepl: "RU",      name: "Russian" },
  { code: "id", deepl: "ID",      name: "Indonesian" },
  { code: "ja", deepl: "JA",      name: "Japanese" },
];

const DEEPL_API_KEY = process.env.DEEPL_API_KEY?.trim();
if (!DEEPL_API_KEY) {
  console.error("❌  DEEPL_API_KEY is missing or empty in your .env file.");
  console.error("    Add:  DEEPL_API_KEY=your_key_here  to .env and re-run.");
  process.exit(1);
}

// 🚧 Hindi (hi) and Bengali (bn) are not yet supported by DeepL.
// WIP: add Google Cloud Translate fallback for these languages.

// Use the free-tier endpoint (api-free.deepl.com) for free API keys,
// and the pro endpoint (api.deepl.com) for paid keys.
const DEEPL_BASE = DEEPL_API_KEY.endsWith(":fx")
  ? "https://api-free.deepl.com/v2"
  : "https://api.deepl.com/v2";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Recursively walk a JSON object and collect all string leaf values
 * together with their dot-path key, preserving structure.
 */
function collectLeaves(obj: unknown, path = ""): Array<{ key: string; value: string }> {
  if (typeof obj === "string") return [{ key: path, value: obj }];
  if (typeof obj !== "object" || obj === null) return [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectLeaves(v, path ? `${path}.${k}` : k),
  );
}

/**
 * Set a nested value on an object via dot-path.
 */
function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in cursor) || typeof cursor[part] !== "object") {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

/**
 * Send up to 50 strings at once to DeepL (their batch limit is higher,
 * but 50 keeps requests small and avoids timeout issues).
 */
async function translateBatch(
  texts: string[],
  targetLang: string,
): Promise<string[]> {
  const body = new URLSearchParams();
  body.set("target_lang", targetLang);
  body.set("source_lang", "EN");
  for (const t of texts) body.append("text", t);

  const res = await fetch(`${DEEPL_BASE}/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepL error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { translations: Array<{ text: string }> };
  return json.translations.map((t) => t.text);
}

const CHUNK_SIZE = 50;

async function translateLocale(
  leaves: Array<{ key: string; value: string }>,
  targetLang: string,
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  const values = leaves.map((l) => l.value);

  for (let i = 0; i < values.length; i += CHUNK_SIZE) {
    const chunk = values.slice(i, i + CHUNK_SIZE);
    const translated = await translateBatch(chunk, targetLang);
    for (let j = 0; j < chunk.length; j++) {
      setPath(result, leaves[i + j].key, translated[j]);
    }
    // Polite rate limiting
    if (i + CHUNK_SIZE < values.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return result;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const source = JSON.parse(readFileSync(resolve(LOCALES_DIR, "en.json"), "utf-8"));
  const leaves = collectLeaves(source);

  console.log(`📖  Source: ${leaves.length} strings to translate.\n`);
  mkdirSync(LOCALES_DIR, { recursive: true });

  console.log("🚧  Hindi (hi) and Bengali (bn): work in progress — skipped (DeepL unsupported).\n");

  for (const lang of TARGET_LANGUAGES) {
    console.log(`🌐  Translating → ${lang.name} (${lang.code})…`);
    try {
      const translated = await translateLocale(leaves, lang.deepl);
      const outPath = resolve(LOCALES_DIR, `${lang.code}.json`);
      writeFileSync(outPath, JSON.stringify(translated, null, 2) + "\n", "utf-8");
      console.log(`✅  Written: locales/${lang.code}.json\n`);
    } catch (err) {
      console.error(`❌  Failed for ${lang.name}: ${err instanceof Error ? err.message : err}\n`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
