const express = require('express');
const {
  getUserStats,
  getMealRecommendations,
  getNutritionTrends
} = require('../controllers/stats.controller');

const router = express.Router();

// Get user statistics
router.get('/', getUserStats);

// Get meal recommendations
router.get('/recommendations', getMealRecommendations);

// Get nutrition trends
router.get('/trends', getNutritionTrends);

module.exports = router;
