import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProductSubtotalDzd, parsePricingSettings } from '../src/features/pricing/model/pricing.js';

test('parses numeric JSON settings returned by Supabase', () => {
  const settings = parsePricingSettings([
    { key: 'usd_to_dzd_rate', value: 260 },
    { key: 'service_fee_dzd', value: 500 },
    { key: 'exchange_rate_source', value: 'manual' },
    { key: 'exchange_rate_updated_at', value: '2026-11-03T15:42:03Z' },
  ]);
  assert.deepEqual(settings, {
    usdToDzdRate: 260, serviceFeeDzd: 500, exchangeRateSource: 'manual',
    exchangeRateUpdatedAt: '2026-11-03T15:42:03Z',
  });
});

test('calculates product subtotal plus fixed service fee using current rate', () => {
  assert.equal(calculateProductSubtotalDzd(10, { usdToDzdRate: 260, serviceFeeDzd: 500 }), 3100);
  assert.equal(calculateProductSubtotalDzd(10, { usdToDzdRate: 265, serviceFeeDzd: 500 }), 3150);
});

test('rejects missing, invalid, or negative pricing settings and prices', () => {
  assert.throws(() => parsePricingSettings([{ key: 'usd_to_dzd_rate', value: 0 }, { key: 'service_fee_dzd', value: 500 }]));
  assert.throws(() => calculateProductSubtotalDzd(-1, { usdToDzdRate: 260, serviceFeeDzd: 500 }));
});
