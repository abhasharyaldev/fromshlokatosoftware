import jwt from "jsonwebtoken"

// Short-lived JWT used ONLY for the Socket.io handshake.
// Issued by the Next.js API route (authed via session cookie), consumed by the
// standalone Socket.io server. Never stored in localStorage — held in memory
// on the client just long enough to establish the connection.

const SECRET = process.env.SOCKET_JWT_SECRET

// Fail loud at import time in any environment — staging and CI included.
// A missing or short secret is always a configuration error, not just in prod.
if (!SECRET || SECRET.length < 32) {
  throw new Error(
    "SOCKET_JWT_SECRET must be set to a value of at least 32 characters. " +
    "Generate one with: openssl rand -hex 32"
  )
}

const key = SECRET

export interface SocketTokenPayload {
  userId:   string
  username: string
}

export function signSocketToken(payload: SocketTokenPayload): string {
  return jwt.sign(payload, key, {
    expiresIn: "60s",
    issuer:    "fsts-auth",
    audience:  "fsts-socket",
  })
}

export function verifySocketToken(token: string): SocketTokenPayload {
  const decoded = jwt.verify(token, key, {
    issuer:   "fsts-auth",
    audience: "fsts-socket",
  }) as jwt.JwtPayload
  if (typeof decoded.userId !== "string" || typeof decoded.username !== "string") {
    throw new Error("Invalid socket token payload")
  }
  return { userId: decoded.userId, username: decoded.username }
}
