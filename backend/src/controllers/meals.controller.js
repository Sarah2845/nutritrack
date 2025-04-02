const R = require('ramda');
const { createMeal, updateMeal } = require('../models/meal.model');
const { getByUserId, getById, insert, update, remove } = require('../utils/db');
const { pipe, getDailyTotals } = require('../utils/fp');
const { AppError } = require('../middlewares/error.middleware');

// Get all meals for the current user
const getUserMeals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Optional filter by date
    const { startDate, endDate, mealType } = req.query;
    
    // Get meals from database
    let meals = getByUserId('meals', userId);
    
    // Apply filters using functional programming
    if (startDate || endDate || mealType) {
      meals = R.pipe(
        // Filter by date range if provided
        startDate ? R.filter(meal => meal.date >= startDate) : R.identity,
        endDate ? R.filter(meal => meal.date <= endDate) : R.identity,
        // Filter by meal type if provided
        mealType ? R.filter(meal => meal.mealType === mealType) : R.identity
      )(meals);
    }
    
    // Return meals
    res.status(200).json({
      meals,
      count: meals.length
    });
  } catch (error) {
    next(error);
  }
};

// Get a single meal by ID
const getMealById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get meal from database
    const meal = getById('meals', id);
    
    // Check if meal exists and belongs to user
    if (!meal || meal.userId !== userId) {
      throw new AppError('Meal not found', 404);
    }
    
    // Return meal
    res.status(200).json({ meal });
  } catch (error) {
    next(error);
  }
};

// Create a new meal
const createNewMeal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const mealData = req.body;
    
    // Validate input
    if (!mealData.name || mealData.calories === undefined) {
      throw new AppError('Meal name and calories are required', 400);
    }
    
    // Create new meal
    const newMeal = createMeal({ ...mealData, userId });
    
    // Save meal to database
    insert('meals', newMeal);
    
    // Return new meal
    res.status(201).json({
      message: 'Meal created successfully',
      meal: newMeal
    });
  } catch (error) {
    next(error);
  }
};

// Update a meal
const updateMealById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    // Get meal from database
    const meal = getById('meals', id);
    
    // Check if meal exists and belongs to user
    if (!meal || meal.userId !== userId) {
      throw new AppError('Meal not found', 404);
    }
    
    // Update meal
    const updatedMeal = updateMeal(meal, updates);
    
    // Save updates to database
    update('meals', id, updatedMeal);
    
    // Return updated meal
    res.status(200).json({
      message: 'Meal updated successfully',
      meal: updatedMeal
    });
  } catch (error) {
    next(error);
  }
};

// Delete a meal
const deleteMealById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get meal from database
    const meal = getById('meals', id);
    
    // Check if meal exists and belongs to user
    if (!meal || meal.userId !== userId) {
      throw new AppError('Meal not found', 404);
    }
    
    // Delete meal from database
    remove('meals', id);
    
    // Return success message
    res.status(200).json({
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get daily nutrition totals
const getDailyNutritionTotals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    // Get meals from database
    let meals = getByUserId('meals', userId);
    
    // Apply date filters if provided
    if (startDate || endDate) {
      meals = R.pipe(
        startDate ? R.filter(meal => meal.date >= startDate) : R.identity,
        endDate ? R.filter(meal => meal.date <= endDate) : R.identity
      )(meals);
    }
    
    // Calculate daily totals using our functional utility
    const dailyTotals = getDailyTotals(meals);
    
    // Return daily totals
    res.status(200).json({
      dailyTotals
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserMeals,
  getMealById,
  createNewMeal,
  updateMealById,
  deleteMealById,
  getDailyNutritionTotals
};
