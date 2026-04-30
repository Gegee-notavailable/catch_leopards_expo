import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker'; // ตัวช่วยเปิดกล้อง

export default function App() {
  const [isScanning, setIsScanning] = useState(false);

  // ฟังก์ชันสำหรับเปิดกล้อง
  const openCamera = async () => {
    // 1. ขออนุญาตเข้าถึงกล้อง
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("ขออภัย", "แอปต้องการสิทธิ์เข้าถึงกล้องเพื่อสแกนครับ");
      return;
    }

    // 2. เปิดกล้องถ่ายรูป
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // ถ่ายเสร็จใช้เลย ไม่ต้องตัดรูป
      quality: 0.7,        // ความชัดกำลังดี ไฟล์ไม่หนักเกินไป
    });

    if (!result.canceled) {
      // ตรงนี้คือจุดที่เพื่อนที่เทรนโมเดลจะเอาไปใช้ต่อ
      Alert.alert("ถ่ายรูปสำเร็จ!", "กำลังส่งภาพไปวิเคราะห์หาเสือดาว...");
      console.log("รูปที่ถ่ายได้:", result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>CATCH LEOPARDS</Text>

      <View style={styles.centerArea}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={() => setIsScanning(true)}
          onPressOut={() => setIsScanning(false)}
          onPress={openCamera} // กดแล้วเปิดกล้อง
        >
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={[styles.scanButton, isScanning && styles.scanButtonActive]}
          >
            <View style={styles.innerCircle}>
              <Text style={styles.buttonText}>
                {isScanning ? "SCANNING..." : "START\nMONITORING"}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>AI Wildlife Protection System</Text>
        <Text style={styles.statusText}>● System Online</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50
  },
  title: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    letterSpacing: 2
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center'
  },
  scanButton: {
    width: 260,
    height: 260,
    borderRadius: 130,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 15,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20
  },
  innerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonActive: {
    transform: [{ scale: 0.92 }]
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28
  },
  footer: {
    alignItems: 'center'
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 5
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500'
  }
});