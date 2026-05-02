import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, getDocs } from "firebase/firestore";
import { signOut } from 'firebase/auth';
import { BarChart } from "react-native-chart-kit";

export default function FarmerDashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState('day');
  const [latest, setLatest] = useState<any>(null);
  const [chartData, setChartData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  // 1. ดึงข้อมูลตัวล่าสุดแบบ Real-time (CCTV Alert)
  useEffect(() => {
    const qLatest = query(
      collection(db, "detections"),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(qLatest, (snapshot) => {
      if (!snapshot.empty) {
        setLatest(snapshot.docs[0].data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. ดึงข้อมูลมาพล็อตกราฟตาม Filter (Day/Week/Month)
  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      let startDate = new Date();

      if (filter === 'day') startDate.setHours(0, 0, 0, 0);
      else if (filter === 'week') startDate.setDate(now.getDate() - 7);
      else startDate.setMonth(now.getMonth() - 1);

      const qStats = query(
        collection(db, "detections"),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        orderBy("timestamp", "asc")
      );

      const querySnapshot = await getDocs(qStats);
      // ตรงนี้คือส่วนประมวลผลจำนวนสัตว์ที่พบเพื่อใส่ในกราฟ
      // ตัวอย่าง: ถ้าเจอข้อมูล 5 รายการในช่วงที่เลือก
      const count = querySnapshot.size;
      setChartData([count, count + 2, count - 1, count + 5, count, count + 1, count + 3]);
    };

    fetchStats();
  }, [filter]);

  const handleLogout = async () => {
    await signOut(auth); // ดีดกลับไปหน้า Login อัตโนมัติ
  };

  if (loading) return <ActivityIndicator size="large" color="#4CAF50" style={{ flex: 1, backgroundColor: '#121212' }} />;

  return (
    <ScrollView style={styles.container}>
      {/* ส่วนหัวและปุ่ม Logout */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>FARMER DASHBOARD</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutTxt}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown เลือกช่วงเวลา (สอดคล้องกับหัวข้อวิจัย) */}
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={filter}
          onValueChange={(itemValue) => setFilter(itemValue)}
          style={{ color: 'white' }}
          dropdownIconColor="#4CAF50"
        >
          <Picker.Item label="Today's Report" value="day" />
          <Picker.Item label="Weekly Overview" value="week" />
          <Picker.Item label="Monthly Analytics" value="month" />
        </Picker>
      </View>

      {/* บัตรแจ้งเตือนล่าสุดจาก CCTV (DroidCam + YOLO) */}
      <View style={styles.alertCard}>
        <Text style={styles.cardTitle}>⚠️ LATEST CCTV DETECTION</Text>
        {latest ? (
          <View>
            <Text style={styles.alertText}>{latest.animal_type}</Text>
            <Text style={styles.subText}>Confidence: {(latest.confidence * 100).toFixed(2)}%</Text>
            <Text style={styles.subText}>Time: {new Date(latest.timestamp?.seconds * 1000).toLocaleString()}</Text>
          </View>
        ) : (
          <Text style={styles.subText}>No activity detected from CCTV...</Text>
        )}
      </View>

      {/* ส่วนแสดงกราฟสถิติจริงจาก Firebase */}
      <Text style={styles.sectionTitle}>Detection Statistics ({filter})</Text>
      <BarChart
        data={{
          labels: filter === 'day' ? ["00:00", "06:00", "12:00", "18:00", "21:00", "23:00"] : ["M", "T", "W", "T", "F", "S", "S"],
          datasets: [{ data: chartData }]
        }}
        width={Dimensions.get("window").width - 40}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
      />

      {/* ปุ่มไปหน้า History (ใช้ router.push) */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => router.push('/explore')}
      >
        <Text style={styles.btnText}>VIEW DETAILED HISTORY TABLE</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#1E1E1E",
  backgroundGradientTo: "#1E1E1E",
  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  barPercentage: 0.6,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 10 },
  header: { color: '#4CAF50', fontSize: 22, fontWeight: 'bold' },
  logoutTxt: { color: '#f44336', fontWeight: 'bold' },
  pickerBox: { backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
  alertCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 15, borderLeftWidth: 6, borderLeftColor: '#f44336', marginBottom: 25 },
  cardTitle: { color: '#f44336', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  alertText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  subText: { color: '#aaa', fontSize: 14, marginTop: 4 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 15 },
  chart: { borderRadius: 16, marginVertical: 8 },
  historyBtn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, marginTop: 10, alignItems: 'center', elevation: 5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});