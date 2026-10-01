import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { registerUser, sendOtp } from '../services/api';

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
        setResendTimer(prev => prev - 1);
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
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {step === 1 ? (
        /* ── STEP 1: Details ── */
        <View style={styles.formContainer}>
          <Text style={styles.title}>Join Pawbook 🐾</Text>
          <Text style={styles.subtitle}>Create your account & connect with pet lovers</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min. 6 characters)"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleSendOtp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Continue & Verify Email →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
            <Text style={styles.link}>
              Already have an account? <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── STEP 2: Email Verification OTP ── */
        <View style={styles.formContainer}>
          <Text style={styles.title}>Verify Email 📧</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.highlightEmail}>{email}</Text>
          </Text>

          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="• • • • • •"
            placeholderTextColor="#666"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          {/* ── Spam Folder Reminder Hint ── */}
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
            style={styles.btn}
            onPress={handleCompleteRegistration}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Verify & Create Account 🐾</Text>
            )}
          </TouchableOpacity>

          {/* Resend & Change Email Actions */}
          <View style={styles.otpActions}>
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendTimer > 0 || loading}
            >
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.changeEmailText}>Edit details / Change email</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  formContainer: {
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 25,
    zIndex: 10,
    padding: 6,
  },
  backButtonText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#a0a0b0',
    marginBottom: 32,
    lineHeight: 22,
  },
  highlightEmail: {
    color: '#fff',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  otpInput: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    paddingVertical: 18,
    color: '#e94560',
  },
  spamHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2942',
    borderWidth: 1,
    borderColor: '#3b4260',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  spamHintEmoji: {
    fontSize: 16,
  },
  spamHintText: {
    flex: 1,
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 17,
  },
  spamHintBold: {
    fontWeight: '700',
    color: '#fbbf24',
  },
  btn: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#e94560',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  link: {
    color: '#a0a0b0',
    textAlign: 'center',
    fontSize: 15,
  },
  linkBold: {
    color: '#e94560',
    fontWeight: '600',
  },
  otpActions: {
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  resendText: {
    color: '#e94560',
    fontSize: 15,
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#666',
  },
  changeEmailText: {
    color: '#a0a0b0',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
