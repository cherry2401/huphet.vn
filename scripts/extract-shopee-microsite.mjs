import { mkdir, writeFile } from "node:fs/promises";

const pageUrl = process.argv[2] ?? "shopee-sieu-re";

function getHeaders() {
  const headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "vi-VN,vi;q=0.9,en;q=0.8",
    referer: `https://shopee.vn/m/${pageUrl}`,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "x-api-source": "pc",
    "x-requested-with": "XMLHttpRequest",
  };

  if (process.env.SHOPEE_COOKIE) {
    headers.cookie = process.env.SHOPEE_COOKIE;
  }

  return headers;
}

function parseProperties(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getPropertyValue(entries, key) {
  return entries.find((entry) => entry.key === key)?.value ?? null;
}

function dedupe(entries, getKey) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = getKey(entry);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function main() {
  const url = new URL("https://shopee.vn/api/v4/pagebuilder/get_csr_page");
  url.searchParams.set("page_url", pageUrl);
  url.searchParams.set("platform", "4");
  url.searchParams.set("timestamp", "0");

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pagebuilder: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const components = payload.layout?.component_list ?? [];
  const micrositeId = payload.data?.meta?.page_id
    ? Number(payload.data.meta.page_id)
    : null;
  const anchors = [];
  const productCollections = [];
  const voucherCollections = [];
  const flashSales = [];

  for (const component of components) {
    const properties = parseProperties(component.properties);
    const data = getPropertyValue(properties, "data");
    const style = getPropertyValue(properties, "style");
    const componentName = String(getPropertyValue(properties, "_componentName") ?? "");

    if (component.biz_component_id === 71 && Array.isArray(data?.tabs)) {
      for (const tab of data.tabs) {
        anchors.push({
          label: String(tab.display_text ?? ""),
          anchoredComponentIds: Array.isArray(tab.anchored_component_ids)
            ? tab.anchored_component_ids
            : [],
        });
      }
    }

    if (component.biz_component_id === 48 && data) {
      if (typeof data.collection_id === "number") {
        productCollections.push({
          feId: component.fe_id ?? "",
          collectionId: data.collection_id,
          componentName,
          hook: component.be_extend_info?.hook ?? null,
        });
      }

      if (Array.isArray(data.multi_tabs)) {
        for (const tab of data.multi_tabs) {
          if (typeof tab.collection_id === "number") {
            productCollections.push({
              feId: component.fe_id ?? "",
              collectionId: tab.collection_id,
              componentName: String(tab.tab_name ?? componentName),
              hook: component.be_extend_info?.hook ?? null,
            });
          }
        }
      }
    }

    if (component.biz_component_id === 51 && typeof data?.voucher_collection_id === "string") {
      voucherCollections.push({
        componentId: component.id ?? 0,
        feId: component.fe_id ?? "",
        micrositeId,
        voucherCollectionId: data.voucher_collection_id,
        componentName,
        numberOfVouchersPerRow:
          typeof style?.number_of_vouchers_per_row === "number"
            ? style.number_of_vouchers_per_row
            : 1,
        hook: component.be_extend_info?.hook ?? null,
      });
    }

    if (component.biz_component_id === 86) {
      flashSales.push({
        feId: component.fe_id ?? "",
        componentName,
        categoryId:
          typeof data?.flash_sale_session_tab?.global_fs_category_id === "number"
            ? data.flash_sale_session_tab.global_fs_category_id
            : null,
        redirectUrl: typeof style?.redirect_url === "string" ? style.redirect_url : null,
      });
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    pageUrl,
    micrositeId,
    anchors,
    productCollections: dedupe(
      productCollections,
      (entry) => `${entry.collectionId}:${entry.componentName}:${entry.feId}`,
    ),
    voucherCollections: dedupe(
      voucherCollections,
      (entry) => `${entry.voucherCollectionId}:${entry.componentName}:${entry.feId}`,
    ),
    flashSales,
  };

  await mkdir("output/shopee", { recursive: true });
  const outputPath = `output/shopee/microsite-${pageUrl}.json`;
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(output, null, 2));
  console.error(`Saved ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
