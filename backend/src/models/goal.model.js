const { v4: uuidv4 } = require('uuid');
const R = require('ramda');
const { freeze } = require('../utils/fp');

// Goal factory function - creates immutable nutritional goal objects
const createGoal = ({ 
  userId, 
  calories, 
  proteins, 
  carbs, 
  fats,
  startDate,
  endDate,
  name
}) => {
  return freeze({
    id: uuidv4(),
    userId,
    name: name || 'Default Goal',
    calories: Number(calories),
    proteins: Number(proteins),
    carbs: Number(carbs),
    fats: Number(fats),
    startDate: startDate || new Date().toISOString().split('T')[0], // Default to today
    endDate: endDate, // Can be null for ongoing goals
    isActive: true,
    createdAt: new Date().toISOString()
  });
};

// Update a goal with new data while maintaining immutability
const updateGoal = (goal, updates) => {
  return freeze({
    ...goal,
    ...R.pick([
      'name',
      'calories',
      'proteins',
      'carbs',
      'fats',
      'startDate',
      'endDate',
      'isActive'
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
  createGoal,
  updateGoal
};
