import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProductSubtotalDzd,
  convertCurrency,
  parsePricingSettings,
} from '../packages/shared/src/domain/pricing.js';

const settings = {
  usdToDzdRate: 260,
  eurToDzdRate: 280,
  serviceFeeDzd: 500,
};

test('parses USD, EUR and service-fee settings returned by Supabase', () => {
  const parsed = parsePricingSettings([
    { key: 'usd_to_dzd_rate', value: 260 },
    { key: 'eur_to_dzd_rate', value: 280 },
    { key: 'service_fee_dzd', value: 500 },
    { key: 'exchange_rate_source', value: 'manual' },
    { key: 'exchange_rate_updated_at', value: '2026-11-03T15:42:03Z' },
  ]);
  assert.deepEqual(parsed, {
    ...settings,
    exchangeRateSource: 'manual',
    exchangeRateUpdatedAt: '2026-11-03T15:42:03Z',
  });
});

test('converts EUR to USD and USD to EUR using configured rates', () => {
  assert.equal(convertCurrency(10, 'EUR', 'USD', settings), 10.77);
  assert.equal(convertCurrency(10, 'USD', 'EUR', settings), 9.29);
  assert.equal(convertCurrency(10, 'EUR', 'DZD', settings), 2800);
  assert.equal(convertCurrency(2600, 'DZD', 'USD', settings), 10);
});

test('calculates product subtotal with service fee for USD or EUR input', () => {
  assert.equal(calculateProductSubtotalDzd(10, settings, 'USD'), 3100);
  assert.equal(calculateProductSubtotalDzd(10, settings, 'EUR'), 3300);
});

test('rejects missing or invalid rates, unsupported currencies, and negative values', () => {
  assert.throws(() => parsePricingSettings([
    { key: 'usd_to_dzd_rate', value: 0 },
    { key: 'eur_to_dzd_rate', value: 280 },
    { key: 'service_fee_dzd', value: 500 },
  ]));
  assert.throws(() => convertCurrency(-1, 'EUR', 'USD', settings));
  assert.throws(() => convertCurrency(1, 'GBP', 'USD', settings));
  assert.throws(() => convertCurrency(1, 'EUR', 'USD', { ...settings, usdToDzdRate: 0 }));
});
