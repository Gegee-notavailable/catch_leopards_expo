import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // แก้ไขชื่อ Collection จาก 'detections' เป็น 'detection_logs' ให้ตรงกับ Backend
    const q = query(collection(db, 'detection_logs'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // --- ระบบแจ้งเตือน Real-time บนหน้าแอป ---
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !loading) { // ตรวจจับข้อมูลใหม่ที่เพิ่มเข้ามา
          const newItem = change.doc.data();
          
          // ดึง Label จากโครงสร้าง detections[0].label ตามที่เห็นใน Firebase
          const label = newItem.detections?.[0]?.label || "Unknown";
          
          if (label === 'leopard') {
            Alert.alert(
              "⚠️ ALERT: LEOPARD DETECTED!",
              "พบเสือดาวในพื้นที่ กรุณาระมัดระวัง",
              [{ text: "รับทราบ", style: "destructive" }]
            );
          } else if (label === 'domestic') {
            console.log("Detected: Domestic object (User/Staff)");
          }
        }
      });
      // ------------------------------------

      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loading]);

  const renderItem = ({ item }: { item: any }) => {
    // ดึงข้อมูล Label จากโครงสร้าง Array detections ใน Firebase
    const displayLabel = item.detections?.[0]?.label || item.label || 'Unidentified';
    const confidence = item.detections?.[0]?.confidence 
      ? `(${(item.detections[0].confidence * 100).toFixed(1)}%)` 
      : '';

    return (
      <View style={styles.logCard}>
        <View style={styles.logInfo}>
          <Text style={styles.logTime}>
            {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString('th-TH') : 'Unknown Time'}
          </Text>
          <Text style={styles.logType}>{displayLabel} {confidence}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[
            styles.dot, 
            { backgroundColor: displayLabel === 'leopard' ? '#FF5252' : '#4CAF50' }
          ]} />
          <Text style={[
            styles.statusText, 
            { color: displayLabel === 'leopard' ? '#FF5252' : '#4CAF50' }
          ]}>
            {displayLabel === 'leopard' ? 'DANGER' : 'LOGGED'}
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
  logTime: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  logType: { color: '#AAA', fontSize: 13, textTransform: 'uppercase' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontWeight: 'bold', fontSize: 12 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 100, fontSize: 16 }
});