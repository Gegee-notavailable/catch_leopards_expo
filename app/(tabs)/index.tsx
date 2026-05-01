import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../firebaseConfig'; // ดึงค่า db (Firestore) มาใช้
import { collection, addDoc } from "firebase/firestore";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const cameraRef = useRef<any>(null);

  // ฟังก์ชันถ่ายรูปแล้วแปลงเป็น Base64 ส่งเข้า Firestore
  const captureAndUploadAsBase64 = async () => {
    if (cameraRef.current && isMonitoring) {
      try {
        // 1. ถ่ายรูปและบังคับให้เป็น Base64
        // บีบคุณภาพเหลือ 0.1 เพื่อให้ไฟล์เล็กพอที่จะลง Firestore (ห้ามเกิน 1MB)
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.1, 
          base64: true,
          skipProcessing: true 
        });

        if (photo.base64) {
          // 2. ส่ง "ตัวอักษรรูปภาพ" เข้า Firestore ตรงๆ
          const docRef = await addDoc(collection(db, "monitoring_logs"), {
            imageBase64: `data:image/jpg;base64,${photo.base64}`, // เก็บเป็น String
            timestamp: new Date().toISOString(),
            status: "searching",
            device: "iPhone_Intern"
          });

          console.log("✅ String Sent! Doc ID:", docRef.id);
        }
      } catch (err) {
        console.error("❌ Firestore Upload Failed:", err);
      }
    }
  };

  // ตั้งเวลาให้ทำงานทุก 3 วินาที
  useEffect(() => {
    let interval: any;
    if (isMonitoring) {
      interval = setInterval(captureAndUploadAsBase64, 3000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>ขอสิทธิ์ใช้กล้อง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>LEOPARD MONITOR</Text>
      
      <View style={styles.centerArea}>
        {isMonitoring ? (
          <View style={styles.cameraWrapper}>
            <CameraView style={styles.camera} ref={cameraRef} />
            <TouchableOpacity onPress={() => setIsMonitoring(false)} style={styles.stopBtn}>
              <Text style={styles.buttonText}>STOP MONITORING</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsMonitoring(true)}>
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.scanButton}>
              <Text style={styles.buttonText}>START{"\n"}REAL-TIME</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.footerText}>
        ● {isMonitoring ? 'SENDING STRINGS TO FIRESTORE' : 'SYSTEM READY'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#4CAF50', fontSize: 26, fontWeight: 'bold', position: 'absolute', top: 70, letterSpacing: 2 },
  centerArea: { width: '100%', alignItems: 'center' },
  scanButton: { width: 220, height: 220, borderRadius: 110, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  cameraWrapper: { width: '85%', height: 400, borderRadius: 20, overflow: 'hidden', borderWidth: 3, borderColor: '#4CAF50' },
  camera: { flex: 1 },
  stopBtn: { backgroundColor: '#FF5252', padding: 15, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  footerText: { color: '#4CAF50', position: 'absolute', bottom: 50, fontSize: 12 },
  permissionBtn: { backgroundColor: '#4CAF50', padding: 20, borderRadius: 10 }
});