import argon2 from "argon2";
import sql from "../../utils/sql.js";
import { signJWT } from "../../utils/jwt.js";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "E-Mail und Passwort erforderlich" },
        { status: 400 },
      );
    }

    const profiles = await sql`
      SELECT * FROM profiles
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1
    `;

    const profile = profiles[0];

    if (!profile || !profile.password_hash) {
      return Response.json(
        { error: "Ungültige Zugangsdaten" },
        { status: 401 },
      );
    }

    const valid = await argon2.verify(profile.password_hash, password);
    if (!valid) {
      return Response.json(
        { error: "Ungültige Zugangsdaten" },
        { status: 401 },
      );
    }

    const token = await signJWT({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.full_name,
    });

    const user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.full_name,
    };

    const headers = new Headers();
    // Set cookie for browser-based access (non-HttpOnly so JS can check it exists)
    headers.set(
      "Set-Cookie",
      `putzo_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
    );

    return Response.json({ token, user }, { headers });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Serverfehler beim Login" }, { status: 500 });
  }
}
