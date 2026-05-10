import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, Timestamp, getDocs } from "firebase/firestore";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. เพิ่ม Monthly เข้าไปในฟิลเตอร์
const FILTERS = [
  { id: 'day', label: "Today's Report" },
  { id: 'week', label: "Weekly's Report" },
  { id: 'month', label: "Monthly's Report" }
];

const SingleBarChart = ({ labels, data }: { labels: string[], data: number[] }) => {
  const chartHeight = 180;
  const maxVal = Math.max(...data, 5);
  const yAxisLabels = [maxVal, Math.floor(maxVal / 2), 0];
  const groupWidth = (SCREEN_WIDTH - 80) / (labels.length || 1);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.yAxis}>
        {yAxisLabels.map((l, i) => (
          <Text key={i} style={styles.axisText}>{String(l)}</Text>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.chartArea}>
          {data.map((val, i) => (
            <View key={i} style={[styles.barGroup, { width: groupWidth }]}>
              <View style={styles.barWrapper}>
                <Text style={styles.barVal}>{val > 0 ? String(val) : ""}</Text>
                <View style={[
                  styles.bar,
                  { backgroundColor: '#4CAF50', height: (val / maxVal) * chartHeight, width: groupWidth * 0.5 }
                ]} />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.xAxis}>
          {labels.map((l, i) => (
            <Text key={i} style={[styles.axisText, { width: groupWidth, textAlign: 'center' }]}>{l}</Text>
          ))}
        </View>
      </View>
    </View>
  );
};

export default function FarmerDashboard() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], values: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const filter = FILTERS[activeIndex].id;
      const now = new Date();
      const start = new Date();

      // ตั้งค่าช่วงเวลาตาม Filter
      if (filter === 'day') {
        start.setHours(0, 0, 0, 0);
      } else if (filter === 'week') {
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
      } else if (filter === 'month') {
        start.setDate(now.getDate() - 29); // ย้อนหลัง 30 วัน
        start.setHours(0, 0, 0, 0);
      }

      try {
        const q = query(
          collection(db, "detection_logs"),
          where("timestamp", ">=", Timestamp.fromDate(start)),
          orderBy("timestamp", "asc")
        );
        const snap = await getDocs(q);
        const logs = snap.docs.map(d => d.data());

        let labels: string[] = [];
        let values: number[] = [];

        if (filter === 'day') {
          labels = ["00-06h", "06-12h", "12-18h", "18-00h"];
          values = [0, 0, 0, 0];
          logs.forEach(log => {
            const h = log.timestamp.toDate().getHours();
            const label = (log.detections?.[0]?.label || "").toLowerCase();
            const idx = Math.min(Math.floor(h / 6), 3);
            if (label.includes('wild')) values[idx]++;
          });
        } else if (filter === 'week') {
          // รายสัปดาห์ (อ้างอิงตามวันปัจจุบัน)
          const dayLabels = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
          }
          labels = dayLabels;
          values = Array(7).fill(0);
          logs.forEach(log => {
            const logDate = log.timestamp.toDate();
            const dayName = logDate.toLocaleDateString('en-US', { weekday: 'short' });
            const labelIdx = labels.indexOf(dayName);
            const labelStr = (log.detections?.[0]?.label || "").toLowerCase();
            if (labelStr.includes('wild') && labelIdx !== -1) values[labelIdx]++;
          });
        } else if (filter === 'month') {
          // 2. รายเดือน: แบ่งเป็น 4 สัปดาห์
          labels = ["W1", "W2", "W3", "W4"];
          values = [0, 0, 0, 0];
          logs.forEach(log => {
            const logDate = log.timestamp.toDate();
            const diffTime = now.getTime() - logDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // แบ่งช่วง 30 วันเป็น 4 บาร์ (ประมาณช่วงละ 7-8 วัน)
            const weekIdx = Math.min(Math.floor(diffDays / 7.5), 3);
            const labelStr = (log.detections?.[0]?.label || "").toLowerCase();
            if (labelStr.includes('wild')) {
              values[3 - weekIdx]++; // 3-weekIdx เพื่อให้สัปดาห์ล่าสุดอยู่ขวาสุด
            }
          });
        }
        setChartData({ labels, values });
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeIndex]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WILD ANIMAL DETECTION</Text>
          <Text style={styles.headerSub}>Security Node: Active</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => auth.signOut()}>
          <Text style={styles.logoutTxt}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.tab, activeIndex === i && styles.activeTab]}
              onPress={() => setActiveIndex(i)}
            >
              <Text style={[styles.tabTxt, activeIndex === i && styles.activeTabTxt]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Intrusion Frequency (Wild Animal Only)</Text>
        {loading ? (
          <ActivityIndicator color="#4CAF50" size="large" style={{ height: 220 }} />
        ) : (
          <SingleBarChart labels={chartData.labels} data={chartData.values} />
        )}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendTxt}>WILD ANIMAL DETECTED</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.mainBtn} onPress={() => router.push('/explore')}>
        <Text style={styles.mainBtnTxt}>OPEN FULL LOG HISTORY</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  headerTitle: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#666', fontSize: 12 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FF5252', backgroundColor: 'rgba(255, 82, 82, 0.1)' },
  logoutTxt: { color: '#FF5252', fontSize: 12, fontWeight: 'bold' },
  filterBar: { marginBottom: 20 },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, marginRight: 10, backgroundColor: '#1E1E1E' },
  activeTab: { backgroundColor: '#4CAF50' },
  tabTxt: { color: '#666', fontWeight: 'bold', fontSize: 13 },
  activeTabTxt: { color: '#FFF' },
  card: { backgroundColor: '#1E1E1E', borderRadius: 25, padding: 15, alignItems: 'center' },
  cardTitle: { color: '#FFF', fontSize: 14, marginBottom: 20 },
  chartContainer: { flexDirection: 'row', height: 240, width: '100%' },
  yAxis: { width: 35, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 8, paddingBottom: 45 },
  chartArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#333', height: 180 },
  barGroup: { alignItems: 'center', justifyContent: 'flex-end' },
  barWrapper: { alignItems: 'center', justifyContent: 'flex-end' },
  bar: { borderRadius: 4 },
  barVal: { color: '#AAA', fontSize: 10, marginBottom: 5, fontWeight: 'bold' },
  xAxis: { flexDirection: 'row', marginTop: 10 },
  axisText: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  legend: { flexDirection: 'row', marginTop: 25 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendTxt: { color: '#AAA', fontSize: 11, fontWeight: 'bold' },
  mainBtn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 20, marginTop: 30, alignItems: 'center' },
  mainBtnTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});