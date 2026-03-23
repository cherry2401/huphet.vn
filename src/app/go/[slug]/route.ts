import { NextResponse } from "next/server";
import { getTrackingLinkBySlug } from "@/lib/adapters/tracking-adapter";

type Params = Promise<{ slug: string }>;

export async function GET(
  request: Request,
  context: { params: Params },
) {
  const { slug } = await context.params;
  const target = await getTrackingLinkBySlug(slug);

  if (!target) {
    return NextResponse.json(
      { error: "Tracking slug not found", slug },
      { status: 404 },
    );
  }

  let destination: URL;
  try {
    destination = new URL(target.url);
  } catch {
    return NextResponse.json(
      { error: "Tracking URL is invalid", slug },
      { status: 422 },
    );
  }
  destination.searchParams.set("utm_source", target.source);
  destination.searchParams.set("utm_campaign", target.campaign);
  destination.searchParams.set("utm_content", target.placement);

  const referrer = request.headers.get("referer");

  if (referrer) {
    destination.searchParams.set("referrer", referrer);
  }

  return NextResponse.redirect(destination, 302);
}
