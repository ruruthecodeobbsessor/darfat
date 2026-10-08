import { authorizeRequest } from "@/lib/auth/server";

export async function GET() {
  const { identity, status } = await authorizeRequest();
  return Response.json(identity ? { authenticated: true } : { authenticated: false }, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
