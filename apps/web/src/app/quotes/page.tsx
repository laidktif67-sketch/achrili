"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import styles from "./quotes.module.css";

const requestStatus:Record<string,string>={SUBMITTED:"تم الإرسال",UNDER_REVIEW:"قيد المراجعة",NEEDS_INFORMATION:"معلومات إضافية مطلوبة",QUOTED:"عرض سعر متاح",REJECTED:"مرفوض",ACCEPTED:"مقبول",CANCELLED:"ملغى",PURCHASED:"تم الشراء",SHIPPED:"تم الشحن",DELIVERED:"تم التسليم"};
const quoteStatus:Record<string,string>={DRAFT:"مسودة",SENT:"أُرسل للعميل",ACCEPTED:"مقبول",REJECTED:"مرفوض",EXPIRED:"انتهت صلاحيته"};
function money(v:number,c="DZD"){return Number(v).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" "+c}
type Quote={id:string;requestId:string;currency:string;productCost:number;shippingCost:number;serviceFee:number;customsEstimate:number|null;total:number;notes:string|null;expiresAt:string|null;status:string;createdAt:string};
type Request={id:string;productUrl:string;productName:string|null;quantity:number;status:string;createdAt:string};

export default function QuotesPage(){
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [requests,setRequests]=useState<Request[]>([]);
 const [quotes,setQuotes]=useState<Quote[]>([]);
 useEffect(()=>{let active=true;(async()=>{
  try{
   const {data:session,error:authError}=await supabase.auth.getSession();
   if(authError||!session.session){window.location.replace("/auth?next="+encodeURIComponent("/quotes"));return}
   const {data:req,error:reqError}=await supabase.from("ProductRequest").select("id,productUrl,productName,quantity,status,createdAt").eq("customerId",session.session.user.id).order("createdAt",{ascending:false}).limit(50);
   if(reqError)throw reqError;
   const ids=(req??[]).map((r:any)=>r.id);
   let quoteRows:Quote[]=[];
   if(ids.length){const {data:q,error:qError}=await supabase.from("Quote").select("id,requestId,currency,productCost,shippingCost,serviceFee,customsEstimate,total,notes,expiresAt,status,createdAt").in("requestId",ids).order("createdAt",{ascending:false});if(qError)throw qError;quoteRows=(q??[]) as Quote[]}
   if(active){setRequests((req??[]) as Request[]);setQuotes(quoteRows)}
  }catch{if(active)setError(true)}finally{if(active)setLoading(false)}
 })();return()=>{active=false}},[]);
 const byRequest=new Map<string,Quote[]>();for(const q of quotes){const list=byRequest.get(q.requestId)||[];list.push(q);byRequest.set(q.requestId,list)}
 return <div className={styles.root}>
  <header className={styles.top}><Link className={styles.brand} href="/">Achri<span>Li</span></Link><Link href="/auth">حسابي</Link></header>
  <main className={styles.page}>
   <section className={styles.intro}><p className={styles.muted}>حساب الزبون / عروض الأسعار</p><h1>طلباتي وعروض الأسعار</h1><p className={styles.muted}>راجع طلباتك وعروض الأسعار هنا. عند إرسال عرض سعر، ستجد خيار المتابعة إلى الدفع من بطاقة العرض.</p></section>
   {loading&&<div className={styles.notice}>جارٍ تحميل طلباتك وعروض الأسعار...</div>}
   {error&&<div className={styles.notice+" "+styles.error}>تعذّر تحميل البيانات. تحقق من تسجيل الدخول واتصالك ثم أعد المحاولة.</div>}
   {!loading&&!error&&!requests.length&&<div className={styles.notice+" "+styles.empty}>لا توجد طلبات حتى الآن. <Link href="/request">أرسل رابط منتج جديد</Link>.</div>}
   {requests.map(req=><article className={styles.card} key={req.id}>
    <h2>{req.productName||"طلب منتج"}</h2>
    <p className={styles.muted}>الكمية: {req.quantity} · الحالة: {requestStatus[req.status]||req.status}</p>
    <a href={req.productUrl} target="_blank" rel="noopener noreferrer">فتح رابط المنتج</a>
    {(byRequest.get(req.id)||[]).length===0?<p className={styles.small}>لم يصدر عرض سعر لهذا الطلب بعد. سنعرضه هنا بعد مراجعته.</p>:
     (byRequest.get(req.id)||[]).map(q=><section className={styles.quote} key={q.id}>
      <h3>عرض السعر</h3><span className={styles.pill}>{quoteStatus[q.status]||q.status||"—"}</span>
      {([["سعر المنتج",q.productCost],["الشحن",q.shippingCost],["رسوم خدمة AchriLi",q.serviceFee]] as [string,number][]).map(([label,value])=><div className={styles.line} key={label}><span>{label}</span><strong>{money(value,q.currency||"DZD")}</strong></div>)}
      {q.customsEstimate!==null&&q.customsEstimate!==undefined&&<div className={styles.line}><span>تقدير الرسوم الجمركية</span><strong>{money(q.customsEstimate,q.currency||"DZD")}</strong></div>}
      <div className={styles.line+" "+styles.total}><span>الإجمالي المسجل</span><strong>{money(q.total,q.currency||"DZD")}</strong></div>
      {q.notes&&<p className={styles.small}>{q.notes}</p>}
      {q.expiresAt&&<p className={styles.small}>صلاحية العرض حتى: {new Date(q.expiresAt).toLocaleString("ar-DZ")}</p>}
      {q.status==="SENT"&&(!q.expiresAt||Date.parse(q.expiresAt)>Date.now())&&<Link className={styles.pay} href={"/payments?quote="+encodeURIComponent(q.id)}>مراجعة العرض والمتابعة إلى الدفع</Link>}
      <p className={styles.small}>إرسال إثبات الدفع لا يؤكد استلام الأموال؛ يراجع المدير التحويل يدويًا. USDT BEP20 متاح فقط عندما يكون مبلغ العرض بالدولار USD.</p>
     </section>)}
   </article>)}
  </main>
  <footer className={styles.footer}>© AchriLi · التسوّق من العالم إلى الجزائر · <Link href="/help">المساعدة والأسئلة الشائعة</Link></footer>
 </div>
}
