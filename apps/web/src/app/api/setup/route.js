import argon2 from "argon2";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== "putzo-setup-2024") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const hash = await argon2.hash("MMmm71006&");
  await sql`
    INSERT INTO profiles (email, full_name, role, password_hash)
    VALUES ('adminMeisam@putzo.de', 'Meisam', 'owner', ${hash})
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
  `;
  return Response.json({ success: true });
}
