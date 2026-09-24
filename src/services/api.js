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
 * Upload / update the user's avatar using XMLHttpRequest.
 * RN's fetch doesn't reliably set the multipart boundary with Blobs;
 * XHR handles it correctly.
 * @param {string} token
 * @param {{ uri: string, name: string, type: string }} image
 */
export const updateAvatar = async (token, image) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    // React Native still supports the plain object form inside XHR FormData
    formData.append('avatar', {
      uri: image.uri,
      name: image.name || 'avatar.jpg',
      type: image.type || 'image/jpeg',
    });

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${API_URL}/profile`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.message || 'Avatar upload failed'));
        }
      } catch {
        reject(new Error(`Server error (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
};
