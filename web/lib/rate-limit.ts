// Minimal fixed-window rate limiter kept in process memory.
//
// On serverless this is per-instance rather than global, so it is a
// best-effort guard against abusive bursts — not a hard quota. It needs no
// external store (Redis etc.), which keeps the app infrastructure-free.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Returns true when the request is allowed, false when the caller has exceeded
 * `limit` requests within `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}
