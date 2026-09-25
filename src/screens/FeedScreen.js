import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, ActivityIndicator, Alert, RefreshControl,
  Modal, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAllPosts, createPost, likePost, addComment, replyToComment, deletePost } from '../services/api';

const PURPLE = '#7C3AED';
const { width } = Dimensions.get('window');

export default function FeedScreen({ user, token }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentingOn, setCommentingOn] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null); // { postId, commentId, username }
  const [expandedComments, setExpandedComments] = useState({});

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getAllPosts(token);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error fetching posts:', err.message);
      Alert.alert('Feed Error', err.message || 'Could not load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  // ── Pick Image ──
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const filename = asset.uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    setSelectedImage({ uri: asset.uri, name: filename, type });
    setShowCreate(true);
  };

  // ── Create Post ──
  const handleCreatePost = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    setPosting(true);
    try {
      await createPost(token, selectedImage, caption);
      setShowCreate(false);
      setCaption('');
      setSelectedImage(null);
      fetchPosts();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setPosting(false);
    }
  };

  // ── Like ──
  const handleLike = async (postId) => {
    try {
      await likePost(token, postId);
      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        const liked = p.likes.includes(user?._id);
        return {
          ...p,
          likes: liked
            ? p.likes.filter(id => id !== user?._id)
            : [...p.likes, user?._id],
        };
      }));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // ── Comment / Reply Submit ──
  const handleSubmitComment = async (postId) => {
    if (!commentText.trim()) return;
    
    if (replyTarget && replyTarget.postId === postId) {
      // Send Reply
      try {
        const updatedPost = await replyToComment(token, postId, replyTarget.commentId, commentText.trim());
        setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
        setCommentText('');
        setReplyTarget(null);
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    } else {
      // Send Top-level Comment
      try {
        const updatedPost = await addComment(token, postId, commentText.trim());
        setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
        setCommentText('');
        setCommentingOn(null);
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    }
  };

  const startReply = (postId, commentId, username) => {
    setCommentingOn(postId);
    setReplyTarget({ postId, commentId, username });
    setCommentText(`@${username} `);
  };

  const cancelReply = () => {
    setReplyTarget(null);
    setCommentText('');
  };

  // ── Delete ──
  const handleDelete = (postId) => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(token, postId);
            setPosts(prev => prev.filter(p => p._id !== postId));
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (replyTarget && replyTarget.postId === postId) {
      setReplyTarget(null);
    }
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getInitial = (name) => (typeof name === 'string' && name.length > 0 ? name[0].toUpperCase() : '?');

  const getCommentsCount = (post) => {
    if (!post.comments) return 0;
    return post.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🐾 Feed</Text>
          <TouchableOpacity style={styles.newPostBtn} onPress={handlePickImage}>
            <Text style={styles.newPostBtnText}>+ New Post</Text>
          </TouchableOpacity>
        </View>

        {posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📷</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handlePickImage}>
              <Text style={styles.emptyBtnText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => {
            const isLiked = post.likes?.includes(user?._id);
            const isOwner = post.user?._id === user?._id;
            const showComments = expandedComments[post._id];
            const isReplyingThisPost = replyTarget && replyTarget.postId === post._id;

            return (
              <View key={post._id} style={styles.postCard}>
                {/* Post header */}
                <View style={styles.postHeader}>
                  {post.user?.avatar ? (
                    <Image source={{ uri: post.user.avatar }} style={styles.postAvatar} />
                  ) : (
                    <View style={styles.postAvatarPlaceholder}>
                      <Text style={styles.postAvatarText}>{getInitial(post.user?.username)}</Text>
                    </View>
                  )}
                  <View style={styles.postUserInfo}>
                    <Text style={styles.postUsername}>{post.user?.username || 'Unknown'}</Text>
                    <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                  </View>
                  {isOwner && (
                    <TouchableOpacity onPress={() => handleDelete(post._id)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Post image */}
                {post.image && (
                  <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
                )}

                {/* Caption */}
                {post.caption ? (
                  <Text style={styles.caption}>
                    <Text style={styles.captionUser}>{post.user?.username} </Text>
                    {post.caption}
                  </Text>
                ) : null}

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post._id)}>
                    <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
                    <Text style={[styles.actionCount, isLiked && styles.likedCount]}>
                      {post.likes?.length || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(post._id)}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionCount}>{getCommentsCount(post)}</Text>
                  </TouchableOpacity>
                </View>

                {/* Comments Section */}
                {showComments && (
                  <View style={styles.commentsSection}>
                    {post.comments?.length === 0 ? (
                      <Text style={styles.noCommentsText}>No comments yet. Start the conversation!</Text>
                    ) : (
                      post.comments?.map((c) => {
                        const commentId = c._id || c.id;
                        return (
                          <View key={commentId} style={styles.commentItem}>
                            {/* Main Comment */}
                            <View style={styles.commentMainRow}>
                              {c.user?.avatar ? (
                                <Image source={{ uri: c.user.avatar }} style={styles.commentAvatar} />
                              ) : (
                                <View style={styles.commentAvatarPlaceholder}>
                                  <Text style={styles.commentAvatarText}>{getInitial(c.user?.username)}</Text>
                                </View>
                              )}
                              <View style={styles.commentBubble}>
                                <View style={styles.commentHeader}>
                                  <Text style={styles.commentUser}>{c.user?.username || 'User'}</Text>
                                  <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                                </View>
                                <Text style={styles.commentBody}>{c.text}</Text>
                                <TouchableOpacity
                                  style={styles.replyButton}
                                  onPress={() => startReply(post._id, commentId, c.user?.username || 'User')}
                                >
                                  <Text style={styles.replyButtonText}>↩ Reply</Text>
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Nested Replies */}
                            {c.replies && c.replies.length > 0 && (
                              <View style={styles.repliesList}>
                                {c.replies.map((reply, rIdx) => (
                                  <View key={reply._id || rIdx} style={styles.replyMainRow}>
                                    {reply.user?.avatar ? (
                                      <Image source={{ uri: reply.user.avatar }} style={styles.replyAvatar} />
                                    ) : (
                                      <View style={styles.replyAvatarPlaceholder}>
                                        <Text style={styles.replyAvatarText}>{getInitial(reply.user?.username)}</Text>
                                      </View>
                                    )}
                                    <View style={styles.replyBubble}>
                                      <View style={styles.commentHeader}>
                                        <Text style={styles.replyUser}>{reply.user?.username || 'User'}</Text>
                                        <Text style={styles.commentTime}>{timeAgo(reply.createdAt)}</Text>
                                      </View>
                                      <Text style={styles.replyBody}>{reply.text}</Text>
                                      <TouchableOpacity
                                        style={styles.replyButton}
                                        onPress={() => startReply(post._id, commentId, reply.user?.username || 'User')}
                                      >
                                        <Text style={styles.replyButtonText}>↩ Reply</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}

                    {/* Active Reply Banner */}
                    {isReplyingThisPost && (
                      <View style={styles.replyBanner}>
                        <Text style={styles.replyBannerText}>
                          Replying to <Text style={styles.replyBannerUser}>@{replyTarget.username}</Text>
                        </Text>
                        <TouchableOpacity onPress={cancelReply} style={styles.replyCancelBtn}>
                          <Text style={styles.replyCancelText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Input Row */}
                    <View style={styles.commentInputRow}>
                      <TextInput
                        style={styles.commentInput}
                        placeholder={isReplyingThisPost ? `Reply to @${replyTarget.username}...` : "Add a comment..."}
                        placeholderTextColor="#9CA3AF"
                        value={commentingOn === post._id ? commentText : ''}
                        onFocus={() => setCommentingOn(post._id)}
                        onChangeText={setCommentText}
                        onSubmitEditing={() => handleSubmitComment(post._id)}
                        returnKeyType="send"
                      />
                      <TouchableOpacity
                        style={[
                          styles.commentSendBtn,
                          !(commentingOn === post._id && commentText.trim()) && styles.commentSendBtnDisabled,
                        ]}
                        disabled={!(commentingOn === post._id && commentText.trim())}
                        onPress={() => handleSubmitComment(post._id)}
                      >
                        <Text style={styles.commentSendText}>
                          {isReplyingThisPost ? 'Reply' : 'Post'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Create Post Modal ── */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setShowCreate(false); setSelectedImage(null); setCaption(''); }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Post</Text>
              <TouchableOpacity onPress={handleCreatePost} disabled={posting}>
                {posting
                  ? <ActivityIndicator color={PURPLE} />
                  : <Text style={styles.modalPost}>Share</Text>
                }
              </TouchableOpacity>
            </View>

            {selectedImage && (
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
            )}

            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption... 🐾"
              placeholderTextColor="#9CA3AF"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />

            <TouchableOpacity style={styles.changeImageBtn} onPress={handlePickImage}>
              <Text style={styles.changeImageText}>📷 Change Image</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F5F3FF' },
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e' },
  newPostBtn: {
    backgroundColor: PURPLE, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, shadowColor: PURPLE, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  newPostBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Empty
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 40, alignItems: 'center',
    margin: 20, shadowColor: PURPLE, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginBottom: 20 },
  emptyBtn: {
    backgroundColor: PURPLE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Post card
  postCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: PURPLE, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  postHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  postAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  postAvatarText: { fontSize: 18, fontWeight: '700', color: PURPLE },
  postUserInfo: { flex: 1 },
  postUsername: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  postTime: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },

  postImage: { width: '100%', height: width - 32, backgroundColor: '#F3F4F6' },

  caption: { paddingHorizontal: 14, paddingTop: 12, fontSize: 14, color: '#374151', lineHeight: 20 },
  captionUser: { fontWeight: '700', color: '#1a1a2e' },

  actions: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon: { fontSize: 20 },
  actionCount: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  likedCount: { color: '#EF4444' },

  // Comments
  commentsSection: {
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#FAFAFD',
  },
  noCommentsText: {
    fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginVertical: 6, textAlign: 'center',
  },
  commentItem: {
    marginBottom: 12,
  },
  commentMainRow: {
    flexDirection: 'row', alignItems: 'flex-start',
  },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, marginTop: 2 },
  commentAvatarPlaceholder: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 2,
  },
  commentAvatarText: { fontSize: 14, fontWeight: '700', color: PURPLE },
  commentBubble: {
    flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1, borderColor: '#F0EFFB',
  },
  commentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2,
  },
  commentUser: { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },
  commentTime: { fontSize: 11, color: '#9CA3AF' },
  commentBody: { fontSize: 13, color: '#374151', lineHeight: 18 },
  replyButton: { marginTop: 4, alignSelf: 'flex-start' },
  replyButtonText: { fontSize: 12, fontWeight: '700', color: PURPLE },

  // Nested Replies
  repliesList: {
    marginLeft: 24, marginTop: 6, borderLeftWidth: 2, borderLeftColor: '#DDD6FE', paddingLeft: 10,
  },
  replyMainRow: {
    flexDirection: 'row', alignItems: 'flex-start', marginTop: 6,
  },
  replyAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6, marginTop: 2 },
  replyAvatarPlaceholder: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 2,
  },
  replyAvatarText: { fontSize: 11, fontWeight: '700', color: PURPLE },
  replyBubble: {
    flex: 1, backgroundColor: '#F5F3FF', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12,
  },
  replyUser: { fontWeight: '700', color: '#1a1a2e', fontSize: 12 },
  replyBody: { fontSize: 12, color: '#374151', lineHeight: 16 },

  // Reply Banner
  replyBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, marginBottom: 8,
  },
  replyBannerText: { fontSize: 12, color: '#5B21B6' },
  replyBannerUser: { fontWeight: '700', color: PURPLE },
  replyCancelBtn: { padding: 4 },
  replyCancelText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },

  // Input
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  commentInput: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, fontSize: 13, color: '#1a1a2e', borderWidth: 1, borderColor: '#E5E7EB',
  },
  commentSendBtn: {
    backgroundColor: PURPLE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
  },
  commentSendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  commentSendText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalCancel: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  modalPost: { fontSize: 16, color: PURPLE, fontWeight: '700' },

  previewImage: {
    width: '100%', height: 280, backgroundColor: '#F3F4F6',
  },
  captionInput: {
    paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: '#1a1a2e',
    minHeight: 60, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  changeImageBtn: { paddingHorizontal: 20, paddingVertical: 14 },
  changeImageText: { color: PURPLE, fontWeight: '600', fontSize: 15 },
});
