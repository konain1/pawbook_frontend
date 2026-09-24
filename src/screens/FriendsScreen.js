import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const MOCK = [
  { id: 1, name: 'Luna', username: 'luna_paws', mutual: 3 },
  { id: 2, name: 'Max', username: 'max_woof', mutual: 1 },
  { id: 3, name: 'Bella', username: 'bella_meow', mutual: 5 },
];

export default function FriendsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🐾 Friends</Text>
      <Text style={styles.subtitle}>Connect with other pet lovers</Text>

      {MOCK.map((f) => (
        <View key={f.id} style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{f.name[0]}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{f.name}</Text>
            <Text style={styles.username}>@{f.username}</Text>
            <Text style={styles.mutual}>{f.mutual} mutual friends</Text>
          </View>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#7C3AED' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  username: { fontSize: 13, color: '#9CA3AF', marginTop: 1 },
  mutual: { fontSize: 12, color: '#7C3AED', marginTop: 3, fontWeight: '500' },
  addBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
