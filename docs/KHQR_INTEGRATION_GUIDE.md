# Bakong KHQR Integration Guide

## 1. NBC KHQR EMVCo Specifications

National Bank of Cambodia (NBC) KHQR follows EMVCo QR Code Specification for Payment Systems (Merchant-Presented Mode).

### Tag Breakdown

| Tag | Name | Type | Description |
|---|---|---|---|
| `00` | Payload Format Indicator | String | Fixed `"01"` |
| `01` | Point of Initiation Method | String | `"11"` (Static) or `"12"` (Dynamic) |
| `29` | Merchant Account Information | Template | Contains sub-tags `00` (`"bakong@nbc"`) and `01` (Bakong Account ID) |
| `52` | Merchant Category Code | String | Standard MCC (e.g., `"0000"` or `"5999"`) |
| `53` | Transaction Currency | String | ISO 4217 numeric: `"840"` (USD) or `"116"` (KHR) |
| `54` | Transaction Amount | String | Exact amount (e.g. `"14.50"` or `"50000"`) |
| `58` | Country Code | String | `"KH"` |
| `59` | Merchant Name | String | Merchant or Store Name (up to 25 chars) |
| `60` | Merchant City | String | City (e.g. `"Phnom Penh"`) |
| `62` | Additional Data Template | Template | Contains sub-tag `01` (Bill Number / Txn Reference) |
| `63` | Checksum (CRC16) | String | CRC16-CCITT 4-character hex checksum |

---

## 2. CRC16-CCITT Checksum Calculation

- **Polynomial**: `0x1021` (`x^16 + x^12 + x^5 + 1`)
- **Initial Value**: `0xFFFF`
- Applied over the entire payload up to and including tag `6304`.

Implementation in `packages/shared/src/crc16.ts`:
```ts
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
```

---

## 3. Production Verification with Bakong Open API

Bakong Open API verifies transactions by hashing the generated KHQR string using MD5 and checking against the national settlement switch.

- Endpoint: `POST https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5`
- Header: `Authorization: Bearer <apiToken>`
- Payload: `{ "md5": "<md5Hash>" }`

### Verification Safety Rules
1. Never mark an order PAID based on client reports or customer receipts.
2. Only mark PAID when the backend receives a successful HTTP 200 response with `responseCode: 0` and confirmed hash from Bakong Open API or active webhook.
3. Protect against replay attacks: ensure `transactionRef` is unique and each payment record can only transition from `PENDING` to `SUCCESS` once atomically.
