export const PRODUCT_REQUEST_LIMITS = Object.freeze({ minQuantity: 1, maxQuantity: 30, maxUrlLength: 2048 });

export function isValidHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && url.href.length <= PRODUCT_REQUEST_LIMITS.maxUrlLength;
  } catch {
    return false;
  }
}
