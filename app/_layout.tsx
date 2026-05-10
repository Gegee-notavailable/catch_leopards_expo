import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useRef } from 'react'; 
import { auth, db } from './firebaseConfig'; 
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator, Alert } from 'react-native'; 
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'; 

export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // --- Global Wild Animal Watcher (Real-time monitoring) ---
  const lastAlertTimeRef = useRef<number>(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Listen to the most recent detection log
    const q = query(collection(db, 'detection_logs'), orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Skip the initial data on first app load
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newItem = change.doc.data();
          
          // Pull label from detections array
          const label = (newItem.detections?.[0]?.label || "").toLowerCase();
          const currentTime = Date.now();
          
          // Data freshness check (within 15 seconds) and Cooldown (10 seconds)
          const logTime = newItem.timestamp?.toMillis() || 0;
          const isRecentData = logTime > currentTime - 15000;
          const isCooldownOver = currentTime - lastAlertTimeRef.current > 10000;

          // Trigger alert if wild animal detected
          if (label.includes('wild') && isRecentData && isCooldownOver) {
            lastAlertTimeRef.current = currentTime;
            
            // ✅ Global English Alert
            Alert.alert(
              "🚨 ALERT: WILD ANIMAL DETECTED!",
              "Our security system has spotted a wild animal in the monitored area. Please check the history logs immediately.",
              [
                { 
                  text: "DISMISS", 
                  style: "cancel" 
                },
                { 
                  text: "VIEW LOGS", 
                  onPress: () => router.push('/explore'),
                  style: "destructive"
                }
              ]
            );
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);
  // ---------------------------------------------------------

  // Authentication State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  // Navigation Logic
  useEffect(() => {
    if (loading) return;
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && inTabsGroup) {
      router.replace('/login');
    } else if (user && !inTabsGroup) {
      router.replace('/');
    }
  }, [user, segments, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}