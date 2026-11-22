import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { verifyTelegramInitData, signAdminToken } from '../apps/backend/src/middleware/auth.js';

export async function runSecurityTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  console.log('\n--- 2. Security & Authentication Tests ---');

  // Test 1: Telegram WebApp HMAC-SHA256 Verification
  const botToken = '123456789:ABCDefghIJKLmnOPQRstuvWXYZ_ExampleBot';
  const userObj = { id: 987654321, first_name: 'Sophea', username: 'sophea_dev' };
  const authDate = Math.floor(Date.now() / 1000).toString();

  const dataCheckArr = [
    `auth_date=${authDate}`,
    `query_id=AAHdF6IQAAAAAN0XohD9K7`,
    `user=${JSON.stringify(userObj)}`
  ].sort();
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const validHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const validInitData = `auth_date=${authDate}&query_id=AAHdF6IQAAAAAN0XohD9K7&user=${encodeURIComponent(
    JSON.stringify(userObj)
  )}&hash=${validHash}`;

  const verifiedUser = verifyTelegramInitData(validInitData, botToken);
  assert(verifiedUser !== null && verifiedUser.id === 987654321, 'Valid Telegram initData must verify correctly');

  // Test 2: Tampered Telegram initData rejection
  const tamperedInitData = validInitData.replace('Sophea', 'Attacker');
  const rejectedUser = verifyTelegramInitData(tamperedInitData, botToken);
  assert(rejectedUser === null, 'Tampered Telegram initData must be strictly rejected');

  // Test 3: Password Hashing with Bcrypt
  const plainPassword = 'SuperSecurePassword@2026';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  const isMatch = await bcrypt.compare(plainPassword, hash);
  const isWrong = await bcrypt.compare('WrongPassword', hash);
  assert(isMatch, 'Bcrypt must verify correct password hash');
  assert(!isWrong, 'Bcrypt must reject incorrect password');

  // Test 4: JWT Admin Token Lifecycle
  const adminPayload = { id: 'admin123', email: 'admin@store.pro', roleId: 'role999' };
  const token = signAdminToken(adminPayload);
  assert(typeof token === 'string' && token.length > 30, 'Admin JWT token must be generated');

  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_telegram_store_2026');
  assert(decoded.email === 'admin@store.pro', 'Decoded JWT payload must match original admin email');

  return { passed, failed, errors };
}
