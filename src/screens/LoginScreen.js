import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { loginUser } from '../services/api';
import { THEME } from '../constants/theme';
import CatMascot from '../components/CatMascot';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser(email.trim(), password);
      Alert.alert('Welcome Back 🎉', `Good to see you again, ${res.user.username}! 🐾`);
      if (onLoginSuccess) {
        onLoginSuccess(res.user, res.token);
      } else {
        navigation?.navigate('Home');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Back Navigation */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.navigate('Welcome')}
        >
          <Text style={styles.backButtonIcon}>←</Text>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Mascot Header */}
        <View style={styles.mascotWrapper}>
          <CatMascot size={92} />
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>Welcome Back 🐾</Text>
          </View>

          <Text style={styles.title}>Log in</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to access your Pawbook feed & friends
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              placeholderTextColor={THEME.colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={THEME.colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color={THEME.colors.offWhite} />
            ) : (
              <Text style={styles.primaryBtnText}>Log In →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupFooterRow}
            onPress={() => navigation?.navigate('Register')}
          >
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 22,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  backButtonIcon: {
    fontSize: 16,
    color: THEME.colors.primaryLight,
    marginRight: 4,
    fontWeight: '700',
  },
  backButtonText: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  mascotWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    marginBottom: 12,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.offWhite,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: THEME.colors.surfaceWarm,
    color: THEME.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  primaryBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: THEME.colors.offWhite,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signupFooterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: THEME.colors.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
});
