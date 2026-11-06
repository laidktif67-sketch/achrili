import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";

function safeNext(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 8) { Alert.alert("تحقق من البيانات", "أدخل البريد وكلمة مرور من 8 أحرف على الأقل."); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace(next as never);
      } else {
        if (name.trim().length < 2) throw new Error("أدخل اسمك الكامل.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { full_name: name.trim(), phone: phone.trim() } }
        });
        if (error) throw error;
        if (data.session) router.replace(next as never);
        else Alert.alert("تحقق من بريدك", "أرسلنا رابط تأكيد الحساب إلى بريدك الإلكتروني.");
      }
    } catch (error) {
      Alert.alert("تعذّر تسجيل الدخول", error instanceof Error ? error.message : "حاول مجدداً.");
    } finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Achri<Text style={styles.orange}>Li</Text></Text>
        <Text style={styles.title}>{mode === "login" ? "مرحباً بعودتك" : "أنشئ حسابك في اشريلي"}</Text>
        <Text style={styles.subtitle}>سجّل الدخول لمتابعة طلباتك وعروض الأسعار.</Text>
        {mode === "signup" && <>
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="اسمك الكامل" textAlign="right" />
          <Text style={styles.label}>رقم الهاتف</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+213..." keyboardType="phone-pad" textAlign="right" />
        </>}
        <Text style={styles.label}>البريد الإلكتروني</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textAlign="left" />
        <Text style={styles.label}>كلمة المرور</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="8 أحرف على الأقل" secureTextEntry autoCapitalize="none" />
        <Pressable style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={submit}><Text style={styles.primaryText}>{busy ? "يرجى الانتظار..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</Text></Pressable>
        <View style={styles.switchRow}><Text style={styles.muted}>{mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}</Text><Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")}><Text style={styles.link}>{mode === "login" ? "إنشاء حساب" : "تسجيل الدخول"}</Text></Pressable></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:"#f5f7fb"},content:{padding:24,paddingTop:65,flexGrow:1,justifyContent:"center"},
 brand:{fontSize:30,fontWeight:"900",color:"#071f5c",textAlign:"center",marginBottom:24},orange:{color:"#f59a23"},
 title:{fontSize:22,fontWeight:"800",color:"#071f5c",textAlign:"right"},subtitle:{fontSize:11,color:"#7b879c",textAlign:"right",lineHeight:22,marginTop:7,marginBottom:18},
 label:{fontSize:11,fontWeight:"800",color:"#394b68",textAlign:"right",marginTop:12,marginBottom:7},
 input:{height:48,borderWidth:1,borderColor:"#dce4f0",borderRadius:10,backgroundColor:"#fff",paddingHorizontal:13,fontSize:12,color:"#172744"},
 primary:{height:48,backgroundColor:"#f59a23",borderRadius:10,alignItems:"center",justifyContent:"center",marginTop:20},disabled:{opacity:.6},primaryText:{color:"#fff",fontSize:12,fontWeight:"800"},
 switchRow:{flexDirection:"row-reverse",justifyContent:"center",gap:8,marginTop:20},muted:{fontSize:10,color:"#7b879c"},link:{fontSize:10,color:"#16458f",fontWeight:"800"}
});
