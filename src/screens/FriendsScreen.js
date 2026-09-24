import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, RefreshControl,
} from 'react-native';
import {
  searchUsers, sendFriendRequest, getPendingRequests,
  getSentRequests, getFriends, acceptFriendRequest, rejectFriendRequest,
} from '../services/api';

const PURPLE = '#7C3AED';

export default function FriendsScreen({ user, token }) {
  const [activeSection, setActiveSection] = useState('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingTo, setSendingTo] = useState(null); // userId currently sending request to
  const [actioningReq, setActioningReq] = useState(null); // requestId being accepted/rejected

  // Fetch friends + requests on mount
  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoadingFriends(true);
    try {
      const [f, p, s] = await Promise.all([
        getFriends(token),
        getPendingRequests(token),
        getSentRequests(token),
      ]);
      setFriends(f);
      setPendingRequests(p);
      setSentRequests(s);
    } catch (err) {
      // silent fail — will show empty states
    } finally {
      setLoadingFriends(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // ─── Search ───
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsers(token, query.trim());
      // Filter out self
      setSearchResults(results.filter(u => u._id !== user?._id));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSearching(false);
    }
  };

  // ─── Send Friend Request ───
  const handleSendRequest = async (userId) => {
    setSendingTo(userId);
    try {
      await sendFriendRequest(token, userId);
      Alert.alert('✅ Sent!', 'Friend request sent successfully');
      // Refresh sent requests
      const s = await getSentRequests(token);
      setSentRequests(s);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSendingTo(null);
    }
  };

  // ─── Accept / Reject ───
  const handleAccept = async (requestId) => {
    setActioningReq(requestId);
    try {
      await acceptFriendRequest(token, requestId);
      Alert.alert('🎉 Accepted!', 'You are now friends');
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActioningReq(null);
    }
  };

  const handleReject = async (requestId) => {
    setActioningReq(requestId);
    try {
      await rejectFriendRequest(token, requestId);
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActioningReq(null);
    }
  };

  // Check if a user is already a friend, has a pending sent request, etc.
  const friendIds = friends.map(f => f._id);
  const sentIds = sentRequests.map(s => s.receiver?._id || s.receiver);
  const pendingIds = pendingRequests.map(p => p.sender?._id || p.sender);

  const getUserStatus = (userId) => {
    if (friendIds.includes(userId)) return 'friend';
    if (sentIds.includes(userId)) return 'sent';
    if (pendingIds.includes(userId)) return 'pending';
    return 'none';
  };

  const getInitial = (name) => (name ? name[0].toUpperCase() : '?');

  // ─── Render ───
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>🐾 Friends</Text>

      {/* Section tabs */}
      <View style={styles.tabRow}>
        {['search', 'requests', 'friends'].map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeSection === key && styles.tabActive]}
            onPress={() => setActiveSection(key)}
          >
            <Text style={[styles.tabText, activeSection === key && styles.tabTextActive]}>
              {key === 'search' ? '🔍 Search' : key === 'requests' ? `📬 Requests${pendingRequests.length ? ` (${pendingRequests.length})` : ''}` : `👥 My Friends (${friends.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Search Section ── */}
      {activeSection === 'search' && (
        <View>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
              {searching
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.searchBtnText}>Search</Text>
              }
            </TouchableOpacity>
          </View>

          {searchResults.length === 0 && !searching && query.length > 0 && (
            <Text style={styles.emptyText}>No users found for "{query}"</Text>
          )}

          {searchResults.map((u) => {
            const status = getUserStatus(u._id);
            return (
              <View key={u._id} style={styles.card}>
                {u.avatar ? (
                  <Image source={{ uri: u.avatar }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitial(u.username)}</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>{u.username}</Text>
                  <Text style={styles.email}>{u.email}</Text>
                </View>
                {status === 'friend' ? (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>✓ Friends</Text>
                  </View>
                ) : status === 'sent' ? (
                  <View style={[styles.statusBadge, styles.statusSent]}>
                    <Text style={styles.statusSentText}>Pending</Text>
                  </View>
                ) : status === 'pending' ? (
                  <View style={[styles.statusBadge, styles.statusSent]}>
                    <Text style={styles.statusSentText}>Incoming</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleSendRequest(u._id)}
                    disabled={sendingTo === u._id}
                  >
                    {sendingTo === u._id
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.addBtnText}>+ Add</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ── Requests Section ── */}
      {activeSection === 'requests' && (
        <View>
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptySubtext}>Search for friends to connect!</Text>
            </View>
          ) : (
            pendingRequests.map((req) => {
              const sender = req.sender;
              return (
                <View key={req._id} style={styles.card}>
                  {sender?.avatar ? (
                    <Image source={{ uri: sender.avatar }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitial(sender?.username)}</Text>
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.name}>{sender?.username || 'Unknown'}</Text>
                    <Text style={styles.email}>Wants to be your friend</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(req._id)}
                      disabled={actioningReq === req._id}
                    >
                      {actioningReq === req._id
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.acceptBtnText}>✓</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(req._id)}
                      disabled={actioningReq === req._id}
                    >
                      <Text style={styles.rejectBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Sent requests */}
          {sentRequests.length > 0 && (
            <View style={styles.sentSection}>
              <Text style={styles.sentTitle}>Sent Requests ({sentRequests.length})</Text>
              {sentRequests.map((req) => {
                const receiver = req.receiver;
                return (
                  <View key={req._id} style={styles.sentCard}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{getInitial(receiver?.username)}</Text>
                    </View>
                    <Text style={styles.sentName}>{receiver?.username || 'Unknown'}</Text>
                    <Text style={styles.sentStatus}>Pending</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ── Friends List Section ── */}
      {activeSection === 'friends' && (
        <View>
          {loadingFriends ? (
            <ActivityIndicator size="large" color={PURPLE} style={{ marginTop: 40 }} />
          ) : friends.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🐾</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Search and send friend requests to connect!</Text>
            </View>
          ) : (
            friends.map((f) => (
              <View key={f._id} style={styles.card}>
                {f.avatar ? (
                  <Image source={{ uri: f.avatar }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitial(f.username)}</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>{f.username}</Text>
                  <Text style={styles.email}>{f.email}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>✓ Friends</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },

  // Search
  searchRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: PURPLE,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 20 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarImg: { width: 50, height: 50, borderRadius: 25, marginRight: 14 },
  avatarText: { fontSize: 22, fontWeight: '700', color: PURPLE },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  email: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Buttons
  addBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  statusBadgeText: { color: '#059669', fontSize: 12, fontWeight: '700' },
  statusSent: { backgroundColor: '#FEF3C7' },
  statusSentText: { color: '#D97706', fontSize: 12, fontWeight: '700' },

  // Accept / Reject
  actionRow: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    backgroundColor: '#059669',
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  rejectBtn: {
    backgroundColor: '#F3F4F6',
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  rejectBtnText: { color: '#6B7280', fontSize: 16, fontWeight: '700' },

  // Empty state
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: PURPLE,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // Sent section
  sentSection: { marginTop: 24 },
  sentTitle: { fontSize: 15, fontWeight: '700', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  sentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarSmallText: { fontSize: 16, fontWeight: '700', color: PURPLE },
  sentName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  sentStatus: { fontSize: 12, color: '#D97706', fontWeight: '600' },
});
