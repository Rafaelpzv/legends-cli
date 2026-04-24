"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheClear = cacheClear;
exports.withCache = withCache;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CACHE_DIR = path_1.default.join(os_1.default.tmpdir(), "legends-cli-cache");
const TTL_MS = 5 * 60 * 1000; // 5 minutes default
function ensureDir() {
    if (!fs_1.default.existsSync(CACHE_DIR))
        fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
}
function keyToFile(key) {
    const safe = key.replace(/[^a-z0-9_\-]/gi, "_").toLowerCase();
    return path_1.default.join(CACHE_DIR, `${safe}.json`);
}
function cacheGet(key) {
    try {
        const file = keyToFile(key);
        if (!fs_1.default.existsSync(file))
            return null;
        const raw = fs_1.default.readFileSync(file, "utf-8");
        const entry = JSON.parse(raw);
        if (Date.now() > entry.expiresAt) {
            fs_1.default.unlinkSync(file);
            return null;
        }
        return entry.data;
    }
    catch {
        return null;
    }
}
function cacheSet(key, data, ttlMs = TTL_MS) {
    try {
        ensureDir();
        const entry = { data, expiresAt: Date.now() + ttlMs };
        fs_1.default.writeFileSync(keyToFile(key), JSON.stringify(entry));
    }
    catch {
        // cache is optional – never crash on failure
    }
}
function cacheClear() {
    try {
        if (fs_1.default.existsSync(CACHE_DIR)) {
            const files = fs_1.default.readdirSync(CACHE_DIR);
            files.forEach((f) => fs_1.default.unlinkSync(path_1.default.join(CACHE_DIR, f)));
        }
    }
    catch {
        /* silent */
    }
}
/** Wrap any async function with automatic cache */
async function withCache(key, fn, ttlMs = TTL_MS) {
    const hit = cacheGet(key);
    if (hit !== null)
        return hit;
    const result = await fn();
    cacheSet(key, result, ttlMs);
    return result;
}
