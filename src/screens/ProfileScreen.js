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
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, updateAvatar } from '../services/api';

const { width } = Dimensions.get('window');

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
      mediaTypes: ['images'],
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
      Alert.alert('✅ Success', 'Profile picture updated!');
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* ── Purple Hero Section ── */}
      <View style={styles.hero}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>My Profile</Text>
          <TouchableOpacity style={styles.logoutPill} onPress={onLogout}>
            <Text style={styles.logoutPillText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handlePickImage}
          activeOpacity={0.85}
          disabled={uploading}
        >
          {profile?.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(profile?.username || 'U')}</Text>
            </View>
          )}
          {/* Camera badge */}
          <View style={styles.cameraBadge}>
            {uploading
              ? <ActivityIndicator size="small" color="#7C3AED" />
              : <Text style={styles.cameraEmoji}>📷</Text>
            }
          </View>
        </TouchableOpacity>

        {/* Name & tag */}
        <Text style={styles.heroName}>{profile?.username || 'Pawbook User'}</Text>
        <Text style={styles.heroEmail}>{profile?.email || ''}</Text>

        {/* Set photo CTA — only when no avatar */}
        {!profile?.avatar && (
          <TouchableOpacity
            style={styles.setPhotoCta}
            onPress={handlePickImage}
            disabled={uploading}
          >
            {uploading
              ? <ActivityIndicator color="#7C3AED" />
              : <Text style={styles.setPhotoCtaText}>📸  Set Profile Picture</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* ── White Card Section ── */}
      <View style={styles.card}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🐾</Text>
            <Text style={styles.statLabel}>Pawbook</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{memberSince?.split(' ')[0] || '—'}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Active</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info rows */}
        <InfoRow icon="👤" label="Username" value={profile?.username} />
        <InfoRow icon="📧" label="Email" value={profile?.email} />
        {profile?.bio && <InfoRow icon="✏️" label="Bio" value={profile.bio} />}
        {memberSince && <InfoRow icon="📅" label="Member since" value={memberSince} />}

        <View style={styles.divider} />

        {/* Action buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>
                {profile?.avatar ? 'Change Profile Picture' : '📸  Set Profile Picture'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineBtn} onPress={onLogout}>
          <Text style={styles.outlineBtnText}>Log out</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const PURPLE = '#7C3AED';
const PURPLE_DARK = '#5B21B6';
const PURPLE_LIGHT = '#EDE9FE';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },

  loadingScreen: { flex: 1, backgroundColor: PURPLE, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 15, opacity: 0.8 },

  // ── Hero ──
  hero: {
    backgroundColor: PURPLE,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 56,
    marginBottom: 28,
  },
  topBarTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  logoutPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoutPillText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: PURPLE_DARK,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 38, fontWeight: '800', color: '#fff' },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraEmoji: { fontSize: 15 },

  heroName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroEmail: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },

  setPhotoCta: {
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 24,
    marginTop: 4,
  },
  setPhotoCtaText: { color: PURPLE, fontSize: 14, fontWeight: '700' },

  // ── White Card ──
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -32,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 32,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, backgroundColor: '#E5E7EB' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  infoIcon: { fontSize: 20, marginRight: 14, width: 28, textAlign: 'center' },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1a1a2e', fontWeight: '600' },

  // Buttons
  primaryBtn: {
    backgroundColor: PURPLE,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: PURPLE,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  outlineBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  outlineBtnText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
});
