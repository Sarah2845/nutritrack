const R = require('ramda');
const { createUser, validateUserCredentials } = require('../models/user.model');
const { generateToken } = require('../middlewares/auth.middleware');
const { getById, insert, getAll } = require('../utils/db');
const { AppError } = require('../middlewares/error.middleware');

// Register a new user
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      throw new AppError('Username, email and password are required', 400);
    }
    
    // Check if user with email already exists
    const users = getAll('users');
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }
    
    // Create new user
    const newUser = createUser({ username, email, password });
    
    // Save user to database
    insert('users', newUser);
    
    // Generate token
    const token = generateToken(R.omit(['password'], newUser));
    
    // Return user info and token
    res.status(201).json({
      message: 'User registered successfully',
      user: R.omit(['password'], newUser),
      token
    });
  } catch (error) {
    next(error);
  }
};

// Login a user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }
    
    // Find user by email
    const users = getAll('users');
    const user = users.find(user => user.email === email);
    
    // Validate credentials
    const validatedUser = validateUserCredentials(user, password);
    
    if (!validatedUser) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Generate token
    const token = generateToken(validatedUser);
    
    // Return user info and token
    res.status(200).json({
      message: 'Login successful',
      user: validatedUser,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user from database
    const user = getById('users', userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Return user info without password
    res.status(200).json({
      user: R.omit(['password'], user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile
};
