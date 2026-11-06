"use client";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findSupportedShop, isValidProductUrl } from "@achrili/shared/domain/product-request";
import { supabase } from "../../lib/supabase";
import styles from "./request.module.css";

const DRAFT_KEY="achrili-product-request-draft";
function findShop(host: string) {
  return findSupportedShop(host);
}
function dzd(v:number){return new Intl.NumberFormat("ar-DZ",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" دج"}
type Notice={message:string;kind:"info"|"success"|"error"}|null;
type FormState={url:string;price:string;currency:"USD"|"EUR";quantity:string;destination:string;phone:string;variant:string;notes:string};
const initial:FormState={url:"",price:"",currency:"USD",quantity:"1",destination:"Algeria",phone:"",variant:"",notes:""};

export default function ProductRequestPage(){
 const router=useRouter();
 const [form,setForm]=useState<FormState>(initial);
 const [pricing,setPricing]=useState<{usd:number;eur:number;fee:number}|null>(null);
 const [pricingMessage,setPricingMessage]=useState("جارٍ تحميل إعدادات التسعير...");
 const [notice,setNotice]=useState<Notice>(null);
 const [shop,setShop]=useState<string|null>(null);
 const [user,setUser]=useState<any>(null);
 const [authChecked,setAuthChecked]=useState(false);
 const [draftLoaded,setDraftLoaded]=useState(false);
 const [busy,setBusy]=useState(false);

 useEffect(()=>{let active=true;supabase.auth.getSession().then(({data,error})=>{if(!active)return;const u=error?null:data.session?.user??null;setUser(u);setAuthChecked(true);if(u?.user_metadata?.phone)setForm(f=>({...f,phone:f.phone||u.user_metadata.phone}))});return()=>{active=false}},[]);
 useEffect(()=>{let active=true;(async()=>{try{const {data,error}=await supabase.from("AppSetting").select("key,value").in("key",["usd_to_dzd_rate","eur_to_dzd_rate","service_fee_dzd"]);if(error)throw error;const m=new Map((data??[]).map((r:any)=>[r.key,Number(r.value)]));const p={usd:Number(m.get("usd_to_dzd_rate")),eur:Number(m.get("eur_to_dzd_rate")),fee:Number(m.get("service_fee_dzd"))};if(!Number.isFinite(p.usd)||p.usd<=0||!Number.isFinite(p.eur)||p.eur<=0||!Number.isFinite(p.fee)||p.fee<0)throw Error();if(active){setPricing(p);setPricingMessage("التقدير لا يشمل الشحن أو الجمارك؛ السعر النهائي يتأكد بعد مراجعة الطلب.")}}catch{if(active){setPricing(null);setPricingMessage("تعذّر تحميل إعدادات التسعير حالياً. يمكنك إرسال الطلب دون تقدير.")}}})();return()=>{active=false}},[]);
 useEffect(()=>{try{const query=new URLSearchParams(window.location.search).get("url")||"";const raw=localStorage.getItem(DRAFT_KEY);if(raw){const d=JSON.parse(raw);if(d&&Number.isFinite(d.updatedAt)&&Date.now()-d.updatedAt<=7*86400000&&d.updatedAt<=Date.now()+60000){setForm(f=>({...f,...d,url:query||d.url,currency:d.currency==="EUR"?"EUR":"USD"}))}else{localStorage.removeItem(DRAFT_KEY);if(query)setForm(f=>({...f,url:query}))}}else if(query)setForm(f=>({...f,url:query}))}catch{}setDraftLoaded(true)},[]);
 useEffect(()=>{if(!draftLoaded)return;try{if(form.url||form.price||form.variant||form.notes||form.quantity!=="1")localStorage.setItem(DRAFT_KEY,JSON.stringify({...form,updatedAt:Date.now()}));else localStorage.removeItem(DRAFT_KEY)}catch{}},[form,draftLoaded]);
 useEffect(()=>{try{const u=new URL(form.url);setShop(u.protocol==="https:"?findShop(u.hostname):null)}catch{setShop(null)}},[form.url]);
 const estimate=useMemo(()=>{if(!pricing||!form.price.trim())return null;const a=Number(form.price),q=Number(form.quantity);if(!Number.isFinite(a)||a<0||!Number.isFinite(q)||q<1)return null;return Math.round((a*(form.currency==="EUR"?pricing.eur:pricing.usd)*q+pricing.fee)*100)/100},[pricing,form.price,form.quantity,form.currency]);
 function change<K extends keyof FormState>(k:K,v:FormState[K]){setForm(f=>({...f,[k]:v}))}
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;if(!user){setNotice({message:"يجب تسجيل الدخول أولاً قبل إرسال الطلب.",kind:"info"});router.push("/auth?next="+encodeURIComponent("/request"));return}
 let url:URL;try{url=new URL(form.url.trim())}catch{setNotice({message:"أدخل رابط HTTPS صحيحاً من متجر مدعوم.",kind:"error"});return}
 const detected=isValidProductUrl(url.href)?findShop(url.hostname):null;if(!detected){setNotice({message:"الرابط غير صالح أو المتجر غير مدعوم.",kind:"error"});return}
 const q=Number(form.quantity),digits=form.phone.replace(/\D/g,"");if(!Number.isInteger(q)||q<1||q>30){setNotice({message:"يجب أن تكون الكمية بين 1 و30.",kind:"error"});return}if(digits.length<9||digits.length>15){setNotice({message:"أدخل رقم هاتف صحيحاً مع مفتاح الدولة، مثل +213.",kind:"error"});return}if(!form.destination.trim()){setNotice({message:"أدخل وجهة التسليم.",kind:"error"});return}
 const rawPrice=form.price.trim();
 const enteredPrice=rawPrice===""?null:Number(rawPrice);
 if(rawPrice!==""&&(enteredPrice===null||!/^\d{1,10}(?:\.\d{1,2})?$/.test(rawPrice)||!Number.isFinite(enteredPrice)||enteredPrice<0)){
  setNotice({message:"أدخل سعراً صحيحاً بحد أقصى منزلتين عشريتين، أو اتركه فارغاً.",kind:"error"});return
 }
 setBusy(true);setNotice({message:"جارٍ إرسال الطلب...",kind:"info"});
 try{const {data:s,error:se}=await supabase.auth.getSession();if(se||!s.session)throw Error("AUTH_REQUIRED");const u=s.session.user;if((u.user_metadata?.phone||"").trim()!==form.phone.trim()){const {error}=await supabase.auth.updateUser({data:{...u.user_metadata,phone:form.phone.trim()}});if(error)throw error}
 const {error}=await supabase.from("ProductRequest").insert({id:crypto.randomUUID(),customerId:u.id,productUrl:url.href,productPrice:enteredPrice,productCurrency:enteredPrice===null?null:form.currency,quantity:q,notes:form.notes.trim()||null,variant:form.variant.trim()||null,destination:form.destination.trim(),status:"SUBMITTED"});if(error)throw error;localStorage.removeItem(DRAFT_KEY);setForm({...initial,phone:form.phone});setNotice({message:"تم حفظ طلبك بنجاح. يمكنك متابعة حالته من صفحة طلباتك.",kind:"success"})
 }catch(err){setNotice({message:err instanceof Error&&err.message==="AUTH_REQUIRED"?"انتهت جلسة تسجيل الدخول. سجّل الدخول ثم أعد إرسال الطلب.":"تعذّر حفظ الطلب. تحقق من حسابك واتصالك ثم حاول مجدداً.",kind:"error"})}finally{setBusy(false)}
 }

 return <div className={styles.root}>
  <header className={styles.topbar}><Link className={styles.brand} href="/"><b>Achri<span>Li</span></b><small>اشريلي</small></Link><nav className={styles.links}><Link href="/">الرئيسية</Link><Link href="/auth">حسابي</Link></nav></header>
  <main className={styles.page}>
   <section className={styles.intro}><div><p className={styles.eyebrow}>خطوة نحو تسوّق أسهل</p><h1>أرسل طلب المنتج</h1><p>أضف رابط المنتج أولاً، ثم حدّد السعر والتفاصيل. سنحفظ طلبك في حسابك لتتمكن من متابعة حالته.</p></div><div className={styles.step}><span>01</span> رابط · سعر · تفاصيل</div></section>
   <div className={styles.draft}><span>تُحفظ المسودة على هذا الجهاز لمدة تصل إلى 7 أيام.</span><button className={styles.clear} type="button" onClick={()=>{localStorage.removeItem(DRAFT_KEY);setForm({...initial,phone:user?.user_metadata?.phone||""});setNotice({message:"تم مسح المسودة المحفوظة.",kind:"info"})}}>مسح المسودة</button></div>
   {notice&&<div className={styles.notice+" "+(notice.kind==="success"?styles.success:notice.kind==="error"?styles.error:styles.info)} role={notice.kind==="error"?"alert":"status"}>{notice.message}</div>}
   <form className={styles.form} onSubmit={submit}>
    <section className={styles.section}><div className={styles.heading}><span className={styles.number}>1</span><div><h2>رابط المنتج</h2><p>ألصق رابط المنتج من المتجر الذي تريد الشراء منه.</p></div></div><label className={styles.label} htmlFor="productUrl">رابط المنتج *</label><input className={styles.input+" "+styles.url} id="productUrl" type="url" required maxLength={2048} placeholder="https://..." value={form.url} onChange={e=>change("url",e.target.value)}/><p className={styles.hint}>يجب أن يكون الرابط من متجر مدعوم وأن يبدأ بـ HTTPS.</p><p className={styles.hint}>{shop?"المتجر المكتشف: "+shop:"سيُحدّد المتجر تلقائياً من الرابط."}</p></section>
    <section className={styles.section+" "+styles.priceBox}><div className={styles.heading}><span className={styles.number}>2</span><div><h2>سعر المنتج</h2><p>اختر العملة وأدخل السعر الظاهر في المتجر لتحصل على تقدير بالدينار الجزائري.</p></div></div><div className={styles.priceGrid}><div><label className={styles.label} htmlFor="productPrice">سعر المنتج في المتجر</label><input className={styles.input} id="productPrice" type="number" min="0" step="0.01" placeholder="مثال: 25.99" value={form.price} onChange={e=>change("price",e.target.value)}/></div><div><label className={styles.label} htmlFor="currency">عملة السعر</label><select className={styles.select} id="currency" value={form.currency} onChange={e=>change("currency",e.target.value as "USD"|"EUR")}><option value="USD">USD — دولار أمريكي</option><option value="EUR">EUR — أورو</option></select></div></div><div className={styles.priceLines}><div className={styles.priceLine}><span>سعر المنتج</span><strong>{form.price?form.price+" "+form.currency:"—"}</strong></div><div className={styles.priceLine}><span>رسوم الخدمة</span><strong>{pricing?dzd(pricing.fee):"—"}</strong></div><div className={styles.total}><span>المجموع التقديري</span><strong>{estimate===null?"أدخل سعر المنتج":dzd(estimate)}</strong></div></div><p className={styles.hint}>{pricingMessage}</p></section>
    <section className={styles.section}><div className={styles.heading}><span className={styles.number}>3</span><div><h2>تفاصيل الطلب</h2><p>أكمل الكمية والوجهة وبيانات التواصل وأي مواصفات مهمة.</p></div></div><div className={styles.grid}><div><label className={styles.label} htmlFor="quantity">الكمية *</label><input className={styles.input} id="quantity" type="number" min="1" max="30" required value={form.quantity} onChange={e=>change("quantity",e.target.value)}/></div><div><label className={styles.label} htmlFor="destination">وجهة التسليم</label><input className={styles.input} id="destination" maxLength={80} required value={form.destination} onChange={e=>change("destination",e.target.value)}/></div></div><label className={styles.label} htmlFor="phone">رقم الهاتف للتواصل *</label><input className={styles.input} id="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={24} placeholder="+213 5XX XX XX XX" required value={form.phone} onChange={e=>change("phone",e.target.value)}/><p className={styles.hint}>رقم إلزامي لنتواصل معك ونتأكد من تفاصيل طلبك.</p><label className={styles.label} htmlFor="variant">اللون / المقاس / النسخة (اختياري)</label><input className={styles.input} id="variant" maxLength={240} placeholder="مثال: أسود، مقاس M" value={form.variant} onChange={e=>change("variant",e.target.value)}/><label className={styles.label} htmlFor="notes">ملاحظات إضافية (اختياري)</label><textarea className={styles.textarea} id="notes" rows={3} maxLength={1500} placeholder="أي تفاصيل تساعدنا في تحديد المنتج..." value={form.notes} onChange={e=>change("notes",e.target.value)}/></section>
    <div className={styles.disclaimer}>هذا تقدير أولي فقط، ولا يشمل الشحن أو الجمارك. السعر النهائي يتأكد بعد مراجعة المنتج.</div>
    <div className={styles.submitRow}><p>{authChecked&&!user?<>يجب <Link href={"/auth?next="+encodeURIComponent("/request")}>تسجيل الدخول</Link> قبل إرسال الطلب.</>:"راجع الرابط والسعر قبل إرسال طلبك."}</p><button className={styles.submit} type="submit" disabled={busy||!authChecked}>{busy?"جارٍ إرسال الطلب...":"إرسال طلب المراجعة"}</button></div>
   </form>
   <footer className={styles.footer}>© {new Date().getFullYear()} AchriLi · تسوّق من العالم إلى الجزائر · <Link href="/help">المساعدة</Link></footer>
  </main>
 </div>;
}
