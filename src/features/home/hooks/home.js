const noticeBox = document.getElementById('notice');
const productUrl = document.getElementById('productUrl');
const shopDomains = {
  Temu: ['temu.com'],
  AliExpress: ['aliexpress.com'],
  Amazon: ['amazon.com', 'amazon.co.uk', 'amazon.fr', 'amazon.de', 'amazon.it', 'amazon.es', 'amazon.ca', 'amazon.ae', 'amazon.sa', 'amazon.com.tr', 'amazon.co.jp', 'amazon.com.mx', 'amazon.in'],
  SHEIN: ['shein.com'],
  eBay: ['ebay.com', 'ebay.co.uk', 'ebay.fr', 'ebay.de', 'ebay.it', 'ebay.es', 'ebay.ca', 'ebay.com.au'],
  Walmart: ['walmart.com'],
  Etsy: ['etsy.com'],
  ASOS: ['asos.com']
};

function notify(message, kind = 'info') {
  noticeBox.textContent = message;
  noticeBox.className = 'notice ' + kind;
  noticeBox.style.display = 'block';
  noticeBox.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  noticeBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

window.notify = notify;

function detectShop(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  for (const [shop, domains] of Object.entries(shopDomains)) {
    if (domains.some(domain => host === domain || host.endsWith('.' + domain))) return shop;
  }
  return null;
}

document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('linkForm').addEventListener('submit', event => {
  event.preventDefault();
  const value = productUrl.value.trim();
  let url;

  try {
    url = new URL(value);
  } catch {
    notify('الرابط غير صحيح. انسخ رابط المنتج كاملاً من المتجر.', 'error');
    productUrl.focus();
    return;
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    notify('استخدم رابط HTTPS مباشر من المتجر، من دون بيانات دخول أو منفذ مخصص.', 'error');
    productUrl.focus();
    return;
  }

  const shop = detectShop(url.hostname);
  if (!shop) {
    notify('هذا المتجر غير مدعوم حالياً. استخدم رابطاً من Temu أو AliExpress أو Amazon أو SHEIN أو eBay أو Walmart أو Etsy أو ASOS.', 'error');
    productUrl.focus();
    return;
  }

  notify('الرابط صالح مبدئياً من متجر ' + shop + '. سيتم فتح نموذج إرسال الطلب؛ لا يتم الشراء أو تأكيد السعر والشحن تلقائياً.', 'success');
  const continueUrl = 'request.html?url=' + encodeURIComponent(url.href);
  window.location.href = continueUrl;
});

document.querySelectorAll('.shop').forEach(button => {
  button.addEventListener('click', () => {
    const shop = button.dataset.shop;
    if (!shopDomains[shop]) {
      notify('ستُضاف متاجر أخرى عند دعمها رسمياً.', 'info');
      return;
    }

    productUrl.focus();
    notify('افتح ' + shop + '، انسخ رابط صفحة المنتج ثم ألصقه هنا للتحقق منه.', 'info');
  });
});
