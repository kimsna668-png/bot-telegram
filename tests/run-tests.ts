import { runKHQRTests } from './khqr.test.js';
import { runSecurityTests } from './security.test.js';
import { runPaymentEngineTests } from './payment-engine.test.js';
import { runInventoryDeliveryTests } from './inventory-delivery.test.js';

async function main() {
  console.log('===============================================================');
  console.log('🧪 TELEGRAM DIGITAL STORE PRO - AUTOMATED TEST SUITE');
  console.log('===============================================================');

  let totalPassed = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  // Suite 1: KHQR & EMVCo Tests
  const res1 = runKHQRTests();
  totalPassed += res1.passed;
  totalFailed += res1.failed;
  allErrors.push(...res1.errors);

  // Suite 2: Security & Auth Tests
  const res2 = await runSecurityTests();
  totalPassed += res2.passed;
  totalFailed += res2.failed;
  allErrors.push(...res2.errors);

  // Suite 3: Payment Engine & Bakong Provider Tests
  const res3 = await runPaymentEngineTests();
  totalPassed += res3.passed;
  totalFailed += res3.failed;
  allErrors.push(...res3.errors);

  // Suite 4: Inventory & Digital Delivery Tests
  const res4 = runInventoryDeliveryTests();
  totalPassed += res4.passed;
  totalFailed += res4.failed;
  allErrors.push(...res4.errors);

  console.log('\n===============================================================');
  console.log(`📊 TEST RESULTS: ${totalPassed} PASSED | ${totalFailed} FAILED`);
  console.log('===============================================================');

  if (totalFailed > 0) {
    console.error('❌ FAILURES ENCOUNTERED:');
    allErrors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
    process.exit(1);
  } else {
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
