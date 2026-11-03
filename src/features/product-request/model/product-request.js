const SHOP_DOMAINS = Object.freeze({
  Temu: ['temu.com'],
  AliExpress: ['aliexpress.com'],
  Amazon: ['amazon.com', 'amazon.co.uk', 'amazon.fr', 'amazon.de', 'amazon.it', 'amazon.es', 'amazon.ca', 'amazon.ae', 'amazon.sa', 'amazon.com.tr', 'amazon.co.jp', 'amazon.com.mx', 'amazon.in'],
  SHEIN: ['shein.com'],
  eBay: ['ebay.com', 'ebay.co.uk', 'ebay.fr', 'ebay.de', 'ebay.it', 'ebay.es', 'ebay.ca', 'ebay.com.au'],
  Walmart: ['walmart.com'], Etsy: ['etsy.com'], ASOS: ['asos.com'],
});

export function findSupportedShop(hostname) {
  const host = hostname.toLowerCase().replace(/\\.$/, '');
  for (const [shop, domains] of Object.entries(SHOP_DOMAINS)) {
    if (domains.some(domain => host === domain || host.endsWith('.' + domain))) return shop;
  }
  return null;
}

export function isValidProductUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && url.href.length <= 2048 && Boolean(findSupportedShop(url.hostname));
  } catch {
    return false;
  }
}
