import type {
  Deal,
  ShopeeFlashSaleConfig,
  ShopeeMicrositeSummary,
  ShopeeProductCollection,
  ShopeeTabAnchor,
  ShopeeVoucherCollection,
} from "@/lib/types";
import { fetchShopeeJson } from "@/lib/shopee/client";

type PageBuilderResponse = {
  error: number;
  error_msg: string | null;
  data?: {
    meta?: {
      page_id?: string;
    };
    page?: {
      meta?: {
        page_id?: string;
      };
    };
  };
  layout?: {
    component_list?: PageBuilderComponent[];
  };
};

type PageBuilderComponent = {
  id?: number;
  biz_component_id?: number;
  fe_id?: string;
  properties?: string;
  extend_info?: string;
  be_extend_info?: {
    hook?: string;
  };
};

type PropertyEntry = {
  key: string;
  value: unknown;
};

type CollectionItemsResponse = {
  error?: number | null;
  error_msg?: string | null;
  data?: {
    items?: Array<{
      itemid?: number;
      shopid?: number;
      name?: string;
      item_price?: number;
      price?: number;
      price_before_discount?: number;
      raw_discount?: number;
      image?: string;
      item_rating?: {
        rating_star?: number;
      };
      url?: string;
    }>;
  };
};

type CollectionMetaResponse = {
  data?: {
    collection_id: number;
    name: string;
    description: string;
  };
};

function parseProperties(raw: string | undefined): PropertyEntry[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PropertyEntry[]) : [];
  } catch {
    return [];
  }
}

function getPropertyValue<T>(entries: PropertyEntry[], key: string): T | null {
  const found = entries.find((entry) => entry.key === key);
  return (found?.value as T | undefined) ?? null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function safeNumberFromShopeePrice(value: number | undefined) {
  if (!value) {
    return 0;
  }

  if (value > 100000000) {
    return Math.round(value / 100000);
  }

  return Math.round(value);
}

export async function getShopeeMicrositeSummary(
  pageUrl = "shopee-sieu-re",
): Promise<ShopeeMicrositeSummary> {
  const response = await fetchShopeeJson<PageBuilderResponse>("/api/v4/pagebuilder/get_csr_page", {
    query: {
      page_url: pageUrl,
      platform: 4,
      timestamp: 0,
    },
  });

  const components = response.layout?.component_list ?? [];
  const micrositeId = response.data?.meta?.page_id
    ? Number(response.data.meta.page_id)
    : null;
  const anchors: ShopeeTabAnchor[] = [];
  const productCollections: ShopeeProductCollection[] = [];
  const voucherCollections: ShopeeVoucherCollection[] = [];
  const flashSales: ShopeeFlashSaleConfig[] = [];

  for (const component of components) {
    const properties = parseProperties(component.properties);
    const data = getPropertyValue<Record<string, unknown>>(properties, "data");
    const componentName = String(getPropertyValue(properties, "_componentName") ?? "");
    const hook = component.be_extend_info?.hook ?? null;
    const feId = component.fe_id ?? "";

    if (component.biz_component_id === 71 && data?.tabs && Array.isArray(data.tabs)) {
      for (const tab of data.tabs as Array<Record<string, unknown>>) {
        anchors.push({
          label: String(tab.display_text ?? ""),
          anchoredComponentIds: Array.isArray(tab.anchored_component_ids)
            ? (tab.anchored_component_ids as string[])
            : [],
        });
      }
    }

    if (component.biz_component_id === 48 && data) {
      if (typeof data.collection_id === "number") {
        productCollections.push({
          feId,
          componentName,
          collectionId: data.collection_id,
          hook,
        });
      }

      if (Array.isArray(data.multi_tabs)) {
        for (const tab of data.multi_tabs as Array<Record<string, unknown>>) {
          if (typeof tab.collection_id === "number") {
            productCollections.push({
              feId,
              componentName: String(tab.tab_name ?? componentName),
              collectionId: tab.collection_id,
              hook,
            });
          }
        }
      }
    }

    if (component.biz_component_id === 51 && data && typeof data.voucher_collection_id === "string") {
      const style = getPropertyValue<Record<string, unknown>>(properties, "style");
      voucherCollections.push({
        componentId: component.id ?? 0,
        feId,
        micrositeId,
        componentName,
        voucherCollectionId: data.voucher_collection_id,
        numberOfVouchersPerRow:
          typeof style?.number_of_vouchers_per_row === "number"
            ? style.number_of_vouchers_per_row
            : 1,
        hook,
      });
    }

    if (component.biz_component_id === 86 && data) {
      const flashSaleSessionTab =
        (data.flash_sale_session_tab as Record<string, unknown> | undefined) ?? undefined;
      const style = getPropertyValue<Record<string, unknown>>(properties, "style");

      flashSales.push({
        feId,
        componentName,
        categoryId:
          typeof flashSaleSessionTab?.global_fs_category_id === "number"
            ? flashSaleSessionTab.global_fs_category_id
            : null,
        redirectUrl: typeof style?.redirect_url === "string" ? style.redirect_url : null,
      });
    }
  }

  return {
    pageUrl,
    micrositeId,
    anchors,
    productCollections: dedupeById(productCollections, (entry) => `${entry.collectionId}:${entry.componentName}`),
    voucherCollections: dedupeById(
      voucherCollections,
      (entry) => `${entry.componentId}:${entry.voucherCollectionId}:${entry.componentName}`,
    ),
    flashSales,
  };
}

export function buildShopeeVoucherRequestPayload(summary: ShopeeMicrositeSummary) {
  return {
    voucher_collection_request_list: summary.voucherCollections
      .filter((collection) => collection.componentId > 0 && collection.micrositeId)
      .map((collection) => ({
        collection_id: collection.voucherCollectionId,
        component_type: 1,
        component_id: collection.componentId,
        limit: collection.numberOfVouchersPerRow,
        microsite_id: collection.micrositeId,
        offset: 0,
        number_of_vouchers_per_row: collection.numberOfVouchersPerRow,
      })),
  };
}

function dedupeById<T>(entries: T[], getKey: (entry: T) => string) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = getKey(entry);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildOwnAffiliateUrl(productUrl: string | undefined): string | null {
  if (!productUrl) return null;

  const template = process.env.AFFILIATE_LINK_TEMPLATE;
  const affiliateId = process.env.AFFILIATE_ID ?? "";
  const subId1 = process.env.AFFILIATE_SUB_ID1 ?? "huphet";

  if (template && affiliateId) {
    return template
      .replaceAll("{{encodedProductUrl}}", encodeURIComponent(productUrl))
      .replaceAll("{{productUrl}}", productUrl)
      .replaceAll("{{affiliateId}}", affiliateId)
      .replaceAll("{{sub_id1}}", subId1);
  }

  try {
    const url = new URL(productUrl);
    if (affiliateId) {
      url.searchParams.set("mmp_pid", `an_${affiliateId}`);
      url.searchParams.set("utm_source", `an_${affiliateId}`);
    }
    url.searchParams.set("utm_medium", "affiliates");
    url.searchParams.set("utm_content", subId1);
    url.searchParams.set("utm_campaign", "-");
    return url.toString();
  } catch {
    return null;
  }
}

export async function getShopeeCollectionDeals(
  collectionId: number,
  fallbackName?: string,
): Promise<Deal[]> {
  const [metaResponse, itemsResponse] = await Promise.all([
    fetchShopeeJson<CollectionMetaResponse>("/api/v4/collection/get", {
      query: { collection_id: collectionId },
    }),
    fetchShopeeJson<CollectionItemsResponse>("/api/v4/collection/get_items", {
      query: {
        card_set_name: "Microsite ATC Card",
        collection_id: collectionId,
        limit: 12,
        need_customised_item_card: true,
        offset: 0,
        show_collection_info: true,
        source: 1,
      },
    }),
  ]);

  const collectionName = metaResponse.data?.name || fallbackName || `Collection ${collectionId}`;
  const items = itemsResponse.data?.items ?? [];

  return items
    .filter((item) => item.itemid && item.shopid && item.name)
    .map((item) => {
      const salePrice = safeNumberFromShopeePrice(item.item_price ?? item.price);
      const originalPrice = safeNumberFromShopeePrice(item.price_before_discount ?? item.price);
      const discountPercent =
        originalPrice > salePrice && originalPrice > 0
          ? Math.max(0, Math.round(((originalPrice - salePrice) / originalPrice) * 100))
          : 0;
      const slugBase = slugify(item.name ?? `${collectionName}-${item.itemid}`);
      const productPageUrl =
        typeof item.url === "string" && item.url.length > 0
          ? item.url
          : `https://shopee.vn/product/${item.shopid}/${item.itemid}`;
      const ownAffUrl = buildOwnAffiliateUrl(productPageUrl);
      const affiliateUrl = ownAffUrl ?? productPageUrl;

      return {
        id: `shopee-${item.shopid}-${item.itemid}`,
        slug: `${slugBase}-${item.itemid}`,
        title: item.name ?? collectionName,
        category: "tech" as const,
        salePrice,
        originalPrice: originalPrice || salePrice,
        discountPercent,
        badge: collectionName,
        affiliateUrl,
        source: `shopee-collection:${collectionId}`,
        shopId: item.shopid,
        itemId: item.itemid,
        collectionId,
        collectionName,
        imageUrl: item.image
          ? `https://cf.shopee.vn/file/${item.image}`
          : undefined,
        ratingStar: item.item_rating?.rating_star,
        sourceKind: "shopee-collection" as const,
      };
    });
}
