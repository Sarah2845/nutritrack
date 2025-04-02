const R = require('ramda');

// Compose - executes from right to left
const compose = R.compose;

// Pipe - executes from left to right
const pipe = R.pipe;

// Create immutable object
const freeze = (obj) => Object.freeze(R.clone(obj));

// Sum a specific property across an array of objects
const sumProp = (prop) => R.pipe(
  R.pluck(prop),
  R.sum
);

// Group by date and calculate daily totals
const getDailyTotals = (meals) => R.pipe(
  R.groupBy(R.prop('date')),
  R.mapObjIndexed((mealsOnDate, date) => ({
    date,
    calories: sumProp('calories')(mealsOnDate),
    proteins: sumProp('proteins')(mealsOnDate),
    carbs: sumProp('carbs')(mealsOnDate),
    fats: sumProp('fats')(mealsOnDate),
    meals: mealsOnDate
  })),
  R.values
)(meals);

// Calculate how close user is to daily nutritional goals (as percentage)
const calculateGoalProgress = (dailyTotals, goals) => {
  if (!goals) return null;
  
  return R.pipe(
    R.map((day) => ({
      ...day,
      progress: {
        calories: Math.min(100, Math.round((day.calories / goals.calories) * 100)),
        proteins: Math.min(100, Math.round((day.proteins / goals.proteins) * 100)),
        carbs: Math.min(100, Math.round((day.carbs / goals.carbs) * 100)),
        fats: Math.min(100, Math.round((day.fats / goals.fats) * 100))
      }
    }))
  )(dailyTotals);
};

// Find meals that match specific nutritional criteria
const findMealsByNutrition = (meals, criteria) => {
  const predicates = R.pipe(
    R.toPairs,
    R.map(([key, value]) => (meal) => meal[key] <= value),
    R.reduce(R.and, R.T)
  )(criteria);
  
  return R.filter(predicates, meals);
};

// Generate meal recommendations based on remaining nutritional needs
const generateRecommendations = (meals, currentTotals, goals) => {
  // Calculate what's remaining to reach goals
  const remaining = {
    calories: goals.calories - currentTotals.calories,
    proteins: goals.proteins - currentTotals.proteins,
    carbs: goals.carbs - currentTotals.carbs,
    fats: goals.fats - currentTotals.fats
  };
  
  // Find meals that would fit within remaining nutritional budget
  return R.pipe(
    R.filter((meal) => 
      meal.calories <= remaining.calories &&
      meal.proteins <= remaining.proteins &&
      meal.carbs <= remaining.carbs &&
      meal.fats <= remaining.fats
    ),
    R.sortBy(R.prop('calories')),
    R.reverse,
    R.take(5)
  )(meals);
};

// Get stats from meals array
const getStats = (meals) => ({
  totalMeals: meals.length,
  averageCalories: Math.round(R.mean(R.pluck('calories', meals))),
  topProteinMeals: R.pipe(
    R.sortBy(R.prop('proteins')),
    R.reverse,
    R.take(3)
  )(meals),
  mostBalancedMeals: R.pipe(
    // Calculate macronutrient balance (ideal distribution would be 1/3 each)
    R.map(meal => {
      const totalMacros = meal.proteins + meal.carbs + meal.fats;
      const proteinRatio = meal.proteins / totalMacros;
      const carbsRatio = meal.carbs / totalMacros;
      const fatsRatio = meal.fats / totalMacros;
      
      // Lower score means better balance (closer to 1/3 each)
      const balanceScore = Math.abs(proteinRatio - 0.33) + 
                           Math.abs(carbsRatio - 0.33) +
                           Math.abs(fatsRatio - 0.33);
      
      return { ...meal, balanceScore };
    }),
    R.sortBy(R.prop('balanceScore')),
    R.take(3)
  )(meals)
});

module.exports = {
  compose,
  pipe,
  freeze,
  sumProp,
  getDailyTotals,
  calculateGoalProgress,
  findMealsByNutrition,
  generateRecommendations,
  getStats
};
