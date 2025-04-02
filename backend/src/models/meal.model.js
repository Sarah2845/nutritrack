const { v4: uuidv4 } = require('uuid');
const R = require('ramda');
const { freeze } = require('../utils/fp');

// Meal factory function - creates immutable meal objects
const createMeal = ({ 
  userId, 
  name, 
  description, 
  calories, 
  proteins, 
  carbs, 
  fats, 
  date, 
  mealType 
}) => {
  return freeze({
    id: uuidv4(),
    userId,
    name,
    description: description || '',
    calories: Number(calories),
    proteins: Number(proteins),
    carbs: Number(carbs),
    fats: Number(fats),
    date: date || new Date().toISOString().split('T')[0], // Default to today's date in YYYY-MM-DD
    mealType: mealType || 'other', // breakfast, lunch, dinner, snack, other
    createdAt: new Date().toISOString()
  });
};

// Update a meal with new data while maintaining immutability
const updateMeal = (meal, updates) => {
  return freeze({
    ...meal,
    ...R.pick([
      'name',
      'description',
      'calories',
      'proteins',
      'carbs',
      'fats',
      'date',
      'mealType'
    ], updates),
    // Convert numeric values
    ...(updates.calories !== undefined && { calories: Number(updates.calories) }),
    ...(updates.proteins !== undefined && { proteins: Number(updates.proteins) }),
    ...(updates.carbs !== undefined && { carbs: Number(updates.carbs) }),
    ...(updates.fats !== undefined && { fats: Number(updates.fats) }),
    updatedAt: new Date().toISOString()
  });
};

module.exports = {
  createMeal,
  updateMeal
};
