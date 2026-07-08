// Rate limiter — async, Redis-backed in production.
//
// In development (or when Upstash env vars are absent) it falls back to an
// in-memory Map. The in-memory store is per-process and resets on cold starts,
// so it MUST NOT be used in production (Vercel serverless).
//
// Production requirement: set UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN in your environment.

interface Entry {
  count:   number
  resetAt: number
}

const store = new Map<string, Entry>()

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number
}

// ── In-memory (dev/fallback) ──────────────────────────────────────────────────

function rateLimitInMemory(
  key:         string,
  maxRequests: number,
  windowMs:    number,
): RateLimitResult {
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// ── Redis-backed (production) ─────────────────────────────────────────────────
// Fixed window: window starts on first request and expires after windowSec.
// Uses INCR + conditional EXPIRE. Not fully atomic — an extremely unlikely
// crash between the two commands could leave a key without TTL. For MVP this
// is acceptable; replace with a Lua script if you need absolute guarantees.

async function rateLimitRedis(
  key:         string,
  maxRequests: number,
  windowMs:    number,
): Promise<RateLimitResult> {
  const { redis } = await import("./redis")
  const redisKey  = `rl:${key}`
  const windowSec = Math.ceil(windowMs / 1000)

  const count = (await redis.incr(redisKey)) as number
  if (count === 1) {
    // First request in window — set the expiry
    await redis.expire(redisKey, windowSec)
  }

  const allowed = count <= maxRequests
  return {
    allowed,
    remaining: Math.max(0, maxRequests - count),
    resetAt:   Date.now() + windowMs, // approximate; real TTL is in Redis
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

const useRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

export async function rateLimit(
  key:         string,
  maxRequests: number,
  windowMs:    number,
): Promise<RateLimitResult> {
  if (useRedis) {
    try {
      return await rateLimitRedis(key, maxRequests, windowMs)
    } catch (err) {
      console.error("[rate-limit] Redis error, falling back to in-memory:", err)
    }
  }
  return rateLimitInMemory(key, maxRequests, windowMs)
}

// ── IP extraction ─────────────────────────────────────────────────────────────
// Prefer x-real-ip (set by Vercel/Cloudflare, not spoofable by the client).
// Fall back to the first entry in x-forwarded-for only if x-real-ip is absent.
// Never trust a full x-forwarded-for chain — it can be prepended by the client.

export function getIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  )
}
