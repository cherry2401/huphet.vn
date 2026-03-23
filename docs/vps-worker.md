# VPS Worker Deploy

## Kien truc

- Vercel: frontend
- Supabase: cache store
- VPS Ubuntu 22: Playwright browser worker

## 1. Cai packages

```bash
sudo apt update
sudo apt install -y curl git ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Trong repo:

```bash
npm install
npm run worker:install-browser
```

Neu Playwright bao thieu system dependency:

```bash
npx playwright install-deps chromium
```

## 2. Tao env rieng cho worker

File de xuat: `/opt/shopee-aff-site/.env.worker`

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_CACHE_TABLE=site_cache
WORKER_PAGE_URL=shopee-sieu-re
WORKER_PROFILE_DIR=/opt/shopee-aff-site/.worker/profiles/shopee-sieu-re
WORKER_HEADLESS=true
WORKER_WAIT_MS=15000
WORKER_MIN_COLLECTION_RESPONSES=3
WORKER_TIMEZONE=Asia/Saigon
```

## 3. Chay thu

```bash
npm run worker:browser-sync -- shopee-sieu-re
```

Neu thanh cong, cac row sau se duoc update trong Supabase:

- `microsite:shopee-sieu-re`
- `deals:shopee-sieu-re`
- `deals:shopee-sieu-re:{slot}`

## 4. Cai systemd

Copy file:

- `deploy/systemd/shopee-browser-sync.service`
- `deploy/systemd/shopee-browser-sync.timer`

Len server:

```bash
sudo cp deploy/systemd/shopee-browser-sync.service /etc/systemd/system/
sudo cp deploy/systemd/shopee-browser-sync.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now shopee-browser-sync.timer
```

## 5. Lenh quan trong

```bash
sudo systemctl status shopee-browser-sync.timer
sudo systemctl start shopee-browser-sync.service
journalctl -u shopee-browser-sync.service -n 200 --no-pager
```

## 6. Ghi chu van hanh

- worker dung browser profile persistent, khong phu thuoc may local
- neu Shopee doi anti-bot, ban sua worker tren VPS thay vi sua frontend
- frontend web chi doc cache Supabase
- `/deal` se doc row theo slot that, vi vay worker can duoc chay lai o moi khung gio ban muon san deal
