const R = require('ramda');
const { createGoal, updateGoal } = require('../models/goal.model');
const { getByUserId, getById, insert, update, remove } = require('../utils/db');
const { calculateGoalProgress } = require('../utils/fp');
const { AppError } = require('../middlewares/error.middleware');

// Get all goals for the current user
const getUserGoals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get goals from database
    const goals = getByUserId('goals', userId);
    
    // Return goals
    res.status(200).json({
      goals,
      count: goals.length
    });
  } catch (error) {
    next(error);
  }
};

// Get active goal for the current user
const getActiveGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get goals from database
    const goals = getByUserId('goals', userId);
    
    // Find the active goal
    const activeGoal = R.pipe(
      R.filter(goal => goal.isActive),
      R.sort(R.descend(R.prop('createdAt'))),
      R.head
    )(goals);
    
    if (!activeGoal) {
      return res.status(200).json({
        message: 'No active goals found',
        goal: null
      });
    }
    
    // Return active goal
    res.status(200).json({
      goal: activeGoal
    });
  } catch (error) {
    next(error);
  }
};

// Get a single goal by ID
const getGoalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get goal from database
    const goal = getById('goals', id);
    
    // Check if goal exists and belongs to user
    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found', 404);
    }
    
    // Return goal
    res.status(200).json({ goal });
  } catch (error) {
    next(error);
  }
};

// Create a new goal
const createNewGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goalData = req.body;
    
    // Validate required fields
    if (goalData.calories === undefined || 
        goalData.proteins === undefined || 
        goalData.carbs === undefined || 
        goalData.fats === undefined) {
      throw new AppError('Calories, proteins, carbs, and fats are required', 400);
    }
    
    // If setting as active, deactivate all other goals
    if (goalData.isActive) {
      const userGoals = getByUserId('goals', userId);
      
      userGoals.forEach(goal => {
        if (goal.isActive) {
          update('goals', goal.id, { ...goal, isActive: false });
        }
      });
    }
    
    // Create new goal
    const newGoal = createGoal({ ...goalData, userId });
    
    // Save goal to database
    insert('goals', newGoal);
    
    // Return new goal
    res.status(201).json({
      message: 'Goal created successfully',
      goal: newGoal
    });
  } catch (error) {
    next(error);
  }
};

// Update a goal
const updateGoalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    // Get goal from database
    const goal = getById('goals', id);
    
    // Check if goal exists and belongs to user
    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found', 404);
    }
    
    // If setting as active, deactivate all other goals
    if (updates.isActive) {
      const userGoals = getByUserId('goals', userId);
      
      userGoals.forEach(g => {
        if (g.id !== id && g.isActive) {
          update('goals', g.id, { ...g, isActive: false });
        }
      });
    }
    
    // Update goal
    const updatedGoal = updateGoal(goal, updates);
    
    // Save updates to database
    update('goals', id, updatedGoal);
    
    // Return updated goal
    res.status(200).json({
      message: 'Goal updated successfully',
      goal: updatedGoal
    });
  } catch (error) {
    next(error);
  }
};

// Delete a goal
const deleteGoalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get goal from database
    const goal = getById('goals', id);
    
    // Check if goal exists and belongs to user
    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found', 404);
    }
    
    // Delete goal from database
    remove('goals', id);
    
    // Return success message
    res.status(200).json({
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get goal progress based on meals
const getGoalProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    
    // Get active goal
    const goals = getByUserId('goals', userId);
    const activeGoal = R.pipe(
      R.filter(goal => goal.isActive),
      R.head
    )(goals);
    
    if (!activeGoal) {
      return res.status(200).json({
        message: 'No active goal found',
        progress: null
      });
    }
    
    // Get meals for the specified date or today
    const targetDate = date || new Date().toISOString().split('T')[0];
    const meals = getByUserId('meals', userId);
    
    const dailyMeals = R.filter(meal => meal.date === targetDate, meals);
    
    // Calculate totals
    const totals = R.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        proteins: acc.proteins + meal.proteins,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats
      }),
      { calories: 0, proteins: 0, carbs: 0, fats: 0 },
      dailyMeals
    );
    
    // Calculate progress percentages
    const progress = {
      calories: Math.min(100, Math.round((totals.calories / activeGoal.calories) * 100)),
      proteins: Math.min(100, Math.round((totals.proteins / activeGoal.proteins) * 100)),
      carbs: Math.min(100, Math.round((totals.carbs / activeGoal.carbs) * 100)),
      fats: Math.min(100, Math.round((totals.fats / activeGoal.fats) * 100)),
      date: targetDate,
      totals,
      goal: activeGoal
    };
    
    // Return progress
    res.status(200).json({ progress });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserGoals,
  getActiveGoal,
  getGoalById,
  createNewGoal,
  updateGoalById,
  deleteGoalById,
  getGoalProgress
};
