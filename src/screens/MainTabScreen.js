import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import ProfileScreen from './ProfileScreen';
import FeedScreen from './FeedScreen';
import FriendsScreen from './FriendsScreen';
import ChatScreen from './ChatScreen';

const PURPLE = '#7C3AED';

const TABS = [
  { key: 'Feed',    label: 'Feed',    icon: '🏠' },
  { key: 'Friends', label: 'Friends', icon: '🐾' },
  { key: 'Chat',    label: 'Chat',    icon: '💬' },
  { key: 'Profile', label: 'Profile', icon: '👤' },
];

export default function MainTabScreen({ token, user, onLogout, onProfileUpdate, rootNavigation }) {
  const [activeTab, setActiveTab] = useState('Feed');

  // Minimal navigation object scoped to tab screens
  const tabNavigation = {
    navigate: (screen) => {
      // Let the root handle EditProfile (it's outside the tab layout)
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
        return <FeedScreen user={user} />;
      case 'Friends':
        return <FriendsScreen user={user} token={token} />;
      case 'Chat':
        return <ChatScreen user={user} token={token} />;
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
        return <FeedScreen user={user} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen content */}
      <View style={styles.screen}>{renderTab()}</View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              {/* Active pill */}
              {isActive && <View style={styles.activePill} />}

              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  screen: { flex: 1 },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: -10,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: PURPLE,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 3,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: PURPLE,
    fontWeight: '700',
  },
});
