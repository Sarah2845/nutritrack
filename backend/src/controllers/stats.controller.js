const R = require('ramda');
const { getByUserId } = require('../utils/db');
const { 
  pipe, 
  getStats, 
  getDailyTotals, 
  calculateGoalProgress,
  generateRecommendations,
  findMealsByNutrition
} = require('../utils/fp');

// Get user statistics
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get meals from database
    const meals = getByUserId('meals', userId);
    
    // Calculate statistics using our functional utility
    const stats = getStats(meals);
    
    // Return statistics
    res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
};

// Get meal recommendations based on remaining nutrition budget
const getMealRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    
    // Get today's date if not specified
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get user's active goal
    const goals = getByUserId('goals', userId);
    const activeGoal = R.pipe(
      R.filter(goal => goal.isActive),
      R.head
    )(goals);
    
    if (!activeGoal) {
      return res.status(200).json({
        message: 'No active goal found',
        recommendations: []
      });
    }
    
    // Get meals for today
    const meals = getByUserId('meals', userId);
    const todaysMeals = R.filter(meal => meal.date === targetDate, meals);
    
    // Calculate today's totals
    const totals = R.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        proteins: acc.proteins + meal.proteins,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats
      }),
      { calories: 0, proteins: 0, carbs: 0, fats: 0 },
      todaysMeals
    );
    
    // Calculate what's remaining
    const remaining = {
      calories: Math.max(0, activeGoal.calories - totals.calories),
      proteins: Math.max(0, activeGoal.proteins - totals.proteins),
      carbs: Math.max(0, activeGoal.carbs - totals.carbs),
      fats: Math.max(0, activeGoal.fats - totals.fats)
    };
    
    // Find all historical meals from this user
    const allUserMeals = R.pipe(
      R.filter(meal => meal.userId === userId),
      R.uniqBy(R.prop('name')) // Only include unique meal names
    )(meals);
    
    // Generate recommendations based on remaining nutrition budget
    const recommendations = R.pipe(
      // Filter meals that fit within remaining nutrients
      R.filter(meal => 
        meal.calories <= remaining.calories &&
        meal.proteins <= remaining.proteins &&
        meal.carbs <= remaining.carbs &&
        meal.fats <= remaining.fats
      ),
      // Sort by how well they utilize the remaining nutrition
      R.sortWith([
        // Prioritize meals that have higher protein utilization
        R.descend(meal => meal.proteins / remaining.proteins),
        // Then by overall calorie utilization
        R.descend(meal => meal.calories / remaining.calories)
      ]),
      // Take top recommendations
      R.take(5)
    )(allUserMeals);
    
    // Return recommendations
    res.status(200).json({
      remaining,
      recommendations
    });
  } catch (error) {
    next(error);
  }
};

// Get nutrition trends over time
const getNutritionTrends = async (req, res, next) => {
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
    
    // Calculate daily totals
    const dailyTotals = getDailyTotals(meals);
    
    // Get goals to calculate progress
    const goals = getByUserId('goals', userId);
    const activeGoal = R.pipe(
      R.filter(goal => goal.isActive),
      R.head
    )(goals);
    
    // Calculate progress if we have an active goal
    const progressData = activeGoal 
      ? calculateGoalProgress(dailyTotals, activeGoal)
      : dailyTotals;
    
    // Return trends data
    res.status(200).json({
      trends: progressData,
      goal: activeGoal || null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserStats,
  getMealRecommendations,
  getNutritionTrends
};
