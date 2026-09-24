import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.logo}>🐾</Text>
      <Text style={styles.title}>Pawbook</Text>
      <Text style={styles.subtitle}>Connect with pet lovers everywhere</Text>

      <TouchableOpacity style={styles.loginBtn} onPress={() => navigation?.navigate('Login')}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerBtn} onPress={() => navigation?.navigate('Register')}>
        <Text style={styles.registerText}>Create Account</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Made with ❤️ for pets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: { fontSize: 80, marginBottom: 10 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#a0a0b0', marginBottom: 50 },
  loginBtn: {
    backgroundColor: '#e94560',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  registerBtn: {
    backgroundColor: 'transparent',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94560',
  },
  registerText: { color: '#e94560', fontSize: 18, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 40, color: '#555', fontSize: 14 },
});
