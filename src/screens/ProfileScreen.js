import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, updateAvatar } from '../services/api';

export default function ProfileScreen({ token, user: initialUser, onLogout }) {
  const [profile, setProfile] = useState(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProfile(token);
      setProfile(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const filename = asset.uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    setUploading(true);
    try {
      const res = await updateAvatar(token, { uri: asset.uri, name: filename, type });
      setProfile(res.user);
      Alert.alert('Success', 'Profile picture updated!');
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} disabled={uploading}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(profile?.username || 'U')}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.cameraIcon}>📷</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {!profile?.avatar && (
          <TouchableOpacity style={styles.uploadCta} onPress={handlePickImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadCtaText}>📸  Set Profile Picture</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Info cards */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Username</Text>
        <Text style={styles.cardValue}>{profile?.username || '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Email</Text>
        <Text style={styles.cardValue}>{profile?.email || '—'}</Text>
      </View>

      {profile?.bio ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Bio</Text>
          <Text style={styles.cardValue}>{profile.bio}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Member since</Text>
        <Text style={styles.cardValue}>
          {profile?.createdAt
            ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })
            : '—'}
        </Text>
      </View>

      {profile?.avatar && (
        <TouchableOpacity style={styles.changeAvatarBtn} onPress={handlePickImage} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.changeAvatarText}>Change Profile Picture</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { paddingHorizontal: 24, paddingBottom: 50 },
  centered: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#a0a0b0', marginTop: 12, fontSize: 15 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 36 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  logoutBtn: { backgroundColor: '#16213e', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e94560' },
  logoutText: { color: '#e94560', fontSize: 13, fontWeight: '600' },

  avatarSection: { alignItems: 'center', marginBottom: 36 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#e94560' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#16213e', borderWidth: 3, borderColor: '#2a2a4a', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 42, fontWeight: '700', color: '#e94560' },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#e94560', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1a1a2e' },
  cameraIcon: { fontSize: 16 },
  uploadCta: { marginTop: 18, backgroundColor: '#e94560', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, minWidth: 180, alignItems: 'center' },
  uploadCtaText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  card: { backgroundColor: '#16213e', borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  cardLabel: { color: '#a0a0b0', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  cardValue: { color: '#fff', fontSize: 16, fontWeight: '500' },

  changeAvatarBtn: { marginTop: 16, borderWidth: 1.5, borderColor: '#e94560', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  changeAvatarText: { color: '#e94560', fontSize: 15, fontWeight: '600' },
});
