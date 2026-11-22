import { SandboxMockProvider } from '../apps/backend/src/services/payment/SandboxMockProvider.js';
import { generateTransactionRef } from '../packages/shared/src/index.js';

export async function runPaymentEngineTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  console.log('\n--- 3. Payment Engine & KHQR Verification Tests ---');

  const provider = new SandboxMockProvider();
  const txnRef = generateTransactionRef();

  // Test 1: Dynamic QR Generation in Sandbox Provider
  const qrRes = await provider.generateDynamicQR({
    transactionRef: txnRef,
    amount: 24.50,
    currency: 'USD',
    bakongAccountId: 'devb_retail@devb',
    merchantName: 'DIGITAL STORE PRO',
    merchantCity: 'Phnom Penh'
  });

  assert(qrRes.qrString.length > 50, 'Dynamic QR string generated successfully');
  assert(qrRes.md5Hash.length === 32, 'MD5 hash generated for Bakong lookup');

  // Test 2: Pre-scan Verification (Must be PENDING / Not Paid)
  const preCheck = await provider.verifyPayment({ transactionRef: txnRef, md5Hash: qrRes.md5Hash });
  assert(!preCheck.isPaid, 'Initial payment check must return isPaid=false before bank scan');

  // Test 3: Simulated Bank App Scan Approval
  const approvalSuccess = provider.simulateBankPaymentApproval(txnRef);
  assert(approvalSuccess, 'Simulated bank payment scan must be accepted');

  // Test 4: Post-scan Verification (Must be PAID)
  const postCheck = await provider.verifyPayment({ transactionRef: txnRef, md5Hash: qrRes.md5Hash });
  assert(postCheck.isPaid, 'Payment verification must return isPaid=true after bank scan');
  assert(postCheck.amount === 24.50, 'Verified amount must match exact order amount');
  assert(postCheck.currency === 'USD', 'Verified currency must match exact order currency');
  assert(!!postCheck.bakongHash, 'Verified payment must contain bank transaction hash');

  // Test 5: Unknown transaction verification
  const unknownCheck = await provider.verifyPayment({ transactionRef: 'UNKNOWN_REF_9999' });
  assert(!unknownCheck.isPaid, 'Non-existent transaction reference must be rejected');

  return { passed, failed, errors };
}
