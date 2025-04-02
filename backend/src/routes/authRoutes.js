const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.post('/change-password', protect, changePassword);

module.exports = router;
