"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "./auth.module.css";

type Mode = "login" | "signup" | "reset" | "new-password";
type Notice = { message: string; kind: "info" | "success" | "error" } | null;
type Provider = "google" | "facebook" | "apple";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function Icon({ name }: { name: "mail" | "lock" | "user" | "phone" | "eye" | "eyeOff" | "arrow" | "shield" | "headset" | "edit" }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<string, ReactNode> = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    phone: <><path d="M7 3h3l2 5-2 2a15 15 0 0 0 4 4l2-2 5 2v3c0 1.1-.9 2-2 2C10 19 5 14 5 5c0-1.1.9-2 2-2Z" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.6M6.2 6.7C3.5 8.4 2 12 2 12s3.5 6 10 6c1 0 1.9-.2 2.7-.5" /></>,
    arrow: <><path d="M19 12H5m7-7-7 7 7 7" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    headset: <><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="12" width="4" height="7" rx="2" /><rect x="17" y="12" width="4" height="7" rx="2" /><path d="M17 19a5 5 0 0 1-5 3h-1" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [next, setNext] = useState("/");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destination = safeNext(params.get("next"));
    setNext(destination);
    const requested = params.get("mode");
    if (requested === "signup" || requested === "reset" || requested === "new-password") setMode(requested);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setMode("new-password");
      if (event === "SIGNED_IN" && session && requested !== "new-password") router.replace(destination);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  function switchMode(value: Mode) {
    setMode(value);
    setNotice(null);
    setPassword("");
    setConfirm("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\\s()-]/g, "");
    if (mode === "login" && !cleanEmail) {
      setNotice({ message: "أدخل بريدك الإلكتروني أو رقم هاتفك.", kind: "error" }); return;
    }
    if ((mode === "signup" || mode === "reset") && !cleanEmail) {
      setNotice({ message: "أدخل بريدك الإلكتروني.", kind: "error" }); return;
    }
    if (mode === "signup") {
      if (name.trim().length < 2) { setNotice({ message: "اكتب اسمك الكامل.", kind: "error" }); return; }
      if (!/^\\+?213[0-9]{9}$/.test(cleanPhone.replace(/^0/, "+213"))) {
        setNotice({ message: "أدخل رقم هاتف جزائري صحيحاً مع رمز الدولة +213.", kind: "error" }); return;
      }
      if (!terms) { setNotice({ message: "يجب الموافقة على الشروط وسياسة الخصوصية.", kind: "error" }); return; }
    }
    if ((mode === "login" || mode === "signup" || mode === "new-password") && password.length < 8) {
      setNotice({ message: "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.", kind: "error" }); return;
    }
    if ((mode === "signup" || mode === "new-password") && password !== confirm) {
      setNotice({ message: "كلمتا المرور غير متطابقتين.", kind: "error" }); return;
    }

    setBusy(true);
    setNotice({ message: "جارٍ تنفيذ العملية...", kind: "info" });
    try {
      if (mode === "login") {
        const credentials = cleanEmail.includes("@")
          ? { email: cleanEmail, password }
          : { phone: cleanEmail.startsWith("+") ? cleanEmail : cleanEmail.startsWith("213") ? "+" + cleanEmail : "+213" + cleanEmail.replace(/^0/, ""), password };
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
        router.replace(next); return;
      }
      if (mode === "signup") {
        const normalizedPhone = cleanPhone.startsWith("+") ? cleanPhone : cleanPhone.startsWith("213") ? "+" + cleanPhone : "+213" + cleanPhone.replace(/^0/, "");
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: name.trim(), fullName: name.trim(), phone: normalizedPhone },
            emailRedirectTo: window.location.origin + next
          }
        });
        if (error) throw error;
        setNotice({ message: data.session ? "تم إنشاء حسابك بنجاح." : "تم إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني. افتح الرسالة لتفعيل حسابك.", kind: "success" });
        if (data.session) router.replace(next);
        return;
      }
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + "/auth?mode=new-password&next=" + encodeURIComponent(next)
        });
        if (error) throw error;
        setNotice({ message: "إذا كان البريد مسجلاً، فستصلك رسالة تتضمن رابط استعادة كلمة المرور.", kind: "success" }); return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setNotice({ message: "تم تحديث كلمة المرور بنجاح.", kind: "success" });
      switchMode("login");
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "تعذّر إتمام العملية. حاول مجدداً.", kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function socialLogin(provider: Provider) {
    if (busy) return;
    setBusy(true);
    setNotice({ message: "جارٍ تحويلك إلى مزوّد تسجيل الدخول...", kind: "info" });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + next }
      });
      if (error) throw error;
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "تعذّر بدء تسجيل الدخول. تأكد من إعداد هذا المزوّد في Supabase.",
        kind: "error"
      });
      setBusy(false);
    }
  }

  const title = mode === "login" ? "مرحباً بعودتك" : mode === "signup" ? "إنشاء حساب جديد" : mode === "reset" ? "نسيت كلمة المرور؟" : "تعيين كلمة مرور جديدة";
  const subtitle = mode === "login" ? "سجّل الدخول وتابع طلباتك بكل سهولة" : mode === "signup" ? "انضم إلى عائلة AchriLi واستمتع بتجربة تسوّق عالمية" : mode === "reset" ? "أدخل بريدك الإلكتروني لنرسل لك رابط الاستعادة" : "اختر كلمة مرور جديدة وآمنة لحسابك";

  return (
    <main className={styles.root} dir="rtl">
      <header className={styles.mobileHero}>
        <Link href="/" className={styles.logo}><span className={styles.logoMark}>A</span><span>AchriLi<small>اشريلي</small></span></Link>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>تسوّق من العالم بكل سهولة</span>
          <h1>معك في كل خطوة</h1>
          <p>من طلب المنتج إلى وصوله إليك</p>
        </div>
        <img className={styles.heroArt} src="/assets/achrili-main-hero.svg" alt="تسوّق عالمي مع AchriLi" />
        <span className={styles.heroGlow} />
      </header>

      <section className={styles.panel} aria-labelledby="auth-title">
        <Link href="/" className={styles.back}>← العودة إلى الرئيسية</Link>
        <Link href="/" className={styles.desktopLogo}>Achri<span>Li</span><small>اشريلي</small></Link>

        <div className={styles.heading}>
          <h2 id="auth-title">{title}</h2>
          <p>{subtitle}</p>
        </div>

        {(mode === "login" || mode === "signup") && (
          <div className={styles.tabs} role="tablist" aria-label="نوع الحساب">
            <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? styles.activeTab : ""} onClick={() => switchMode("signup")}><Icon name="edit" /> إنشاء حساب جديد</button>
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? styles.activeTab : ""} onClick={() => switchMode("login")}><Icon name="user" /> تسجيل الدخول</button>
          </div>
        )}

        {notice && <div className={styles.notice + " " + (notice.kind === "success" ? styles.success : notice.kind === "error" ? styles.error : styles.info)} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</div>}

        <form onSubmit={submit} className={styles.form}>
          {mode === "signup" && (
            <>
              <label className={styles.field}><span>الاسم الكامل <b>*</b></span><span className={styles.inputWrap}><input autoComplete="name" required value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك الكامل" /><Icon name="user" /></span></label>
              <label className={styles.field}><span>البريد الإلكتروني <b>*</b></span><span className={styles.inputWrap}><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="أدخل بريدك الإلكتروني" /><Icon name="mail" /></span></label>
              <label className={styles.field}><span>رقم الهاتف <b>*</b></span><span className={styles.inputWrap + " " + styles.phoneWrap}><input type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="05 XX XX XX XX" /><span className={styles.country}>🇩🇿 +213</span><Icon name="phone" /></span></label>
            </>
          )}
          {(mode === "login" || mode === "reset") && <label className={styles.field}><span>البريد الإلكتروني</span><span className={styles.inputWrap}><input type="text" inputMode="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني أو رقم الهاتف" /><Icon name="mail" /></span></label>}
          {mode !== "reset" && <label className={styles.field}><span>{mode === "new-password" ? "كلمة المرور الجديدة" : "كلمة المرور"}{mode !== "login" && <b> *</b>}</span><span className={styles.inputWrap}><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="8 أحرف على الأقل" /><button type="button" className={styles.iconButton} onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}><Icon name={showPassword ? "eyeOff" : "eye"} /></button><Icon name="lock" /></span></label>}
          {(mode === "signup" || mode === "new-password") && <label className={styles.field}><span>تأكيد كلمة المرور <b>*</b></span><span className={styles.inputWrap}><input type={showPassword ? "text" : "password"} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="أعد كتابة كلمة المرور" /><Icon name="lock" /></span></label>}

          {mode === "login" && <div className={styles.formOptions}><label className={styles.remember}><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> تذكرني</label><button type="button" className={styles.textButton} onClick={() => switchMode("reset")}>نسيت كلمة المرور؟</button></div>}
          {mode === "signup" && <label className={styles.terms}><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /><span>أوافق على <Link href="/terms">الشروط والأحكام</Link> و<Link href="/privacy">سياسة الخصوصية</Link></span></label>}

          <button className={styles.primary} type="submit" disabled={busy}>
            {busy ? "يرجى الانتظار..." : mode === "login" ? "دخول الآن" : mode === "signup" ? "إنشاء الحساب" : mode === "reset" ? "إرسال رابط الاستعادة" : "حفظ كلمة المرور"}
            <Icon name="arrow" />
          </button>
        </form>

        {(mode === "login" || mode === "signup") && <>
          <div className={styles.separator}><span>أو</span></div>
          <div className={styles.socials}>
            <button type="button" onClick={() => socialLogin("google")} disabled={busy}><span className={styles.googleIcon}>G</span> Google</button>
            <button type="button" onClick={() => socialLogin("facebook")} disabled={busy}><span className={styles.facebookIcon}>f</span> Facebook</button>
            <button type="button" onClick={() => socialLogin("apple")} disabled={busy}><span className={styles.appleIcon}>●</span> Apple</button>
          </div>
        </>}

        <div className={styles.trust}>
          <div><Icon name="shield" /><span><strong>بياناتك آمنة معنا</strong><small>نضمن لك الحماية والخصوصية</small></span></div>
          <i />
          <div><Icon name="headset" /><span><strong>دعم متواصل</strong><small>على مدار الساعة</small></span></div>
        </div>

        <div className={styles.bottomLink}>
          {mode === "login" ? <>ليس لديك حساب؟ <button type="button" onClick={() => switchMode("signup")}>إنشاء حساب جديد ←</button></> : mode === "signup" ? <>لديك حساب بالفعل؟ <button type="button" onClick={() => switchMode("login")}>تسجيل الدخول ←</button></> : <button type="button" onClick={() => switchMode("login")}>العودة إلى تسجيل الدخول</button>}
        </div>
      </section>
    </main>
  );
}
