import test from 'node:test';
import assert from 'node:assert/strict';
import { findSupportedShop, isValidProductUrl } from '../packages/shared/src/domain/product-request.js';

test('matches supported store root domains and subdomains', () => {
  assert.equal(findSupportedShop('amazon.com'), 'Amazon');
  assert.equal(findSupportedShop('www.amazon.com'), 'Amazon');
  assert.equal(findSupportedShop('m.aliexpress.com'), 'AliExpress');
});

test('recognizes additional international shopping platforms', () => {
  assert.equal(findSupportedShop('www.temu.com'), 'Temu');
  assert.equal(findSupportedShop('m.shopee.com.my'), 'Shopee');
  assert.equal(findSupportedShop('www.noon.com'), 'Noon');
  assert.equal(findSupportedShop('shop.zalando.de'), 'Zalando');
  assert.equal(findSupportedShop('www.trendyol.com'), 'Trendyol');
});

test('normalizes hostname case and a trailing dot', () => {
  assert.equal(findSupportedShop('WWW.AMAZON.COM.'), 'Amazon');
});

test('does not accept lookalike or unrelated domains', () => {
  assert.equal(findSupportedShop('amazon.com.example.org'), null);
  assert.equal(findSupportedShop('notamazon.com'), null);
  assert.equal(findSupportedShop('example.org'), null);
});

test('accepts a supported HTTPS product URL', () => {
  assert.equal(isValidProductUrl('https://www.amazon.com/dp/example'), true);
});

test('rejects insecure URLs, credentials, ports, and unsupported stores', () => {
  assert.equal(isValidProductUrl('http://amazon.com/dp/example'), false);
  assert.equal(isValidProductUrl('https://user:pass@amazon.com/dp/example'), false);
  assert.equal(isValidProductUrl('https://amazon.com:8443/dp/example'), false);
  assert.equal(isValidProductUrl('https://amazon.com.example.org/dp/example'), false);
  assert.equal(isValidProductUrl('not a URL'), false);
});

test('rejects product URLs longer than the configured limit', () => {
  const longUrl = 'https://amazon.com/' + 'a'.repeat(2050);
  assert.equal(isValidProductUrl(longUrl), false);
});
