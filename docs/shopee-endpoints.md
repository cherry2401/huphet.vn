# Shopee Endpoint Notes

## Confirmed endpoints

- `GET /api/v4/pagebuilder/get_csr_page?page_url=shopee-sieu-re&platform=4&timestamp=0`
- `GET /api/v4/collection/get?collection_id=...`
- `GET /api/v4/collection/get_items?...collection_id=...`
- `POST /api/v1/microsite/get_vouchers_by_collections`
- `GET https://api.tienve.vn/api/v1/flash-deals/shopee-xu` (Third-party Xu data)

## What `pagebuilder` gives you

- `data.page.meta.page_id`: microsite id
- `layout.component_list[*].id`: component id
- `biz_component_id = 48`: product collection blocks
- `biz_component_id = 51`: voucher grid blocks
- `biz_component_id = 86`: flash sale block

## Voucher payload recovered from browser

```json
{
  "voucher_collection_request_list": [
    {
      "collection_id": "79448732830982",
      "component_type": 1,
      "component_id": 41280400,
      "limit": 1,
      "microsite_id": 68693,
      "offset": 0,
      "number_of_vouchers_per_row": 1
    }
  ]
}
```

## Browser-only headers observed on voucher request

- `af-ac-enc-dat`
- `af-ac-enc-sz-token`
- `x-csrftoken`
- `x-sap-ri`
- `x-sap-sec`
- `x-sz-sdk-version`
- `x-shopee-language`

Without a valid browser session plus these protected headers, direct server-side calls often return `403` or an anti-bot payload.

## Practical implication

- `pagebuilder` is safe to use as a discovery source.
- `collection/get_items` and voucher APIs should be treated as protected sources.
- For a production affiliate site, keep Shopee fetches behind a server adapter with fallback data.
- If you want stable live data, plan for either:
  - a maintained browser session service, or
  - your own cached ingestion pipeline.
