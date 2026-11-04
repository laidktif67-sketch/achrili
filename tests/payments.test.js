import test from 'node:test';
import assert from 'node:assert/strict';
import { canEnablePaymentMethod, isAllowedProofFile, isValidBep20Address, PAYMENT_METHODS } from '../src/features/payments/model/payment.js';

test('CCP method cannot be enabled without holder and account identifier', () => {
  assert.equal(canEnablePaymentMethod({ code: PAYMENT_METHODS.CCP_TRANSFER, accountHolder: '', accountIdentifier: '' }), false);
  assert.equal(canEnablePaymentMethod({ code: PAYMENT_METHODS.CCP_TRANSFER, accountHolder: 'Example', accountIdentifier: 'RIP/CCP' }), true);
});

test('USDT method requires a valid BEP20 address and exact network', () => {
  assert.equal(isValidBep20Address('0x' + 'a'.repeat(40)), true);
  assert.equal(isValidBep20Address('0x' + 'a'.repeat(39)), false);
  assert.equal(canEnablePaymentMethod({ code: PAYMENT_METHODS.USDT_BEP20, network: 'BEP20', walletAddress: '0x' + 'A'.repeat(40) }), true);
  assert.equal(canEnablePaymentMethod({ code: PAYMENT_METHODS.USDT_BEP20, network: 'TRC20', walletAddress: '0x' + 'A'.repeat(40) }), false);
  assert.equal(canEnablePaymentMethod({ code: PAYMENT_METHODS.USDT_BEP20, network: 'BEP20', walletAddress: '' }), false);
});

test('payment proof accepts only supported non-empty files up to 5 MB', () => {
  assert.equal(isAllowedProofFile({ type: 'image/png', size: 1024 }), true);
  assert.equal(isAllowedProofFile({ type: 'application/pdf', size: 1024 }), true);
  assert.equal(isAllowedProofFile({ type: 'text/html', size: 1024 }), false);
  assert.equal(isAllowedProofFile({ type: 'image/png', size: 0 }), false);
  assert.equal(isAllowedProofFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }), false);
});
