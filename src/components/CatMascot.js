import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { THEME } from '../constants/theme';

export default function CatMascot({ size = 110, style, mood = 'happy' }) {
  const scale = size / 110;

  return (
    <View style={[styles.container, { width: size, height: size * 0.9 }, style]}>
      {/* Ears */}
      <View style={[styles.earLeft, { transform: [{ scale }] }]} />
      <View style={[styles.earRight, { transform: [{ scale }] }]} />
      
      {/* Head */}
      <View style={[styles.head, { width: size, height: size * 0.82, borderRadius: size * 0.41 }]}>
        {/* Cute Eyes Container */}
        <View style={styles.eyesRow}>
          {/* Left Eye */}
          <View style={[styles.eye, { width: 22 * scale, height: 22 * scale, borderRadius: 11 * scale }]}>
            <View style={[styles.eyePupil, { width: 14 * scale, height: 14 * scale, borderRadius: 7 * scale }]} />
            <View style={[styles.eyeSparkle, { width: 6 * scale, height: 6 * scale, borderRadius: 3 * scale }]} />
          </View>
          
          {/* Right Eye */}
          <View style={[styles.eye, { width: 22 * scale, height: 22 * scale, borderRadius: 11 * scale }]}>
            <View style={[styles.eyePupil, { width: 14 * scale, height: 14 * scale, borderRadius: 7 * scale }]} />
            <View style={[styles.eyeSparkle, { width: 6 * scale, height: 6 * scale, borderRadius: 3 * scale }]} />
          </View>
        </View>

        {/* Blush Cheeks */}
        <View style={styles.blushRow}>
          <View style={[styles.blush, { width: 16 * scale, height: 8 * scale, borderRadius: 4 * scale }]} />
          <View style={[styles.blush, { width: 16 * scale, height: 8 * scale, borderRadius: 4 * scale }]} />
        </View>

        {/* Little Pink Nose */}
        <View style={[styles.nose, { width: 6 * scale, height: 4 * scale, borderRadius: 2 * scale }]} />

        {/* Cute Whiskers */}
        <View style={[styles.whiskerLeft1, { width: 18 * scale, top: 46 * scale, left: -10 * scale }]} />
        <View style={[styles.whiskerLeft2, { width: 18 * scale, top: 54 * scale, left: -10 * scale }]} />
        <View style={[styles.whiskerRight1, { width: 18 * scale, top: 46 * scale, right: -10 * scale }]} />
        <View style={[styles.whiskerRight2, { width: 18 * scale, top: 54 * scale, right: -10 * scale }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  earLeft: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E1E1E',
    transform: [{ rotate: '-25deg' }],
    zIndex: 1,
  },
  earRight: {
    position: 'absolute',
    top: 0,
    right: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E1E1E',
    transform: [{ rotate: '25deg' }],
    zIndex: 1,
  },
  head: {
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    shadowColor: '#1E1E1E',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  eyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '58%',
    marginTop: 4,
  },
  eye: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eyePupil: {
    backgroundColor: '#1E1E1E',
    position: 'absolute',
  },
  eyeSparkle: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 2,
    right: 2,
  },
  blushRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '75%',
    position: 'absolute',
    bottom: 22,
  },
  blush: {
    backgroundColor: '#F9876F',
    opacity: 0.55,
  },
  nose: {
    backgroundColor: '#F9876F',
    position: 'absolute',
    bottom: 24,
  },
  whiskerLeft1: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#1E1E1E',
    transform: [{ rotate: '-8deg' }],
  },
  whiskerLeft2: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#1E1E1E',
    transform: [{ rotate: '8deg' }],
  },
  whiskerRight1: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#1E1E1E',
    transform: [{ rotate: '8deg' }],
  },
  whiskerRight2: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#1E1E1E',
    transform: [{ rotate: '-8deg' }],
  },
});
