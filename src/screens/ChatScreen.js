import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const MOCK_CHATS = [
  { id: 1, name: 'Luna', username: 'luna_paws', lastMsg: 'Hey! How is Max doing? 🐶', time: '2m', unread: 2 },
  { id: 2, name: 'Max', username: 'max_woof', lastMsg: 'Loved your last post!', time: '1h', unread: 0 },
  { id: 3, name: 'Bella', username: 'bella_meow', lastMsg: 'Can we meet at the park?', time: '3h', unread: 1 },
];

export default function ChatScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>💬 Chat</Text>
      <Text style={styles.subtitle}>Your conversations</Text>

      {MOCK_CHATS.map((chat) => (
        <TouchableOpacity key={chat.id} style={styles.card} activeOpacity={0.75}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{chat.name[0]}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.row}>
              <Text style={styles.name}>{chat.name}</Text>
              <Text style={styles.time}>{chat.time}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.lastMsg} numberOfLines={1}>{chat.lastMsg}</Text>
              {chat.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{chat.unread}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
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
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#7C3AED' },
  info: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  time: { fontSize: 12, color: '#9CA3AF' },
  lastMsg: { fontSize: 13, color: '#6B7280', marginTop: 3, flex: 1 },
  badge: {
    backgroundColor: '#7C3AED',
    minWidth: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5, marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
