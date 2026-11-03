export function parsePricingSettings(rows) {
  const values = new Map((Array.isArray(rows) ? rows : []).map(row => [row.key, row.value]));
  const rate = Number(values.get('usd_to_dzd_rate'));
  const fee = Number(values.get('service_fee_dzd'));
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(fee) || fee < 0) {
    throw new Error('Pricing settings are missing or invalid');
  }
  return {
    usdToDzdRate: rate,
    serviceFeeDzd: fee,
    exchangeRateSource: String(values.get('exchange_rate_source') ?? 'unknown'),
    exchangeRateUpdatedAt: String(values.get('exchange_rate_updated_at') ?? ''),
  };
}

export function calculateProductSubtotalDzd(productPriceUsd, settings) {
  const price = Number(productPriceUsd);
  if (!Number.isFinite(price) || price < 0) throw new Error('Product price must be a non-negative number');
  if (!settings || !Number.isFinite(settings.usdToDzdRate) || settings.usdToDzdRate <= 0 ||
      !Number.isFinite(settings.serviceFeeDzd) || settings.serviceFeeDzd < 0) {
    throw new Error('Valid pricing settings are required');
  }
  return Math.round(price * settings.usdToDzdRate + settings.serviceFeeDzd);
}
