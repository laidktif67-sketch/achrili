"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "./auth.module.css";

type Mode="login"|"signup"|"reset"|"new-password";
type Notice={message:string;kind:"info"|"success"|"error"}|null;
function safeNext(value:string|null){return value&&value.startsWith("/")&&!value.startsWith("//")?value:"/"}

export default function AuthPage(){
 const router=useRouter();
 const [mode,setMode]=useState<Mode>("login");
 const [next,setNext]=useState("/");
 const [name,setName]=useState("");
 const [phone,setPhone]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [terms,setTerms]=useState(false);
 const [notice,setNotice]=useState<Notice>(null);
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  setNext(safeNext(params.get("next")));
  const requested=params.get("mode");
  if(requested==="signup"||requested==="reset"||requested==="new-password")setMode(requested);
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
   if(event==="PASSWORD_RECOVERY")setMode("new-password");
   if(event==="SIGNED_IN"&&session&&requested!=="new-password")router.replace(safeNext(params.get("next")));
  });
  return()=>subscription.unsubscribe();
 },[router]);

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  if(!email.trim()){setNotice({message:"أدخل بريدك الإلكتروني.",kind:"error"});return}
  if(mode==="signup"){
   if(name.trim().length<2){setNotice({message:"اكتب اسمك الكامل.",kind:"error"});return}
   if(password.length<8){setNotice({message:"كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.",kind:"error"});return}
   if(password!==confirm){setNotice({message:"كلمتا المرور غير متطابقتين.",kind:"error"});return}
   if(!terms){setNotice({message:"يجب الموافقة على الشروط وسياسة الخصوصية.",kind:"error"});return}
  }
  if(mode==="login"&&password.length===0){setNotice({message:"أدخل كلمة المرور.",kind:"error"});return}
  if(mode==="new-password"&&password.length<8){setNotice({message:"اختر كلمة مرور من 8 أحرف على الأقل.",kind:"error"});return}
  if(mode==="new-password"&&password!==confirm){setNotice({message:"كلمتا المرور غير متطابقتين.",kind:"error"});return}
  setBusy(true);setNotice({message:"جارٍ تنفيذ العملية...",kind:"info"});
  try{
   if(mode==="login"){
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;
    router.replace(next);return;
   }
   if(mode==="signup"){
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{fullName:name.trim(),phone:phone.trim()},emailRedirectTo:window.location.origin+next}});
    if(error)throw error;
    setNotice({message:data.session?"تم إنشاء حسابك وتسجيل الدخول.":"تم إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني. افتح الرسالة لتفعيل الحساب.",kind:"success"});
    if(data.session)router.replace(next);
    return;
   }
   if(mode==="reset"){
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/auth?mode=new-password&next="+encodeURIComponent(next)});
    if(error)throw error;
    setNotice({message:"إذا كان البريد مسجلاً، فستصلك رسالة تتضمن رابط استعادة كلمة المرور.",kind:"success"});return;
   }
   const {error}=await supabase.auth.updateUser({password});if(error)throw error;
   setNotice({message:"تم تحديث كلمة المرور بنجاح.",kind:"success"});setMode("login");setPassword("");setConfirm("");
  }catch(error){
   setNotice({message:error instanceof Error?error.message:"تعذّر إتمام العملية. حاول مجدداً.",kind:"error"});
  }finally{setBusy(false)}
 }

 async function google(){
  setBusy(true);try{const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+next}});if(error)throw error}
  catch(error){setNotice({message:error instanceof Error?error.message:"تعذّر بدء تسجيل Google. تأكد من تفعيل المزوّد في Supabase.",kind:"error"});setBusy(false)}
 }

 const title=mode==="login"?"مرحباً بعودتك":mode==="signup"?"أنشئ حسابك في اشريلي":mode==="reset"?"استعادة كلمة المرور":"كلمة مرور جديدة";
 const subtitle=mode==="login"?"سجّل الدخول لمتابعة تسوّقك.":mode==="signup"?"خطوة واحدة تفصلك عن تجربة تسوّق أسهل.":mode==="reset"?"أدخل بريدك الإلكتروني لنرسل لك رابط الاستعادة.":"اختر كلمة مرور قوية لحسابك.";
 return <main className={styles.root}>
  <aside className={styles.visual}><div className={styles.visualBrand}>Achri<span>Li</span></div><h1>العالم أقرب إليك<br/>مع اشريلي.</h1><p>حسابك يجمع روابط منتجاتك وتجربة تسوّقك في مكان واحد. من إرسال الطلب إلى متابعة عروض الأسعار.</p><img className={styles.visualArt} src="/assets/achrili-main-hero.svg" alt="AchriLi — تسوّق من العالم إلى الجزائر"/></aside>
  <section className={styles.panel}>
   <Link className={styles.back} href="/">← العودة للرئيسية</Link>
   <Link className={styles.brand} href="/">Achri<span>Li</span></Link>
   <div className={styles.heading}><h2>{title}</h2><p>{subtitle}</p></div>
   {notice&&<div className={styles.notice+" "+(notice.kind==="success"?styles.success:notice.kind==="error"?styles.error:styles.info)} role={notice.kind==="error"?"alert":"status"}>{notice.message}</div>}
   <form onSubmit={submit}>
    {mode==="signup"&&<><label className={styles.label} htmlFor="fullName">الاسم الكامل</label><input className={styles.input} id="fullName" autoComplete="name" required value={name} onChange={e=>setName(e.target.value)}/><label className={styles.label} htmlFor="phone">رقم الهاتف</label><input className={styles.input} id="phone" type="tel" autoComplete="tel" placeholder="+213..." value={phone} onChange={e=>setPhone(e.target.value)}/></>}
    <label className={styles.label} htmlFor="email">البريد الإلكتروني</label><input className={styles.input} id="email" type="email" autoComplete="email" required placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
    {mode!=="reset"&&<><label className={styles.label} htmlFor="password">كلمة المرور</label><input className={styles.input} id="password" type="password" autoComplete={mode==="login"?"current-password":"new-password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 أحرف على الأقل"/></>}
    {(mode==="signup"||mode==="new-password")&&<><label className={styles.label} htmlFor="confirm">تأكيد كلمة المرور</label><input className={styles.input} id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></>}
    {mode==="signup"&&<label className={styles.terms}><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/><span>أوافق على <Link className={styles.link} href="/terms">الشروط</Link> و<Link className={styles.link} href="/privacy">سياسة الخصوصية</Link>.</span></label>}
    {mode==="login"&&<div className={styles.row}><button className={styles.link} type="button" onClick={()=>{setMode("reset");setNotice(null)}}>نسيت كلمة المرور؟</button><button className={styles.link} type="button" onClick={()=>{setMode("signup");setNotice(null)}}>إنشاء حساب</button></div>}
    <button className={styles.primary} type="submit" disabled={busy}>{busy?"يرجى الانتظار...":mode==="login"?"تسجيل الدخول":mode==="signup"?"إنشاء حساب":mode==="reset"?"إرسال رابط الاستعادة":"حفظ كلمة المرور"}</button>
   </form>
   {mode==="login"&&<button className={styles.google} type="button" onClick={google} disabled={busy}>المتابعة باستخدام Google</button>}
   <div className={styles.footer}>{mode!=="login"&&<button className={styles.link} type="button" onClick={()=>{setMode("login");setNotice(null)}}>العودة إلى تسجيل الدخول</button>}<p>بياناتك محمية وتُستخدم لتسهيل تجربة التسوّق الخاصة بك.</p>© {new Date().getFullYear()} AchriLi — اشريلي</div>
  </section>
 </main>
}
