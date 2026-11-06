import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { supabase } from "../src/lib/supabase";
import { isValidProductUrl } from "@achrili/shared/domain/product-request";


export default function RequestScreen(){
 const router=useRouter();const params=useLocalSearchParams<{url?:string}>();
 const initialUrl=Array.isArray(params.url)?params.url[0]||"":params.url||"";
 const [url,setUrl]=useState(initialUrl);const [quantity,setQuantity]=useState("1");const [destination,setDestination]=useState("Algeria");const [phone,setPhone]=useState("");const [variant,setVariant]=useState("");const [notes,setNotes]=useState("");const [busy,setBusy]=useState(false);const [user,setUser]=useState<any>(null);
 useEffect(()=>{let active=true;supabase.auth.getSession().then(({data,error})=>{if(!active)return;if(error||!data.session){router.replace("/auth?next=/request");return}setUser(data.session.user);setPhone(data.session.user.user_metadata?.phone||"")});return()=>{active=false}},[router]);
 useEffect(()=>{if(initialUrl)setUrl(initialUrl)},[initialUrl]);
 async function submit(){
  if(!user){router.replace("/auth?next=/request");return}
  if(!isValidProductUrl(url.trim())){Alert.alert("رابط غير صالح","استخدم رابط HTTPS من متجر مدعوم.");return}
  const q=Number(quantity),digits=phone.replace(/\D/g,"");if(!Number.isInteger(q)||q<1||q>30){Alert.alert("الكمية غير صحيحة","الكمية يجب أن تكون بين 1 و30.");return}if(digits.length<9||digits.length>15){Alert.alert("رقم الهاتف","أدخل رقم هاتف صحيحاً مع مفتاح الدولة.");return}
  setBusy(true);try{
   const {data:session,error:sessionError}=await supabase.auth.getSession();if(sessionError||!session.session)throw new Error("انتهت جلسة تسجيل الدخول.");
   const u=session.session.user;if((u.user_metadata?.phone||"").trim()!==phone.trim()){const {error}=await supabase.auth.updateUser({data:{...u.user_metadata,phone:phone.trim()}});if(error)throw error}
   const {error}=await supabase.from("ProductRequest").insert({id:Crypto.randomUUID(),customerId:u.id,productUrl:url.trim(),quantity:q,destination:destination.trim(),variant:variant.trim()||null,notes:notes.trim()||null,status:"SUBMITTED"});if(error)throw error;
   Alert.alert("تم إرسال الطلب","تم حفظ طلبك بنجاح. يمكنك متابعة حالته من صفحة طلباتي.",[{text:"عرض طلباتي",onPress:()=>router.replace("/orders")}]);
  }catch(error){Alert.alert("تعذّر إرسال الطلب",error instanceof Error?error.message:"حاول مجدداً.")}finally{setBusy(false)}
 }
 const field=(label:string,value:string,onChangeText:(v:string)=>void,placeholder:string,options:any={})=><View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8b98ac" textAlign="right" {...options}/></View>;
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <Text style={styles.eyebrow}>طلب جديد</Text><Text style={styles.title}>أرسل طلب المنتج</Text><Text style={styles.subtitle}>أكمل المعلومات التالية حتى نتمكن من مراجعة طلبك.</Text>
  <View style={styles.card}>
   {field("رابط المنتج *",url,setUrl,"https://...",{keyboardType:"url",autoCapitalize:"none",autoCorrect:false})}
   <Text style={styles.hint}>{isValidProductUrl(url.trim())?"تم التحقق مبدئياً من المتجر المدعوم.":"الرابط يجب أن يكون HTTPS من متجر مدعوم."}</Text>
   {field("الكمية *",quantity,setQuantity,"1",{keyboardType:"number-pad"})}
   {field("وجهة التسليم",destination,setDestination,"Algeria")}
   {field("رقم الهاتف للتواصل *",phone,setPhone,"+213...",{keyboardType:"phone-pad"})}
   {field("اللون / المقاس / النسخة",variant,setVariant,"اختياري")}
   <View style={styles.field}><Text style={styles.label}>ملاحظات إضافية</Text><TextInput style={[styles.input,styles.multiline]} value={notes} onChangeText={setNotes} placeholder="أي تفاصيل تساعدنا..." placeholderTextColor="#8b98ac" multiline textAlign="right" textAlignVertical="top"/></View>
   <Text style={styles.notice}>إرسال الطلب لا يعني شراء المنتج أو تأكيد السعر والشحن. ستتم مراجعة التفاصيل قبل أي خطوة لاحقة.</Text>
   <Pressable style={[styles.button,busy&&styles.disabled]} onPress={submit} disabled={busy}><Text style={styles.buttonText}>{busy?"جارٍ الإرسال...":"إرسال طلب المراجعة"}</Text></Pressable>
  </View>
 </ScrollView>
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:"#f5f7fb"},content:{padding:18,paddingTop:30,paddingBottom:35},
 eyebrow:{color:"#bd7419",fontSize:11,fontWeight:"800",textAlign:"right"},title:{fontSize:23,fontWeight:"900",color:"#071f5c",textAlign:"right",marginTop:7},subtitle:{fontSize:11,color:"#7b879c",textAlign:"right",lineHeight:21,marginTop:5,marginBottom:17},
 card:{backgroundColor:"#fff",borderRadius:17,borderWidth:1,borderColor:"#e5ebf4",padding:16},
 field:{marginBottom:13},label:{fontSize:11,color:"#394b68",fontWeight:"800",textAlign:"right",marginBottom:7},
 input:{minHeight:46,borderWidth:1,borderColor:"#dce4f0",borderRadius:9,paddingHorizontal:12,paddingVertical:10,color:"#172744",fontSize:12,backgroundColor:"#fff"},multiline:{minHeight:88},
 hint:{fontSize:9,color:"#7b879c",textAlign:"right",marginTop:-6,marginBottom:10},notice:{fontSize:10,color:"#825c2b",backgroundColor:"#fff8ec",padding:11,borderRadius:9,lineHeight:19,textAlign:"right",marginTop:3},
 button:{height:48,backgroundColor:"#071f5c",borderRadius:10,alignItems:"center",justifyContent:"center",marginTop:16},disabled:{opacity:.55},buttonText:{color:"#fff",fontSize:12,fontWeight:"800"}
});
