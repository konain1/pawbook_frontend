import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function FeedScreen({ user }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🐾 Feed</Text>
      <Text style={styles.subtitle}>Posts from your friends will appear here</Text>

      {/* Placeholder cards */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar} />
            <View>
              <Text style={styles.cardUser}>@pawuser{i}</Text>
              <Text style={styles.cardTime}>2h ago</Text>
            </View>
          </View>
          <Text style={styles.cardBody}>🐶 Just took my dog to the park! What a lovely day. 🌿</Text>
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
    padding: 18,
    marginBottom: 14,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', marginRight: 12 },
  cardUser: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  cardTime: { fontSize: 12, color: '#9CA3AF' },
  cardBody: { fontSize: 15, color: '#374151', lineHeight: 22 },
});
