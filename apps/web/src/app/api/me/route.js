import sql from "../utils/sql.js";
import { getAuthUser } from "../utils/jwt.js";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  try {
    const profiles =
      await sql`SELECT * FROM profiles WHERE id = ${user.id} LIMIT 1`;
    const profile = profiles[0];
    if (!profile)
      return Response.json({ error: "Profil nicht gefunden" }, { status: 404 });
    return Response.json(profile);
  } catch (err) {
    console.error("me error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
