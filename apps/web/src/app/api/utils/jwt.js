// Central JWT utility — used by all API routes to verify auth
// Supports: Authorization: Bearer <token> header (mobile + web)

const secret =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "production" ? null : "putzo-local-dev-secret");

function base64urlEncode(str) {
  return Buffer.from(str).toString("base64url");
}

function base64urlDecode(str) {
  return Buffer.from(str, "base64url").toString("utf8");
}

async function getKey(usage) {
  if (!secret) {
    throw new Error("AUTH_SECRET must be set in production");
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function signJWT(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(
    JSON.stringify({
      ...payload,
      iat: Date.now(),
      exp: Date.now() + expiresInMs,
    }),
  );

  const key = await getKey("sign");
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${header}.${body}`),
  );
  const signature = Buffer.from(signatureBuffer).toString("base64url");
  return `${header}.${body}.${signature}`;
}

export async function verifyJWT(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const key = await getKey("verify");
    const sigBuffer = Buffer.from(signature, "base64url");
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      new TextEncoder().encode(`${header}.${body}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Call this in every API route to get the current user
// Returns { id, email, role, name } or null if not authenticated
export async function getAuthUser(request) {
  // 1. Check Authorization: Bearer <token> header (mobile + web JS)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyJWT(token);
  }

  // 2. Check putzo_token cookie (web browser fallback)
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/putzo_token=([^;]+)/);
  if (match) {
    return verifyJWT(decodeURIComponent(match[1]));
  }

  return null;
}

export function requireAuth(user, requiredRole = null) {
  if (!user) {
    return new Response(JSON.stringify({ error: "Nicht angemeldet" }), {
      status: 401,
    });
  }
  if (requiredRole && user.role !== requiredRole) {
    return new Response(JSON.stringify({ error: "Keine Berechtigung" }), {
      status: 403,
    });
  }
  return null;
}
