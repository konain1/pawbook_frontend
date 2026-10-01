import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import ProfileScreen from './ProfileScreen';
import FeedScreen from './FeedScreen';
import FriendsScreen from './FriendsScreen';
import ChatScreen from './ChatScreen';
import { THEME } from '../constants/theme';

const TABS = [
  { key: 'Feed', label: 'Feed', icon: '🏠' },
  { key: 'Friends', label: 'Friends', icon: '🐾' },
  { key: 'Chat', label: 'Chat', icon: '💬' },
  { key: 'Profile', label: 'Profile', icon: '👤' },
];

export default function MainTabScreen({ token, user, onLogout, onProfileUpdate, rootNavigation }) {
  const [activeTab, setActiveTab] = useState('Feed');

  const tabNavigation = {
    navigate: (screen) => {
      if (screen === 'EditProfile') {
        rootNavigation?.navigate('EditProfile');
      } else {
        setActiveTab(screen);
      }
    },
    goBack: () => setActiveTab('Feed'),
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Feed':
        return <FeedScreen user={user} token={token} />;
      case 'Friends':
        return <FriendsScreen user={user} token={token} />;
      case 'Chat':
        return <ChatScreen user={user} token={token} navigation={tabNavigation} />;
      case 'Profile':
        return (
          <ProfileScreen
            token={token}
            user={user}
            onLogout={onLogout}
            navigation={tabNavigation}
          />
        );
      default:
        return <FeedScreen user={user} token={token} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen content */}
      <View style={styles.screen}>{renderTab()}</View>

      {/* Floating Rounded Bottom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                  {tab.icon}
                </Text>
                {isActive && (
                  <Text style={styles.tabLabelActive}>{tab.label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  screen: { flex: 1 },

  // Floating Tab Bar
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F2E6DF',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: THEME.colors.accent,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabelActive: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
});
