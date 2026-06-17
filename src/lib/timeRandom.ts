// Time-seeded random utilities for shop & black market refresh

/** Simple mulberry32 PRNG — deterministic from a numeric seed */
export function createRNG(seed: number) {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick N items randomly from array using RNG */
export function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(n, arr.length));
}

/** Random int in [min, max] using RNG */
export function randInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Current shop window seed (changes every 30 min) */
export function getShopSeed(): number {
  return Math.floor(Date.now() / 1800000);
}

/** Current black market window seed (changes every 1 hour) */
export function getMarketSeed(): number {
  return Math.floor(Date.now() / 3600000);
}

/** Time remaining until next window (ms) → formatted string */
export function formatCountdown(windowMs: number): string {
  const now = Date.now();
  const elapsed = now % windowMs;
  const remaining = windowMs - elapsed;
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Time remaining until next window in seconds (for useEffect intervals) */
export function secondsUntilNext(windowMs: number): number {
  return Math.ceil((windowMs - (Date.now() % windowMs)) / 1000);
}
