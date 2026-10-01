import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  getFriends,
  getConversationList,
  getConversation,
  sendMessage,
  markMessagesAsRead,
} from '../services/api';
import { THEME } from '../constants/theme';
import CatMascot from '../components/CatMascot';

export default function ChatScreen({ user, token, navigation }) {
  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Chat State
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef(null);

  // ── Fetch Friends & Recent Conversations ──
  const loadChatData = useCallback(async () => {
    if (!token) return;
    try {
      const [friendsList, convList] = await Promise.all([
        getFriends(token).catch(() => []),
        getConversationList(token).catch(() => []),
      ]);
      setFriends(Array.isArray(friendsList) ? friendsList : []);
      setConversations(Array.isArray(convList) ? convList : []);
    } catch (err) {
      console.warn('Error loading chat data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChatData();
  };

  // ── Fetch Messages with Active Friend ──
  const fetchActiveConversation = useCallback(
    async (silent = false) => {
      if (!token || !activeFriend) return;
      const friendId = activeFriend._id || activeFriend.id;
      if (!silent) setLoadingMessages(true);
      try {
        const data = await getConversation(token, friendId);
        setMessages(Array.isArray(data) ? data : []);
        markMessagesAsRead(token, friendId).catch(() => {});
      } catch (err) {
        if (!silent) {
          Alert.alert('Chat Error', err.message || 'Could not load messages');
        }
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    [token, activeFriend]
  );

  useEffect(() => {
    if (activeFriend) {
      fetchActiveConversation(false);
      const interval = setInterval(() => {
        fetchActiveConversation(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeFriend, fetchActiveConversation]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeFriend && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, activeFriend]);

  // ── Send Message ──
  const handleSend = async () => {
    if (!inputText.trim() || !activeFriend || sending) return;
    const textToSend = inputText.trim();
    const friendId = activeFriend._id || activeFriend.id;

    const tempMsg = {
      _id: `temp-${Date.now()}`,
      sender: user?._id || user?.id,
      receiver: friendId,
      text: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setSending(true);

    try {
      const savedMsg = await sendMessage(token, friendId, textToSend);
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? savedMsg : m))
      );
      loadChatData();
    } catch (err) {
      Alert.alert('Send Error', err.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const getInitial = (name) =>
    typeof name === 'string' && name.length > 0 ? name[0].toUpperCase() : '?';

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Build unified list of chat contacts
  const chatContacts = friends.map((friend) => {
    const friendId = friend._id || friend.id;
    const conv = conversations.find((c) => {
      const otherId = c.otherUser?._id || c.otherUser?.id || c.otherUser;
      return otherId === friendId;
    });
    return {
      friend,
      lastMessage: conv?.lastMessage || null,
      unreadCount: conv?.unreadCount || 0,
      lastActivity: conv?.lastActivity || conv?.lastMessage?.createdAt || null,
    };
  });

  chatContacts.sort((a, b) => {
    if (a.lastActivity && b.lastActivity) {
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    }
    if (a.lastActivity) return -1;
    if (b.lastActivity) return 1;
    return 0;
  });

  const filteredContacts = chatContacts.filter((c) =>
    c.friend?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingView]}>
        <CatMascot size={64} />
        <ActivityIndicator size="small" color={THEME.colors.primary} style={{ marginTop: 14 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Active 1-on-1 Chat Room ── */}
      {activeFriend ? (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Room Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setActiveFriend(null)}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>

            {activeFriend.avatar ? (
              <Image source={{ uri: activeFriend.avatar }} style={styles.chatHeaderAvatar} />
            ) : (
              <View style={styles.chatHeaderAvatarPlaceholder}>
                <Text style={styles.chatHeaderAvatarText}>
                  {getInitial(activeFriend.username)}
                </Text>
              </View>
            )}

            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{activeFriend.username}</Text>
              <Text style={styles.chatHeaderStatus}>● Connected</Text>
            </View>
          </View>

          {/* Messages Feed */}
          {loadingMessages && messages.length === 0 ? (
            <View style={styles.loadingView}>
              <ActivityIndicator color={THEME.colors.primary} />
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 ? (
                <View style={styles.emptyMessagesBox}>
                  <CatMascot size={70} />
                  <Text style={styles.emptyMessagesTitle}>
                    Say hello to {activeFriend.username}! 🐾
                  </Text>
                  <Text style={styles.emptyMessagesSubtitle}>
                    Send a quick greeting to start your conversation.
                  </Text>
                </View>
              ) : (
                messages.map((msg, index) => {
                  const myId = user?._id || user?.id;
                  const senderId =
                    typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                  const isMe = senderId === myId;

                  return (
                    <View
                      key={msg._id || index}
                      style={[
                        styles.messageRow,
                        isMe ? styles.messageRowMe : styles.messageRowThem,
                      ]}
                    >
                      {!isMe &&
                        (activeFriend.avatar ? (
                          <Image
                            source={{ uri: activeFriend.avatar }}
                            style={styles.bubbleAvatar}
                          />
                        ) : (
                          <View style={styles.bubbleAvatarPlaceholder}>
                            <Text style={styles.bubbleAvatarText}>
                              {getInitial(activeFriend.username)}
                            </Text>
                          </View>
                        ))}

                      <View
                        style={[
                          styles.messageBubble,
                          isMe ? styles.bubbleMe : styles.bubbleThem,
                        ]}
                      >
                        <Text style={[styles.messageText, isMe ? styles.textMe : styles.textThem]}>
                          {msg.text}
                        </Text>
                        <Text style={[styles.messageTime, isMe ? styles.timeMe : styles.timeThem]}>
                          {formatTime(msg.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Message Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder={`Message ${activeFriend.username}…`}
              placeholderTextColor={THEME.colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !inputText.trim() || sending ? styles.sendBtnDisabled : null,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <Text style={styles.sendBtnText}>{sending ? '…' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* ── Conversation List View ── */
        <ScrollView
          style={styles.listScrollView}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.listHeader}>
            <Text style={styles.title}>💬 Messages</Text>
            <Text style={styles.subtitle}>Chat directly with your pet friends</Text>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor={THEME.colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Contact List */}
          {friends.length === 0 ? (
            <View style={styles.emptyCard}>
              <CatMascot size={80} />
              <Text style={styles.emptyTitle}>No Friends Yet</Text>
              <Text style={styles.emptySubtext}>
                You need friends to start messaging. Search and add friends from the Friends tab!
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation?.navigate('Friends')}
                activeOpacity={0.88}
              >
                <Text style={styles.emptyBtnText}>🐾 Find Friends</Text>
              </TouchableOpacity>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptySearchCard}>
              <Text style={styles.emptySearchText}>No friends matching "{searchQuery}"</Text>
            </View>
          ) : (
            filteredContacts.map(({ friend, lastMessage, unreadCount, lastActivity }) => {
              const friendId = friend._id || friend.id;
              const hasLastMsg = !!lastMessage;
              const myId = user?._id || user?.id;
              const isLastFromMe =
                typeof lastMessage?.sender === 'object'
                  ? lastMessage?.sender?._id === myId
                  : lastMessage?.sender === myId;

              return (
                <TouchableOpacity
                  key={friendId}
                  style={styles.friendCard}
                  onPress={() => setActiveFriend(friend)}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer}>
                    {friend.avatar ? (
                      <Image source={{ uri: friend.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{getInitial(friend.username)}</Text>
                      </View>
                    )}
                    <View style={styles.onlineDot} />
                  </View>

                  <View style={styles.friendInfo}>
                    <View style={styles.friendHeaderRow}>
                      <Text style={styles.friendName}>{friend.username}</Text>
                      {lastActivity && (
                        <Text style={styles.lastTime}>{formatTime(lastActivity)}</Text>
                      )}
                    </View>

                    <View style={styles.messageSnippetRow}>
                      <Text
                        style={[
                          styles.snippetText,
                          unreadCount > 0 ? styles.snippetUnread : null,
                        ]}
                        numberOfLines={1}
                      >
                        {hasLastMsg
                          ? `${isLastFromMe ? 'You: ' : ''}${lastMessage.text}`
                          : 'Tap to start a conversation 🐾'}
                      </Text>

                      {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── List View Styles ──
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: THEME.colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: THEME.colors.textSecondary, marginTop: 2, marginBottom: 14 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceWarm,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: THEME.colors.text },
  clearSearch: { fontSize: 14, color: THEME.colors.textLight, paddingHorizontal: 6 },

  listScrollView: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 110 },

  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderCrimson,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.borderCrimson,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: THEME.colors.offWhite },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: THEME.colors.success,
    borderWidth: 2,
    borderColor: THEME.colors.surface,
  },

  friendInfo: { flex: 1 },
  friendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: { fontSize: 16, fontWeight: '800', color: THEME.colors.text },
  lastTime: { fontSize: 11, color: THEME.colors.textLight },

  messageSnippetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetText: { fontSize: 13, color: THEME.colors.textSecondary, flex: 1 },
  snippetUnread: { color: THEME.colors.offWhite, fontWeight: '800' },

  unreadBadge: {
    backgroundColor: THEME.colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: { color: THEME.colors.offWhite, fontSize: 11, fontWeight: '800' },

  // Empty states
  emptyCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: THEME.colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyBtnText: { color: THEME.colors.offWhite, fontWeight: '800', fontSize: 14 },

  emptySearchCard: { padding: 30, alignItems: 'center' },
  emptySearchText: { fontSize: 14, color: THEME.colors.textLight },

  // ── 1-on-1 Chat Room Styles ──
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderCrimson,
  },
  backBtn: { paddingRight: 14, paddingVertical: 4 },
  backBtnText: { fontSize: 24, fontWeight: '800', color: THEME.colors.primaryLight },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderCrimson,
  },
  chatHeaderAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderCrimson,
  },
  chatHeaderAvatarText: { fontSize: 16, fontWeight: '800', color: THEME.colors.offWhite },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 16, fontWeight: '800', color: THEME.colors.text },
  chatHeaderStatus: { fontSize: 12, color: THEME.colors.success, fontWeight: '600' },

  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },

  emptyMessagesBox: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyMessagesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMessagesSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },

  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowThem: { justifyContent: 'flex-start' },

  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 6, marginBottom: 2 },
  bubbleAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  bubbleAvatarText: { fontSize: 11, fontWeight: '800', color: THEME.colors.offWhite },

  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: THEME.colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleThem: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
  },

  messageText: { fontSize: 14, lineHeight: 20 },
  textMe: { color: THEME.colors.offWhite, fontWeight: '500' },
  textThem: { color: THEME.colors.text },

  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeMe: { color: 'rgba(245,242,237,0.7)' },
  timeThem: { color: THEME.colors.textLight },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderCrimson,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceWarm,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.text,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#26060A',
  },
  sendBtnText: { color: THEME.colors.offWhite, fontWeight: '800', fontSize: 14 },
});
