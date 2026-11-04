import { supabase } from '../../../shared/services/supabase/client.js';
import { findSupportedShop, isValidProductUrl } from '../model/product-request.js';
import { getPricingSettings } from '../../../shared/services/supabase/pricing-settings.js';
import { convertCurrency } from '../../pricing/model/pricing.js';
const $=id=>document.getElementById(id);let lang=localStorage.getItem('achrili-language')==='fr'?'fr':'ar',user=null,busy=false;
const words={ar:{profile:'حسابي وطلباتي',back:'← العودة للرئيسية',eyebrow:'خطوة نحو تسوّق أسهل',title:'أرسل طلب المنتج',intro:'أدخل رابط المنتج وتفاصيله. سنحفظ طلبك في حسابك لتتمكن من متابعة حالته.',urlLabel:'رابط المنتج *',urlHint:'يجب أن يكون الرابط من متجر مدعوم وأن يبدأ بـ HTTPS.',quantity:'الكمية *',destination:'وجهة التسليم',variant:'اللون / المقاس / النسخة (اختياري)',notes:'ملاحظات إضافية (اختياري)',disclaimer:'إرسال الطلب يسجّل طلب مراجعة فقط؛ لا يعني شراء المنتج أو تأكيد السعر أو الشحن أو الدفع.',submit:'إرسال طلب المراجعة',footer:'تسوّق من العالم إلى الجزائر',badUrl:'أدخل رابط HTTPS صحيحاً من متجر مدعوم.',badQty:'يجب أن تكون الكمية بين 1 و30.',sending:'جارٍ إرسال الطلب...',success:'تم حفظ طلبك بنجاح. يمكنك متابعة حالته من صفحة حسابك.',failed:'تعذّر حفظ الطلب. حاول مجدداً بعد التحقق من اتصالك وحسابك.',login:'يجب تسجيل الدخول أولاً. سيتم توجيهك إلى صفحة الدخول.',shop:'المتجر المدعوم:',required:'تعذّر إرسال الطلب: تأكد من أن ملف حسابك مكتمل ثم أعد المحاولة.',rateLabel:'سعر الدولار',eurRateLabel:'سعر الأورو',converterTitle:'تحويل العملات',amountLabel:'المبلغ',fromLabel:'من',toLabel:'إلى',feeLabel:'رسوم خدمة AchriLi',pricingLoading:'جارٍ تحميل إعدادات التسعير...',pricingFailed:'تعذر تحميل إعدادات التسعير؛ لن نعرض تقديراً للسعر الآن.',rateSource:'المصدر',rateManual:'يدوي',pricingNote:'هذه الإعدادات معلوماتية حالياً. السعر النهائي والشحن غير مؤكدين حتى تتم مراجعة المنتج والتحقق من رسوم الشحن الفعلية.'},fr:{profile:'Mon compte et mes demandes',back:'← Retour à l’accueil',eyebrow:'Une étape vers un shopping plus simple',title:'Envoyer une demande produit',intro:'Saisissez le lien et les détails du produit. La demande sera enregistrée dans votre compte pour suivre son statut.',urlLabel:'Lien du produit *',urlHint:'Le lien doit provenir d’une boutique prise en charge et utiliser HTTPS.',quantity:'Quantité *',destination:'Destination',variant:'Couleur / taille / variante (facultatif)',notes:'Notes supplémentaires (facultatif)',disclaimer:'L’envoi crée une demande de vérification uniquement ; aucun achat, prix, livraison ou paiement n’est confirmé.',submit:'Envoyer la demande',footer:'Le shopping mondial vers l’Algérie',badUrl:'Saisissez une URL HTTPS valide d’une boutique prise en charge.',badQty:'La quantité doit être comprise entre 1 et 30.',sending:'Envoi de la demande...',success:'Votre demande a été enregistrée. Suivez son statut depuis votre compte.',failed:'Impossible d’enregistrer la demande. Vérifiez votre connexion et réessayez.',login:'Connectez-vous d’abord. Redirection vers la page de connexion.',shop:'Boutique prise en charge :',required:'Impossible d’envoyer la demande. Vérifiez votre profil puis réessayez.',rateLabel:'Taux du dollar',eurRateLabel:'Taux de l’euro',converterTitle:'Convertisseur de devises',amountLabel:'Montant',fromLabel:'De',toLabel:'Vers',feeLabel:'Frais de service AchriLi',pricingLoading:'Chargement des paramètres de tarification...',pricingFailed:'Impossible de charger les paramètres de tarification ; aucune estimation ne sera affichée.',rateSource:'Source',rateManual:'Manuel',pricingNote:'Ces paramètres sont informatifs pour le moment. Le prix final et la livraison ne sont pas confirmés avant vérification du produit et des frais de livraison réels.'}};
const t=k=>words[lang][k]||words.ar[k]||k;
function message(s,type='info'){$('notice').textContent=s;$('notice').className='notice '+type;$('notice').hidden=false}
function translate(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));$('language').textContent=lang==='ar'?'FR':'عربي';$('destination').value=$('destination').value||'Algeria'}
$('language').addEventListener('click',()=>{lang=lang==='ar'?'fr':'ar';localStorage.setItem('achrili-language',lang);translate();loadPricing()});
$('year').textContent=new Date().getFullYear();translate();
let pricingSettings=null;function updateConversion(){const result=$('convertResult');if(!pricingSettings){result.textContent='—';return}try{const amount=$('convertAmount').value;if(amount.trim()===''){result.textContent='—';return}const value=convertCurrency(amount,$('convertFrom').value,$('convertTo').value,pricingSettings);result.textContent=value.toLocaleString(lang==='ar'?'ar-DZ':'fr-FR',{maximumFractionDigits:2})+' '+$('convertTo').value}catch{result.textContent='—'}}
$('convertAmount').addEventListener('input',updateConversion);$('convertFrom').addEventListener('change',updateConversion);$('convertTo').addEventListener('change',updateConversion);
async function loadPricing(){const rate=$('pricingRate'),eurRate=$('pricingEurRate'),fee=$('pricingFee'),status=$('pricingStatus');status.textContent=t('pricingLoading');try{pricingSettings=await getPricingSettings();rate.textContent=Number(pricingSettings.usdToDzdRate).toLocaleString(lang==='ar'?'ar-DZ':'fr-FR')+' DZD / USD';eurRate.textContent=Number(pricingSettings.eurToDzdRate).toLocaleString(lang==='ar'?'ar-DZ':'fr-FR')+' DZD / EUR';fee.textContent=Number(pricingSettings.serviceFeeDzd).toLocaleString(lang==='ar'?'ar-DZ':'fr-FR')+' DZD';status.textContent=t('pricingNote');updateConversion()}catch(error){console.error('Unable to load pricing settings',error);pricingSettings=null;rate.textContent='—';eurRate.textContent='—';fee.textContent='—';status.textContent=t('pricingFailed');updateConversion()}}
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
    const draft={productUrl:$('productUrl').value.trim(),quantity:$('quantity').value,destination:$('destination').value.trim(),variant:$('variant').value,notes:$('notes').value,updatedAt:Date.now()};
    const hasUserInput=Boolean(draft.productUrl||draft.variant.trim()||draft.notes.trim()||draft.quantity!=='1');
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
    if(draft.quantity)$('quantity').value=draft.quantity;
    if(draft.destination)$('destination').value=draft.destination;
    if(draft.variant)$('variant').value=draft.variant;
    if(draft.notes)$('notes').value=draft.notes;
    setDraftStatus(lang==='fr'?'Brouillon précédent restauré. Il expirera après 7 jours.':'تم استرجاع المسودة السابقة؛ تنتهي صلاحيتها بعد 7 أيام.',true);
  }else if(initial){
    try{$('productUrl').value=new URL(initial).href}catch{}
  }
}
restoreDraft();
['productUrl','quantity','destination','variant','notes'].forEach(id=>{
  const field=$(id);
  field.addEventListener('input',saveDraft);
  field.addEventListener('change',saveDraft);
});
$('clearDraft').addEventListener('click',()=>{
  localStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem('achrili-pending-product-url');
  $('requestForm').reset();
  $('quantity').value='1';
  $('destination').value=lang==='fr'?'Algérie':'Algeria';
  setDraftStatus(lang==='fr'?'Brouillon supprimé de cet appareil.':'تم مسح المسودة المحفوظة من هذا الجهاز.',false);
  $('productUrl').focus();
});
async function init(){const {data,error}=await supabase.auth.getSession();if(error||!data.session){saveDraft();if($('productUrl').value.trim())sessionStorage.setItem('achrili-pending-product-url',$('productUrl').value.trim());message(t('login'),'info');setTimeout(()=>location.replace('auth.html?next=request.html'),900);return}user=data.session.user}
$('requestForm').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;if(!user){message(t('login'),'info');return}
let url;try{url=new URL($('productUrl').value.trim())}catch{message(t('badUrl'),'error');return}
const shop=isValidProductUrl(url.href)?findSupportedShop(url.hostname):null;if(!shop){message(t('badUrl'),'error');return}
const quantity=Number($('quantity').value);if(!Number.isInteger(quantity)||quantity<1||quantity>30){message(t('badQty'),'error');return}
const destination=$('destination').value.trim();if(!destination){message(t('required'),'error');return}
busy=true;const btn=$('submit');btn.disabled=true;btn.textContent=t('sending');
try{const {data:sessionData,error:sessionError}=await supabase.auth.getSession();if(sessionError||!sessionData.session)throw new Error('auth');user=sessionData.session.user;
const payload={id:crypto.randomUUID(),customerId:user.id,productUrl:url.href,quantity,notes:$('notes').value.trim()||null,variant:$('variant').value.trim()||null,destination,status:'SUBMITTED'};
const {error}=await supabase.from('ProductRequest').insert(payload);if(error)throw error;
sessionStorage.removeItem('achrili-pending-product-url');localStorage.removeItem(DRAFT_KEY);sessionStorage.removeItem(LEGACY_DRAFT_KEY);setDraftStatus(lang==='fr'?'Demande envoyée ; brouillon supprimé.':'تم إرسال الطلب ومسح المسودة.',false);message(t('success')+' '+t('shop')+' '+shop,'success');$('requestForm').reset();$('quantity').value='1';$('destination').value=lang==='fr'?'Algérie':'Algeria';const newUrl=new URL(location.href);newUrl.search='';history.replaceState({},'',newUrl.pathname);
}catch(err){console.error('Product request submission failed',err);message(err?.message==='auth'?t('login'):t('failed'),'error')}finally{busy=false;btn.disabled=false;btn.textContent=t('submit')}
});
init().catch(()=>location.replace('auth.html?next='+encodeURIComponent('request.html'+location.search)));
