"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import styles from "./payments.module.css";

type Method={id:string;code:string;displayName:string;accountHolder:string|null;accountIdentifier:string|null;network:string|null;walletAddress:string|null;instructions:string|null};
type Quote={id:string;requestId:string;currency:string;total:number|string;status:string;expiresAt:string|null};
type Notice={message:string;kind:"info"|"success"|"error"|"warn"}|null;
function money(v:number|string,c:string){return Number(v).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" "+c}
function allowedFile(file:File|null){return Boolean(file&&["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)&&file.size>0&&file.size<=5*1024*1024)}

export default function PaymentsPage(){
 const [quote,setQuote]=useState<Quote|null>(null);
 const [methods,setMethods]=useState<Method[]>([]);
 const [user,setUser]=useState<any>(null);
 const [quoteId,setQuoteId]=useState("");
 const [selected,setSelected]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [reference,setReference]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<Notice>(null);
 const [submitted,setSubmitted]=useState(false);

 useEffect(()=>{let active=true;(async()=>{
  try{
   const params=new URLSearchParams(window.location.search);const id=params.get("quote")||"";setQuoteId(id);
   const {data:session,error:authError}=await supabase.auth.getSession();
   if(authError||!session.session){window.location.replace("/auth?next="+encodeURIComponent("/payments?quote="+id));return}
   if(!active)return;setUser(session.session.user);
   if(!id){setNotice({message:"افتح صفحة الدفع من عرض السعر الذي تريد دفعه.",kind:"warn"});return}
   const {data:q,error:qError}=await supabase.from("Quote").select("id,requestId,currency,total,status,expiresAt").eq("id",id).maybeSingle();
   if(qError||!q){setNotice({message:"تعذّر العثور على عرض السعر أو لا تملك صلاحية الوصول إليه.",kind:"error"});return}
   if(q.status!=="SENT"||(q.expiresAt&&Date.parse(q.expiresAt)<=Date.now())){setNotice({message:"الدفع متاح فقط لعرض سعر مُرسل وغير منتهي الصلاحية.",kind:"warn"});return}
   setQuote(q as Quote);
   const {data:rows,error:mError}=await supabase.from("PaymentMethod").select("id,code,displayName,accountHolder,accountIdentifier,network,walletAddress,instructions").eq("enabled",true);
   if(mError)throw mError;
   const compatible=(rows??[]).filter((m:Method)=>(m.code==="CCP_TRANSFER"&&q.currency==="DZD")||(m.code==="USDT_BEP20"&&q.currency==="USD")) as Method[];
   setMethods(compatible);if(compatible.length)setSelected(compatible[0].id);
   if(!compatible.length)setNotice({message:"لا توجد وسيلة دفع مفعّلة ومتوافقة مع عملة هذا العرض. CCP متاح لعروض DZD فقط، وUSDT BEP20 لعروض USD فقط.",kind:"warn"});
  }catch{if(active)setNotice({message:"تعذّر تحميل بيانات الدفع. تحقق من اتصالك ثم أعد المحاولة.",kind:"error"})}
  finally{if(active)setLoading(false)}
 })();return()=>{active=false}},[]);

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!quote||!user)return;
  const method=methods.find(m=>m.id===selected);
  if(!method){setNotice({message:"اختر وسيلة دفع متوافقة مع عرض السعر.",kind:"error"});return}
  if(!allowedFile(file)){setNotice({message:"ارفع صورة PNG أو JPG أو WebP أو ملف PDF بحجم لا يتجاوز 5 ميغابايت.",kind:"error"});return}
  if(reference.trim().length>200){setNotice({message:"رقم العملية طويل جداً.",kind:"error"});return}
  setBusy(true);setNotice({message:"جارٍ رفع إثبات الدفع...",kind:"info"});
  let proofPath:string|null=null;let paymentCreated=false;
  try{
   const ext=file!.type==="application/pdf"?"pdf":file!.type==="image/png"?"png":file!.type==="image/webp"?"webp":"jpg";
   proofPath=user.id+"/"+crypto.randomUUID()+"."+ext;
   const {error:uploadError}=await supabase.storage.from("payment-proofs").upload(proofPath,file!,{contentType:file!.type,upsert:false});
   if(uploadError)throw new Error("تعذّر رفع إثبات الدفع. "+uploadError.message);
   const {error:insertError}=await supabase.from("Payment").insert({quoteId:quote.id,paymentMethodId:method.id,proofPath,transactionReference:reference.trim()||null});
   if(insertError)throw new Error("تعذّر تسجيل الدفع. تحقق من أن العرض ما زال صالحاً ثم أعد المحاولة.");
   paymentCreated=true;setSubmitted(true);setNotice({message:"تم استلام إثبات الدفع بنجاح. الحالة الآن قيد المراجعة، ولم يتم تأكيد الدفع تلقائياً.",kind:"success"});
  }catch(error){
   if(proofPath&&!paymentCreated){const {error:cleanupError}=await supabase.storage.from("payment-proofs").remove([proofPath]);if(cleanupError)console.error("Payment proof cleanup failed",cleanupError.message)}
   setNotice({message:error instanceof Error?error.message:"تعذّر إرسال إثبات الدفع.",kind:"error"});
  }finally{setBusy(false)}
 }

 const activeMethod=methods.find(m=>m.id===selected);
 return <div className={styles.root}>
  <header className={styles.top}><Link className={styles.brand} href="/">Achri<span>Li</span></Link><Link href="/quotes">طلباتي</Link></header>
  <main className={styles.page}>
   <h1>الدفع وإثبات التحويل</h1>
   <p className={styles.muted}>أرسل الإثبات بعد تنفيذ التحويل. رفع الإثبات لا يعني تأكيد استلام الأموال؛ يراجع المدير العملية يدوياً.</p>
   {loading&&<div className={styles.notice}>جارٍ تحميل عرض السعر ووسائل الدفع...</div>}
   {notice&&<div className={styles.notice+" "+(notice.kind==="success"?styles.success:notice.kind==="error"?styles.error:notice.kind==="warn"?styles.warn:"")} role={notice.kind==="error"?"alert":"status"}>{notice.message}</div>}
   {quote&&<div className={styles.card}><strong>المبلغ المعتمد في عرض السعر: {money(quote.total,quote.currency)} </strong><p className={styles.small}>رقم العرض: {quote.id}</p></div>}
   {quote&&methods.length>0&&!submitted&&<section className={styles.card}>
    <form onSubmit={submit}>
     <h2>اختر وسيلة الدفع</h2>
     <div className={styles.methods}>
      {methods.map(m=><label className={styles.method} key={m.id}><input type="radio" name="method" value={m.id} checked={selected===m.id} onChange={()=>setSelected(m.id)}/><span><strong>{m.displayName}</strong>{m.code==="CCP_TRANSFER"?<><p className={styles.small}>صاحب الحساب: {m.accountHolder||"غير محدد"}</p><p className={styles.small}>بيانات التحويل: {m.accountIdentifier||"غير محددة"}</p></>:<><p className={styles.small}>الشبكة: BEP20 فقط</p><p className={styles.small}>عنوان المحفظة: {m.walletAddress||"غير محدد"}</p><p className={styles.small}>لا ترسل USDT عبر TRC20 أو ERC20 إلى عنوان BEP20.</p></>}{m.instructions&&<p className={styles.small}>{m.instructions}</p>}</span></label>)}
     </div>
     <label className={styles.label} htmlFor="proof">إثبات الدفع (صورة أو PDF) *</label>
     <input className={styles.input} id="proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={e=>setFile(e.target.files?.[0]||null)}/>
     <p className={styles.small}>الحد الأقصى 5 ميغابايت. الملف يحفظ في مساحة خاصة، ولا يكون رابطاً عاماً.</p>
     <label className={styles.label} htmlFor="reference">رقم العملية / ملاحظة مرجعية (اختياري)</label>
     <input className={styles.input} id="reference" maxLength={200} autoComplete="off" value={reference} onChange={e=>setReference(e.target.value)}/>
     <button className={styles.submit} type="submit" disabled={busy||!activeMethod}>{busy?"جارٍ إرسال الإثبات...":"إرسال إثبات الدفع للمراجعة"}</button>
    </form>
   </section>}
   {submitted&&<div className={styles.card}><p>لمتابعة حالة طلبك وعرض السعر، ارجع إلى صفحة طلباتي.</p><Link href="/quotes">العودة إلى طلباتي ومتابعة الحالة</Link></div>}
  </main>
 </div>
}
