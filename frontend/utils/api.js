import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData)
};

// Teams endpoints
const teams = {
  getAll: () => api.get('/teams'),
  getById: (teamId) => api.get(`/teams/${teamId}`),
  getPriceHistory: (teamId, timeframe) => 
    api.get(`/teams/${teamId}/price-history?timeframe=${timeframe}`)
};

// Trading endpoints
const trading = {
  getPortfolio: () => api.get('/trading/portfolio'),
  placeOrder: (orderData) => api.post('/trading/orders', orderData),
  getOrders: () => api.get('/trading/orders'),
  cancelOrder: (orderId) => api.delete(`/trading/orders/${orderId}`),
  getFunds: () => api.get('/trading/funds'),
  addFunds: (amount) => api.post('/trading/funds', { amount })
};

// Community endpoints
const community = {
  getLeaderboard: () => api.get('/community/leaderboard'),
  getActivity: () => api.get('/community/activity'),
  followUser: (userId) => api.post(`/community/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/community/follow/${userId}`)
};

// Rewards endpoints
const rewards = {
  getAll: () => api.get('/rewards'),
  claim: (rewardId) => api.post(`/rewards/${rewardId}/claim`)
};

export default {
  auth,
  teams,
  trading,
  community,
  rewards
}; 