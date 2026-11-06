"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type Notice = { message: string; kind: "info" | "success" | "error" } | null;

const shops = [
  { name: "Temu", file: "temu.svg", domains: ["temu.com"] },
  { name: "AliExpress", file: "aliexpress.svg", domains: ["aliexpress.com"] },
  { name: "Amazon", file: "amazon.svg", domains: ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.it", "amazon.es"] },
  { name: "SHEIN", file: "shein.svg", domains: ["shein.com"] },
  { name: "eBay", file: "ebay.svg", domains: ["ebay.com"] },
  { name: "Walmart", file: "walmart.svg", domains: ["walmart.com"] },
  { name: "Etsy", file: "etsy.svg", domains: ["etsy.com"] },
  { name: "ASOS", file: "asos.svg", domains: ["asos.com"] }
];

function detectShop(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return shops.find((shop) => shop.domains.some((domain) => host === domain || host.endsWith("." + domain)));
}

export default function HomePage() {
  const router = useRouter();
  const [productUrl, setProductUrl] = useState("");
  const [notice, setNotice] = useState<Notice>(null);

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let url: URL;
    try {
      url = new URL(productUrl.trim());
    } catch {
      setNotice({ message: "الرابط غير صحيح. انسخ رابط المنتج كاملاً من المتجر.", kind: "error" });
      return;
    }

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.href.length > 2048
    ) {
      setNotice({ message: "استخدم رابط HTTPS مباشر من متجر مدعوم، دون بيانات دخول أو منفذ مخصص.", kind: "error" });
      return;
    }

    const shop = detectShop(url.hostname);
    if (!shop) {
      setNotice({ message: "هذا المتجر غير مدعوم حالياً. اختر أحد المتاجر الظاهرة أدناه.", kind: "error" });
      return;
    }

    setNotice({
      message: "الرابط صالح مبدئياً من متجر " + shop.name + ". سننتقل إلى نموذج إرسال الطلب؛ لا يتم الشراء أو تأكيد السعر والشحن تلقائياً.",
      kind: "success"
    });
    router.push("/request?url=" + encodeURIComponent(url.href));
  }

  return (
    <div className="home-page">
    <main className="wrap">
      <header>
        <button className="round" type="button" aria-label="الإشعارات" onClick={() => setNotice({ message: "لا توجد إشعارات جديدة حالياً.", kind: "info" })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
        </button>
        <a className="brand" href="/" aria-label="AchriLi">
          <div className="brand-en">Achri<span>Li</span></div>
          <div className="brand-ar">اشريلي</div>
          <div className="tag">SHOP THE WORLD. FROM <b>ALGERIA.</b></div>
        </a>
        <a className="round" href="/auth" aria-label="حسابي">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
        </a>
      </header>

      <form className="search" id="linkForm" onSubmit={submitProduct}>
        <input
          id="productUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="ألصق رابط المنتج من المتجر..."
          aria-label="رابط المنتج"
          required
          value={productUrl}
          onChange={(event) => setProductUrl(event.target.value)}
        />
        <button type="submit">تابع طلب المنتج ←</button>
      </form>
      <p className="search-note">أرسل رابط المنتج، ثم راجع تفاصيل السعر والشحن قبل تأكيد أي طلب. لا يتم الشراء تلقائياً.</p>
      {notice && <div className={"notice " + notice.kind} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</div>}

      <section className="hero" aria-label="تسوّق من العالم">
        <img src="/assets/achrili-main-hero.svg" alt="AchriLi — أرسل رابط المنتج وراجع تفاصيل السعر والشحن قبل التأكيد" />
      </section>

      <section className="section" id="shops">
        <h2 className="section-title">متاجر عالمية بين يديك</h2>
        <p className="shops-intro">اكتشف أشهر المتاجر العالمية وأرسل رابط المنتج الذي يعجبك.</p>
        <div className="shops">
          {shops.map((shop) => (
            <button className="shop" key={shop.name} type="button" onClick={() => setNotice({ message: "افتح " + shop.name + "، انسخ رابط صفحة المنتج ثم ألصقه في الحقل أعلاه للتحقق منه.", kind: "info" })}>
              <span className="logo"><img className="shop-logo" src={"/assets/images/shops/" + shop.file} alt={shop.name} loading="lazy" /></span>
              <span>{shop.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">كيف تعمل AchriLi؟</h2>
        <div className="steps">
          <article className="step">
            <span className="num">1</span>
            <div className="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" /></svg></div>
            <h3>أرسل رابط المنتج</h3><p>من متجرك العالمي المفضل</p>
          </article>
          <article className="step">
            <span className="num">2</span>
            <div className="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 3h2l2.4 12.1a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.4L22 8H6" /><circle cx="10" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg></div>
            <h3>نراجع طلبك</h3><p>نوضح السعر والشحن قبل التأكيد</p>
          </article>
          <article className="step">
            <span className="num">3</span>
            <div className="step-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5" /></svg></div>
            <h3>تابع حالة طلبك</h3><p>بعد تأكيد تفاصيل الخدمة</p>
          </article>
        </div>
      </section>

      <section className="service-note" aria-label="معلومة مهمة">
        <span className="service-note-icon" aria-hidden="true">i</span>
        <p><strong>قبل إرسال طلبك</strong><br />نراجع الرابط أولاً، ثم تظهر لك تفاصيل السعر والشحن المتاحة قبل اتخاذ قرارك. إرسال الرابط وحده لا يعني تأكيد الشراء.</p>
        <a href="/help">اعرف المزيد</a>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} AchriLi — اشريلي · تسوّق من العالم
        <p className="footer-links">
          <a href="/help">المساعدة والأسئلة الشائعة</a>
          <a href="/request">إرسال طلب</a>
          <a href="/privacy">سياسة الخصوصية</a>
          <a href="/terms">الشروط والأحكام</a>
        </p>
      </footer>

      <nav className="bottom" aria-label="التنقل">
        <a href="/" aria-current="page"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z" /></svg></span>الرئيسية</a>
        <button type="button" onClick={() => document.getElementById("shops")?.scrollIntoView({ behavior: "smooth" })}><span aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg></span>المتاجر</button>
        <a className="center" href="/request"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10" /></svg></span>اشتري لي</a>
        <a href="/quotes"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2Z" /></svg></span>طلباتي</a>
        <a href="/auth"><span aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg></span>حسابي</a>
      </nav>
    </main>
    </div>
  );
}
