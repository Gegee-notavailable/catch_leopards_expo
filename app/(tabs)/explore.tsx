import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ดึงข้อมูลจาก collection 'detections'
    const q = query(collection(db, 'detections'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.logCard}>
      <View style={styles.logInfo}>
        <Text style={styles.logTime}>
          {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString('th-TH') : 'Unknown Time'}
        </Text>
        <Text style={styles.logType}>{item.label || 'Unidentified Object'}</Text>
      </View>
      <View style={styles.statusContainer}>
        <View style={styles.dot} />
        <Text style={styles.statusText}>LOGGED</Text>
      </View>
    </View>
  );

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
  logType: { color: '#888', fontSize: 13 },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 6 },
  statusText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 100, fontSize: 16 }
});