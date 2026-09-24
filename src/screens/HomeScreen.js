import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function HomeScreen({ user, navigation, onLogout }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐾 Welcome to Pawbook</Text>
      {user?.username && (
        <Text style={styles.userText}>Logged in as @{user.username}</Text>
      )}
      <Text style={styles.subtitle}>Your posts & feed will appear here</Text>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => {
          if (onLogout) onLogout();
          else navigation?.navigate('Welcome');
        }}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  userText: { fontSize: 18, color: '#e94560', fontWeight: '600', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#a0a0b0', marginBottom: 30 },
  logoutBtn: {
    backgroundColor: 'transparent',
    borderColor: '#e94560',
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutText: { color: '#e94560', fontSize: 16, fontWeight: '600' },
});

