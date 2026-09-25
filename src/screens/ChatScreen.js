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

const PURPLE = '#7C3AED';

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

  // ─── Fetch Friends & Recent Conversations ─────────────────────
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

  // ─── Fetch Messages with Active Friend ────────────────────────
  const fetchActiveConversation = useCallback(
    async (silent = false) => {
      if (!token || !activeFriend) return;
      const friendId = activeFriend._id || activeFriend.id;
      if (!silent) setLoadingMessages(true);
      try {
        const data = await getConversation(token, friendId);
        setMessages(Array.isArray(data) ? data : []);
        // Mark messages as read
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

  // Load messages when activeFriend changes
  useEffect(() => {
    if (activeFriend) {
      fetchActiveConversation(false);
      // Auto-poll for new messages every 3 seconds while chat is active
      const interval = setInterval(() => {
        fetchActiveConversation(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeFriend, fetchActiveConversation]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ─── Send Message ─────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeFriend || sending) return;
    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    const friendId = activeFriend._id || activeFriend.id;

    // Optimistic message
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user?._id || user?.id, username: user?.username, avatar: user?.avatar },
      receiver: { _id: friendId, username: activeFriend.username, avatar: activeFriend.avatar },
      text: textToSend,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const savedMessage = await sendMessage(token, friendId, textToSend);
      // Replace temp message with server message
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempMessage._id ? savedMessage : msg))
      );
      loadChatData(); // refresh conversation snippet in background
    } catch (err) {
      Alert.alert('Send Failed', err.message || 'You can only chat with friends.');
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
    } finally {
      setSending(false);
    }
  };

  // ─── Helper Functions ─────────────────────────────────────────
  const getInitial = (name) =>
    typeof name === 'string' && name.length > 0 ? name[0].toUpperCase() : '?';

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Combine friends with their latest conversation data
  const mergedChatList = friends.map((f) => {
    const friendId = (f._id || f.id)?.toString();
    const conv = conversations.find(
      (c) => (c.friend?._id || c.friend?.id || c.friend)?.toString() === friendId
    );
    return {
      friend: f,
      lastMessage: conv?.lastMessage || null,
      unreadCount: conv?.unreadCount || 0,
    };
  });

  // Sort by latest message time
  mergedChatList.sort((a, b) => {
    const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const filteredChatList = mergedChatList.filter((item) =>
    item.friend?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── RENDER 1-ON-1 CHAT ROOM ─────────────────────────────────
  if (activeFriend) {
    const friendId = activeFriend._id || activeFriend.id;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Room Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setActiveFriend(null);
              setMessages([]);
              loadChatData();
            }}
          >
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
            <Text style={styles.chatHeaderStatus}>🐾 Friend</Text>
          </View>
        </View>

        {/* Messages ScrollView */}
        {loadingMessages ? (
          <View style={styles.loadingView}>
            <ActivityIndicator size="large" color={PURPLE} />
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
                <Text style={styles.emptyMessagesEmoji}>👋</Text>
                <Text style={styles.emptyMessagesTitle}>
                  Start a conversation with {activeFriend.username}!
                </Text>
                <Text style={styles.emptyMessagesSubtitle}>
                  Only friends can send and receive messages here.
                </Text>
              </View>
            ) : (
              messages.map((msg, index) => {
                const senderId =
                  typeof msg.sender === 'object'
                    ? (msg.sender?._id || msg.sender?.id)?.toString()
                    : msg.sender?.toString();
                const myId = (user?._id || user?.id)?.toString();
                const isMe = senderId === myId;

                return (
                  <View
                    key={msg._id || index}
                    style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}
                  >
                    {!isMe && (
                      activeFriend.avatar ? (
                        <Image source={{ uri: activeFriend.avatar }} style={styles.bubbleAvatar} />
                      ) : (
                        <View style={styles.bubbleAvatarPlaceholder}>
                          <Text style={styles.bubbleAvatarText}>
                            {getInitial(activeFriend.username)}
                          </Text>
                        </View>
                      )
                    )}

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
                        {formatMessageTime(msg.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder={`Message ${activeFriend.username}... 🐾`}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || sending) && styles.sendBtnDisabled,
            ]}
            disabled={!inputText.trim() || sending}
            onPress={handleSendMessage}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── RENDER CONVERSATION / FRIENDS LIST ───────────────────────
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.listHeader}>
        <Text style={styles.title}>💬 Chat</Text>
        <Text style={styles.subtitle}>Chat only with your friends</Text>

        {/* Search Bar */}
        {friends.length > 0 && (
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : (
        <ScrollView
          style={styles.listScrollView}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PURPLE}
            />
          }
        >
          {friends.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🐾</Text>
              <Text style={styles.emptyTitle}>No Friends Yet</Text>
              <Text style={styles.emptySubtext}>
                Only confirmed friends can chat with each other. Search and add friends to unlock messaging!
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation?.navigate('Friends')}
              >
                <Text style={styles.emptyBtnText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
          ) : filteredChatList.length === 0 ? (
            <View style={styles.emptySearchCard}>
              <Text style={styles.emptySearchText}>No friends matching "{searchQuery}"</Text>
            </View>
          ) : (
            filteredChatList.map(({ friend, lastMessage, unreadCount }) => {
              const friendId = friend._id || friend.id;

              return (
                <TouchableOpacity
                  key={friendId}
                  style={styles.friendCard}
                  activeOpacity={0.75}
                  onPress={() => setActiveFriend(friend)}
                >
                  {/* Avatar with Friend Badge */}
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

                  {/* Friend Info & Last Msg */}
                  <View style={styles.friendInfo}>
                    <View style={styles.friendHeaderRow}>
                      <Text style={styles.friendName}>{friend.username}</Text>
                      {lastMessage && (
                        <Text style={styles.lastTime}>
                          {formatMessageTime(lastMessage.createdAt)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.messageSnippetRow}>
                      <Text
                        style={[
                          styles.snippetText,
                          unreadCount > 0 && styles.snippetUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {lastMessage
                          ? lastMessage.text
                          : friend.bio || 'Tap to start chatting 🐾'}
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
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── List View Styles ──
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2, marginBottom: 12 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: PURPLE,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a2e' },
  clearSearch: { fontSize: 14, color: '#9CA3AF', paddingHorizontal: 6 },

  listScrollView: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: PURPLE,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: PURPLE },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },

  friendInfo: { flex: 1 },
  friendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  lastTime: { fontSize: 11, color: '#9CA3AF' },

  messageSnippetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetText: { fontSize: 13, color: '#6B7280', flex: 1 },
  snippetUnread: { color: '#1a1a2e', fontWeight: '700' },

  unreadBadge: {
    backgroundColor: PURPLE,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Empty states
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: PURPLE,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 20,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptySearchCard: { padding: 30, alignItems: 'center' },
  emptySearchText: { fontSize: 14, color: '#9CA3AF' },

  // ── 1-on-1 Chat Room Styles ──
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
    shadowColor: PURPLE,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtn: { paddingRight: 12, paddingVertical: 4 },
  backBtnText: { fontSize: 24, fontWeight: '700', color: PURPLE },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  chatHeaderAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chatHeaderAvatarText: { fontSize: 16, fontWeight: '700', color: PURPLE },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  chatHeaderStatus: { fontSize: 12, color: '#10B981', fontWeight: '600' },

  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },

  emptyMessagesBox: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyMessagesEmoji: { fontSize: 40, marginBottom: 10 },
  emptyMessagesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyMessagesSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
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
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  bubbleAvatarText: { fontSize: 11, fontWeight: '700', color: PURPLE },

  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: PURPLE,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },

  messageText: { fontSize: 14, lineHeight: 20 },
  textMe: { color: '#fff' },
  textThem: { color: '#1a1a2e' },

  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  timeThem: { color: '#9CA3AF' },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
