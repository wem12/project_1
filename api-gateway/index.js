// api-gateway/index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const proxy = require('express-http-proxy');
const config = require('./config');
const authenticateJWT = require('./middleware/auth');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors(config.cors));
app.use(morgan('combined'));

// Load OpenAPI specification
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Apply rate limiting
app.use('/api/v1/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Service routing - Routes that don't require authentication
app.use('/api/v1/auth', proxy(`${config.services.user}`, {
  proxyReqPathResolver: (req) => `/auth${req.url}`
}));

app.use('/api/v1/teams', proxy(`${config.services.team}`, {
  proxyReqPathResolver: (req) => `/teams${req.url}`
}));

app.use('/api/v1/leaderboards', proxy(`${config.services.community}`, {
  proxyReqPathResolver: (req) => `/leaderboards${req.url}`
}));

// Routes that require authentication
app.use('/api/v1/users', authenticateJWT, proxy(`${config.services.user}`, {
  proxyReqPathResolver: (req) => `/users${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
    return proxyReqOpts;
  }
}));

app.use('/api/v1/portfolio', authenticateJWT, proxy(`${config.services.trading}`, {
  proxyReqPathResolver: (req) => `/portfolio${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
    return proxyReqOpts;
  }
}));

app.use('/api/v1/orders', authenticateJWT, proxy(`${config.services.trading}`, {
  proxyReqPathResolver: (req) => `/orders${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
    return proxyReqOpts;
  }
}));

app.use('/api/v1/rewards', authenticateJWT, proxy(`${config.services.rewards}`, {
  proxyReqPathResolver: (req) => `/rewards${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
    return proxyReqOpts;
  }
}));

app.use('/api/v1/community', authenticateJWT, proxy(`${config.services.community}`, {
  proxyReqPathResolver: (req) => `/community${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
    return proxyReqOpts;
  }
}));

app.use('/api/v1/funding', authenticateJWT, proxy(`${config.services.trading}`, {
  proxyReqPathResolver: (req) => `/funding${req.url}`,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
    return proxyReqOpts;
  }
}));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'The requested resource was not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app;