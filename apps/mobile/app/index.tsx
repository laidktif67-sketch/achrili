import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, Pressable, View } from "react-native";
import { useRouter } from "expo-router";

const shops = ["Temu", "AliExpress", "Amazon", "SHEIN", "eBay", "Walmart", "Etsy", "ASOS"];
const domains: Record<string, string[]> = {
  Temu: ["temu.com"], AliExpress: ["aliexpress.com"],
  Amazon: ["amazon.com", "amazon.co.uk", "amazon.fr", "amazon.de", "amazon.it", "amazon.es"],
  SHEIN: ["shein.com"], "eBay": ["ebay.com", "ebay.co.uk", "ebay.fr"],
  Walmart: ["walmart.com"], Etsy: ["etsy.com"], ASOS: ["asos.com"]
};
function supported(urlText: string) {
  try {
    const url = new URL(urlText.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return Object.values(domains).flat().some((domain) => host === domain || host.endsWith("." + domain));
  } catch { return false; }
}

export default function HomeScreen() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState("");
  function continueRequest() {
    if (!supported(url)) { setNotice("أدخل رابط HTTPS صحيحاً من متجر مدعوم."); return; }
    setNotice("");
    router.push("/request?url=" + encodeURIComponent(url.trim()));
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View><Text style={styles.logo}>Achri<Text style={styles.orange}>Li</Text></Text><Text style={styles.tag}>اشريلي · تسوّق من العالم</Text></View>
        <Pressable style={styles.avatar} onPress={() => router.push("/profile")}><Text style={styles.avatarText}>◉</Text></Pressable>
      </View>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>تسوّق عالمي، أقرب إليك</Text>
        <Text style={styles.title}>أرسل رابط المنتج، ودعنا نراجع طلبك.</Text>
        <Text style={styles.subtitle}>من متاجرك المفضلة إلى الجزائر. راجع تفاصيل السعر والشحن قبل تأكيد أي طلب.</Text>
        <TextInput style={styles.urlInput} value={url} onChangeText={setUrl} placeholder="ألصق رابط المنتج هنا..." placeholderTextColor="#8995a9" autoCapitalize="none" autoCorrect={false} keyboardType="url" textAlign="left" />
        <Pressable style={styles.primary} onPress={continueRequest}><Text style={styles.primaryText}>تابع طلب المنتج ←</Text></Pressable>
        {!!notice && <Text style={styles.error}>{notice}</Text>}
      </View>
      <Text style={styles.sectionTitle}>متاجر عالمية بين يديك</Text>
      <View style={styles.grid}>{shops.map((shop) => <View key={shop} style={styles.shop}><Text style={styles.shopText}>{shop}</Text></View>)}</View>
      <Text style={styles.sectionTitle}>كيف تعمل AchriLi؟</Text>
      <View style={styles.step}><Text style={styles.stepNo}>01</Text><View style={styles.stepBody}><Text style={styles.stepTitle}>أرسل رابط المنتج</Text><Text style={styles.stepText}>من متجرك العالمي المفضل.</Text></View></View>
      <View style={styles.step}><Text style={styles.stepNo}>02</Text><View style={styles.stepBody}><Text style={styles.stepTitle}>نراجع طلبك</Text><Text style={styles.stepText}>نوضح السعر والشحن قبل التأكيد.</Text></View></View>
      <View style={styles.step}><Text style={styles.stepNo}>03</Text><View style={styles.stepBody}><Text style={styles.stepTitle}>تابع حالة طلبك</Text><Text style={styles.stepText}>من حسابك في اشريلي.</Text></View></View>
      <Text style={styles.disclaimer}>إرسال الرابط ينشئ طلب مراجعة فقط، ولا يعني شراء المنتج أو تأكيد السعر أو الشحن تلقائياً.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 18, paddingTop: 28, paddingBottom: 35 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  logo: { color: "#071f5c", fontSize: 27, fontWeight: "900", textAlign: "left" },
  orange: { color: "#f59a23" },
  tag: { color: "#75839a", fontSize: 10, textAlign: "right", marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#eaf1ff", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#16458f", fontSize: 22 },
  hero: { borderRadius: 22, padding: 20, backgroundColor: "#071f5c", marginBottom: 24 },
  eyebrow: { color: "#ffc47c", fontSize: 11, fontWeight: "800", textAlign: "right" },
  title: { color: "#ffffff", fontSize: 23, lineHeight: 37, fontWeight: "800", textAlign: "right", marginTop: 10 },
  subtitle: { color: "#dce7fb", fontSize: 11, lineHeight: 22, textAlign: "right", marginTop: 7, marginBottom: 15 },
  urlInput: { backgroundColor: "#ffffff", borderRadius: 10, height: 48, paddingHorizontal: 13, fontSize: 12, color: "#172744" },
  primary: { backgroundColor: "#f59a23", borderRadius: 10, height: 47, alignItems: "center", justifyContent: "center", marginTop: 10 },
  primaryText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  error: { color: "#ffd9d4", textAlign: "right", fontSize: 10, marginTop: 8 },
  sectionTitle: { color: "#071f5c", fontSize: 16, fontWeight: "800", textAlign: "right", marginBottom: 13, marginTop: 8 },
  grid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 9, marginBottom: 25 },
  shop: { width: "23%", minHeight: 57, borderRadius: 12, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5ebf4", alignItems: "center", justifyContent: "center", padding: 5 },
  shopText: { color: "#34445f", fontSize: 10, fontWeight: "700" },
  step: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 13, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: "#e7edf6" },
  stepNo: { color: "#16458f", backgroundColor: "#eaf1ff", overflow: "hidden", borderRadius: 10, padding: 9, fontSize: 12, fontWeight: "900" },
  stepBody: { flex: 1, marginRight: 12 },
  stepTitle: { color: "#071f5c", textAlign: "right", fontWeight: "800", fontSize: 12 },
  stepText: { color: "#7b879c", textAlign: "right", fontSize: 10, marginTop: 3 },
  disclaimer: { color: "#8b642b", backgroundColor: "#fff8ec", borderRadius: 10, padding: 12, fontSize: 10, lineHeight: 20, textAlign: "right", marginTop: 14 }
});
