# Data Contract

## Muc tieu

Chot mot shape du lieu on dinh giua:

- worker Playwright tren VPS
- Supabase `site_cache`
- frontend/public pages

Frontend khong duoc doc raw payload tu Shopee. Tat ca phai di qua shape duoi day.

## Cache rows trong Supabase

Bang: `site_cache`

### `kind = "microsite"`

`cache_key`:

```txt
microsite:{pageUrl}
```

`payload` co shape:

```ts
type ShopeeMicrositeSummary = {
  pageUrl: string;
  micrositeId: number | null;
  anchors: Array<{
    label: string;
    anchoredComponentIds: string[];
  }>;
  productCollections: Array<{
    feId: string;
    componentName: string;
    collectionId: number;
    hook: string | null;
  }>;
  voucherCollections: Array<{
    componentId: number;
    feId: string;
    micrositeId: number | null;
    componentName: string;
    voucherCollectionId: string;
    numberOfVouchersPerRow: number;
    hook: string | null;
  }>;
  flashSales: Array<{
    feId: string;
    componentName: string;
    categoryId: number | null;
    redirectUrl: string | null;
  }>;
};
```

### `kind = "deals"` latest aggregate

`cache_key`:

```txt
deals:{pageUrl}
```

`payload` co shape:

```ts
type Deal[] = Array<{
  id: string;
  slug: string;
  title: string;
  category: "beauty" | "fashion" | "home" | "tech";
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
  badge: string;
  affiliateUrl: string;
  source: string;
  imageUrl?: string;
  shopId?: number;
  itemId?: number;
  collectionId?: number;
  collectionName?: string;
  ratingStar?: number;
  sourceKind?: "mock-feed" | "shopee-collection" | "browser-worker" | "voucher-grid" | "anchor";
}>;
```

### `kind = "deals"` snapshot theo slot

`cache_key`:

```txt
deals:{pageUrl}:{slot}
```

`slot` la mot trong:

- `0000`
- `0900`
- `1200`
- `1500`
- `2000`

`payload` van la `Deal[]`, nhung day la danh sach deal worker bat duoc cho dung khung gio do.

## Nguon ghi du lieu

### Worker browser

Worker tren VPS la nguon uu tien cho `kind = "deals"`.

Worker:

1. mo microsite trong browser context that
2. bat `pagebuilder/get_csr_page`
3. bat `collection/get_items`
4. normalize sang `Deal[]`
5. suy ra slot tu thoi diem sync
6. upsert 2 row:
   - `deals:{pageUrl}`
   - `deals:{pageUrl}:{slot}`

### Server adapter

Adapter trong web app:

- uu tien doc row `deals:{pageUrl}:{slot}`
- neu khong co slot row thi co the doc `deals:{pageUrl}` cho fallback
- chi fetch Shopee truc tiep khi can fallback

## Quy tac frontend

- `/deal` doc row theo slot, khong tu chia slot trong UI nua
- count cua moi tab gio phai dua tren snapshot row da luu
- `/live` va `/voucher` hien tai doc `ShopeeMicrositeSummary` + mock/fallback
- khong render raw response Shopee tren UI

## Quy tac mo rong sau nay

Neu them:

- `kind = "vouchers"`
- `kind = "live_sessions"`
- `kind = "campaigns"`

thi moi kind phai co:

1. type trong `src/lib/types.ts`
2. writer trong worker
3. reader trong cache layer
4. doc cap nhat tai file nay
