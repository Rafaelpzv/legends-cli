import fs from "fs";
import path from "path";
import os from "os";

const CACHE_DIR = path.join(os.tmpdir(), "legends-cli-cache");
const TTL_MS = 5 * 60 * 1000; // 5 minutes default

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function ensureDir(): void {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function keyToFile(key: string): string {
  const safe = key.replace(/[^a-z0-9_\-]/gi, "_").toLowerCase();
  return path.join(CACHE_DIR, `${safe}.json`);
}

export function cacheGet<T>(key: string): T | null {
  try {
    const file = keyToFile(key);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      fs.unlinkSync(file);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs = TTL_MS): void {
  try {
    ensureDir();
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
    fs.writeFileSync(keyToFile(key), JSON.stringify(entry));
  } catch {
    // cache is optional – never crash on failure
  }
}

export function cacheClear(): void {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach((f) => fs.unlinkSync(path.join(CACHE_DIR, f)));
    }
  } catch {
    /* silent */
  }
}

/** Wrap any async function with automatic cache */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = TTL_MS,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const result = await fn();
  cacheSet(key, result, ttlMs);
  return result;
}
