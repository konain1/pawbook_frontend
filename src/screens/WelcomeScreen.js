import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { THEME } from '../constants/theme';
import CatMascot from '../components/CatMascot';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Decorative Top Tag */}
      <View style={styles.topBadge}>
        <Text style={styles.topBadgeText}>🐾 Clean • Premium • Timeless</Text>
      </View>

      {/* Mascot Card Hero */}
      <View style={styles.heroCard}>
        <CatMascot size={130} />
      </View>

      {/* Title & Description */}
      <Text style={styles.title}>Pawbook 🐾</Text>
      <Text style={styles.subtitle}>
        An exclusive space for pet lovers to share moments, make friends & chat
      </Text>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation?.navigate('Register')}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>Get Started →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation?.navigate('Login')}
          activeOpacity={0.88}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Crafted with ❤️ for pets & their humans</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  topBadge: {
    backgroundColor: THEME.colors.accentLight,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    marginBottom: 24,
  },
  topBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.offWhite,
    letterSpacing: 0.5,
  },
  heroCard: {
    backgroundColor: THEME.colors.surface,
    width: width * 0.72,
    height: width * 0.62,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderCrimson,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: THEME.colors.primary,
    width: '100%',
    paddingVertical: 17,
    borderRadius: 26,
    alignItems: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryBtnText: {
    color: THEME.colors.offWhite,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: THEME.colors.surface,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 26,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryBtnText: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    color: THEME.colors.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
});
