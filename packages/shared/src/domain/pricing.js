export function parsePricingSettings(rows) {
  const values = new Map((Array.isArray(rows) ? rows : []).map(row => [row.key, row.value]));
  const usdToDzdRate = Number(values.get('usd_to_dzd_rate'));
  const eurToDzdRate = Number(values.get('eur_to_dzd_rate'));
  const serviceFeeDzd = Number(values.get('service_fee_dzd'));
  if (!Number.isFinite(usdToDzdRate) || usdToDzdRate <= 0 ||
      !Number.isFinite(eurToDzdRate) || eurToDzdRate <= 0 ||
      !Number.isFinite(serviceFeeDzd) || serviceFeeDzd < 0) {
    throw new Error('Pricing settings are missing or invalid');
  }
  return {
    usdToDzdRate,
    eurToDzdRate,
    serviceFeeDzd,
    exchangeRateSource: String(values.get('exchange_rate_source') ?? 'unknown'),
    exchangeRateUpdatedAt: String(values.get('exchange_rate_updated_at') ?? ''),
  };
}

const CURRENCIES = new Set(['USD', 'EUR', 'DZD']);

function toDzdRate(currency, settings) {
  if (currency === 'DZD') return 1;
  if (currency === 'USD') return settings?.usdToDzdRate;
  if (currency === 'EUR') return settings?.eurToDzdRate;
  throw new Error('Unsupported currency');
}

/** Convert between USD, EUR and DZD using the configured DZD base rates. */
export function convertCurrency(amount, fromCurrency, toCurrency, settings) {
  const value = Number(amount);
  const from = String(fromCurrency).toUpperCase();
  const to = String(toCurrency).toUpperCase();
  if (!Number.isFinite(value) || value < 0) throw new Error('Amount must be a non-negative number');
  if (!CURRENCIES.has(from) || !CURRENCIES.has(to)) throw new Error('Unsupported currency');
  const fromRate = toDzdRate(from, settings);
  const toRate = toDzdRate(to, settings);
  if (!Number.isFinite(fromRate) || fromRate <= 0 || !Number.isFinite(toRate) || toRate <= 0) {
    throw new Error('Valid exchange rates are required');
  }
  return Math.round((value * fromRate / toRate) * 100) / 100;
}

export function calculateProductSubtotalDzd(productPrice, settings, currency = 'USD') {
  const price = Number(productPrice);
  if (!Number.isFinite(price) || price < 0) throw new Error('Product price must be a non-negative number');
  if (!settings || !Number.isFinite(settings.serviceFeeDzd) || settings.serviceFeeDzd < 0) {
    throw new Error('Valid pricing settings are required');
  }
  return Math.round(convertCurrency(price, currency, 'DZD', settings) + settings.serviceFeeDzd);
}
