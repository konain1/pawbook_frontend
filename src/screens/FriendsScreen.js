import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import {
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  getFriends,
  acceptFriendRequest,
  rejectFriendRequest,
} from '../services/api';
import { THEME } from '../constants/theme';
import CatMascot from '../components/CatMascot';

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
  const [sendingTo, setSendingTo] = useState(null);
  const [actioningReq, setActioningReq] = useState(null);

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
      // silent fail
    } finally {
      setLoadingFriends(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  // ── Search ──
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsers(token, query.trim());
      setSearchResults(results.filter((u) => u._id !== user?._id));
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSearching(false);
    }
  };

  // ── Send Friend Request ──
  const handleSendRequest = async (userId) => {
    setSendingTo(userId);
    try {
      await sendFriendRequest(token, userId);
      Alert.alert('✅ Sent!', 'Friend request sent successfully');
      const s = await getSentRequests(token);
      setSentRequests(s);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSendingTo(null);
    }
  };

  // ── Accept / Reject ──
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

  const friendIds = friends.map((f) => f._id);
  const sentIds = sentRequests.map((s) => s.receiver?._id || s.receiver);
  const pendingIds = pendingRequests.map((p) => p.sender?._id || p.sender);

  const getUserStatus = (userId) => {
    if (friendIds.includes(userId)) return 'friend';
    if (sentIds.includes(userId)) return 'sent';
    if (pendingIds.includes(userId)) return 'pending';
    return 'none';
  };

  const getInitial = (name) => (name ? name[0].toUpperCase() : '?');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={THEME.colors.primary}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>🐾 Friends & Network</Text>

      {/* Section tabs */}
      <View style={styles.tabRow}>
        {['search', 'requests', 'friends'].map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeSection === key && styles.tabActive]}
            onPress={() => setActiveSection(key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeSection === key && styles.tabTextActive]}>
              {key === 'search'
                ? '🔍 Search'
                : key === 'requests'
                ? `📬 Requests${pendingRequests.length ? ` (${pendingRequests.length})` : ''}`
                : `👥 Friends (${friends.length})`}
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
              placeholder="Search by pet lover's username..."
              placeholderTextColor={THEME.colors.textLight}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearch}
              disabled={searching}
              activeOpacity={0.85}
            >
              {searching ? (
                <ActivityIndicator color={THEME.colors.offWhite} size="small" />
              ) : (
                <Text style={styles.searchBtnText}>Search</Text>
              )}
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
                    activeOpacity={0.85}
                  >
                    {sendingTo === u._id ? (
                      <ActivityIndicator color={THEME.colors.offWhite} size="small" />
                    ) : (
                      <Text style={styles.addBtnText}>+ Add</Text>
                    )}
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
              <CatMascot size={68} />
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
                      activeOpacity={0.85}
                    >
                      {actioningReq === req._id ? (
                        <ActivityIndicator color={THEME.colors.offWhite} size="small" />
                      ) : (
                        <Text style={styles.acceptBtnText}>✓</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(req._id)}
                      disabled={actioningReq === req._id}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.rejectBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Sent Requests Sub-Section */}
          {sentRequests.length > 0 && (
            <View style={styles.sentSection}>
              <Text style={styles.sentTitle}>Sent Requests ({sentRequests.length})</Text>
              {sentRequests.map((req) => {
                const receiver = req.receiver;
                return (
                  <View key={req._id} style={styles.sentCard}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>
                        {getInitial(receiver?.username || '?')}
                      </Text>
                    </View>
                    <Text style={styles.sentName}>{receiver?.username || 'User'}</Text>
                    <Text style={styles.sentStatus}>Pending Response</Text>
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
            <ActivityIndicator color={THEME.colors.primary} style={{ marginTop: 30 }} />
          ) : friends.length === 0 ? (
            <View style={styles.emptyCard}>
              <CatMascot size={68} />
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtext}>
                Use the search tab to find and add fellow pet lovers!
              </Text>
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
  container: { flex: 1, backgroundColor: THEME.colors.background },
  content: { padding: 20, paddingBottom: 110, paddingTop: 52 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.borderCrimson,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: { fontSize: 12, fontWeight: '700', color: THEME.colors.textSecondary },
  tabTextActive: { color: THEME.colors.offWhite },

  // Search
  searchRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceWarm,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.colors.text,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: 'center',
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBtnText: { color: THEME.colors.offWhite, fontWeight: '800', fontSize: 14 },

  emptyText: { color: THEME.colors.textLight, fontSize: 14, textAlign: 'center', marginTop: 20 },

  // Cards
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderCrimson,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderCrimson,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: THEME.colors.offWhite },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: THEME.colors.text },
  email: { fontSize: 12, color: THEME.colors.textSecondary, marginTop: 2 },

  // Buttons
  addBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    minWidth: 64,
    alignItems: 'center',
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: { color: THEME.colors.offWhite, fontSize: 13, fontWeight: '800' },

  statusBadge: {
    backgroundColor: THEME.colors.accentLight,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: { color: THEME.colors.offWhite, fontSize: 12, fontWeight: '700' },
  statusSent: { backgroundColor: THEME.colors.surfaceWarm, borderColor: THEME.colors.border },
  statusSentText: { color: THEME.colors.warning, fontSize: 12, fontWeight: '700' },

  // Accept / Reject
  actionRow: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    backgroundColor: THEME.colors.success,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  rejectBtn: {
    backgroundColor: THEME.colors.accentLight,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: { color: THEME.colors.offWhite, fontSize: 16, fontWeight: '800' },

  // Empty state
  emptyCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtext: { fontSize: 14, color: THEME.colors.textSecondary, textAlign: 'center' },

  // Sent section
  sentSection: { marginTop: 24 },
  sentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textLight,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sentCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
  },
  avatarSmallText: { fontSize: 15, fontWeight: '800', color: THEME.colors.offWhite },
  sentName: { flex: 1, fontSize: 14, fontWeight: '700', color: THEME.colors.text },
  sentStatus: { fontSize: 12, color: THEME.colors.warning, fontWeight: '600' },
});
