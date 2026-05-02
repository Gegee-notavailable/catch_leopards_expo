import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.includes('@')) {
      Alert.alert("Error", "กรุณากรอก Email ให้ถูกต้อง (ต้องมี @)");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // เมื่อ Login สำเร็จ RootLayout จะพาไปหน้า (tabs) เองอัตโนมัติ
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FARMER LOGIN</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email (e.g. test@gmail.com)"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>LOG IN</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={{ color: '#888' }}>No account? </Text>
        <Link href="/register" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>Register as Farmer</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText: { color: '#4CAF50', fontWeight: 'bold' }
});