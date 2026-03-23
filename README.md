# Shopee Aff Site

Next.js skeleton cho website Shopee affiliate theo huong sach hon repo tham chieu `shopeelivecoin`.

## Muc tieu

- giu lai phan public marketing dang hoc: deal hub, live hot, flash sale, voucher
- tach han internal operations khoi public site
- chuan bi san cho data adapters, tracking redirect, va content routes

## Thu muc chinh

- `src/app`: public routes va UI shell
- `src/lib`: domain types, adapters, shopee client, cache helpers
- `docs/reference-reuse.md`: phan nao nen giu tu repo cu
- `docs/architecture.md`: kien truc website aff de xuat
- `docs/shopee-endpoints.md`: endpoint va payload da xac nhan
- `docs/env.md`: danh sach env cho deploy va cron
- `worker/`: browser sync worker cho VPS

## Chay local

```bash
npm run dev
```

Mo [http://localhost:3000](http://localhost:3000).

## Env va API noi bo

Tao `.env.local` tu `.env.example`.

Bien quan trong:

- `INTERNAL_API_KEY`: bao ve API sync/status noi bo
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`: Basic Auth cho `/admin` va co the dung lai cho API noi bo
- `SHOPEE_COOKIE`: cookie phien browser Shopee
- `SHOPEE_AF_AC_ENC_DAT`, `SHOPEE_AF_AC_ENC_SZ_TOKEN`, `SHOPEE_X_SAP_RI`, `SHOPEE_X_SAP_SEC`: header chong bot neu ban muon goi endpoint duoc bao ve
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: bat cache store ben ngoai de deploy Vercel on dinh hon
- `TIENVE_FLASH_DEALS_API_URL`: doi endpoint partner API neu can
- `TIENVE_CACHE_PAGE_URL`: cache key root cho partner deals (mac dinh `tienve-partner`)
- `CRON_SECRET`: bao ve route cron `/api/cron/partner-sync`

API noi bo:

- `GET /api/internal/shopee/status`
- `POST /api/internal/shopee/sync`
- `POST /api/internal/partner/sync`

Gui them header `x-api-key: <INTERNAL_API_KEY>`.
Cron route dung header `Authorization: Bearer <CRON_SECRET>`.

## Partner cache sync cron

Frontend `/deal` se uu tien doc cache partner trong Supabase (`deals:tienve-partner` va `deals:tienve-partner:{slot}`),
nen khong phu thuoc request realtime den partner API.

Da them cron route:

- `GET /api/cron/partner-sync`

Neu deploy Vercel, file `vercel.json` da dat lich 15 phut/lần.

Trang admin mini:

- `GET /admin`
- duoc bao ve bang Basic Auth
- co them the `Partner API` + bang `Partner sync log` de xem slot nao fail/success

## Cache pipeline

Website uu tien doc cache file trong `output/shopee/cache/` truoc khi thu goi Shopee truc tiep.
Neu co Supabase env, cache se doc Supabase truoc va dong thoi mirror ve file local.

## Browser worker cho VPS

Neu ban muon lay deal that ma khong phu thuoc local, dung worker Playwright headless:

```bash
npm run worker:browser-sync -- shopee-sieu-re
```

Worker nay chay tren VPS, tu mo browser, lay data, va ghi vao Supabase.
Huong dan day du o [docs/vps-worker.md](/I:/Website/hup-het/shopee-aff-site/docs/vps-worker.md).

Luong khuyen nghi:

1. chay `npm run dev`
2. o terminal khac, chay `npm run sync:partner-cache -- tienve-partner`
3. neu can fallback Shopee, chay `npm run sync:shopee-cache -- shopee-sieu-re`
4. sau do cac trang `/deal`, `/live`, `/voucher` se dung cache local neu co

## Ghi chu van hanh

- `pagebuilder/get_csr_page` la nguon discovery on dinh nhat hien tai
- `collection/get_items` va `get_vouchers_by_collections` la endpoint duoc bao ve
- neu khong co browser session hop le, app se roi ve mock data thay vi vo trang
- tren Vercel, nen tao bang theo [docs/supabase-cache.sql](/I:/Website/hup-het/shopee-aff-site/docs/supabase-cache.sql)
- env setup day du xem [docs/env.md](/I:/Website/hup-het/shopee-aff-site/docs/env.md)
- de lay deal that on dinh, nen dung worker browser tren VPS thay vi server fetch truc tiep tu Vercel
