import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuoteAmounts } from "../supabase/functions/admin-quotes/quote-domain.js";

const rates = { serviceFeeDzd: 500, usdToDzdRate: 260, eurToDzdRate: 280 };

test("uses the configured fixed DZD fee and converts it into quote currency", () => {
  assert.deepEqual(calculateQuoteAmounts({ currency: "USD", productCost: 10, shippingCost: 2, customsEstimate: 0, ...rates }), {
    serviceFee: 1.92, total: 13.92,
  });
  assert.deepEqual(calculateQuoteAmounts({ currency: "EUR", productCost: 10, shippingCost: 2, customsEstimate: 0, ...rates }), {
    serviceFee: 1.79, total: 13.79,
  });
  assert.deepEqual(calculateQuoteAmounts({ currency: "DZD", productCost: 1000, shippingCost: 0, customsEstimate: 0, ...rates }), {
    serviceFee: 500, total: 1500,
  });
});

test("rounds total to two decimal places", () => {
  assert.deepEqual(calculateQuoteAmounts({ currency: "USD", productCost: 1.111, shippingCost: 2.222, customsEstimate: 0.333, ...rates }), {
    serviceFee: 1.92, total: 5.59,
  });
});

test("rejects invalid currencies, negative values, and invalid rates", () => {
  assert.throws(() => calculateQuoteAmounts({ currency: "GBP", productCost: 1, shippingCost: 0, ...rates }), /Unsupported currency/);
  assert.throws(() => calculateQuoteAmounts({ currency: "USD", productCost: -1, shippingCost: 0, ...rates }), /productCost/);
  assert.throws(() => calculateQuoteAmounts({ currency: "USD", productCost: 1, shippingCost: 0, ...rates, usdToDzdRate: 0 }), /valid exchange rate/);
});
