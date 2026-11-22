import crypto from 'crypto';
import { generateSecureToken } from '../packages/shared/src/index.js';

export function runInventoryDeliveryTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- 4. Digital Inventory & Delivery Unit Tests ---');

  // Test 1: Secure Download Token Generation
  const token = generateSecureToken(32);
  assert(token.length === 64, `Secure download token should be 64 hex characters (got: ${token.length})`);

  // Test 2: In-Memory License Allocation Mock
  const pool = [
    { key: 'KEY-AAA-111', status: 'AVAILABLE' },
    { key: 'KEY-BBB-222', status: 'AVAILABLE' },
    { key: 'KEY-CCC-333', status: 'AVAILABLE' }
  ];

  const allocate = (count: number) => {
    const allocated: string[] = [];
    for (const item of pool) {
      if (item.status === 'AVAILABLE' && allocated.length < count) {
        item.status = 'ALLOCATED';
        allocated.push(item.key);
      }
    }
    return allocated;
  };

  const firstAllocation = allocate(2);
  assert(firstAllocation.length === 2, 'Allocates requested number of keys');
  assert(firstAllocation[0] === 'KEY-AAA-111' && firstAllocation[1] === 'KEY-BBB-222', 'Allocates keys in FIFO order');

  const secondAllocation = allocate(1);
  assert(secondAllocation.length === 1 && secondAllocation[0] === 'KEY-CCC-333', 'Allocates remaining available key');

  const emptyAllocation = allocate(1);
  assert(emptyAllocation.length === 0, 'Does not duplicate or over-allocate exhausted keys');

  return { passed, failed, errors };
}
