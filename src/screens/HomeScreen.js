import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';
import CatMascot from '../components/CatMascot';

export default function HomeScreen({ user, navigation, onLogout }) {
  return (
    <View style={styles.container}>
      <CatMascot size={80} style={{ marginBottom: 20 }} />
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
        activeOpacity={0.85}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: THEME.colors.text, marginBottom: 8 },
  userText: { fontSize: 16, color: THEME.colors.secondary, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 15, color: THEME.colors.textSecondary, marginBottom: 30 },
  logoutBtn: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.borderCrimson,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  logoutText: { color: THEME.colors.offWhite, fontSize: 15, fontWeight: '700' },
});
