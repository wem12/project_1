// api-gateway/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, config.jwtSecret, (err, user) => {
      if (err) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication token is required'
    });
  }
};

module.exports = authenticateJWT;