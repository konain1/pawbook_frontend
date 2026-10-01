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
import { THEME } from '../constants/theme';
import CatMascot from '../components/CatMascot';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ token, user: initialUser, onLogout, navigation }) {
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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

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
      Alert.alert('Success 🎉', 'Profile picture updated!');
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : null;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <CatMascot size={70} />
        <ActivityIndicator size="small" color={THEME.colors.primary} style={{ marginTop: 14 }} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={THEME.colors.primary}
        />
      }
    >
      {/* ── Warm Peach Hero Section ── */}
      <View style={styles.hero}>
        {/* Top Header Row */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>My Profile 🐾</Text>
          <View style={styles.topBarActions}>
            <TouchableOpacity
              style={styles.gearIconBtn}
              onPress={() => navigation?.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Text style={styles.gearIconText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
              <Text style={styles.logoutBtnText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar with Camera Badge */}
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

          <View style={styles.cameraBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={THEME.colors.primary} />
            ) : (
              <Text style={styles.cameraEmoji}>📸</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Name & Tag */}
        <Text style={styles.heroName}>{profile?.username || 'Pawbook Member'}</Text>
        <Text style={styles.heroEmail}>{profile?.email || ''}</Text>

        {/* Bio Badge */}
        {profile?.bio ? (
          <View style={styles.bioBadge}>
            <Text style={styles.bioText}>“{profile.bio}”</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBioBtn}
            onPress={() => navigation?.navigate('EditProfile')}
          >
            <Text style={styles.addBioText}>+ Add a cute bio</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Attributes / Stats Chips (Reference Image Style) ── */}
      <View style={styles.attributeGrid}>
        <View style={styles.attributeCard}>
          <Text style={styles.attributeIcon}>🐾</Text>
          <Text style={styles.attributeLabel}>Community</Text>
          <Text style={styles.attributeValue}>Pawbook</Text>
        </View>

        <View style={styles.attributeCard}>
          <Text style={styles.attributeIcon}>📅</Text>
          <Text style={styles.attributeLabel}>Joined</Text>
          <Text style={styles.attributeValue}>{memberSince || 'Recent'}</Text>
        </View>

        <View style={styles.attributeCard}>
          <Text style={styles.attributeIcon}>✨</Text>
          <Text style={styles.attributeLabel}>Status</Text>
          <Text style={styles.attributeValue}>Active Pet Lover</Text>
        </View>
      </View>

      {/* ── Main Details Card ── */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Account Details</Text>

        <InfoRow icon="👤" label="Username" value={profile?.username} />
        <InfoRow icon="📧" label="Email" value={profile?.email} />
        <InfoRow icon="🐾" label="Role" value="Pet Parent & Enthusiast" />
        {memberSince && <InfoRow icon="🗓️" label="Member Since" value={memberSince} />}

        {/* Action Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => navigation?.navigate('EditProfile')}
          activeOpacity={0.88}
        >
          <Text style={styles.editProfileBtnText}>✏️ Edit Profile Info</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    paddingBottom: 110,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Hero ──
  hero: {
    backgroundColor: '#FFEFEA',
    paddingBottom: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#F8E0D5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 48,
    marginBottom: 20,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -0.3,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gearIconBtn: {
    backgroundColor: '#FFFFFF',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2DCD3',
  },
  gearIconText: { fontSize: 17 },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F2DCD3',
  },
  logoutBtnText: {
    color: THEME.colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },

  // Avatar
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: THEME.colors.accent,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F8E0D5',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraEmoji: { fontSize: 15 },

  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 2,
  },
  heroEmail: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  bioBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2DCD3',
    maxWidth: '85%',
  },
  bioText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  addBioBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F2DCD3',
  },
  addBioText: {
    color: THEME.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },

  // Attribute Grid (Reference Style)
  attributeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 18,
    gap: 10,
  },
  attributeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  attributeIcon: { fontSize: 20, marginBottom: 4 },
  attributeLabel: {
    fontSize: 11,
    color: THEME.colors.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  attributeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.text,
    textAlign: 'center',
  },

  // Main Card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 16,
    letterSpacing: -0.2,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFE2DA',
  },
  infoIcon: { fontSize: 17 },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: THEME.colors.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: THEME.colors.text,
    fontWeight: '700',
  },

  editProfileBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
