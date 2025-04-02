const express = require('express');
const { 
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  updatePreferences
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Toutes ces routes nécessitent une authentification
router.use(protect);

router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

router.put('/avatar', updateAvatar);
router.put('/preferences', updatePreferences);

module.exports = router;
