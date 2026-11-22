import { generateKHQR, parseKHQR, calculateCRC16, verifyCRC16 } from '../packages/shared/src/index.js';

export function runKHQRTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const assert = (condition: boolean, desc: string) => {
    if (condition) {
      passed++;
      console.log(`  ✓ ${desc}`);
    } else {
      failed++;
      errors.push(desc);
      console.error(`  ✗ ${desc}`);
    }
  };

  console.log('\n--- 1. KHQR & CRC16 Spec Compliance Tests ---');

  // Test 1: CRC16 calculation
  const samplePayload = '00020101021229300010bakong@nbc0112devb@retail520400005303840540510.005802KH5917DIGITAL STORE PRO6010Phnom Penh6304';
  const crc = calculateCRC16(samplePayload);
  assert(crc.length === 4, `CRC16 should produce 4 hex characters (got: ${crc})`);

  // Test 2: Dynamic KHQR Generation (USD)
  const usdQR = generateKHQR({
    transactionRef: 'TXN-TEST-12345',
    amount: 14.99,
    currency: 'USD',
    bakongAccountId: 'store_official@devb',
    merchantName: 'DIGITAL STORE PRO',
    merchantCity: 'Phnom Penh',
    billNumber: 'ORD-98765'
  });

  assert(usdQR.startsWith('000201010212'), 'KHQR must start with Tag 00 (01) and Tag 01 (12 Dynamic)');
  assert(verifyCRC16(usdQR), 'KHQR payload must have valid CRC16-CCITT checksum at Tag 63');

  // Test 3: Parse KHQR
  const parsed = parseKHQR(usdQR);
  assert(parsed.isValid, 'parseKHQR must validate standard generated QR');
  assert(parsed.currency === 'USD', 'Currency should correctly resolve to USD');
  assert(parsed.amount === 14.99, `Amount should equal 14.99 (got: ${parsed.amount})`);
  assert(parsed.bakongAccountId === 'store_official@devb', `Bakong account must match (got: ${parsed.bakongAccountId})`);
  assert(parsed.billNumber === 'TXN-TEST-12345', `Bill number must match transaction ref (got: ${parsed.billNumber})`);

  // Test 4: Dynamic KHQR Generation (KHR Currency 116)
  const khrQR = generateKHQR({
    transactionRef: 'TXN-KHR-555',
    amount: 50000,
    currency: 'KHR',
    bakongAccountId: 'merchant@acleda',
    merchantName: 'DIGITAL STORE',
    merchantCity: 'Phnom Penh'
  });

  const parsedKHR = parseKHQR(khrQR);
  assert(parsedKHR.isValid, 'KHR KHQR must be valid');
  assert(parsedKHR.currency === 'KHR', 'Currency must resolve to KHR (tag 53 = 116)');
  assert(parsedKHR.amount === 50000, `Amount must equal 50000 (got: ${parsedKHR.amount})`);

  // Test 5: Invalid QR checksum detection
  const tamperedQR = usdQR.substring(0, usdQR.length - 2) + '00';
  assert(!verifyCRC16(tamperedQR), 'Tampered payload with invalid checksum must be rejected');

  return { passed, failed, errors };
}
