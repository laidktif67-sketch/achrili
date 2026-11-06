import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AchriLi</Text>
      <Text>تطبيق AchriLi — نقطة البداية للواجهة الجديدة.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 12 }
});
