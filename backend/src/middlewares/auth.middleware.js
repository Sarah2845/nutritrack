const jwt = require('jsonwebtoken');
const R = require('ramda');

const JWT_SECRET = process.env.JWT_SECRET || 'nutritrack-secret-key';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }
  
  try {
    // Verify token and add user data to request
    const user = jwt.verify(token, JWT_SECRET);
    
    // Using Ramda to create an immutable copy of the user object
    req.user = R.clone(user);
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Generate a JWT token for a user
const generateToken = (user) => {
  // Create a clean user object without password
  const userWithoutPassword = R.omit(['password'], user);
  
  // Generate and return the token
  return jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  authenticateToken,
  generateToken
};
