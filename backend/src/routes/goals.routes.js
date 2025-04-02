const express = require('express');
const {
  getUserGoals,
  getActiveGoal,
  getGoalById,
  createNewGoal,
  updateGoalById,
  deleteGoalById,
  getGoalProgress
} = require('../controllers/goals.controller');

const router = express.Router();

// Get all goals for the current user
router.get('/', getUserGoals);

// Get active goal
router.get('/active', getActiveGoal);

// Get goal progress
router.get('/progress', getGoalProgress);

// Get a single goal by ID
router.get('/:id', getGoalById);

// Create a new goal
router.post('/', createNewGoal);

// Update a goal
router.put('/:id', updateGoalById);

// Delete a goal
router.delete('/:id', deleteGoalById);

module.exports = router;
