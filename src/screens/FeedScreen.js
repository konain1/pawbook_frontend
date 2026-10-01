import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getAllPosts,
  createPost,
  likePost,
  addComment,
  replyToComment,
  deletePost,
  sharePost,
  getPostShares,
} from '../services/api';
import { THEME } from '../constants/theme';
import CatMascot from '../components/CatMascot';

const { width } = Dimensions.get('window');

export default function FeedScreen({ user, token }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create post modal state
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [posting, setPosting] = useState(false);

  // Comment & reply state
  const [commentText, setCommentText] = useState('');
  const [commentingOn, setCommentingOn] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});

  // Share state
  const [shareTargetPost, setShareTargetPost] = useState(null);
  const [shareCaption, setShareCaption] = useState('');
  const [sharing, setSharing] = useState(false);

  // Who shared modal state
  const [viewingSharesPost, setViewingSharesPost] = useState(null);
  const [sharesUserList, setSharesUserList] = useState([]);
  const [loadingSharesList, setLoadingSharesList] = useState(false);

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

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

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
      Alert.alert('Missing Image', 'Please select an image to share.');
      return;
    }
    setPosting(true);
    try {
      await createPost(token, selectedImage, caption);
      setShowCreate(false);
      setCaption('');
      setSelectedImage(null);
      fetchPosts();
      Alert.alert('Success 🎉', 'Your cute post was published!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setPosting(false);
    }
  };

  // ── Share Post ──
  const handleOpenShareModal = (post) => {
    const originalAuthorId = post.isShared && post.originalPost
      ? (post.originalPost.user?._id || post.originalPost.user)
      : null;
    const isOwnPost = post.user?._id === user?._id || (originalAuthorId && originalAuthorId === user?._id);
    if (isOwnPost) {
      Alert.alert('Cannot Share', 'You cannot share your own post. Sharing is for friends and other users!');
      return;
    }
    const target = post.isShared && post.originalPost ? post.originalPost : post;
    setShareTargetPost(target);
    setShareCaption('');
  };

  const handleShareSubmit = async () => {
    if (!shareTargetPost) return;
    setSharing(true);
    try {
      const newPost = await sharePost(token, shareTargetPost._id, shareCaption.trim());
      setShareTargetPost(null);
      setShareCaption('');
      setPosts((prev) => [newPost, ...prev]);
      Alert.alert('Shared! 🔁', 'Post shared to your feed!');
    } catch (err) {
      Alert.alert('Share Error', err.message || 'Failed to share post');
    } finally {
      setSharing(false);
    }
  };

  // ── View Who Shared ──
  const handleViewShares = async (post) => {
    const rootPostId = post.isShared && post.originalPost ? post.originalPost._id : post._id;
    setViewingSharesPost(post);
    setLoadingSharesList(true);
    try {
      const shares = await getPostShares(token, rootPostId);
      setSharesUserList(Array.isArray(shares) ? shares : []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load shares');
      setSharesUserList([]);
    } finally {
      setLoadingSharesList(false);
    }
  };

  // ── Like ──
  const handleLike = async (postId) => {
    try {
      await likePost(token, postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p;
          const liked = p.likes?.includes(user?._id);
          return {
            ...p,
            likes: liked
              ? (p.likes || []).filter((id) => id !== user?._id)
              : [...(p.likes || []), user?._id],
          };
        })
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // ── Comment / Reply Submit ──
  const handleSubmitComment = async (postId) => {
    if (!commentText.trim()) return;

    if (replyTarget && replyTarget.postId === postId) {
      try {
        const updatedPost = await replyToComment(
          token,
          postId,
          replyTarget.commentId,
          commentText.trim()
        );
        setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
        setCommentText('');
        setReplyTarget(null);
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    } else {
      try {
        const updatedPost = await addComment(token, postId, commentText.trim());
        setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
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
    Alert.alert('Delete Post', 'Are you sure you want to remove this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(token, postId);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
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

  const getInitial = (name) =>
    typeof name === 'string' && name.length > 0 ? name[0].toUpperCase() : '?';

  const getCommentsCount = (post) => {
    if (!post.comments) return 0;
    return post.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
  };

  const getSharesCount = (post) => {
    if (post.isShared && post.originalPost) {
      return post.originalPost.shares?.length || 0;
    }
    return post.shares?.length || 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingView}>
        <CatMascot size={70} />
        <ActivityIndicator size="small" color={THEME.colors.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Fetching cute moments…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
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
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Good day, {user?.username || 'Friend'} 🐾</Text>
            <Text style={styles.headerTitle}>Pawbook Feed</Text>
          </View>
          <TouchableOpacity
            style={styles.newPostPillBtn}
            onPress={handlePickImage}
            activeOpacity={0.85}
          >
            <Text style={styles.newPostPlus}>+</Text>
            <Text style={styles.newPostText}>New Post</Text>
          </TouchableOpacity>
        </View>

        {/* ── Posts Stream ── */}
        {posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <CatMascot size={80} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share a cute pet moment with friends!
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={handlePickImage}>
              <Text style={styles.emptyActionText}>📸 Share a Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => {
            const isLiked = post.likes?.includes(user?._id);
            const isOwner = post.user?._id === user?._id;
            const originalAuthorId = post.isShared && post.originalPost
              ? (post.originalPost.user?._id || post.originalPost.user)
              : null;
            const isOwnPost = isOwner || (originalAuthorId && originalAuthorId === user?._id);
            const canShare = !isOwnPost;
            const showComments = expandedComments[post._id];
            const isReplyingThisPost = replyTarget && replyTarget.postId === post._id;
            const shareCount = getSharesCount(post);

            return (
              <View key={post._id} style={styles.postCard}>
                {/* ── Shared Post Badge Header ── */}
                {post.isShared && (
                  <View style={styles.sharedBadgeRow}>
                    <View style={styles.sharedBadgePill}>
                      <Text style={styles.sharedBadgeIcon}>🔁</Text>
                      <Text style={styles.sharedBadgeText}>
                        <Text style={styles.sharedBadgeUsername}>
                          {post.user?.username || 'User'}
                        </Text>{' '}
                        shared a post
                      </Text>
                    </View>
                    <Text style={styles.sharedTimeText}>{timeAgo(post.createdAt)}</Text>
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => handleDelete(post._id)}
                        style={styles.deletePostBtn}
                      >
                        <Text style={styles.deleteIconText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* ── Main Author Header (If regular post) ── */}
                {!post.isShared && (
                  <View style={styles.authorHeader}>
                    {post.user?.avatar ? (
                      <Image source={{ uri: post.user.avatar }} style={styles.authorAvatar} />
                    ) : (
                      <View style={styles.authorAvatarPlaceholder}>
                        <Text style={styles.authorAvatarInitial}>
                          {getInitial(post.user?.username)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>{post.user?.username || 'Pawbook User'}</Text>
                      <Text style={styles.authorTime}>{timeAgo(post.createdAt)}</Text>
                    </View>
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => handleDelete(post._id)}
                        style={styles.deletePostBtn}
                      >
                        <Text style={styles.deleteIconText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* ── Sharer's Caption ── */}
                {post.isShared && post.caption ? (
                  <Text style={styles.sharerCaption}>
                    <Text style={styles.captionUsername}>{post.user?.username}: </Text>
                    {post.caption}
                  </Text>
                ) : null}

                {/* ── Embedded Original Post Card ── */}
                {post.isShared ? (
                  post.originalPost ? (
                    <View style={styles.embeddedCard}>
                      <View style={styles.embeddedHeader}>
                        {post.originalPost.user?.avatar ? (
                          <Image
                            source={{ uri: post.originalPost.user.avatar }}
                            style={styles.embeddedAvatar}
                          />
                        ) : (
                          <View style={styles.embeddedAvatarPlaceholder}>
                            <Text style={styles.embeddedAvatarInitial}>
                              {getInitial(post.originalPost.user?.username)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.embeddedAuthorInfo}>
                          <Text style={styles.embeddedAuthorName}>
                            {post.originalPost.user?.username || 'Original Author'}
                          </Text>
                          <Text style={styles.embeddedTime}>
                            {timeAgo(post.originalPost.createdAt)}
                          </Text>
                        </View>
                      </View>

                      {post.originalPost.image && (
                        <Image
                          source={{ uri: post.originalPost.image }}
                          style={styles.embeddedImage}
                          resizeMode="cover"
                        />
                      )}

                      {post.originalPost.caption ? (
                        <Text style={styles.embeddedCaption}>
                          <Text style={styles.captionUsername}>
                            {post.originalPost.user?.username}{' '}
                          </Text>
                          {post.originalPost.caption}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.deletedPostCard}>
                      <Text style={styles.deletedPostText}>⚠️ Original post was removed</Text>
                    </View>
                  )
                ) : (
                  /* ── Regular Post Image ── */
                  post.image && (
                    <Image
                      source={{ uri: post.image }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  )
                )}

                {/* ── Regular Post Caption ── */}
                {!post.isShared && post.caption ? (
                  <Text style={styles.postCaption}>
                    <Text style={styles.captionUsername}>{post.user?.username} </Text>
                    {post.caption}
                  </Text>
                ) : null}

                {/* ── Action Buttons Bar ── */}
                <View style={styles.actionsBar}>
                  {/* Like Button */}
                  <TouchableOpacity
                    style={[styles.actionChip, isLiked && styles.likedActionChip]}
                    onPress={() => handleLike(post._id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionIconText}>{isLiked ? '❤️' : '🤍'}</Text>
                    <Text style={[styles.actionCountText, isLiked && styles.likedCountText]}>
                      {post.likes?.length || 0}
                    </Text>
                  </TouchableOpacity>

                  {/* Comment Button */}
                  <TouchableOpacity
                    style={styles.actionChip}
                    onPress={() => toggleComments(post._id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionIconText}>💬</Text>
                    <Text style={styles.actionCountText}>{getCommentsCount(post)}</Text>
                  </TouchableOpacity>

                  {/* Share Button — Only shown for friends and other users, not the author */}
                  {canShare && (
                    <TouchableOpacity
                      style={styles.actionChip}
                      onPress={() => handleOpenShareModal(post)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionIconText}>🔁</Text>
                      <Text style={styles.actionCountText}>{shareCount}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Who Shared Pill */}
                  {shareCount > 0 && (
                    <TouchableOpacity
                      style={styles.whoSharedPill}
                      onPress={() => handleViewShares(post)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.whoSharedPillText}>
                        {shareCount === 1 ? '1 share' : `${shareCount} shares`} 👥
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ── Comments Section ── */}
                {showComments && (
                  <View style={styles.commentsContainer}>
                    {post.comments?.length === 0 ? (
                      <Text style={styles.noCommentsText}>
                        No comments yet. Say something friendly! 🐾
                      </Text>
                    ) : (
                      post.comments?.map((c) => {
                        const commentId = c._id || c.id;
                        return (
                          <View key={commentId} style={styles.commentItem}>
                            {/* Main Comment */}
                            <View style={styles.commentRow}>
                              {c.user?.avatar ? (
                                <Image
                                  source={{ uri: c.user.avatar }}
                                  style={styles.commentAvatar}
                                />
                              ) : (
                                <View style={styles.commentAvatarPlaceholder}>
                                  <Text style={styles.commentAvatarInitial}>
                                    {getInitial(c.user?.username)}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.commentBubble}>
                                <View style={styles.commentHeader}>
                                  <Text style={styles.commentUsername}>
                                    {c.user?.username || 'User'}
                                  </Text>
                                  <Text style={styles.commentTime}>
                                    {timeAgo(c.createdAt)}
                                  </Text>
                                </View>
                                <Text style={styles.commentBodyText}>{c.text}</Text>
                                <TouchableOpacity
                                  style={styles.replyButton}
                                  onPress={() =>
                                    startReply(post._id, commentId, c.user?.username || 'User')
                                  }
                                >
                                  <Text style={styles.replyButtonText}>↩ Reply</Text>
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Threaded Replies */}
                            {c.replies && c.replies.length > 0 && (
                              <View style={styles.repliesList}>
                                {c.replies.map((reply, rIdx) => (
                                  <View key={reply._id || rIdx} style={styles.replyRow}>
                                    {reply.user?.avatar ? (
                                      <Image
                                        source={{ uri: reply.user.avatar }}
                                        style={styles.replyAvatar}
                                      />
                                    ) : (
                                      <View style={styles.replyAvatarPlaceholder}>
                                        <Text style={styles.replyAvatarInitial}>
                                          {getInitial(reply.user?.username)}
                                        </Text>
                                      </View>
                                    )}
                                    <View style={styles.replyBubble}>
                                      <View style={styles.commentHeader}>
                                        <Text style={styles.replyUsername}>
                                          {reply.user?.username || 'User'}
                                        </Text>
                                        <Text style={styles.commentTime}>
                                          {timeAgo(reply.createdAt)}
                                        </Text>
                                      </View>
                                      <Text style={styles.replyBodyText}>{reply.text}</Text>
                                      <TouchableOpacity
                                        style={styles.replyButton}
                                        onPress={() =>
                                          startReply(
                                            post._id,
                                            commentId,
                                            reply.user?.username || 'User'
                                          )
                                        }
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
                      <View style={styles.activeReplyBanner}>
                        <Text style={styles.activeReplyText}>
                          Replying to{' '}
                          <Text style={styles.activeReplyUsername}>
                            @{replyTarget.username}
                          </Text>
                        </Text>
                        <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyBtn}>
                          <Text style={styles.cancelReplyText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Comment Input */}
                    <View style={styles.commentInputRow}>
                      <TextInput
                        style={styles.commentTextInput}
                        placeholder={
                          isReplyingThisPost
                            ? `Reply to @${replyTarget.username}...`
                            : 'Write a friendly comment...'
                        }
                        placeholderTextColor={THEME.colors.textLight}
                        value={commentingOn === post._id ? commentText : ''}
                        onFocus={() => setCommentingOn(post._id)}
                        onChangeText={setCommentText}
                        onSubmitEditing={() => handleSubmitComment(post._id)}
                        returnKeyType="send"
                      />
                      <TouchableOpacity
                        style={[
                          styles.commentSendBtn,
                          !(commentingOn === post._id && commentText.trim()) &&
                            styles.commentSendBtnDisabled,
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
              <TouchableOpacity
                onPress={() => {
                  setShowCreate(false);
                  setSelectedImage(null);
                  setCaption('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitleText}>New Cute Post 🐾</Text>
              <TouchableOpacity onPress={handleCreatePost} disabled={posting}>
                {posting ? (
                  <ActivityIndicator color={THEME.colors.primary} />
                ) : (
                  <Text style={styles.modalPostActionText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            <TextInput
              style={styles.captionTextInput}
              placeholder="What's your pet doing today? 🐾"
              placeholderTextColor={THEME.colors.textLight}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />

            <TouchableOpacity style={styles.changeImageBtn} onPress={handlePickImage}>
              <Text style={styles.changeImageBtnText}>📷 Change Photo</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Share Modal ── */}
      <Modal visible={!!shareTargetPost} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShareTargetPost(null);
                  setShareCaption('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitleText}>🔁 Share Post</Text>
              <TouchableOpacity onPress={handleShareSubmit} disabled={sharing}>
                {sharing ? (
                  <ActivityIndicator color={THEME.colors.primary} />
                ) : (
                  <Text style={styles.modalPostActionText}>Share Now</Text>
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.shareCaptionTextInput}
              placeholder="Add your thoughts... (optional) 🐾"
              placeholderTextColor={THEME.colors.textLight}
              value={shareCaption}
              onChangeText={setShareCaption}
              multiline
              maxLength={500}
            />

            {/* Target Post Preview Box */}
            {shareTargetPost && (
              <View style={styles.sharePreviewCard}>
                <View style={styles.sharePreviewAuthor}>
                  {shareTargetPost.user?.avatar ? (
                    <Image
                      source={{ uri: shareTargetPost.user.avatar }}
                      style={styles.sharePreviewAvatar}
                    />
                  ) : (
                    <View style={styles.sharePreviewAvatarPlaceholder}>
                      <Text style={styles.sharePreviewInitial}>
                        {getInitial(shareTargetPost.user?.username)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.sharePreviewUsername}>
                    {shareTargetPost.user?.username || 'User'}
                  </Text>
                </View>

                {shareTargetPost.image && (
                  <Image
                    source={{ uri: shareTargetPost.image }}
                    style={styles.sharePreviewImage}
                    resizeMode="cover"
                  />
                )}

                {shareTargetPost.caption ? (
                  <Text style={styles.sharePreviewCaptionText} numberOfLines={2}>
                    {shareTargetPost.caption}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Who Shared Modal ── */}
      <Modal visible={!!viewingSharesPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>👥 Shared By</Text>
              <TouchableOpacity
                onPress={() => {
                  setViewingSharesPost(null);
                  setSharesUserList([]);
                }}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
            </View>

            {loadingSharesList ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
                <Text style={styles.modalLoadingText}>Loading shares...</Text>
              </View>
            ) : sharesUserList.length === 0 ? (
              <View style={styles.modalEmptyBox}>
                <CatMascot size={60} />
                <Text style={styles.modalEmptyText}>No shares yet</Text>
              </View>
            ) : (
              <ScrollView style={styles.sharesListScroll} showsVerticalScrollIndicator={false}>
                {sharesUserList.map((sharer) => (
                  <View key={sharer._id} style={styles.sharerRow}>
                    {sharer.avatar ? (
                      <Image source={{ uri: sharer.avatar }} style={styles.sharerAvatarImage} />
                    ) : (
                      <View style={styles.sharerAvatarPlaceholder}>
                        <Text style={styles.sharerAvatarInitial}>
                          {getInitial(sharer.username)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.sharerDetails}>
                      <Text style={styles.sharerUsernameText}>{sharer.username}</Text>
                      <Text style={styles.sharerBioText} numberOfLines={1}>
                        {sharer.bio || 'Pawbook friend 🐾'}
                      </Text>
                    </View>
                    <View style={styles.sharerBadgePill}>
                      <Text style={styles.sharerBadgeText}>🔁 Shared</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: THEME.colors.background },
  container: { flex: 1 },
  content: { paddingBottom: 110 },
  loadingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  headerLeft: { flex: 1 },
  headerGreeting: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -0.5,
  },
  newPostPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    gap: 4,
  },
  newPostPlus: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: -2 },
  newPostText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // ── Empty State ──
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyActionBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyActionText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // ── Post Card ──
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  // Shared Header
  sharedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE8DC',
  },
  sharedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  sharedBadgeIcon: { fontSize: 15 },
  sharedBadgeText: { fontSize: 13, color: THEME.colors.textSecondary },
  sharedBadgeUsername: { fontWeight: '800', color: THEME.colors.primaryDark },
  sharedTimeText: { fontSize: 11, color: THEME.colors.textLight, marginRight: 8 },
  sharerCaption: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 14,
    color: THEME.colors.text,
    lineHeight: 20,
  },

  // Author Header
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  authorAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorAvatarInitial: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '800', color: THEME.colors.text },
  authorTime: { fontSize: 12, color: THEME.colors.textLight, marginTop: 1 },
  deletePostBtn: { padding: 6 },
  deleteIconText: { fontSize: 16 },

  // Embedded Shared Card
  embeddedCard: {
    marginHorizontal: 14,
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F2E6DF',
    backgroundColor: '#FFFDFB',
    overflow: 'hidden',
  },
  embeddedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8ECE5',
  },
  embeddedAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  embeddedAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  embeddedAvatarInitial: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  embeddedAuthorInfo: { flex: 1 },
  embeddedAuthorName: { fontSize: 13, fontWeight: '800', color: THEME.colors.text },
  embeddedTime: { fontSize: 11, color: THEME.colors.textLight },
  embeddedImage: { width: '100%', height: 210, backgroundColor: '#F8ECE5' },
  embeddedCaption: { padding: 12, fontSize: 13, color: THEME.colors.text, lineHeight: 18 },

  deletedPostCard: {
    margin: 14,
    padding: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    alignItems: 'center',
  },
  deletedPostText: { color: THEME.colors.error, fontSize: 13, fontWeight: '700' },

  // Post Image & Caption
  postImage: {
    width: '100%',
    height: width - 36,
    backgroundColor: '#F8ECE5',
  },
  postCaption: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 14,
    color: THEME.colors.text,
    lineHeight: 20,
  },
  captionUsername: { fontWeight: '800', color: THEME.colors.text },

  // Action Chips
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F8E8DF',
    gap: 6,
  },
  likedActionChip: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FED7D7',
  },
  actionIconText: { fontSize: 16 },
  actionCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  likedCountText: { color: '#E53E3E' },

  whoSharedPill: {
    marginLeft: 'auto',
    backgroundColor: THEME.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  whoSharedPillText: {
    fontSize: 12,
    color: THEME.colors.primaryDark,
    fontWeight: '800',
  },

  // Comments
  commentsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F8ECE5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFDFB',
  },
  noCommentsText: {
    fontSize: 13,
    color: THEME.colors.textLight,
    fontStyle: 'italic',
    marginVertical: 8,
    textAlign: 'center',
  },
  commentItem: { marginBottom: 12 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, marginTop: 2 },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  commentAvatarInitial: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentUsername: { fontWeight: '800', color: THEME.colors.text, fontSize: 13 },
  commentTime: { fontSize: 11, color: THEME.colors.textLight },
  commentBodyText: { fontSize: 13, color: THEME.colors.textSecondary, lineHeight: 18 },
  replyButton: { marginTop: 4, alignSelf: 'flex-start' },
  replyButtonText: { fontSize: 12, fontWeight: '700', color: THEME.colors.primary },

  // Threaded replies
  repliesList: {
    marginLeft: 26,
    marginTop: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#FEE8DC',
    paddingLeft: 10,
  },
  replyRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  replyAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6, marginTop: 2 },
  replyAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginTop: 2,
  },
  replyAvatarInitial: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  replyBubble: {
    flex: 1,
    backgroundColor: '#FFF8F4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  replyUsername: { fontWeight: '800', color: THEME.colors.text, fontSize: 12 },
  replyBodyText: { fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 16 },

  activeReplyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF0E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeReplyText: { fontSize: 12, color: THEME.colors.textSecondary },
  activeReplyUsername: { fontWeight: '800', color: THEME.colors.primaryDark },
  cancelReplyBtn: { padding: 4 },
  cancelReplyText: { fontSize: 12, fontWeight: '800', color: THEME.colors.textLight },

  // Comment input
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: THEME.colors.text,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  commentSendBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  commentSendBtnDisabled: { backgroundColor: '#E2D9D2' },
  commentSendText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Modal common
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30,30,30,0.45)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8ECE5',
  },
  modalCancelText: { fontSize: 15, color: THEME.colors.textSecondary, fontWeight: '600' },
  modalTitleText: { fontSize: 17, fontWeight: '800', color: THEME.colors.text },
  modalPostActionText: { fontSize: 15, color: THEME.colors.primary, fontWeight: '800' },

  previewImage: { width: '100%', height: 260, backgroundColor: '#F8ECE5' },
  captionTextInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
    color: THEME.colors.text,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F8ECE5',
  },
  changeImageBtn: { paddingHorizontal: 20, paddingVertical: 14 },
  changeImageBtnText: { color: THEME.colors.primary, fontWeight: '700', fontSize: 14 },

  // Share Modal
  shareCaptionTextInput: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    color: THEME.colors.text,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F8ECE5',
  },
  sharePreviewCard: {
    margin: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F2E6DF',
    backgroundColor: '#FFFDFB',
    padding: 12,
  },
  sharePreviewAuthor: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sharePreviewAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  sharePreviewAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sharePreviewInitial: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  sharePreviewUsername: { fontSize: 13, fontWeight: '800', color: THEME.colors.text },
  sharePreviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8ECE5',
  },
  sharePreviewCaptionText: { fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 16 },

  // Who Shared Modal
  modalLoadingBox: { padding: 40, alignItems: 'center', gap: 10 },
  modalLoadingText: { fontSize: 14, color: THEME.colors.textSecondary },
  modalEmptyBox: { padding: 40, alignItems: 'center' },
  modalEmptyText: {
    fontSize: 15,
    color: THEME.colors.textLight,
    fontWeight: '600',
    marginTop: 10,
  },
  sharesListScroll: { paddingHorizontal: 20, paddingVertical: 10 },
  sharerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8ECE5',
  },
  sharerAvatarImage: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  sharerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sharerAvatarInitial: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  sharerDetails: { flex: 1 },
  sharerUsernameText: { fontSize: 15, fontWeight: '800', color: THEME.colors.text },
  sharerBioText: { fontSize: 12, color: THEME.colors.textSecondary, marginTop: 2 },
  sharerBadgePill: {
    backgroundColor: THEME.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sharerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
});
