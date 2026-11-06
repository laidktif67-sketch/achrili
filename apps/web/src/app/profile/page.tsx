"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import styles from "./profile.module.css";

type User={id:string;email?:string;user_metadata?:Record<string,any>};
type Order={id:string;productUrl:string;productName:string|null;variant:string|null;quantity:number;status:string;createdAt:string};
const statuses:Record<string,string>={SUBMITTED:"تم الإرسال",UNDER_REVIEW:"قيد المراجعة",NEEDS_INFORMATION:"معلومات إضافية مطلوبة",QUOTED:"عرض السعر متاح",REJECTED:"مرفوض",ACCEPTED:"مقبول",CANCELLED:"ملغى",PURCHASED:"تم الشراء",SHIPPED:"تم الشحن",DELIVERED:"تم التسليم"};

export default function ProfilePage(){
 const [user,setUser]=useState<User|null>(null);
 const [name,setName]=useState("");
 const [phone,setPhone]=useState("");
 const [orders,setOrders]=useState<Order[]>([]);
 const [loading,setLoading]=useState(true);
 const [ordersLoading,setOrdersLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<{message:string;error?:boolean}|null>(null);

 useEffect(()=>{let active=true;(async()=>{
  const {data,error}=await supabase.auth.getSession();
  if(error||!data.session){window.location.replace("/auth?next=/profile");return}
  const u=data.session.user as User;if(!active)return;
  setUser(u);setName(String(u.user_metadata?.full_name||u.user_metadata?.name||""));setPhone(String(u.user_metadata?.phone||""));setLoading(false);
  const {data:rows,error:ordersError}=await supabase.from("ProductRequest").select("id,productUrl,productName,variant,quantity,status,createdAt").eq("customerId",u.id).order("createdAt",{ascending:false}).limit(30);
  if(!active)return;setOrdersLoading(false);if(!ordersError)setOrders((rows??[]) as Order[]);
 })().catch(()=>{if(active){setLoading(false);setOrdersLoading(false);setNotice({message:"تعذّر تحميل الحساب. سجّل الدخول مجدداً.",error:true})}});return()=>{active=false}},[]);

 async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!user||busy)return;if(name.trim().length<2){setNotice({message:"يرجى إدخال الاسم الكامل.",error:true});return}
 setBusy(true);setNotice(null);try{const {data,error}=await supabase.auth.updateUser({data:{...user.user_metadata,full_name:name.trim(),phone:phone.trim()}});if(error)throw error;if(data.user){setUser(data.user as User);setName(String(data.user.user_metadata?.full_name||""));setPhone(String(data.user.user_metadata?.phone||""))}setNotice({message:"تم حفظ معلوماتك بنجاح."})}catch(e){setNotice({message:e instanceof Error?e.message:"تعذّر حفظ التغييرات. حاول مجدداً.",error:true})}finally{setBusy(false)}}
 async function logout(){setBusy(true);const {error}=await supabase.auth.signOut();if(error){setNotice({message:"تعذّر تسجيل الخروج. حاول مجدداً.",error:true});setBusy(false)}else window.location.replace("/auth")}
 const displayName=name.trim()||user?.email?.split("@")[0]||"AchriLi";
 return <div className={styles.root}>
  <header className={styles.top}><Link className={styles.brand} href="/">Achri<span>Li</span></Link><Link href="/">العودة للرئيسية</Link></header>
  <main className={styles.page}>
   <section className={styles.heading}><div><p className={styles.muted}>حسابك في اشريلي</p><h1>ملفي الشخصي</h1><p className={styles.muted}>حدّث معلوماتك لتكون تجربة التسوّق أسهل.</p></div><span className={styles.secure}>حسابك آمن</span></section>
   {notice&&<div className={styles.notice+" "+(notice.error?styles.error:"")} role="status">{notice.message}</div>}
   {loading?<div className={styles.card}>جارٍ تحميل بيانات حسابك...</div>:<div className={styles.layout}>
    <aside className={styles.card+" "+styles.sidebar}><div className={styles.avatar}>{[...displayName][0]?.toUpperCase()||"A"}</div><h2>{displayName}</h2><p className={styles.muted}>{user?.email}</p><span className={styles.status}>عضو في اشريلي</span><Link className={styles.nav} href="/profile">المعلومات الشخصية</Link><Link className={styles.nav} href="/quotes">عروض الأسعار</Link><Link className={styles.nav} href="/request">طلب جديد</Link></aside>
    <div><section className={styles.card}><h2>المعلومات الشخصية</h2><p className={styles.muted}>هذه المعلومات تساعدنا على التواصل معك بشأن طلباتك.</p><form onSubmit={save}><label className={styles.label} htmlFor="fullName">الاسم الكامل</label><input className={styles.input} id="fullName" autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/><label className={styles.label} htmlFor="email">البريد الإلكتروني</label><input className={styles.input} id="email" value={user?.email||""} readOnly/><p className={styles.muted}>لا يمكن تغيير البريد الإلكتروني من هذه الصفحة.</p><label className={styles.label} htmlFor="phone">رقم الهاتف</label><input className={styles.input} id="phone" type="tel" autoComplete="tel" placeholder="+213 ..." value={phone} onChange={e=>setPhone(e.target.value)}/><button className={styles.button} disabled={busy}>{busy?"جارٍ الحفظ...":"حفظ التغييرات"}</button></form></section>
     <section className={styles.card}><h2>طلباتي</h2><p className={styles.muted}>تابع طلبات المنتجات التي أرسلتها وحالتها الحالية.</p><Link href="/request">إرسال طلب جديد</Link>{ordersLoading?<p className={styles.muted}>جارٍ تحميل طلباتك...</p>:orders.length===0?<p className={styles.muted}>لا توجد طلبات بعد. أرسل رابط منتج لبدء أول طلب.</p>:orders.map(o=><article className={styles.order} key={o.id}><h3>{o.productName||"طلب منتج"}</h3><span className={styles.status}>{statuses[o.status]||o.status}</span><p className={styles.muted}>الكمية: {o.quantity} · {new Date(o.createdAt).toLocaleDateString("ar-DZ")}</p>{o.variant&&<p className={styles.muted}>المواصفات: {o.variant}</p>}<a href={o.productUrl} target="_blank" rel="noopener noreferrer">فتح رابط المنتج</a><Link href="/quotes">متابعة الطلب وعرض السعر والدفع</Link></article>)}</section>
     <section className={styles.card}><h2>الأمان والحساب</h2><p className={styles.muted}>أنت مسجّل الدخول على هذا الجهاز. لا تشارك كلمة المرور أو رموز التحقق مع أي شخص.</p><button className={styles.button+" "+styles.secondary} onClick={logout} disabled={busy}>تسجيل الخروج</button></section>
    </div>
   </div>}
  </main>
  <footer className={styles.footer}>© {new Date().getFullYear()} AchriLi · تسوّق من العالم إلى الجزائر</footer>
 </div>
}
