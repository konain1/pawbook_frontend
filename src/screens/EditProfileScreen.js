import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateAvatar } from '../services/api';
import { API_URL } from '../services/api';

const PURPLE = '#7C3AED';
const PURPLE_DARK = '#5B21B6';

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

      Alert.alert('✅ Saved', 'Profile updated successfully!');
      if (onProfileUpdate) onProfileUpdate(data.user);
      navigation?.navigate('Profile');
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
      Alert.alert('✅ Done', 'Profile picture updated!');
      if (onProfileUpdate) onProfileUpdate(res.user);
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.navigate('Profile')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Change Photo */}
      <TouchableOpacity style={styles.changePhotoBtn} onPress={handleChangePhoto} disabled={uploadingAvatar}>
        {uploadingAvatar
          ? <ActivityIndicator color={PURPLE} />
          : <Text style={styles.changePhotoText}>📸  Change Profile Picture</Text>
        }
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Your username"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself…"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <Text style={styles.sectionHint}>Leave blank to keep current password</Text>

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Min. 6 characters"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat new password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>Save Changes</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  content: { paddingBottom: 50 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PURPLE,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: {},
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },

  changePhotoBtn: {
    margin: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  changePhotoText: { color: PURPLE, fontSize: 15, fontWeight: '700' },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  sectionHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 16 },

  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
  },
  bioInput: { height: 90, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: PURPLE,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
