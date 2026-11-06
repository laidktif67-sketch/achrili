import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";

type RequestRow = {
  id: string;
  productName: string | null;
  productUrl: string;
  quantity: number;
  status: string;
};
type QuoteRow = {
  id: string;
  requestId: string;
  currency: string;
  productCost: number | string;
  shippingCost: number | string;
  serviceFee: number | string;
  customsEstimate: number | string | null;
  total: number | string;
  notes: string | null;
  expiresAt: string | null;
  status: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "مرسل إليك",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  EXPIRED: "منتهي الصلاحية"
};

function amount(value: number | string, currency: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ar-DZ");
}

export default function QuotesScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    if (authError || !sessionData.session) {
      router.replace("/auth?next=/quotes");
      return;
    }

    const { data: requestRows, error: requestError } = await supabase
      .from("ProductRequest")
      .select("id,productName,productUrl,quantity,status")
      .eq("customerId", sessionData.session.user.id)
      .order("createdAt", { ascending: false })
      .limit(50);
    if (requestError) throw requestError;

    const rows = (requestRows ?? []) as RequestRow[];
    const ids = rows.map((row) => row.id);
    let quoteRows: QuoteRow[] = [];
    if (ids.length > 0) {
      const { data, error: quoteError } = await supabase
        .from("Quote")
        .select("id,requestId,currency,productCost,shippingCost,serviceFee,customsEstimate,total,notes,expiresAt,status,createdAt")
        .in("requestId", ids)
        .order("createdAt", { ascending: false });
      if (quoteError) throw quoteError;
      quoteRows = (data ?? []) as QuoteRow[];
    }
    setRequests(rows);
    setQuotes(quoteRows);
  }, [router]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load()
      .catch(() => { if (active) setError("تعذّر تحميل عروض الأسعار. اسحب الشاشة للتحديث أو حاول لاحقاً."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); }
    catch { setError("تعذّر تحديث عروض الأسعار. تحقق من اتصالك ثم حاول مجدداً."); }
    finally { setRefreshing(false); }
  }, [load]);

  const requestById = new Map(requests.map((request) => [request.id, request]));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#16458f" />}
    >
      <Text style={styles.title}>عروض الأسعار</Text>
      <Text style={styles.subtitle}>راجع تفاصيل كل عرض قبل اتخاذ قرارك. لا يتم الدفع تلقائياً.</Text>

      {loading && <View style={styles.state}><ActivityIndicator color="#16458f" /><Text style={styles.meta}>جارٍ تحميل عروض الأسعار...</Text></View>}
      {!!error && <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><Pressable onPress={refresh}><Text style={styles.retry}>إعادة المحاولة</Text></Pressable></View>}
      {!loading && !error && quotes.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>لا توجد عروض أسعار بعد</Text>
          <Text style={styles.meta}>ستظهر عروضك هنا بعد مراجعة طلبات المنتجات.</Text>
          <Pressable style={styles.button} onPress={() => router.push("/orders")}><Text style={styles.buttonText}>متابعة طلباتي</Text></Pressable>
        </View>
      )}

      {!loading && !error && quotes.map((quote) => {
        const request = requestById.get(quote.requestId);
        const currency = quote.currency || "DZD";
        const expired = Boolean(quote.expiresAt && Date.parse(quote.expiresAt) <= Date.now());
        return (
          <View key={quote.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{request?.productName || "عرض سعر لطلب منتج"}</Text>
              <Text style={[styles.badge, quote.status === "SENT" && !expired ? styles.badgeSent : null]}>
                {expired ? "منتهي الصلاحية" : statusLabels[quote.status] || quote.status}
              </Text>
            </View>
            {request && <Text style={styles.meta}>الكمية: {request.quantity} · حالة الطلب: {request.status}</Text>}
            <View style={styles.line}><Text style={styles.lineLabel}>سعر المنتج</Text><Text style={styles.lineValue}>{amount(quote.productCost, currency)}</Text></View>
            <View style={styles.line}><Text style={styles.lineLabel}>الشحن</Text><Text style={styles.lineValue}>{amount(quote.shippingCost, currency)}</Text></View>
            <View style={styles.line}><Text style={styles.lineLabel}>رسوم الخدمة</Text><Text style={styles.lineValue}>{amount(quote.serviceFee, currency)}</Text></View>
            {quote.customsEstimate !== null && <View style={styles.line}><Text style={styles.lineLabel}>تقدير الجمارك</Text><Text style={styles.lineValue}>{amount(quote.customsEstimate, currency)}</Text></View>}
            <View style={[styles.line, styles.total]}><Text style={styles.totalLabel}>الإجمالي</Text><Text style={styles.totalValue}>{amount(quote.total, currency)}</Text></View>
            {!!quote.notes && <Text style={styles.notes}>{quote.notes}</Text>}
            {!!quote.expiresAt && <Text style={styles.meta}>صالح حتى: {dateLabel(quote.expiresAt)}</Text>}
            <Text style={styles.meta}>تاريخ العرض: {dateLabel(quote.createdAt)}</Text>
            {quote.status === "SENT" && !expired && (
              <Text style={styles.notice}>العرض متاح للمراجعة. لإتمام الخطوات التالية، استخدم صفحة عروض الأسعار على موقع AchriLi.</Text>
            )}
            {!!request?.productUrl && <Pressable style={styles.outline} onPress={() => router.push("/orders")}><Text style={styles.outlineText}>عرض طلباتي</Text></Pressable>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 18, paddingTop: 30, paddingBottom: 36 },
  title: { fontSize: 23, fontWeight: "900", color: "#071f5c", textAlign: "right" },
  subtitle: { fontSize: 11, color: "#7b879c", textAlign: "right", lineHeight: 21, marginTop: 5, marginBottom: 18 },
  state: { alignItems: "center", gap: 10, padding: 28 },
  card: { backgroundColor: "#fff", borderRadius: 15, borderWidth: 1, borderColor: "#e5ebf4", padding: 15, marginBottom: 12 },
  cardHeader: { gap: 9, marginBottom: 8 },
  name: { fontSize: 13, fontWeight: "800", color: "#071f5c", textAlign: "right" },
  badge: { alignSelf: "flex-end", overflow: "hidden", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#edf1f7", color: "#52617a", fontSize: 10, fontWeight: "800" },
  badgeSent: { backgroundColor: "#e8f6ee", color: "#17653d" },
  line: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#edf0f5" },
  lineLabel: { color: "#66758d", fontSize: 11 },
  lineValue: { color: "#263a5b", fontSize: 11, fontWeight: "700" },
  total: { borderBottomWidth: 0, marginTop: 2 },
  totalLabel: { color: "#071f5c", fontSize: 12, fontWeight: "900" },
  totalValue: { color: "#071f5c", fontSize: 14, fontWeight: "900" },
  meta: { color: "#7b879c", fontSize: 10, textAlign: "right", marginTop: 7, lineHeight: 18 },
  notes: { color: "#465671", fontSize: 11, textAlign: "right", lineHeight: 20, marginTop: 9, backgroundColor: "#f7f9fc", padding: 10, borderRadius: 9 },
  notice: { color: "#825c2b", fontSize: 10, lineHeight: 19, textAlign: "right", backgroundColor: "#fff8ec", padding: 10, borderRadius: 9, marginTop: 10 },
  empty: { alignItems: "center", backgroundColor: "#fff", borderRadius: 15, borderWidth: 1, borderColor: "#e5ebf4", padding: 22 },
  emptyTitle: { color: "#071f5c", fontSize: 14, fontWeight: "900", marginBottom: 5 },
  errorBox: { backgroundColor: "#fff0ee", borderRadius: 12, padding: 14 },
  error: { color: "#a52e27", fontSize: 11, textAlign: "right", lineHeight: 20 },
  retry: { color: "#16458f", fontWeight: "800", fontSize: 11, textAlign: "right", marginTop: 10 },
  button: { backgroundColor: "#071f5c", borderRadius: 9, paddingHorizontal: 18, paddingVertical: 12, marginTop: 15 },
  buttonText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  outline: { borderWidth: 1, borderColor: "#dce6f7", borderRadius: 9, padding: 10, alignItems: "center", marginTop: 12 },
  outlineText: { color: "#16458f", fontSize: 10, fontWeight: "800" }
});
