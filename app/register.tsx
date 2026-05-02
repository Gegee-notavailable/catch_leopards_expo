import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleRegister = async () => {
        if (password.length < 6) {
            Alert.alert("Error", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            Alert.alert("Success", "ลงทะเบียนสำเร็จ!", [
                { text: "OK", onPress: () => router.replace('/login') }
            ]);
        } catch (error: any) {
            Alert.alert("Registration Error", error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>REGISTER FARMER</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password (min 6 chars)"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={[styles.button, { backgroundColor: '#2E7D32' }]} onPress={handleRegister}>
                <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
                <Text style={{ color: '#888', textAlign: 'center' }}>Back to Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', marginBottom: 40 },
    input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15 },
    button: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});