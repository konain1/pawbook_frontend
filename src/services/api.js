// Backend API URL
// - iOS Simulator → localhost (runs on Mac)
// - Physical iPhone → Mac's LAN IP
export const API_URL = 'http://192.168.1.6:8000/api';

/**
 * Register a new user
 * @param {string} username 
 * @param {string} email 
 * @param {string} password 
 */
export const registerUser = async (username, email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Please ensure backend is running.');
    }
    throw error;
  }
};

/**
 * Login an existing user
 * @param {string} email 
 * @param {string} password 
 */
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Please ensure backend is running.');
    }
    throw error;
  }
};

/**
 * Get the logged-in user's profile
 * @param {string} token
 */
export const getProfile = async (token) => {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload / update the user's avatar
 * @param {string} token
 * @param {{ uri: string, name: string, type: string }} image
 */
export const updateAvatar = async (token, image) => {
  try {
    const formData = new FormData();
    formData.append('avatar', {
      uri: image.uri,
      name: image.name || 'avatar.jpg',
      type: image.type || 'image/jpeg',
    });

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Avatar upload failed');
    return data;
  } catch (error) {
    throw error;
  }
};
