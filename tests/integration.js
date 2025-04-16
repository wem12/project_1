const axios = require('axios');
const assert = require('assert');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test user credentials
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890'
};

let authToken = null;

// Helper function to log test results
const logTest = (name, passed) => {
  console.log(`${passed ? '✅' : '❌'} ${name}`);
};

// Run tests
async function runTests() {
  console.log('Running integration tests...');
  
  try {
    // Test 1: Register a new user
    try {
      const registerResponse = await client.post('/auth/register', testUser);
      logTest('User Registration', registerResponse.status === 201);
    } catch (error) {
      logTest('User Registration', false);
      console.error('Registration error:', error.response?.data || error.message);
    }
    
    // Test 2: Login with the new user
    try {
      const loginResponse = await client.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      
      authToken = loginResponse.data.token;
      client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      logTest('User Login', loginResponse.status === 200 && authToken);
    } catch (error) {
      logTest('User Login', false);
      console.error('Login error:', error.response?.data || error.message);
    }
    
    // Test 3: Get user profile
    if (authToken) {
      try {
        const profileResponse = await client.get('/users/me');
        logTest('Get User Profile', 
          profileResponse.status === 200 && 
          profileResponse.data.email === testUser.email
        );
      } catch (error) {
        logTest('Get User Profile', false);
        console.error('Profile error:', error.response?.data || error.message);
      }
    } else {
      logTest('Get User Profile', false);
      console.log('Skipped due to missing auth token');
    }
    
    // Test 4: Get teams
    try {
      const teamsResponse = await client.get('/teams');
      logTest('Get Teams', 
        teamsResponse.status === 200 && 
        Array.isArray(teamsResponse.data.teams)
      );
    } catch (error) {
      logTest('Get Teams', false);
      console.error('Teams error:', error.response?.data || error.message);
    }
    
    // Test 5: Get portfolio (requires auth)
    if (authToken) {
      try {
        const portfolioResponse = await client.get('/portfolio');
        logTest('Get Portfolio', portfolioResponse.status === 200);
      } catch (error) {
        logTest('Get Portfolio', false);
        console.error('Portfolio error:', error.response?.data || error.message);
      }
    } else {
      logTest('Get Portfolio', false);
      console.log('Skipped due to missing auth token');
    }
    
    console.log('Integration tests completed!');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

runTests(); 