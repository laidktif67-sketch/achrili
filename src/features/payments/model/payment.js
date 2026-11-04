export const PAYMENT_METHODS = Object.freeze({
  CCP_TRANSFER: 'CCP_TRANSFER',
  USDT_BEP20: 'USDT_BEP20',
});

export const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
});

export function isValidBep20Address(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function canEnablePaymentMethod(method) {
  if (!method || typeof method !== 'object') return false;
  if (method.code === PAYMENT_METHODS.CCP_TRANSFER) {
    return Boolean(String(method.accountHolder ?? '').trim() && String(method.accountIdentifier ?? '').trim());
  }
  if (method.code === PAYMENT_METHODS.USDT_BEP20) {
    return method.network === 'BEP20' && isValidBep20Address(method.walletAddress);
  }
  return false;
}

export function isAllowedProofFile(file) {
  if (!file) return false;
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  return allowed.has(file.type) && file.size > 0 && file.size <= 5 * 1024 * 1024;
}

export function paymentMethodLabel(code) {
  return code === PAYMENT_METHODS.CCP_TRANSFER ? 'CCP / تحويل بريدي'
    : code === PAYMENT_METHODS.USDT_BEP20 ? 'USDT (BEP20)' : 'وسيلة دفع غير معروفة';
}
