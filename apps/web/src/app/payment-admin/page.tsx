"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import styles from "./payment-admin.module.css";

type Method={id:string;code:string;displayName:string;enabled:boolean;accountHolder:string|null;accountIdentifier:string|null;walletAddress:string|null;network:string|null;instructions:string|null};
type Payment={id:string;customerId:string;requestId:string;quoteId:string;paymentMethodId:string;amount:number|string;currency:string;status:string;proofPath:string;transactionReference:string|null;reviewNote:string|null;createdAt:string;methodName:string;proofUrl:string|null};
type Notice={message:string;kind:"info"|"error"|"success"}|null;
function validMethod(m:Method,holder:string,identifier:string,wallet:string){if(m.code==="CCP_TRANSFER")return Boolean(holder.trim()&&identifier.trim());if(m.code==="USDT_BEP20")return m.network==="BEP20"&&/^0x[a-fA-F0-9]{40}$/.test(wallet.trim());return false}
function money(v:number|string,c:string){return Number(v).toLocaleString("fr-FR",{maximumFractionDigits:2})+" "+c}

export default function PaymentAdminPage(){
 const [admin,setAdmin]=useState(false);
 const [loading,setLoading]=useState(true);
 const [methods,setMethods]=useState<Method[]>([]);
 const [payments,setPayments]=useState<Payment[]>([]);
 const [notice,setNotice]=useState<Notice>(null);
 const [busy,setBusy]=useState<string|null>(null);
 useEffect(()=>{let active=true;(async()=>{
  try{const {data,error}=await supabase.auth.getSession();if(error||!data.session){window.location.replace("/auth?next=/payment-admin");return}
   if(data.session.user.app_metadata?.role!=="admin"){if(active)setNotice({message:"هذه الصفحة مخصصة للمدير المخوّل فقط.",kind:"error"});return}
   if(active)setAdmin(true);
   await Promise.all([loadMethods(),loadPayments()]);
  }catch{if(active)setNotice({message:"تعذّر تحميل لوحة الدفع.",kind:"error"})}finally{if(active)setLoading(false)}
 })();return()=>{active=false}},[]);
 async function loadMethods(){const {data,error}=await supabase.from("PaymentMethod").select("*").order("code");if(error)throw error;setMethods((data??[]) as Method[])}
 async function loadPayments(){
  const {data,error}=await supabase.from("Payment").select("id,customerId,requestId,quoteId,paymentMethodId,amount,currency,status,proofPath,transactionReference,reviewNote,createdAt").order("createdAt",{ascending:false}).limit(100);
  if(error)throw error;
  const rows=(data??[]) as Omit<Payment,"methodName"|"proofUrl">[];
  const names=new Map(methods.map(m=>[m.id,m.displayName]));
  const mapped=await Promise.all(rows.map(async p=>{const {data:signed}=await supabase.storage.from("payment-proofs").createSignedUrl(p.proofPath,300);return {...p,methodName:names.get(p.paymentMethodId)||p.paymentMethodId,proofUrl:signed?.signedUrl||null}}));
  setPayments(mapped);
 }
 async function saveMethod(m:Method,form:HTMLFormElement){
  const fd=new FormData(form);const holder=String(fd.get("accountHolder")||"");const identifier=String(fd.get("accountIdentifier")||"");const wallet=String(fd.get("walletAddress")||"");const instructions=String(fd.get("instructions")||"");const enabled=fd.has("enabled");
  if(enabled&&!validMethod(m,holder,identifier,wallet)){setNotice({message:"لا يمكن تفعيل وسيلة الدفع قبل إدخال البيانات المطلوبة بصورة صحيحة.",kind:"error"});return}
  const patch:any={enabled,accountHolder:holder.trim()||null,accountIdentifier:identifier.trim()||null,walletAddress:wallet.trim()||null,instructions:instructions.trim()||null,updatedAt:new Date().toISOString()};
  if(m.code==="USDT_BEP20")patch.network="BEP20";else patch.network=null;
  setBusy(m.id);try{const {error}=await supabase.from("PaymentMethod").update(patch).eq("id",m.id);if(error)throw error;await loadMethods();setNotice({message:"تم حفظ إعدادات وسيلة الدفع.",kind:"success"})}catch(e){setNotice({message:e instanceof Error?e.message:"تعذّر حفظ الإعدادات.",kind:"error"})}finally{setBusy(null)}
 }
 async function review(p:Payment,form:HTMLFormElement){
  const fd=new FormData(form);const status=String(fd.get("status")||p.status);const reviewNote=String(fd.get("reviewNote")||"").trim();
  if(!["PENDING","UNDER_REVIEW","CONFIRMED","REJECTED"].includes(status)){setNotice({message:"حالة دفع غير صالحة.",kind:"error"});return}
  if(["CONFIRMED","REJECTED"].includes(p.status)&&status!==p.status){setNotice({message:"لا يمكن إعادة فتح مراجعة نهائية أو عكسها.",kind:"error"});return}
  setBusy(p.id);try{const {error}=await supabase.from("Payment").update({status,reviewNote:reviewNote||null}).eq("id",p.id);if(error)throw error;setNotice({message:"تم تحديث المراجعة. لا تؤكد التحويل إلا بعد التحقق اليدوي من استلامه.",kind:"success"});await loadPayments()}catch(e){setNotice({message:e instanceof Error?e.message:"تعذّر تحديث الدفع.",kind:"error"})}finally{setBusy(null)}
 }
 return <div className={styles.root}>
  <header className={styles.top}><strong>AchriLi · إدارة الدفع</strong><Link href="/">العودة للموقع</Link></header>
  <main className={styles.page}><h1>وسائل الدفع والتحويلات</h1><p className={styles.muted}>التحقق يدوي. لا تؤكد التحويل بناءً على صورة وحدها؛ راجع الحساب أو المعاملة على الشبكة. بيانات الوسائل لا تظهر للزبائن إلا عندما تكون مفعّلة.</p>
   {notice&&<div className={styles.card+" "+(notice.kind==="error"?styles.error:notice.kind==="success"?styles.success:"")}>{notice.message}</div>}
   {loading&&<div className={styles.card}>جارٍ تحميل لوحة الدفع...</div>}
   {admin&&<>
    <section><h2>إعداد وسائل الدفع</h2>{methods.map(m=><article className={styles.card} key={m.id}><h3>{m.displayName}</h3><form onSubmit={e=>{e.preventDefault();void saveMethod(m,e.currentTarget)}}><div className={styles.grid}>
      {m.code==="CCP_TRANSFER"?<><div><label className={styles.label}>اسم صاحب الحساب</label><input className={styles.input} name="accountHolder" defaultValue={m.accountHolder||""}/></div><div><label className={styles.label}>رقم CCP / RIP</label><input className={styles.input} name="accountIdentifier" defaultValue={m.accountIdentifier||""}/></div></>:<div><label className={styles.label}>عنوان محفظة BEP20</label><input className={styles.input} name="walletAddress" defaultValue={m.walletAddress||""}/></div>}
     </div><label className={styles.label}>تعليمات للزبون</label><textarea className={styles.textarea} name="instructions" defaultValue={m.instructions||""}/>{m.code==="USDT_BEP20"&&<p className={styles.muted}>الشبكة ثابتة على BEP20. لا تفعّلها قبل التحقق من العنوان.</p>}<label className={styles.label}><input type="checkbox" name="enabled" defaultChecked={m.enabled} style={{width:"auto"}}/> تفعيل وسيلة الدفع</label><button className={styles.button} disabled={busy===m.id}>{busy===m.id?"جارٍ الحفظ...":"حفظ الإعدادات"}</button></form></article>)}</section>
    <section><h2>مراجعة إثباتات الدفع</h2><button className={styles.button+" "+styles.secondary} onClick={()=>void Promise.all([loadMethods(),loadPayments()]).catch(()=>setNotice({message:"تعذّر تحديث البيانات.",kind:"error"}))}>تحديث البيانات</button>
     {payments.length===0?<p className={styles.muted}>لا توجد إثباتات دفع حتى الآن.</p>:payments.map(p=><article className={styles.row} key={p.id}><h3>{p.methodName} · {money(p.amount,p.currency)}</h3><p className={styles.muted}>الحالة: {p.status} · الطلب: {p.requestId} · العرض: {p.quoteId}</p><p className={styles.muted}>العميل: {p.customerId}</p>{p.transactionReference&&<p className={styles.muted}>مرجع العملية: {p.transactionReference}</p>}{p.proofUrl&&<p><a href={p.proofUrl} target="_blank" rel="noopener noreferrer">فتح إثبات الدفع (رابط مؤقت 5 دقائق)</a></p>}{p.reviewNote&&<p className={styles.muted}>ملاحظة المراجعة: {p.reviewNote}</p>}
      <form className={styles.actions} onSubmit={e=>{e.preventDefault();void review(p,e.currentTarget)}}><select className={styles.select} name="status" defaultValue={p.status} disabled={["CONFIRMED","REJECTED"].includes(p.status)}>{["PENDING","UNDER_REVIEW","CONFIRMED","REJECTED"].map(s=><option key={s} value={s}>{s}</option>)}</select><input className={styles.input} name="reviewNote" maxLength={2000} placeholder="ملاحظة مراجعة (اختياري)" defaultValue={p.reviewNote||""}/><button className={styles.button} disabled={busy===p.id||["CONFIRMED","REJECTED"].includes(p.status)}>{busy===p.id?"جارٍ الحفظ...":"حفظ المراجعة"}</button></form>
     </article>)}
    </section>
   </>}
  </main>
 </div>
}
