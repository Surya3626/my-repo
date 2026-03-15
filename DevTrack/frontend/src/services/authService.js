import apiClient from '../api/client';

const login = (username, password) => {
  return apiClient
    .post('/auth/login', {
      username,
      password,
    })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
        return JSON.parse(user);
    } catch (e) {
        console.error("Error parsing user from localStorage", e);
        return null;
    }
};

const authHeader = () => {
    const user = getCurrentUser();
    if (user && user.token) {
        return { Authorization: 'Bearer ' + user.token };
    } else {
        return {};
    }
};

const signup = (userData) => {
  return apiClient.post('/auth/signup', userData);
};

export default {
  login,
  signup,
  logout,
  getCurrentUser,
  authHeader,
};
