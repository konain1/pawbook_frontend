import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Welcome');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const navigation = {
    navigate: (screenName) => setCurrentScreen(screenName),
    goBack: () => setCurrentScreen('Welcome'),
  };

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentScreen('Profile');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCurrentScreen('Welcome');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return <LoginScreen navigation={navigation} onLoginSuccess={handleAuthSuccess} />;
      case 'Register':
        return <RegisterScreen navigation={navigation} onRegisterSuccess={handleAuthSuccess} />;
      case 'Profile':
        return <ProfileScreen token={token} user={user} onLogout={handleLogout} navigation={navigation} />;
      case 'EditProfile':
        return (
          <EditProfileScreen
            token={token}
            user={user}
            navigation={navigation}
            onProfileUpdate={(updatedUser) => setUser(updatedUser)}
          />
        );
      case 'Home':
        return <HomeScreen user={user} navigation={navigation} onLogout={handleLogout} />;
      case 'Welcome':
      default:
        return <WelcomeScreen navigation={navigation} />;
    }
  };

  const bgColor = ['Profile', 'EditProfile'].includes(currentScreen) ? '#7C3AED' : '#1a1a2e';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
