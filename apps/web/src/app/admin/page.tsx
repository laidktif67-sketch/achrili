"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import styles from "./admin.module.css";

type ProductRequestRow = {
  id: string;
  customerId: string;
  productUrl: string;
  productName: string | null;
  productPrice: number | string | null;
  productCurrency: string | null;
  variant: string | null;
  quantity: number;
  notes: string | null;
  destination: string;
  status: string;
  createdAt: string;
  customerPhone: string | null;
  shop: string;
};
type Notice = { message: string; kind: "info" | "success" | "error" } | null;

function money(value: number | string, currency: string) {
  return Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;
}

export default function AdminPage() {
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ProductRequestRow[]>([]);
  const [selected, setSelected] = useState<ProductRequestRow | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [productCost, setProductCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [customsEstimate, setCustomsEstimate] = useState("0");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [quoteId, setQuoteId] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          window.location.replace("/auth?next=/admin");
          return;
        }
        if (data.session.user.app_metadata?.role !== "admin") {
          if (active) setNotice({ message: "هذه الصفحة مخصصة للمدير المخوّل فقط.", kind: "error" });
          return;
        }
        if (active) setAdmin(true);
        await loadRequests();
      } catch {
        if (active) setNotice({ message: "تعذّر تحميل لوحة الإدارة.", kind: "error" });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function invoke(body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke("admin-quotes", { body });
    if (error) throw new Error(error.message || "تعذّر الاتصال بخدمة الإدارة.");
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function loadRequests() {
    const result = await invoke({ action: "list_submitted_requests" });
    setRequests((result.requests ?? []) as ProductRequestRow[]);
  }

  function chooseRequest(request: ProductRequestRow) {
    setSelected(request);
    setCurrency(request.productCurrency || "USD");
    setProductCost(request.productPrice === null ? "" : String(request.productPrice));
    setShippingCost("");
    setCustomsEstimate("0");
    setNotes("");
    setNotice({ message: "تم اختيار الطلب. راجع سعر العميل ثم أكمل تكاليف العرض.", kind: "info" });
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function createQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy) return;
    const product = Number(productCost);
    const shipping = Number(shippingCost);
    const customs = Number(customsEstimate);
    if (![product, shipping, customs].every(Number.isFinite) || [product, shipping, customs].some(value => value < 0)) {
      setNotice({ message: "تحقق من المبالغ؛ يجب أن تكون أرقاماً صحيحة وغير سالبة.", kind: "error" });
      return;
    }
    setBusy(true);
    try {
      const result = await invoke({
        action: "create_quote",
        requestId: selected.id,
        currency,
        productCost: product,
        shippingCost: shipping,
        customsEstimate: customs,
        notes: notes.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
      });
      const id = result.quote?.id;
      if (id) setQuoteId(id);
      setNotice({ message: "تم إنشاء عرض السعر كمسودة. لم يتم إرساله إلى الزبون بعد.", kind: "success" });
      setSelected(null);
      await loadRequests();
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "تعذّر إنشاء عرض السعر.", kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function sendQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !quoteId.trim()) return;
    setBusy(true);
    try {
      const result = await invoke({ action: "send_quote", quoteId: quoteId.trim() });
      setNotice({ message: "تم تغيير حالة العرض إلى " + result.quote?.status + ".", kind: "success" });
      setQuoteId("");
      await loadRequests();
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "تعذّر إرسال عرض السعر.", kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.root} dir="rtl">
      <header className={styles.top}>
        <strong>AchriLi · إدارة الطلبات</strong>
        <Link href="/">العودة إلى الموقع</Link>
      </header>
      <main className={styles.page}>
        <div className={styles.heading}>
          <div><p>لوحة المدير</p><h1>طلبات الزبائن وعروض الأسعار</h1><span>راجع السعر الذي أدخله الزبون، ثم أنشئ عرض السعر النهائي.</span></div>
          {admin && <button type="button" className={styles.secondary} onClick={() => void loadRequests().catch(error => setNotice({ message: error.message, kind: "error" }))}>تحديث الطلبات</button>}
        </div>
        {notice && <div className={styles.notice + " " + (notice.kind === "error" ? styles.error : notice.kind === "success" ? styles.success : "")} role="status">{notice.message}</div>}
        {loading && <div className={styles.card}>جارٍ التحقق من صلاحياتك وتحميل لوحة الإدارة...</div>}
        {!loading && !admin && <div className={styles.card}>لا تملك صلاحية الوصول إلى هذه الصفحة.</div>}
        {admin && <>
          <section className={styles.section}>
            <div className={styles.sectionHeading}><h2>الطلبات التي تنتظر التسعير</h2><span>{requests.length} طلب</span></div>
            {!requests.length ? <div className={styles.card}>لا توجد طلبات جديدة متاحة للتسعير حالياً.</div> : requests.map(request => (
              <article className={styles.card} key={request.id}>
                <div className={styles.requestTitle}><h3>{request.productName || "طلب منتج"}</h3><span>{request.status}</span></div>
                <p className={styles.meta}>المتجر: {request.shop || "غير معروف"} · الكمية: {request.quantity} · الوجهة: {request.destination || "—"}</p>
                <div className={styles.sourcePrice}>
                  <span>السعر الذي أدخله الزبون</span>
                  <strong>{request.productPrice == null ? "لم يحدد سعراً" : money(request.productPrice, request.productCurrency || "—")}</strong>
                </div>
                <p className={styles.meta}>هاتف الزبون: {request.customerPhone || "غير مسجل"}</p>
                {request.variant && <p>المواصفات: {request.variant}</p>}
                {request.notes && <p>ملاحظات الزبون: {request.notes}</p>}
                <div className={styles.actions}>
                  <a href={request.productUrl} target="_blank" rel="noopener noreferrer">فتح رابط المنتج</a>
                  <button type="button" onClick={() => chooseRequest(request)}>إنشاء عرض لهذا الطلب</button>
                </div>
              </article>
            ))}
          </section>

          <section className={styles.section} id="quote-form">
            <h2>إنشاء عرض سعر</h2>
            {!selected ? <div className={styles.card}>اختر طلباً من القائمة لبدء إنشاء عرض السعر. سيتم اقتراح سعر الزبون وعملته تلقائياً.</div> : <form className={styles.card} onSubmit={createQuote}>
              <p className={styles.meta}>الطلب المحدد: {selected.productName || selected.id}</p>
              <div className={styles.grid}>
                <label>عملة العرض<select value={currency} onChange={event => setCurrency(event.target.value)}><option value="USD">USD</option><option value="EUR">EUR</option><option value="DZD">DZD</option></select></label>
                <label>سعر المنتج<input required type="number" min="0" step="0.01" value={productCost} onChange={event => setProductCost(event.target.value)} /></label>
                <label>تكلفة الشحن<input required type="number" min="0" step="0.01" value={shippingCost} onChange={event => setShippingCost(event.target.value)} /></label>
                <label>تقدير الجمارك<input type="number" min="0" step="0.01" value={customsEstimate} onChange={event => setCustomsEstimate(event.target.value)} /></label>
                <label>صلاحية العرض (اختياري)<input type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} /></label>
              </div>
              <label className={styles.fullLabel}>ملاحظات للزبون<textarea rows={3} maxLength={4000} value={notes} onChange={event => setNotes(event.target.value)} /></label>
              <div className={styles.actions}><button type="submit" disabled={busy}>{busy ? "جارٍ الإنشاء..." : "إنشاء عرض كمسودة"}</button><button type="button" className={styles.secondary} onClick={() => setSelected(null)}>إلغاء</button></div>
            </form>}
          </section>

          <section className={styles.section}>
            <h2>إرسال عرض موجود</h2>
            <form className={styles.card} onSubmit={sendQuote}>
              <label className={styles.fullLabel}>معرّف عرض السعر<input required value={quoteId} onChange={event => setQuoteId(event.target.value)} placeholder="ألصق معرّف العرض هنا" /></label>
              <button type="submit" disabled={busy || !quoteId.trim()}>{busy ? "جارٍ الإرسال..." : "إرسال العرض إلى الزبون"}</button>
            </form>
            <p className={styles.meta}>الإرسال يغيّر حالة العرض إلى SENT؛ لا يرسل إشعاراً خارجياً حالياً.</p>
          </section>
        </>}
      </main>
    </div>
  );
}
