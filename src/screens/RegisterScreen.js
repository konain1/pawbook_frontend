import React, { useState, useEffect } from 'react';
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
import { registerUser, sendOtp } from '../services/api';
import { THEME } from '../constants/theme';
import CatMascot from '../components/CatMascot';

export default function RegisterScreen({ navigation, onRegisterSuccess }) {
  const [step, setStep] = useState(1); // 1: Enter details, 2: Enter OTP
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Request verification OTP
  const handleSendOtp = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your username, email, and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email.trim(), username.trim());
      setStep(2);
      setResendTimer(60); // 60 seconds cooldown
      Alert.alert(
        'Code Sent! 📬',
        `We sent a 6-digit verification code to ${email.trim()}.\n\n💡 Tip: Please check your Spam or Junk folder if you don't see it in your inbox.`
      );
    } catch (error) {
      Alert.alert('Verification Error', error.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      await sendOtp(email.trim(), username.trim());
      setResendTimer(60);
      Alert.alert(
        'Code Resent 🔁',
        `A fresh verification code was sent to ${email.trim()}.\n\n💡 Tip: Check your Spam/Junk folder if not in Inbox.`
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete registration with OTP
  const handleCompleteRegistration = async () => {
    if (!otp.trim()) {
      Alert.alert('Missing Code', 'Please enter the 6-digit verification code.');
      return;
    }

    if (otp.trim().length !== 6) {
      Alert.alert('Invalid Code', 'The verification code must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(username.trim(), email.trim(), password, otp.trim());
      Alert.alert('Success 🎉', `Welcome to Pawbook, ${res.user.username}! 🐾`);
      if (onRegisterSuccess) {
        onRegisterSuccess(res.user, res.token);
      } else {
        navigation?.navigate('Home');
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Invalid or expired verification code.');
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
          onPress={() => {
            if (step === 2) {
              setStep(1);
            } else {
              navigation?.navigate('Welcome');
            }
          }}
        >
          <Text style={styles.backButtonIcon}>←</Text>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Mascot Header */}
        <View style={styles.mascotWrapper}>
          <CatMascot size={92} />
        </View>

        {step === 1 ? (
          /* ── STEP 1: Details ── */
          <View style={styles.card}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Join Pawbook 🐾</Text>
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Connect with fellow pet lovers in a clean, premium space
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Luna_the_cat"
                placeholderTextColor={THEME.colors.textLight}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

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
                placeholder="At least 6 characters"
                placeholderTextColor={THEME.colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={THEME.colors.offWhite} />
              ) : (
                <Text style={styles.primaryBtnText}>Continue & Verify Email →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginFooterRow}
              onPress={() => navigation?.navigate('Login')}
            >
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── STEP 2: Email Verification OTP ── */
          <View style={styles.card}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Email Verification 📧</Text>
            </View>

            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.highlightEmail}>{email}</Text>
            </Text>

            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor={THEME.colors.textLight}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            {/* Spam Folder Reminder Box */}
            <View style={styles.spamHintBox}>
              <Text style={styles.spamHintEmoji}>💡</Text>
              <Text style={styles.spamHintText}>
                Can't find the email? Please check your{' '}
                <Text style={styles.spamHintBold}>Spam</Text>,{' '}
                <Text style={styles.spamHintBold}>Junk</Text>, or{' '}
                <Text style={styles.spamHintBold}>Promotions</Text> folder.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleCompleteRegistration}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={THEME.colors.offWhite} />
              ) : (
                <Text style={styles.primaryBtnText}>Verify & Create Account 🐾</Text>
              )}
            </TouchableOpacity>

            {/* Resend & Edit Actions */}
            <View style={styles.otpActions}>
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={resendTimer > 0 || loading}
                style={styles.resendBtn}
              >
                <Text
                  style={[
                    styles.resendText,
                    resendTimer > 0 && styles.resendDisabled,
                  ]}
                >
                  {resendTimer > 0
                    ? `Resend code in ${resendTimer}s`
                    : '🔁 Resend Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(1)} style={styles.changeEmailBtn}>
                <Text style={styles.changeEmailText}>✏️ Edit email / details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    marginBottom: 22,
    lineHeight: 20,
  },
  highlightEmail: {
    color: THEME.colors.secondary,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
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
  otpInputContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  otpInput: {
    width: '100%',
    backgroundColor: THEME.colors.surfaceWarm,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 12,
    textAlign: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    color: THEME.colors.offWhite,
  },
  spamHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentLight,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginVertical: 14,
    gap: 8,
  },
  spamHintEmoji: {
    fontSize: 16,
  },
  spamHintText: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
  },
  spamHintBold: {
    fontWeight: '700',
    color: THEME.colors.offWhite,
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
  loginFooterRow: {
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
  otpActions: {
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  resendBtn: {
    paddingVertical: 4,
  },
  resendText: {
    color: THEME.colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  resendDisabled: {
    color: THEME.colors.textLight,
  },
  changeEmailBtn: {
    paddingVertical: 4,
  },
  changeEmailText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
