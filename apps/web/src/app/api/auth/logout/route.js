export async function POST() {
  const headers = new Headers();
  headers.set("Set-Cookie", "putzo_token=; Path=/; SameSite=Lax; Max-Age=0");
  return Response.json({ success: true }, { headers });
}
