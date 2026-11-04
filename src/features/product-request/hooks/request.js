import { supabase } from '../../../shared/services/supabase/client.js';
import { findSupportedShop, isValidProductUrl } from '../model/product-request.js';
import { getPricingSettings } from '../../../shared/services/supabase/pricing-settings.js';
import { convertCurrency } from '../../pricing/model/pricing.js';
const $=id=>document.getElementById(id);let lang=localStorage.getItem('achrili-language')==='fr'?'fr':'ar',user=null,busy=false;
const words={ar:{profile:'حسابي وطلباتي',back:'← العودة للرئيسية',eyebrow:'خطوة نحو تسوّق أسهل',title:'أرسل طلب المنتج',intro:'أضف رابط المنتج أولاً، ثم حدّد السعر والتفاصيل. سنحفظ طلبك في حسابك لتتمكن من متابعة حالته.',stepLabel:'رابط · سعر · تفاصيل',customerPhone:'رقم الهاتف للتواصل *',phoneHint:'رقم إلزامي لنتواصل معك ونتأكد من تفاصيل طلبك.',linkHeading:'رابط المنتج',linkIntro:'ألصق رابط المنتج من المتجر الذي تريد الشراء منه.',detailsHeading:'تفاصيل الطلب',detailsIntro:'أكمل بيانات التواصل والكمية والوجهة وأي مواصفات مهمة.',phoneLabel:'رقم الهاتف للتواصل *',phoneHint:'رقم إلزامي لنتواصل معك ونؤكد تفاصيل طلبك.',badPhone:'أدخل رقم هاتف صحيحاً يتكوّن من 9 إلى 15 رقماً.',submitHint:'راجع الرابط والسعر قبل إرسال طلبك.',urlLabel:'رابط المنتج *',urlHint:'يجب أن يكون الرابط من متجر مدعوم وأن يبدأ بـ HTTPS.',quantity:'الكمية *',destination:'وجهة التسليم',variant:'اللون / المقاس / النسخة (اختياري)',notes:'ملاحظات إضافية (اختياري)',disclaimer:'هذا تقدير أولي فقط، ولا يشمل الشحن أو الجمارك. السعر النهائي يتأكد بعد مراجعة المنتج.',submit:'إرسال طلب المراجعة',footer:'تسوّق من العالم إلى الجزائر',badUrl:'أدخل رابط HTTPS صحيحاً من متجر مدعوم.',badQty:'يجب أن تكون الكمية بين 1 و30.',sending:'جارٍ إرسال الطلب...',success:'تم حفظ طلبك بنجاح. يمكنك متابعة حالته من صفحة حسابك.',failed:'تعذّر حفظ الطلب. حاول مجدداً بعد التحقق من اتصالك وحسابك.',login:'يجب تسجيل الدخول أولاً. سيتم توجيهك إلى صفحة الدخول.',shop:'المتجر المدعوم:',required:'تعذّر إرسال الطلب: تأكد من أن ملف حسابك مكتمل ثم أعد المحاولة.',estimateEyebrow:'تقدير سريع',estimateTitle:'قدّر سعر منتجك',estimateIntro:'اختر العملة وأدخل السعر الظاهر في المتجر لتحصل على تقدير بالدينار الجزائري.',productPriceLabel:'سعر المنتج في المتجر',productCurrencyLabel:'عملة السعر',originalPrice:'سعر المنتج',convertedPrice:'سعر الوحدة بالدينار',serviceFeeLine:'رسوم الخدمة',estimatedTotal:'المجموع التقديري',enterPrice:'أدخل سعر المنتج',pricingLoading:'جارٍ تحميل أسعار الصرف...',pricingFailed:'تعذر تحميل التسعير؛ تحقق من الاتصال ثم أعد المحاولة.',pricingNote:'التقدير محسوب حسب أسعار الصرف ورسوم الخدمة المضبوطة في AchriLi. لا يشمل الشحن أو الجمارك، والسعر النهائي يتأكد بعد مراجعة الطلب.'},fr:{profile:'Mon compte et mes demandes',back:'← Retour à l’accueil',eyebrow:'Une étape vers un shopping plus simple',title:'Envoyer une demande produit',intro:'Ajoutez d’abord le lien du produit, puis son prix et les détails. Votre demande sera enregistrée dans votre compte.',stepLabel:'Lien · Prix · Détails',customerPhone:'Téléphone de contact *',phoneHint:'Obligatoire pour vous contacter et confirmer les détails de votre demande.',linkHeading:'Lien du produit',linkIntro:'Collez le lien du produit depuis la boutique souhaitée.',detailsHeading:'Détails de la demande',detailsIntro:'Indiquez vos coordonnées, la quantité, la destination et les variantes utiles.',phoneLabel:'Numéro de téléphone de contact *',phoneHint:'Obligatoire pour vous contacter et confirmer les détails de votre demande.',badPhone:'Saisissez un numéro valide contenant entre 9 et 15 chiffres.',submitHint:'Vérifiez le lien et le prix avant l’envoi.',urlLabel:'Lien du produit *',urlHint:'Le lien doit provenir d’une boutique prise en charge et utiliser HTTPS.',quantity:'Quantité *',destination:'Destination',variant:'Couleur / taille / variante (facultatif)',notes:'Notes supplémentaires (facultatif)',disclaimer:'Cette estimation est indicative et exclut la livraison et les droits de douane. Le prix final sera confirmé après vérification du produit.',submit:'Envoyer la demande',footer:'Le shopping mondial vers l’Algérie',badUrl:'Saisissez une URL HTTPS valide d’une boutique prise en charge.',badQty:'La quantité doit être comprise entre 1 et 30.',sending:'Envoi de la demande...',success:'Votre demande a été enregistrée. Suivez son statut depuis votre compte.',failed:'Impossible d’enregistrer la demande. Vérifiez votre connexion et réessayez.',login:'Connectez-vous d’abord. Redirection vers la page de connexion.',shop:'Boutique prise en charge :',required:'Impossible d’envoyer la demande. Vérifiez votre profil puis réessayez.',estimateEyebrow:'Estimation rapide',estimateTitle:'Estimez le prix de votre produit',estimateIntro:'Choisissez la devise et saisissez le prix affiché sur la boutique pour obtenir une estimation en dinars algériens.',productPriceLabel:'Prix du produit en boutique',productCurrencyLabel:'Devise du prix',originalPrice:'Prix du produit',convertedPrice:'Prix unitaire en dinars',serviceFeeLine:'Frais de service',estimatedTotal:'Total estimé',enterPrice:'Saisissez le prix du produit',pricingLoading:'Chargement des taux de change...',pricingFailed:'Tarification indisponible ; vérifiez la connexion puis réessayez.',pricingNote:'Estimation calculée avec les taux et frais configurés dans AchriLi. Livraison et douane non incluses ; le prix final sera confirmé après vérification de la demande.'}};
const t=k=>words[lang][k]||words.ar[k]||k;
function message(s,type='info'){$('notice').textContent=s;$('notice').className='notice '+type;$('notice').hidden=false}
function translate(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));$('language').textContent=lang==='ar'?'FR':'عربي';$('destination').value=$('destination').value||'Algeria';$('customerPhone').placeholder='+213 5XX XX XX XX'}
$('language').addEventListener('click',()=>{lang=lang==='ar'?'fr':'ar';localStorage.setItem('achrili-language',lang);translate();loadPricing()});
$('year').textContent=new Date().getFullYear();translate();
let pricingSettings=null;
const money=(value,currency)=>Number(value).toLocaleString(lang==='ar'?'ar-DZ':'fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+currency;
function updateEstimate(){
 const priceField=$('productPrice'),currency=$('productCurrency').value;
 const original=$('originalPriceValue'),converted=$('convertedPriceValue'),fee=$('serviceFeeValue'),total=$('estimatedTotalValue');
 const raw=priceField.value.trim(),price=Number(raw);
 if(!pricingSettings){original.textContent='—';converted.textContent='—';fee.textContent='—';total.textContent='—';return}
 if(raw===''||!Number.isFinite(price)||price<0){original.textContent='—';converted.textContent='—';fee.textContent=money(pricingSettings.serviceFeeDzd,'DZD');total.textContent=t('enterPrice');return}
 const convertedDzd=convertCurrency(price,currency,'DZD',pricingSettings);
 const quantity=Math.max(1,Math.min(30,Number($('quantity')?.value)||1));
 const feeDzd=pricingSettings.serviceFeeDzd;
 original.textContent=money(price,currency);
 converted.textContent=money(convertedDzd,'DZD');
 fee.textContent=money(feeDzd,'DZD');
 total.textContent=money(convertedDzd*quantity+feeDzd,'DZD');
}
$('productPrice').addEventListener('input',updateEstimate);
$('productCurrency').addEventListener('change',updateEstimate);
$('quantity').addEventListener('input',updateEstimate);
async function loadPricing(){
 const status=$('pricingStatus');
 status.textContent=t('pricingLoading');
 try{
  pricingSettings=await getPricingSettings();
  status.textContent=t('pricingNote');
  updateEstimate();
 }catch(error){
  console.error('Unable to load pricing settings',error);
  pricingSettings=null;
  status.textContent=t('pricingFailed');
  updateEstimate();
 }
}
loadPricing();

// Subscribe to database changes so the displayed rates and converter stay current.
const pricingChannel = supabase
  .channel('achrili-pricing-settings')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'AppSetting',
  }, () => {
    loadPricing();
  })
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.warn('Pricing Realtime unavailable; reload the page to refresh rates.');
    }
  });

window.addEventListener('pagehide', () => {
  supabase.removeChannel(pricingChannel);
}, { once: true });

const DRAFT_KEY='achrili-product-request-draft';
const LEGACY_DRAFT_KEY='achrili-product-request-draft';
const DRAFT_TTL=7*24*60*60*1000;
function readDraft(){
  try{
    let raw=localStorage.getItem(DRAFT_KEY);
    if(!raw){
      raw=sessionStorage.getItem(LEGACY_DRAFT_KEY);
      if(raw){localStorage.setItem(DRAFT_KEY,raw);sessionStorage.removeItem(LEGACY_DRAFT_KEY);}
    }
    if(!raw)return null;
    const draft=JSON.parse(raw);
    if(!draft||typeof draft!=='object'||!Number.isFinite(draft.updatedAt)||Date.now()-draft.updatedAt>DRAFT_TTL||draft.updatedAt>Date.now()+60000){
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  }catch(error){console.warn('Unable to read saved request draft',error);return null}
}
function setDraftStatus(message,hasDraft=false){
  const status=$('draftStatus'),clear=$('clearDraft');
  if(status)status.textContent=message;
  if(clear)clear.hidden=!hasDraft;
}
function saveDraft(){
  try{
    const draft={productUrl:$('productUrl').value.trim(),customerPhone:$('customerPhone').value.trim(),quantity:$('quantity').value,destination:$('destination').value.trim(),variant:$('variant').value,notes:$('notes').value,productPrice:$('productPrice').value,productCurrency:$('productCurrency').value,updatedAt:Date.now()};
    const hasUserInput=Boolean(draft.productUrl||draft.customerPhone||draft.productPrice||draft.variant.trim()||draft.notes.trim()||draft.quantity!=='1');
    if(hasUserInput){
      localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
      setDraftStatus(lang==='fr'?'Brouillon enregistré sur cet appareil (7 jours maximum).':'حُفظت المسودة على هذا الجهاز (لمدة أقصاها 7 أيام).',true);
    }else{
      localStorage.removeItem(DRAFT_KEY);
      setDraftStatus(lang==='fr'?'Le brouillon sera enregistré dès votre première modification.':'سيتم حفظ المسودة عند إجراء أول تعديل.',false);
    }
  }catch(error){
    console.warn('Unable to save request draft',error);
    setDraftStatus(lang==='fr'?'Enregistrement local indisponible dans ce navigateur.':'الحفظ المحلي غير متاح في هذا المتصفح.',false);
  }
}
function restoreDraft(){
  const params=new URLSearchParams(location.search),draft=readDraft();
  const initial=params.get('url')||sessionStorage.getItem('achrili-pending-product-url');
  if(draft){
    if(draft.productUrl&&!params.has('url'))$('productUrl').value=draft.productUrl;
    if(draft.customerPhone)$('customerPhone').value=draft.customerPhone;
    if(draft.quantity)$('quantity').value=draft.quantity;
    if(draft.destination)$('destination').value=draft.destination;
    if(draft.variant)$('variant').value=draft.variant;
    if(draft.notes)$('notes').value=draft.notes;
    if(draft.productPrice)$('productPrice').value=draft.productPrice;
    if(draft.productCurrency==='USD'||draft.productCurrency==='EUR')$('productCurrency').value=draft.productCurrency;
    updateEstimate();
    setDraftStatus(lang==='fr'?'Brouillon précédent restauré. Il expirera après 7 jours.':'تم استرجاع المسودة السابقة؛ تنتهي صلاحيتها بعد 7 أيام.',true);
  }else if(initial){
    try{$('productUrl').value=new URL(initial).href}catch{}
  }
}
restoreDraft();
['productUrl','customerPhone','quantity','destination','variant','notes','productPrice','productCurrency'].forEach(id=>{
  const field=$(id);
  field.addEventListener('input',saveDraft);
  field.addEventListener('change',saveDraft);
});
$('clearDraft').addEventListener('click',()=>{
  localStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem('achrili-pending-product-url');
  $('requestForm').reset();
  $('quantity').value='1';
  $('productPrice').value='';$('productCurrency').value='USD';updateEstimate();
  $('destination').value=lang==='fr'?'Algérie':'Algeria';
  setDraftStatus(lang==='fr'?'Brouillon supprimé de cet appareil.':'تم مسح المسودة المحفوظة من هذا الجهاز.',false);
  const cleanUrl=new URL(location.href);cleanUrl.search='';history.replaceState({},'',cleanUrl.pathname);
  $('productUrl').focus();
});
async function init(){const {data,error}=await supabase.auth.getSession();if(error||!data.session){saveDraft();if($('productUrl').value.trim())sessionStorage.setItem('achrili-pending-product-url',$('productUrl').value.trim());message(t('login'),'info');setTimeout(()=>location.replace('auth.html?next=request.html'),900);return}user=data.session.user}
$('requestForm').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;if(!user){message(t('login'),'info');return}
let url;try{url=new URL($('productUrl').value.trim())}catch{message(t('badUrl'),'error');return}
const shop=isValidProductUrl(url.href)?findSupportedShop(url.hostname):null;if(!shop){message(t('badUrl'),'error');return}
const phone=$('phone').value.trim();const phoneDigits=phone.replace(/\D/g,'');if(phoneDigits.length<9||phoneDigits.length>15){message(t('badPhone'),'error');$('phone').focus();return}
const quantity=Number($('quantity').value);if(!Number.isInteger(quantity)||quantity<1||quantity>30){message(t('badQty'),'error');return}
const customerPhone=$('customerPhone').value.trim();if(!customerPhone||customerPhone.replace(/\D/g,'').length<7){message(lang==='fr'?'Saisissez un numéro de téléphone valide pour confirmer votre demande.':'أدخل رقم هاتف صحيحًا لنتمكن من التواصل معك وتأكيد طلبك.','error');$('customerPhone').focus();return}
const destination=$('destination').value.trim();if(!destination){message(t('required'),'error');return}
busy=true;const btn=$('submit');btn.disabled=true;btn.textContent=t('sending');
try{const {data:sessionData,error:sessionError}=await supabase.auth.getSession();if(sessionError||!sessionData.session)throw new Error('auth');user=sessionData.session.user;if((user.user_metadata?.phone||'').trim()!==customerPhone){const {error:phoneError}=await supabase.auth.updateUser({data:{...user.user_metadata,phone:customerPhone}});if(phoneError)throw phoneError}
const {data:updatedUser,error:phoneSaveError}=await supabase.auth.updateUser({data:{...(sessionData.session.user.user_metadata||{}),phone}});if(phoneSaveError)throw phoneSaveError;if(updatedUser?.user)user=updatedUser.user;
const payload={id:crypto.randomUUID(),customerId:user.id,productUrl:url.href,quantity,notes:$('notes').value.trim()||null,variant:$('variant').value.trim()||null,destination,status:'SUBMITTED'};
const {error}=await supabase.from('ProductRequest').insert(payload);if(error)throw error;
sessionStorage.removeItem('achrili-pending-product-url');localStorage.removeItem(DRAFT_KEY);sessionStorage.removeItem(LEGACY_DRAFT_KEY);setDraftStatus(lang==='fr'?'Demande envoyée ; brouillon supprimé.':'تم إرسال الطلب ومسح المسودة.',false);message(t('success')+' '+t('shop')+' '+shop,'success');$('requestForm').reset();$('quantity').value='1';$('productPrice').value='';$('productCurrency').value='USD';updateEstimate();$('destination').value=lang==='fr'?'Algérie':'Algeria';const newUrl=new URL(location.href);newUrl.search='';history.replaceState({},'',newUrl.pathname);
}catch(err){console.error('Product request submission failed',err);message(err?.message==='auth'?t('login'):t('failed'),'error')}finally{busy=false;btn.disabled=false;btn.textContent=t('submit')}
});
init().catch(()=>location.replace('auth.html?next='+encodeURIComponent('request.html'+location.search)));
