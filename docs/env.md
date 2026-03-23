# Environment Variables

## Core internal auth

```env
INTERNAL_API_KEY=replace-with-a-long-random-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
```

## Supabase cache

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_CACHE_TABLE=site_cache
```

## Partner API (TienVe)

```env
TIENVE_FLASH_DEALS_API_URL=https://api.tienve.vn/api/v1/flash-deals/partner
TIENVE_CACHE_PAGE_URL=tienve-partner
```

- `TIENVE_FLASH_DEALS_API_URL`: endpoint API nguon deal partner.
- `TIENVE_CACHE_PAGE_URL`: prefix cache key trong `site_cache`, vi du `deals:tienve-partner:0900`.

## Affiliate link generator (rewrite link ve ID aff cua ban)

```env
AFFILIATE_ID=

# Mode 0: custom-link API (uu tien cao nhat neu duoc cau hinh)
AFFILIATE_CUSTOM_LINK_API_URL=
AFFILIATE_CUSTOM_LINK_BEARER_TOKEN=
AFFILIATE_CUSTOM_LINK_TIMEOUT_MS=9000
AFFILIATE_CUSTOM_LINK_MAX_URLS=40
AFFILIATE_CUSTOM_LINK_HEADLESS=true
AFFILIATE_WORKER_PROFILE_DIR=
AFFILIATE_CUSTOM_LINK_PROVIDER=browser-gql
AFFILIATE_CDP_ENDPOINT=
AFFILIATE_CDP_PORT=9222
AFFILIATE_CHROMIUM_SANDBOX=true
AFFILIATE_SUB_ID1=
AFFILIATE_SUB_ID2=
AFFILIATE_SUB_ID3=
AFFILIATE_SUB_ID4=
AFFILIATE_SUB_ID5=

# Mode 1: template (de goi, khong can service ngoai)
AFFILIATE_LINK_TEMPLATE=

# Mode 2: HTTP service (service cua ban tra ve JSON co affiliateUrl)
AFFILIATE_LINK_GENERATOR_URL=
AFFILIATE_LINK_GENERATOR_BEARER_TOKEN=
AFFILIATE_LINK_GENERATOR_TIMEOUT_MS=6000
```

- Neu dat `AFFILIATE_CUSTOM_LINK_API_URL`, worker se goi API nay de doi ra short/custom link
  (vd `https://s.shopee.vn/...`) co kem `sub_id1..5`. Day la mode uu tien cao nhat.
  - Co the dung endpoint noi bo: `/api/internal/affiliate/custom-link`.
  - Endpoint noi bo su dung Playwright + profile dang nhap affiliate de convert theo batch (toi da 5 url/lua chon tren UI moi lan).
- Ho tro mode `gql` de goi truc tiep `affiliate.shopee.vn/api/v3/gql?q=batchCustomLink` (khong mo UI browser khi sync):
  - `AFFILIATE_CUSTOM_LINK_PROVIDER=gql` (mac dinh)
  - Can cap nhat bo token/header tu session affiliate:
    - `AFFILIATE_CSRF_TOKEN`
    - `AFFILIATE_COOKIE`
    - `AFFILIATE_AF_AC_ENC_DAT`
    - `AFFILIATE_AF_AC_ENC_SZ_TOKEN`
    - `AFFILIATE_X_SAP_RI`
    - `AFFILIATE_X_SAP_SEC`
    - `AFFILIATE_X_SZ_SDK_VERSION`
  - Neu token het han, system se bao `sessionStatus` va fallback sang mmp_pid (hoac Playwright neu dat provider `auto`).
- Ho tro mode `browser-gql` (khuyen nghi): goi `batchCustomLink` bang fetch trong context browser da login,
  giam mismatch fingerprint so voi Node fetch thuần.
  - Neu dat `AFFILIATE_CDP_ENDPOINT` (vd `http://127.0.0.1:9222`), server se attach vao browser that dang mo
    thay vi launch browser automation moi.
- Neu dat `AFFILIATE_LINK_GENERATOR_URL`, worker se goi endpoint nay cho tung deal de lay deeplink affiliate cua ban.
- Neu khong dat URL ma co `AFFILIATE_LINK_TEMPLATE`, worker se noi template voi cac placeholder:
  - `{{id}}`, `{{slug}}`, `{{title}}`
  - `{{affiliateId}}` (tu bien `AFFILIATE_ID`)
  - `{{shopId}}`, `{{itemId}}`
  - `{{productUrl}}`, `{{encodedProductUrl}}`
  - `{{currentAffiliateUrl}}`, `{{encodedCurrentAffiliateUrl}}`
- Neu chi dat `AFFILIATE_ID` (khong dat 2 bien tren), worker se tu dong chuyen sang mode `mmp_pid`:
  - Lay `productUrl` cua san pham.
  - Gan/ghi de query `mmp_pid=an_<AFFILIATE_ID>`.
  - Vi du: `mmp_pid=an_17321560336`.
- Neu khong dat bien nao, worker giu nguyen `affiliateUrl` tu nguon data.

## Cron security

```env
CRON_SECRET=replace-with-random-secret
```

- Route cron: `GET /api/cron/partner-sync`
- Header bat buoc: `Authorization: Bearer <CRON_SECRET>`

## Public URL + short link

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `NEXT_PUBLIC_APP_URL`: domain goc de API tao link tra ve short URL day du, vi du `https://your-domain.com/l/abc123`.

## Shopee worker (optional fallback)

```env
WORKER_PAGE_URL=shopee-sieu-re
WORKER_PROFILE_DIR=.worker/profiles/shopee-sieu-re
WORKER_HEADLESS=true
WORKER_WAIT_MS=15000
WORKER_MIN_COLLECTION_RESPONSES=3
WORKER_BROWSER_CHANNEL=
WORKER_TIMEZONE=Asia/Saigon
```
