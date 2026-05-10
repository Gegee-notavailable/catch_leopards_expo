import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ดึงข้อมูลล่าสุด 50 รายการจาก Firestore
    const q = query(
      collection(db, 'detection_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // --- หมายเหตุ: ลบส่วน Alert ออกจากตรงนี้แล้ว เพื่อไม่ให้แจ้งเตือนซ้ำซ้อนในหน้านี้ ---

      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    // 1. ดึงข้อมูล Label จากอาเรย์ detections
    const rawLabel = item.detections?.[0]?.label || item.label || 'Unidentified';
    const displayLabel = rawLabel.toUpperCase();

    // 2. คำนวณค่า Confidence
    const confValue = item.detections?.[0]?.confidence;
    const confidenceText = confValue
      ? `(${(confValue * 100).toFixed(1)}%)`
      : '';

    // 3. เช็คว่าเป็นสัตว์ป่าหรือไม่ (ใช้คำว่า 'wild' เพื่อเปลี่ยนเป็นสีแดง)
    const isDangerous = rawLabel.toLowerCase().includes('wild');

    return (
      <View style={[
        styles.logCard, 
        isDangerous && { borderColor: '#FF5252', backgroundColor: '#2A1A1A' } // ขอบแดงและพื้นหลังเข้มขึ้นเมื่ออันตราย
      ]}>
        <View style={styles.logInfo}>
          <Text style={styles.logTime}>
            {item.timestamp?.toDate
              ? item.timestamp.toDate().toLocaleString('th-TH')
              : 'Unknown Time'}
          </Text>
          <Text style={[styles.logType, isDangerous && { color: '#FF5252', fontWeight: 'bold' }]}>
            {isDangerous ? "🚨 " : ""}{displayLabel} {confidenceText}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[
            styles.dot,
            { backgroundColor: isDangerous ? '#FF5252' : '#4CAF50' }
          ]} />
          <Text style={[
            styles.statusText,
            { color: isDangerous ? '#FF5252' : '#4CAF50' }
          ]}>
            {isDangerous ? 'DANGER' : 'LOGGED'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.header}>DETECTION HISTORY</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={logs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No history found in database.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  innerContainer: { flex: 1, padding: 20 },
  header: { color: '#4CAF50', fontSize: 28, fontWeight: 'bold', marginBottom: 25, marginTop: 10 },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A'
  },
  logInfo: { flex: 1 },
  logTime: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  logType: { color: '#AAA', fontSize: 12, textTransform: 'uppercase' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontWeight: 'bold', fontSize: 12 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 100, fontSize: 16 }
});