# Browser Sync Worker

Worker nay duoc thiet ke de chay tren VPS Ubuntu 22, khong can UI.

Nhiem vu:

- mo Shopee microsite trong browser context that
- capture `pagebuilder/get_csr_page`
- capture `collection/get_items`
- normalize deal data
- ghi cache latest vao Supabase va file local
- ghi them snapshot theo slot `0000|0900|1200|1500|2000`

## Chay tay

```bash
npm run worker:browser-sync -- shopee-sieu-re
```

## Bootstrap local

Neu muon chay dung quy trinh tren local bang mot lenh:

```bash
npm run worker:bootstrap -- shopee-sieu-re
```

Lenh nay se:

1. mo Chrome that qua `worker:login`
2. doi session hop le
3. tu dong chay `worker:browser-sync`

Neu muon login va sync trong cung mot phien browser that de dung profile that dang mo:

```bash
npm run worker:bootstrap-live -- shopee-sieu-re
```

## Khoi tao session local

Neu worker bi `blocked` hoac `90309999`, dung helper nay tren may local:

```bash
npm run worker:login -- shopee-sieu-re
```

Helper se mo Chrome that tren profile worker. Ban login/qua challenge mot lan trong cua so do,
sau do worker sync se dung lai profile persistent nay.

Neu da co session tot va muon bo qua buoc login helper:

```bash
$env:WORKER_SKIP_LOGIN='true'
npm run worker:bootstrap -- shopee-sieu-re
```

## Khoi tao session affiliate custom-link

De worker co the doi link qua trang `affiliate.shopee.vn/offer/custom_link`:

1. Mo browser that voi profile clone (khong automation):

```bash
npm run worker:affiliate-open-profile
```

2. Dang nhap + xu ly captcha bang tay trong cua so vua mo.

3. Kiem tra session profile bang helper Playwright:

```bash
npm run worker:affiliate-login
```

Dang nhap 1 lan trong cua so browser mo ra, sau do profile se duoc tai su dung cho route
`/api/internal/affiliate/custom-link`.

Neu muon dung Brave thay vi Chrome:

```powershell
$env:WORKER_BROWSER_PATH='C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
npm run worker:bootstrap -- shopee-sieu-re
```

## Bien moi truong

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_CACHE_TABLE`
- `WORKER_PAGE_URL`
- `WORKER_PROFILE_DIR`
- `WORKER_HEADLESS`
- `WORKER_WAIT_MS`
- `WORKER_MIN_COLLECTION_RESPONSES`
- `WORKER_BROWSER_CHANNEL`
- `WORKER_BROWSER_PATH`
- `WORKER_TIMEZONE`
- `AFFILIATE_WORKER_PROFILE_DIR`
- `AFFILIATE_CUSTOM_LINK_HEADLESS`

## Ghi chu

- profile browser duoc luu persistent trong `WORKER_PROFILE_DIR`
- worker nay khong can `.env.local` tu may local; no can env tren VPS
- neu server chua co browser, chay `npm run worker:install-browser`
- worker se ghi 2 key cho deals:
  - `deals:{pageUrl}`
  - `deals:{pageUrl}:{slot}`
- neu bi Shopee block, worker se khong ghi de cache deals cu bang mang rong
