import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const supabase = createClient(
  'https://cmvgeipqthurdbeizfvn.supabase.co',
  'sb_publishable_kuB0PCt85GcDcFbWTOZC7g_zE4UR3Xc',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
const $ = id => document.getElementById(id);
let mode = new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'login';
let lang = localStorage.getItem('achrili-language') === 'fr' ? 'fr' : 'ar';
let busy = false;

const words = {
 ar: {back:'العودة للرئيسية',eyebrow:'تسوّق من العالم، بكل سهولة',hero:'العالم أقرب إليك<br>مع اشريلي.',heroText:'حسابك يجمع روابط منتجاتك وتجربة تسوّقك في مكان واحد.',secure:'تسوّق آمن',shops:'متاجر عالمية',foot:'أهلاً بك في عالم التسوّق الذكي',login:'تسجيل الدخول',signup:'إنشاء حساب',name:'الاسم الكامل',phone:'رقم الهاتف',password:'كلمة المرور',confirm:'تأكيد كلمة المرور',forgot:'نسيت كلمة المرور؟',terms:'أوافق على الشروط وسياسة الخصوصية.',or:'أو تابع باستخدام',google:'المتابعة باستخدام Google',privacy:'بياناتك محمية وتُستخدم لتسهيل تجربة التسوّق الخاصة بك.',footer:'تسوّق من العالم إلى الجزائر',loginTitle:'مرحباً بعودتك',loginSub:'سجّل الدخول لمتابعة تسوّقك.',signupTitle:'أنشئ حسابك في اشريلي',signupSub:'خطوة واحدة تفصلك عن تجربة تسوّق أسهل.',resetTitle:'استعادة كلمة المرور',resetSub:'أدخل بريدك الإلكتروني لنرسل لك رابط الاستعادة.',newTitle:'كلمة مرور جديدة',newSub:'اختر كلمة مرور قوية لحسابك.',identity:'البريد الإلكتروني',email:'البريد الإلكتروني',namePh:'اكتب اسمك الكامل',identityPh:'name@example.com أو +213...',emailPh:'name@example.com',phonePh:'5 XX XX XX XX',passPh:'8 أحرف على الأقل',loginBtn:'تسجيل الدخول',signupBtn:'إنشاء حساب',resetBtn:'إرسال رابط الاستعادة',newBtn:'حفظ كلمة المرور',noAccount:'ليس لديك حساب؟',hasAccount:'لديك حساب بالفعل؟',errRequired:'يرجى ملء الحقول المطلوبة.',errName:'اكتب اسمك الكامل.',errEmail:'أدخل بريداً إلكترونياً صحيحاً.',errPhone:'أدخل رقم هاتف صحيحاً مع مفتاح الدولة، مثل +213...',errPass:'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.',errConfirm:'كلمتا المرور غير متطابقتين.',errTerms:'يجب الموافقة على الشروط وسياسة الخصوصية.',okSignup:'تم إرسال طلب إنشاء الحساب. إذا كان تأكيد البريد مفعّلاً، افتح بريدك لتأكيد الحساب.',okLogin:'تم تسجيل الدخول بنجاح.',okReset:'إذا كان البريد مسجلاً، فستصلك رسالة تتضمن رابط الاستعادة.',okNew:'تم تحديث كلمة المرور بنجاح.',generic:'تعذّر إتمام العملية. حاول مجدداً.',googleErr:'تعذّر بدء تسجيل Google. تأكد من تفعيل مزوّد Google في إعدادات Supabase.',loading:'جارٍ المعالجة...',termsLink:'الشروط وسياسة الخصوصية'},
 fr: {back:'Retour à l’accueil',eyebrow:'Le shopping mondial, en toute simplicité',hero:'Le monde plus proche<br>avec AchriLi.',heroText:'Retrouvez vos liens produits et votre expérience shopping au même endroit.',secure:'Achats sécurisés',shops:'Boutiques mondiales',foot:'Bienvenue dans le shopping intelligent',login:'Connexion',signup:'Créer un compte',name:'Nom complet',phone:'Téléphone',password:'Mot de passe',confirm:'Confirmer le mot de passe',forgot:'Mot de passe oublié ?',terms:'J’accepte les conditions et la politique de confidentialité.',or:'Ou continuer avec',google:'Continuer avec Google',privacy:'Vos données sont protégées et servent à faciliter vos achats.',footer:'Le shopping mondial, livré en Algérie',loginTitle:'Heureux de vous revoir',loginSub:'Connectez-vous pour continuer vos achats.',signupTitle:'Créez votre compte AchriLi',signupSub:'Une étape pour simplifier vos achats.',resetTitle:'Réinitialiser le mot de passe',resetSub:'Saisissez votre e-mail pour recevoir un lien.',newTitle:'Nouveau mot de passe',newSub:'Choisissez un mot de passe robuste.',identity:'Adresse e-mail',email:'Adresse e-mail',namePh:'Votre nom complet',identityPh:'nom@exemple.com ou +213...',emailPh:'nom@exemple.com',phonePh:'5 XX XX XX XX',passPh:'8 caractères minimum',loginBtn:'Se connecter',signupBtn:'Créer mon compte',resetBtn:'Envoyer le lien',newBtn:'Enregistrer le mot de passe',noAccount:'Pas encore de compte ?',hasAccount:'Vous avez déjà un compte ?',errRequired:'Veuillez remplir les champs requis.',errName:'Saisissez votre nom complet.',errEmail:'Saisissez une adresse e-mail valide.',errPhone:'Saisissez un numéro avec indicatif, par exemple +213...',errPass:'Le mot de passe doit contenir au moins 8 caractères.',errConfirm:'Les mots de passe ne correspondent pas.',errTerms:'Veuillez accepter les conditions et la politique de confidentialité.',okSignup:'Demande de création envoyée. Consultez votre e-mail si la confirmation est activée.',okLogin:'Connexion réussie.',okReset:'Si cette adresse est enregistrée, vous recevrez un lien de réinitialisation.',okNew:'Mot de passe mis à jour.',generic:'Impossible de terminer cette opération. Réessayez.',googleErr:'Connexion Google impossible. Vérifiez que Google est activé dans Supabase.',loading:'Traitement...',termsLink:'Conditions et confidentialité'}
};
const t = key => words[lang][key] || key;
function notify(message, kind='error'){const el=$('message');el.textContent=message;el.className='message '+kind;el.hidden=false;}
function clear(){ $('message').hidden=true; $('message').textContent=''; }
function normalizedPhone(value){let p=value.trim().replace(/[\s()-]/g,'');if(p.startsWith('0'))p='+213'+p.slice(1);else if(p.startsWith('213'))p='+'+p;return p;}
function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function setMode(next){mode=next;history.replaceState({},'',next==='login'?'auth.html':'auth.html?mode='+next);render();}
function render(){
 document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 document.querySelectorAll('[data-t]').forEach(el=>{const k=el.dataset.t;if(words[lang][k]){if(k==='hero')el.innerHTML=words[lang][k];else el.textContent=words[lang][k];}});
 $('termsWrap').querySelector('span').innerHTML=lang==='ar'?'أوافق على <a href="terms.html">الشروط</a> و<a href="privacy.html">سياسة الخصوصية</a>.':'J’accepte les <a href="terms.html">conditions</a> et la <a href="privacy.html">politique de confidentialité</a>.';
 $('lang').textContent=lang==='ar'?'FR':'عربي';$('langDesk').textContent=lang==='ar'?'FR':'عربي';
 const signup=mode==='signup',reset=mode==='reset',newPass=mode==='new-password';
 $('title').innerHTML=t(reset?'resetTitle':newPass?'newTitle':signup?'signupTitle':'loginTitle');
 $('subtitle').textContent=t(reset?'resetSub':newPass?'newSub':signup?'signupSub':'loginSub');
 $('tabs').hidden=reset||newPass;$('loginTab').classList.toggle('active',mode==='login');$('signupTab').classList.toggle('active',signup);
 $('nameWrap').hidden=!signup;$('phoneWrap').hidden=!signup;$('confirmWrap').hidden=!(signup||newPass);$('termsWrap').hidden=!signup;
 $('forgot').hidden=signup||reset||newPass;$('passwordWrap').hidden=reset;
 $('identityLabel').textContent=reset||signup?t('email'):t('identity');
 $('identity').placeholder=reset||signup?t('emailPh'):t('identityPh');$('identity').inputMode=reset||signup?'email':'text';$('identity').autocomplete=reset||signup?'email':'username';
 $('name').placeholder=t('namePh');$('phone').placeholder=t('phonePh');$('password').placeholder=t('passPh');
 $('password').autocomplete=signup||newPass?'new-password':'current-password';$('password').required=!reset;$('confirm').required=signup||newPass;$('name').required=signup;$('terms').required=signup;
 $('submit').querySelector('span').textContent=t(reset?'resetBtn':newPass?'newBtn':signup?'signupBtn':'loginBtn');
 $('divider').hidden=reset||newPass;$('google').hidden=reset||newPass;
 $('switchText').hidden=reset||newPass;
 $('switchText').innerHTML=(signup?t('hasAccount'):t('noAccount'))+' <button class="link" id="switch">'+(signup?t('login'):t('signup'))+'</button>';
 $('switch').addEventListener('click',()=>setMode(signup?'login':'signup'));
 clear();
}
function validate(){
 const identity=$('identity').value.trim(),pass=$('password').value;
 if(mode==='signup'&&!$('name').value.trim())return t('errName');
 if(!identity)return t('errRequired');
 if((mode==='signup'||mode==='reset')&&!isEmail(identity))return t('errEmail');
 if(mode==='login'&&!isEmail(identity))return t('errEmail');
 if(mode==='signup'&&!/^\+?[0-9]{8,15}$/.test(normalizedPhone($('phone').value)))return t('errPhone');
 if(mode!=='reset'&&pass.length<8)return t('errPass');
 if((mode==='signup'||mode==='new-password')&&pass!==$('confirm').value)return t('errConfirm');
 if(mode==='signup'&&!$('terms').checked)return t('errTerms');
 return null;
}
$('form').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;clear();const issue=validate();if(issue){notify(issue);return;}busy=true;$('submit').disabled=true;$('google').disabled=true;$('submit').querySelector('span').textContent=t('loading');
 try{
  const identity=$('identity').value.trim(),password=$('password').value;
  if(mode==='login'){
   const credentials={email:identity,password};
   const {error}=await supabase.auth.signInWithPassword(credentials);if(error)throw error;
   notify(t('okLogin'),'success');setTimeout(()=>location.assign('index.html?auth=success'),650);
  }else if(mode==='signup'){
   const {error}=await supabase.auth.signUp({email:identity,password,options:{data:{full_name:$('name').value.trim(),phone:normalizedPhone($('phone').value)},emailRedirectTo:location.origin+location.pathname}});
   if(error)throw error;notify(t('okSignup'),'success');$('form').reset();
  }else if(mode==='reset'){
   const {error}=await supabase.auth.resetPasswordForEmail(identity,{redirectTo:location.origin+location.pathname+'?mode=new-password'});if(error)throw error;notify(t('okReset'),'success');
  }else{
   const {error}=await supabase.auth.updateUser({password});if(error)throw error;notify(t('okNew'),'success');setTimeout(()=>setMode('login'),1200);
  }
 }catch(err){notify(err?.message||t('generic'));}
 finally{busy=false;$('submit').disabled=false;$('google').disabled=false;$('submit').querySelector('span').textContent=t(mode==='reset'?'resetBtn':mode==='new-password'?'newBtn':mode==='signup'?'signupBtn':'loginBtn');}
});
$('loginTab').addEventListener('click',()=>setMode('login'));
$('signupTab').addEventListener('click',()=>setMode('signup'));
$('forgot').addEventListener('click',()=>setMode('reset'));
$('google').addEventListener('click',async()=>{if(busy)return;clear();busy=true;$('google').disabled=true;try{const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)throw error;}catch(err){notify(err?.message||t('googleErr'));busy=false;$('google').disabled=false;}});
document.querySelectorAll('.eye').forEach(button=>button.addEventListener('click',()=>{const input=$(button.dataset.target);input.type=input.type==='password'?'text':'password';}));
function changeLang(){lang=lang==='ar'?'fr':'ar';localStorage.setItem('achrili-language',lang);render();}
$('lang').addEventListener('click',changeLang);$('langDesk').addEventListener('click',changeLang);
$('year').textContent=new Date().getFullYear();
supabase.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY'&&mode!=='new-password')setMode('new-password');});
render();
