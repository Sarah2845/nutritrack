const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const R = require('ramda');
const { freeze } = require('../utils/fp');

// User factory function - creates immutable user objects
const createUser = ({ username, email, password }) => {
  return freeze({
    id: uuidv4(),
    username,
    email,
    password: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  });
};

// Validates user credentials and returns a cleaned user object without password
const validateUserCredentials = (user, password) => {
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return null;
  }
  
  // Return user without password
  return R.omit(['password'], user);
};

module.exports = {
  createUser,
  validateUserCredentials
};
