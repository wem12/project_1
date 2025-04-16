import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if not already on auth pages
      if (!window.location.pathname.startsWith('/auth/')) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Teams endpoints
const teams = {
  getAll: (params) => api.get('/teams', { params }),
  getById: (teamId) => api.get(`/teams/${teamId}`),
  getPriceHistory: (teamId, timeframe) => 
    api.get(`/teams/${teamId}/price-history`, { params: { timeframe } }),
  getStats: (teamId) => api.get(`/teams/${teamId}/stats`),
  getNews: (teamId, params) => api.get(`/teams/${teamId}/news`, { params }),
};

// Orders endpoints
const orders = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: (params) => api.get('/orders', { params }),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  confirm: (orderId) => api.post(`/orders/${orderId}/confirm`),
  cancel: (orderId) => api.post(`/orders/${orderId}/cancel`),
};

// User endpoints
const users = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.patch('/users/me', userData),
  getPortfolio: () => api.get('/users/me/portfolio'),
  getTransactions: (params) => api.get('/users/me/transactions', { params }),
};

// Portfolio endpoints
const portfolio = {
  get: () => api.get('/portfolio'),
  getHoldings: () => api.get('/portfolio/holdings'),
  getHistory: (params) => api.get('/portfolio/history', { params }),
};

// Rewards endpoints
const rewards = {
  getAll: (params) => api.get('/rewards', { params }),
  getById: (rewardId) => api.get(`/rewards/${rewardId}`),
  redeem: (rewardId) => api.post(`/rewards/${rewardId}/redeem`),
  getRedeemed: (params) => api.get('/rewards/redeemed', { params }),
};

// Community endpoints
const community = {
  getLeaderboards: (params) => api.get('/leaderboards', { params }),
  getDiscussions: (params) => api.get('/community/discussions', { params }),
  getDiscussion: (discussionId) => api.get(`/community/discussions/${discussionId}`),
  createDiscussion: (data) => api.post('/community/discussions', data),
  addComment: (discussionId, data) => api.post(`/community/discussions/${discussionId}/comments`, data),
  getAchievements: () => api.get('/community/achievements'),
};

export default {
  auth,
  teams,
  orders,
  users,
  portfolio,
  rewards,
  community,
};
