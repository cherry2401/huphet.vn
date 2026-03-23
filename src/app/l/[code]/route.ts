import { NextResponse } from "next/server";
import { resolveShortLink } from "@/lib/short-links/store";

type Params = Promise<{ code: string }>;

export async function GET(
  _request: Request,
  context: { params: Params },
) {
  const { code } = await context.params;
  const targetUrl = await resolveShortLink(code);

  if (!targetUrl) {
    return NextResponse.json(
      { ok: false, error: "Short link not found" },
      { status: 404 },
    );
  }

  return NextResponse.redirect(targetUrl, 302);
}

