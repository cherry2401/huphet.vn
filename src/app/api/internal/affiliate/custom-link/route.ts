import { NextResponse } from "next/server";
import { convertShopeeCustomLinksByGql } from "@/lib/affiliate/custom-link-gql";
import {
  convertShopeeCustomLinks,
  convertShopeeCustomLinksByBrowserGql,
} from "@/lib/affiliate/custom-link-playwright";
import { requireAdmin } from "@/lib/admin/auth";

type ConvertRequestBody = {
  url?: string;
  urls?: string[];
  affiliateId?: string;
  sub_id1?: string;
  sub_id2?: string;
  sub_id3?: string;
  sub_id4?: string;
  sub_id5?: string;
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ConvertRequestBody = {};
  try {
    body = (await request.json()) as ConvertRequestBody;
  } catch {
    body = {};
  }

  const urls = body.urls ?? (body.url ? [body.url] : []);
  const subIds = {
    sub_id1: body.sub_id1,
    sub_id2: body.sub_id2,
    sub_id3: body.sub_id3,
    sub_id4: body.sub_id4,
    sub_id5: body.sub_id5,
  };

  try {
    const mode = process.env.AFFILIATE_CUSTOM_LINK_PROVIDER ?? "browser-gql";
    const gqlFirst = mode === "gql" || mode === "auto";
    const browserGqlFirst = mode === "browser-gql" || mode === "auto";

    if (gqlFirst) {
      const gqlResult = await convertShopeeCustomLinksByGql(urls, subIds);
      if (mode === "gql") {
        return NextResponse.json(gqlResult, { status: gqlResult.ok ? 200 : 500 });
      }

      if (gqlResult.ok && gqlResult.failed.length === 0) {
        return NextResponse.json(gqlResult, { status: 200 });
      }

      if (!gqlResult.ok) {
        const fallbackResult = await convertShopeeCustomLinks({ urls, subIds });
        return NextResponse.json({
          ok: fallbackResult.sessionStatus === "ok",
          links: fallbackResult.links,
          failed: fallbackResult.failed,
          failCodes: gqlResult.failCodes,
          processed: fallbackResult.processed,
          sessionStatus: fallbackResult.sessionStatus,
          error: fallbackResult.error ?? gqlResult.error,
        });
      }

      // Partial GQL failure: fallback only for failed URLs and merge results.
      const fallbackPartial = await convertShopeeCustomLinks({
        urls: gqlResult.failed,
        subIds,
      });
      const mergedLinks = {
        ...gqlResult.links,
        ...fallbackPartial.links,
      };
      const recovered = new Set(Object.keys(fallbackPartial.links));
      const mergedFailed = gqlResult.failed.filter((url) => !recovered.has(url));
      return NextResponse.json({
        ok: mergedFailed.length === 0,
        links: mergedLinks,
        failed: mergedFailed,
        failCodes: gqlResult.failCodes,
        processed: gqlResult.processed,
        sessionStatus: fallbackPartial.sessionStatus ?? gqlResult.sessionStatus,
        error:
          mergedFailed.length > 0
            ? fallbackPartial.error ?? gqlResult.error
            : null,
      });
    }

    if (browserGqlFirst) {
      const browserGql = await convertShopeeCustomLinksByBrowserGql({ urls, subIds });
      if (mode === "browser-gql" || browserGql.ok || browserGql.failed.length === 0) {
        return NextResponse.json(browserGql, { status: browserGql.ok ? 200 : 500 });
      }
    }

    const result = await convertShopeeCustomLinks({ urls, subIds });

    return NextResponse.json({
      ok: result.sessionStatus === "ok",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Custom link conversion failed",
      },
      { status: 500 },
    );
  }
}
