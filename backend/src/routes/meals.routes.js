const express = require('express');
const {
  getUserMeals,
  getMealById,
  createNewMeal,
  updateMealById,
  deleteMealById,
  getDailyNutritionTotals
} = require('../controllers/meals.controller');

const router = express.Router();

// Get all meals for the current user with optional filters
router.get('/', getUserMeals);

// Get daily nutrition totals
router.get('/daily', getDailyNutritionTotals);

// Get a single meal by ID
router.get('/:id', getMealById);

// Create a new meal
router.post('/', createNewMeal);

// Update a meal
router.put('/:id', updateMealById);

// Delete a meal
router.delete('/:id', deleteMealById);

module.exports = router;
