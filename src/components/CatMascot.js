import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

export default function CatMascot({ size = 110, style }) {
  const scale = size / 110;

  return (
    <View style={[styles.container, { width: size, height: size * 0.9 }, style]}>
      {/* Outer Ears */}
      <View style={[styles.earLeft, { transform: [{ scale }, { rotate: '-25deg' }] }]} />
      <View style={[styles.earRight, { transform: [{ scale }, { rotate: '25deg' }] }]} />

      {/* Inner Crimson Ears */}
      <View style={[styles.innerEarLeft, { transform: [{ scale: scale * 0.6 }, { rotate: '-25deg' }] }]} />
      <View style={[styles.innerEarRight, { transform: [{ scale: scale * 0.6 }, { rotate: '25deg' }] }]} />
      
      {/* Head */}
      <View style={[styles.head, { width: size, height: size * 0.82, borderRadius: size * 0.41 }]}>
        {/* Eyes Container */}
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

        {/* Blush Cheeks (Crimson) */}
        <View style={styles.blushRow}>
          <View style={[styles.blush, { width: 16 * scale, height: 8 * scale, borderRadius: 4 * scale }]} />
          <View style={[styles.blush, { width: 16 * scale, height: 8 * scale, borderRadius: 4 * scale }]} />
        </View>

        {/* Crimson Red Nose */}
        <View style={[styles.nose, { width: 8 * scale, height: 5 * scale, borderRadius: 2.5 * scale }]} />

        {/* Whiskers */}
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
    borderBottomColor: '#F5F2ED',
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
    borderBottomColor: '#F5F2ED',
    zIndex: 1,
  },
  innerEarLeft: {
    position: 'absolute',
    top: 8,
    left: 17,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#8B0D1A',
    zIndex: 2,
  },
  innerEarRight: {
    position: 'absolute',
    top: 8,
    right: 17,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#8B0D1A',
    zIndex: 2,
  },
  head: {
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
    shadowColor: '#8B0D1A',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  eyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '58%',
    marginTop: 4,
  },
  eye: {
    backgroundColor: '#0B0B0B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eyePupil: {
    backgroundColor: '#0B0B0B',
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
    bottom: 20,
  },
  blush: {
    backgroundColor: '#8B0D1A',
    opacity: 0.45,
  },
  nose: {
    backgroundColor: '#8B0D1A',
    position: 'absolute',
    bottom: 22,
  },
  whiskerLeft1: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#0B0B0B',
    transform: [{ rotate: '-8deg' }],
  },
  whiskerLeft2: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#0B0B0B',
    transform: [{ rotate: '8deg' }],
  },
  whiskerRight1: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#0B0B0B',
    transform: [{ rotate: '8deg' }],
  },
  whiskerRight2: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: '#0B0B0B',
    transform: [{ rotate: '-8deg' }],
  },
});
