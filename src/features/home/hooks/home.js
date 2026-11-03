const noticeBox = document.getElementById('notice');
const productUrl = document.getElementById('productUrl');
import { findSupportedShop, isValidProductUrl } from '../../product-request/model/product-request.js';

function notify(message, kind = 'info') {
  noticeBox.textContent = message;
  noticeBox.className = 'notice ' + kind;
  noticeBox.style.display = 'block';
  noticeBox.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  noticeBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

window.notify = notify;


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

  if (!isValidProductUrl(url.href)) {
    notify('استخدم رابط HTTPS مباشر من متجر مدعوم، من دون بيانات دخول أو منفذ مخصص، وبطول لا يتجاوز 2048 حرفاً.', 'error');
    productUrl.focus();
    return;
  }

  const shop = findSupportedShop(url.hostname);
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
