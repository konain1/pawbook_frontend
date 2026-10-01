import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateAvatar, API_URL } from '../services/api';
import { THEME } from '../constants/theme';

export default function EditProfileScreen({ token, user, navigation, onProfileUpdate }) {
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const body = {};
      if (username.trim()) body.username = username.trim();
      if (bio.trim() !== (user?.bio || '')) body.bio = bio.trim();
      if (password) body.password = password;

      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');

      Alert.alert('Saved 🎉', 'Profile updated successfully!');
      if (onProfileUpdate) onProfileUpdate(data.user);
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
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

    setUploadingAvatar(true);
    try {
      const res = await updateAvatar(token, { uri: asset.uri, name: filename, type });
      Alert.alert('Done 📸', 'Profile picture updated!');
      if (onProfileUpdate) onProfileUpdate(res.user);
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.navigate('Profile')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile 🐾</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Change Photo Button */}
      <TouchableOpacity
        style={styles.changePhotoBtn}
        onPress={handleChangePhoto}
        disabled={uploadingAvatar}
        activeOpacity={0.85}
      >
        {uploadingAvatar ? (
          <ActivityIndicator color={THEME.colors.primaryLight} />
        ) : (
          <Text style={styles.changePhotoText}>📸 Change Profile Photo</Text>
        )}
      </TouchableOpacity>

      {/* Account Info Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Info</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Your username"
          placeholderTextColor={THEME.colors.textLight}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell other pet lovers about yourself & pets…"
          placeholderTextColor={THEME.colors.textLight}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Change Password Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <Text style={styles.sectionHint}>Leave blank to keep your current password</Text>

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Min. 6 characters"
          placeholderTextColor={THEME.colors.textLight}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat new password"
          placeholderTextColor={THEME.colors.textLight}
          secureTextEntry
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.88}
      >
        {saving ? (
          <ActivityIndicator color={THEME.colors.offWhite} />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  content: { paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderCrimson,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: THEME.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  backBtnText: { color: THEME.colors.text, fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.colors.text },

  changePhotoBtn: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderCrimson,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  changePhotoText: { color: THEME.colors.offWhite, fontSize: 15, fontWeight: '800' },

  sectionCard: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: THEME.colors.text, marginBottom: 2 },
  sectionHint: { fontSize: 12, color: THEME.colors.textLight, marginBottom: 12 },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: THEME.colors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: THEME.colors.text,
  },
  bioInput: { height: 86, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: THEME.colors.primary,
    marginHorizontal: 20,
    marginTop: 22,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnText: { color: THEME.colors.offWhite, fontSize: 16, fontWeight: '800' },
});
