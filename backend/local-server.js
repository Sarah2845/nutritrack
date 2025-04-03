/**
 * Serveur local NutriTrack - Version sans MongoDB
 * Cette version du serveur fonctionne sans MongoDB en utilisant uniquement le stockage local JSON
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { initializeDatabase, getById, getByUserId, insert, update, remove } = require('./src/utils/db');

// Initialiser l'application Express
const app = express();

// Configuration de l'application
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialiser la base de données locale
initializeDatabase();
console.log('Base de données locale initialisée');

// S'assurer que la base de données contient une collection pour les objectifs avec des données de test
const ensureObjectivesInDb = () => {
  const db = require('./src/utils/db').db;
  
  // Créer la collection si elle n'existe pas
  if (!db.has('objectives').value()) {
    db.set('objectives', []).write();
    console.log('Collection objectives créée');
  }
  
  // Vérifier s'il y a des objectifs pour l'utilisateur de test (id: 1)
  const testUserObjectives = db.get('objectives').find({ userId: '1' }).value();
  
  // Si aucun objectif n'existe pour l'utilisateur de test, en créer un
  if (!testUserObjectives) {
    const defaultObjectives = {
      id: 'tg23dyz0ztl',
      userId: '1',
      calories: 2000,
      proteins: 150,
      carbs: 200,
      fats: 70,
      activityLevel: 'moderate', 
      goalType: 'maintain',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.get('objectives').push(defaultObjectives).write();
    console.log('Objectifs de test ajoutés pour l\'utilisateur test:', defaultObjectives);
  }
  
  return db.get('objectives').value();
};

// Initialiser la collection des objectifs
ensureObjectivesInDb();

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware d'authentification simplifié
const protect = (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé'
    });
  }
  
  try {
    const decoded = jwt.verify(token, 'local-dev-secret-123456789');
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// ==============================================
// ROUTES D'API
// ==============================================

// ROUTE DE TEST
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Le serveur local fonctionne correctement.' });
});

// ===== AUTHENTIFICATION =====

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Pour la démo - accepte n'importe quel login
  const user = {
    id: '1',
    name: 'Utilisateur Test',
    email: email || 'test@example.com',
    createdAt: new Date().toISOString()
  };
  
  // Générer un token
  const token = jwt.sign({ id: user.id }, 'local-dev-secret-123456789', {
    expiresIn: '30d'
  });
  
  res.status(200).json({
    success: true,
    token,
    user
  });
});

// Obtenir les infos utilisateur
app.get('/api/auth/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: '1',
      name: 'Utilisateur Test',
      email: 'test@example.com',
      createdAt: '2025-04-01T08:00:00.000Z'
    }
  });
});

// Déconnexion
app.get('/api/auth/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Déconnecté avec succès'
  });
});

// ===== REPAS =====

// NOUVELLE IMPLÉMENTATION: Gestion directe des repas dans la base de données
// Nous utilisons des fonctions simplifiées pour éviter les erreurs

// Collection locale de repas pour test (si la base de données est vide)
let testMeals = [
  {
    id: 'test1',
    userId: '1',
    name: 'Petit-déjeuner complet',
    mealType: 'breakfast',
    description: 'Œufs, pain complet, avocat',
    calories: 450,
    proteins: 20,
    carbs: 40,
    fats: 25,
    date: '2025-04-02',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test2',
    userId: '1',
    name: 'Déjeuner équilibré',
    mealType: 'lunch',
    description: 'Poulet, riz et légumes',
    calories: 650,
    proteins: 35,
    carbs: 75,
    fats: 15,
    date: '2025-04-02',
    createdAt: new Date().toISOString()
  }
];

// Fonction qui garantit l'accès direct à la base de données
const ensureMealsInDb = () => {
  // Accès direct à la base de données
  const db = require('./src/utils/db').db;
  const meals = db.get('meals').value();
  
  // Si la collection meals est vide, initialiser avec des données de test
  if (!meals || meals.length === 0) {
    console.log('Collection des repas vide, initialisation avec des données de test');
    db.set('meals', testMeals).write();
  }
  
  return db.get('meals').value();
};

// S'assurer que la base de données contient des repas
ensureMealsInDb();

// Obtenir tous les repas d'un utilisateur
app.get('/api/meals', protect, (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`GET /api/meals - RecherchE des repas pour l'utilisateur: ${userId}`);
    
    // Filtres optionnels
    const { startDate, endDate, mealType } = req.query;
    
    // Accès direct à la base de données pour récupérer tous les repas
    const db = require('./src/utils/db').db;
    const allMeals = db.get('meals').value();
    console.log(`Nombre total de repas dans la BD: ${allMeals.length}`);
    
    // Filtrer par utilisateur
    let userMeals = allMeals.filter(meal => meal.userId === userId);
    console.log(`Nombre de repas de l'utilisateur ${userId}: ${userMeals.length}`);
    
    // Appliquer les filtres additionnels
    if (startDate) {
      userMeals = userMeals.filter(meal => meal.date >= startDate);
    }
    
    if (endDate) {
      userMeals = userMeals.filter(meal => meal.date <= endDate);
    }
    
    if (mealType) {
      userMeals = userMeals.filter(meal => meal.mealType === mealType);
    }
    
    // Renvoyer les repas
    console.log(`Retourne ${userMeals.length} repas après filtrage`);
    res.status(200).json({
      meals: userMeals,
      count: userMeals.length
    });
  } catch (error) {
    console.error('Erreur dans GET /api/meals:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des repas',
      error: error.message
    });
  }
});

// Obtenir un repas par ID
app.get('/api/meals/:id', protect, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const meal = db.get('meals').find({ id }).value();
    
    // Vérifier si le repas existe et appartient à l'utilisateur
    if (!meal || meal.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Repas non trouvé'
      });
    }
    
    // Renvoyer le repas
    res.status(200).json({ meal });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du repas',
      error: error.message
    });
  }
});

// Créer un nouveau repas
app.post('/api/meals', protect, (req, res) => {
  try {
    const userId = req.user.id;
    const mealData = req.body;
    
    console.log('=== CRÉATION D\'UN NOUVEAU REPAS ===');
    console.log('Données reçues:', mealData);
    console.log('UserId:', userId);
    
    // Valider les données
    if (!mealData.name || mealData.calories === undefined) {
      console.log('ERREUR: Validation échouée - nom ou calories manquants');
      return res.status(400).json({
        success: false,
        message: 'Le nom et les calories sont requis'
      });
    }
    
    // Créer un ID unique
    const id = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    
    // Créer le repas avec toutes les propriétés nécessaires
    const newMeal = {
      id,
      userId, // S'assurer que l'ID utilisateur est inclus
      name: mealData.name,
      date: mealData.date || new Date().toISOString().split('T')[0],
      mealType: mealData.mealType || 'other',
      description: mealData.description || '',
      calories: Number(mealData.calories || 0),
      proteins: Number(mealData.proteins || 0),
      carbs: Number(mealData.carbs || 0),
      fats: Number(mealData.fats || 0),
      createdAt: new Date().toISOString()
    };
    
    console.log('Nouveau repas à sauvegarder:', newMeal);
    
    // Accès direct à la base de données pour ajouter le repas
    const db = require('./src/utils/db').db;
    db.get('meals').push(newMeal).write();
    
    // Vérifier que le repas a bien été ajouté
    const mealInDb = db.get('meals').find({ id }).value();
    if (!mealInDb) {
      throw new Error('Le repas n\'a pas été correctement enregistré');
    }
    
    console.log('Repas enregistré avec succès!', mealInDb);
    
    // Renvoyer le repas créé
    res.status(201).json({
      success: true,
      message: 'Repas créé avec succès',
      meal: newMeal
    });
  } catch (error) {
    console.error('ERREUR lors de la création d\'un repas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du repas',
      error: error.message
    });
  }
});

// Mettre à jour un repas
app.put('/api/meals/:id', protect, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const meal = db.get('meals').find({ id }).value();
    
    // Vérifier si le repas existe et appartient à l'utilisateur
    if (!meal || meal.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Repas non trouvé'
      });
    }
    
    // Mettre à jour le repas
    const updatedMeal = {
      ...meal,
      ...updates,
      calories: Number(updates.calories || meal.calories),
      proteins: Number(updates.proteins || meal.proteins),
      carbs: Number(updates.carbs || meal.carbs),
      fats: Number(updates.fats || meal.fats),
      updatedAt: new Date().toISOString()
    };
    
    // Sauvegarder les modifications directement
    db.get('meals').find({ id }).assign(updatedMeal).write();
    
    // Renvoyer le repas mis à jour
    res.status(200).json({
      success: true,
      message: 'Repas mis à jour avec succès',
      meal: updatedMeal
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du repas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du repas',
      error: error.message
    });
  }
});

// Supprimer un repas
app.delete('/api/meals/:id', protect, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const meal = db.get('meals').find({ id }).value();
    
    // Vérifier si le repas existe et appartient à l'utilisateur
    if (!meal || meal.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Repas non trouvé'
      });
    }
    
    // Supprimer le repas directement
    db.get('meals').remove({ id }).write();
    
    // Renvoyer un message de succès
    res.status(200).json({
      success: true,
      message: 'Repas supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du repas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du repas',
      error: error.message
    });
  }
});

// ===== PLANIFICATION DES MENUS =====

// Collection locale de plans de repas pour test (si la base de données est vide)
let testMealPlans = [
  {
    id: 'plan1',
    userId: '1',
    mealId: 'test1',
    date: '2025-04-03',
    mealTime: 'breakfast',
    servings: 1,
    notes: 'Ajouter du miel',
    createdAt: new Date().toISOString()
  },
  {
    id: 'plan2',
    userId: '1',
    mealId: 'test2',
    date: '2025-04-03',
    mealTime: 'lunch',
    servings: 1.5,
    notes: '',
    createdAt: new Date().toISOString()
  }
];

// Fonction qui garantit l'accès direct à la base de données pour les plans de repas
const ensureMealPlansInDb = () => {
  // Accès direct à la base de données
  const db = require('./src/utils/db').db;
  
  // Vérifier si la collection existe, sinon la créer
  if (!db.has('mealPlans').value()) {
    db.set('mealPlans', []).write();
  }
  
  const mealPlans = db.get('mealPlans').value();
  
  // Si la collection mealPlans est vide, initialiser avec des données de test
  if (!mealPlans || mealPlans.length === 0) {
    console.log('Collection des plans de repas vide, initialisation avec des données de test');
    db.set('mealPlans', testMealPlans).write();
  }
  
  return db.get('mealPlans').value();
};

// S'assurer que la base de données contient des plans de repas
ensureMealPlansInDb();

// Obtenir tous les plans de repas d'un utilisateur pour une période donnée
app.get('/api/meal-plans', protect, (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`GET /api/meal-plans - Recherche des plans pour l'utilisateur: ${userId}`);
    
    // Filtres obligatoires
    const { startDate, endDate } = req.query;
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const allMealPlans = db.get('mealPlans').value();
    console.log(`Nombre total de plans dans la BD: ${allMealPlans.length}`);
    
    // Filtrer par utilisateur
    let userMealPlans = allMealPlans.filter(plan => plan.userId === userId);
    console.log(`Nombre de plans de l'utilisateur ${userId}: ${userMealPlans.length}`);
    
    // Appliquer les filtres de date
    if (startDate) {
      userMealPlans = userMealPlans.filter(plan => plan.date >= startDate);
    }
    
    if (endDate) {
      userMealPlans = userMealPlans.filter(plan => plan.date <= endDate);
    }
    
    // Renvoyer les plans filtrés
    console.log(`Retourne ${userMealPlans.length} plans après filtrage`);
    res.status(200).json({
      mealPlans: userMealPlans,
      count: userMealPlans.length
    });
  } catch (error) {
    console.error('Erreur dans GET /api/meal-plans:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans de repas',
      error: error.message
    });
  }
});

// Obtenir un plan de repas par ID
app.get('/api/meal-plans/:id', protect, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const mealPlan = db.get('mealPlans').find({ id }).value();
    
    // Vérifier si le plan existe et appartient à l'utilisateur
    if (!mealPlan || mealPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Plan de repas non trouvé'
      });
    }
    
    // Renvoyer le plan
    res.status(200).json({ mealPlan });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du plan de repas',
      error: error.message
    });
  }
});

// Créer un nouveau plan de repas
app.post('/api/meal-plans', protect, (req, res) => {
  try {
    const userId = req.user.id;
    const planData = req.body;
    
    console.log('=== CRÉATION D\'UN NOUVEAU PLAN DE REPAS ===');
    console.log('Données reçues:', planData);
    console.log('UserId:', userId);
    
    // Valider les données
    if (!planData.mealId || !planData.date || !planData.mealTime) {
      console.log('ERREUR: Validation échouée - données requises manquantes');
      return res.status(400).json({
        success: false,
        message: 'L\'identifiant du repas, la date et le moment du repas sont requis'
      });
    }
    
    // Créer un ID unique
    const id = Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    
    // Créer le plan de repas avec toutes les propriétés nécessaires
    const newMealPlan = {
      id,
      userId,
      mealId: planData.mealId,
      date: planData.date,
      mealTime: planData.mealTime,
      servings: Number(planData.servings || 1),
      notes: planData.notes || '',
      dayIndex: planData.dayIndex !== undefined ? Number(planData.dayIndex) : null,
      createdAt: new Date().toISOString()
    };
    
    console.log('Nouveau plan à sauvegarder:', newMealPlan);
    
    // Accès direct à la base de données pour ajouter le plan
    const db = require('./src/utils/db').db;
    db.get('mealPlans').push(newMealPlan).write();
    
    // Vérifier que le plan a bien été ajouté
    const planInDb = db.get('mealPlans').find({ id }).value();
    if (!planInDb) {
      throw new Error('Le plan n\'a pas été correctement enregistré');
    }
    
    console.log('Plan enregistré avec succès!', planInDb);
    
    // Renvoyer le plan créé
    res.status(201).json({
      success: true,
      message: 'Plan de repas créé avec succès',
      mealPlan: newMealPlan
    });
  } catch (error) {
    console.error('ERREUR lors de la création d\'un plan de repas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du plan de repas',
      error: error.message
    });
  }
});

// Mettre à jour un plan de repas
app.put('/api/meal-plans/:id', protect, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const mealPlan = db.get('mealPlans').find({ id }).value();
    
    // Vérifier si le plan existe et appartient à l'utilisateur
    if (!mealPlan || mealPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Plan de repas non trouvé'
      });
    }
    
    // Mettre à jour le plan
    const updatedMealPlan = {
      ...mealPlan,
      ...updates,
      servings: Number(updates.servings || mealPlan.servings),
      dayIndex: updates.dayIndex !== undefined ? Number(updates.dayIndex) : mealPlan.dayIndex,
      updatedAt: new Date().toISOString()
    };
    
    // Sauvegarder les modifications directement
    db.get('mealPlans').find({ id }).assign(updatedMealPlan).write();
    
    // Renvoyer le plan mis à jour
    res.status(200).json({
      success: true,
      message: 'Plan de repas mis à jour avec succès',
      mealPlan: updatedMealPlan
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du plan de repas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du plan de repas',
      error: error.message
    });
  }
});

// Supprimer un plan de repas
app.delete('/api/meal-plans/:id', protect, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const mealPlan = db.get('mealPlans').find({ id }).value();
    
    // Vérifier si le plan existe et appartient à l'utilisateur
    if (!mealPlan || mealPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Plan de repas non trouvé'
      });
    }
    
    // Supprimer le plan directement
    db.get('mealPlans').remove({ id }).write();
    
    // Renvoyer un message de succès
    res.status(200).json({
      success: true,
      message: 'Plan de repas supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du plan de repas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du plan de repas',
      error: error.message
    });
  }
});

// =======================================
// ROUTES POUR LES OBJECTIFS NUTRITIONNELS
// =======================================

// Obtenir les objectifs nutritionnels de l'utilisateur
app.get('/api/objectives', protect, (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`GET /api/objectives - Recherche des objectifs pour l'utilisateur: ${userId}`);
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const userObjectives = db.get('objectives').find({ userId }).value();
    
    // Si aucun objectif n'est trouvé, renvoyer une erreur 404
    if (!userObjectives) {
      return res.status(404).json({
        success: false,
        message: 'Aucun objectif nutritionnel trouvé pour cet utilisateur'
      });
    }
    
    // Renvoyer les objectifs
    res.status(200).json({
      success: true,
      objectives: userObjectives
    });
  } catch (error) {
    console.error('Erreur dans GET /api/objectives:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des objectifs nutritionnels',
      error: error.message
    });
  }
});

// Créer ou mettre à jour les objectifs nutritionnels
app.post('/api/objectives', protect, (req, res) => {
  try {
    const userId = req.user.id;
    const objectivesData = req.body;
    
    console.log('=== CRÉATION/MISE À JOUR DES OBJECTIFS NUTRITIONNELS ===');
    console.log('Données reçues:', objectivesData);
    console.log('UserId:', userId);
    
    // Valider les données
    if (!objectivesData.calories || !objectivesData.proteins || !objectivesData.carbs || !objectivesData.fats) {
      console.log('ERREUR: Validation échouée - données requises manquantes');
      return res.status(400).json({
        success: false,
        message: 'Les calories, protéines, glucides et lipides sont requis'
      });
    }
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    
    // Vérifier si l'utilisateur a déjà des objectifs
    const existingObjectives = db.get('objectives').find({ userId }).value();
    
    if (existingObjectives) {
      // Mettre à jour les objectifs existants
      const updatedObjectives = {
        ...existingObjectives,
        calories: objectivesData.calories,
        proteins: objectivesData.proteins,
        carbs: objectivesData.carbs,
        fats: objectivesData.fats,
        activityLevel: objectivesData.activityLevel || existingObjectives.activityLevel,
        goalType: objectivesData.goalType || existingObjectives.goalType,
        updatedAt: new Date().toISOString()
      };
      
      db.get('objectives').find({ userId }).assign(updatedObjectives).write();
      
      console.log('Objectifs mis à jour:', updatedObjectives);
      
      return res.status(200).json({
        success: true,
        message: 'Objectifs nutritionnels mis à jour avec succès',
        objectives: updatedObjectives
      });
    } else {
      // Créer de nouveaux objectifs
      const newObjectives = {
        id: Math.random().toString(36).substring(2, 15),
        userId,
        calories: objectivesData.calories,
        proteins: objectivesData.proteins,
        carbs: objectivesData.carbs,
        fats: objectivesData.fats,
        activityLevel: objectivesData.activityLevel || 'moderate',
        goalType: objectivesData.goalType || 'maintain',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.get('objectives').push(newObjectives).write();
      
      console.log('Nouveaux objectifs créés:', newObjectives);
      
      return res.status(201).json({
        success: true,
        message: 'Objectifs nutritionnels créés avec succès',
        objectives: newObjectives
      });
    }
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour des objectifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création/mise à jour des objectifs nutritionnels',
      error: error.message
    });
  }
});

// Route pour les données de progression nutritionnelle
app.get('/api/nutrition-progress', protect, (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    
    console.log(`GET /api/nutrition-progress - Données de progression pour l'utilisateur: ${userId}`);
    console.log('Période demandée:', startDate, 'à', endDate);
    
    // Accès direct à la base de données pour les repas planifiés
    const db = require('./src/utils/db').db;
    let mealPlans = db.get('meal-plans').filter({ userId }).value();
    
    // Filtrer par date si spécifié
    if (startDate && endDate) {
      mealPlans = mealPlans.filter(plan => {
        const planDate = new Date(plan.date).toISOString().split('T')[0];
        return planDate >= startDate && planDate <= endDate;
      });
    }
    
    // Obtenir les objectifs de l'utilisateur
    let objectives = db.get('objectives').find({ userId }).value();
    
    // Générer des objectifs par défaut si aucun n'existe
    if (!objectives) {
      console.log(`Aucun objectif trouvé pour l'utilisateur ${userId}, utilisation d'objectifs par défaut`);
      objectives = {
        id: `obj_${Date.now()}`,
        userId: userId,
        calories: 2000,
        proteins: 120,
        carbs: 250,
        fats: 70,
        targetWeight: 75,
        createdAt: new Date().toISOString()
      };
      
      // Sauvegarder les objectifs par défaut
      db.get('objectives').push(objectives).write();
      console.log('Objectifs par défaut créés:', objectives);
    }
    
    // Vérifier si des données sont disponibles
    if (mealPlans.length === 0) {
      console.log(`Aucun plan de repas trouvé pour l'utilisateur ${userId}, génération de données de démonstration`);
      
      // Générer des données de démonstration
      const dataByDay = generateDemoProgressData(startDate, endDate, objectives);
      
      return res.status(200).json({
        success: true,
        progressData: dataByDay,
        objectives: objectives,
        startDate: startDate,
        endDate: endDate,
        demoData: true
      });
    }
    
    // Obtenir les repas correspondants
    let processedData = mealPlans.map(plan => {
      const meal = db.get('meals').find({ id: plan.mealId }).value() || { 
        id: plan.mealId,
        name: 'Repas inconnu',
        calories: Math.round(Math.random() * 300 + 200),
        proteins: Math.round(Math.random() * 20 + 10),
        carbs: Math.round(Math.random() * 30 + 20),
        fats: Math.round(Math.random() * 10 + 5)
      };
      
      return { ...plan, meal };
    });
    
    // Regrouper par date
    const dataByDay = {};
    processedData.forEach(plan => {
      const date = new Date(plan.date).toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      if (!dataByDay[date]) {
        dataByDay[date] = {
          calories: 0,
          proteins: 0,
          carbs: 0,
          fats: 0,
          mealTypes: {}
        };
      }
      
      // Ajouter les valeurs nutritionnelles
      dataByDay[date].calories += plan.meal.calories * plan.servings;
      dataByDay[date].proteins += plan.meal.proteins * plan.servings;
      dataByDay[date].carbs += plan.meal.carbs * plan.servings;
      dataByDay[date].fats += plan.meal.fats * plan.servings;
      
      // Regrouper par type de repas
      const mealType = plan.mealType || 'autre';
      if (!dataByDay[date].mealTypes[mealType]) {
        dataByDay[date].mealTypes[mealType] = 0;
      }
      dataByDay[date].mealTypes[mealType] += plan.meal.calories * plan.servings;
    });
    
    // Vérifier si le résultat est vide après traitement
    if (Object.keys(dataByDay).length === 0) {
      console.log('Aucune donnée de progression disponible après traitement, génération de données de démonstration');
      const demoData = generateDemoProgressData(startDate, endDate, objectives);
      
      return res.status(200).json({
        success: true,
        progressData: demoData,
        objectives: objectives,
        startDate: startDate,
        endDate: endDate,
        demoData: true
      });
    }
    
    return res.status(200).json({
      success: true,
      progressData: dataByDay,
      objectives: objectives,
      startDate: startDate,
      endDate: endDate
    });
  } catch (error) {
    console.error('Erreur dans GET /api/nutrition-progress:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de progression',
      error: error.message
    });
  }
});

/**
 * Générer des données de démonstration pour la progression nutritionnelle
 */
function generateDemoProgressData(startDate, endDate, objectives) {
  const dataByDay = {};
  
  // Définir la période
  let start = startDate ? new Date(startDate) : new Date();
  let end = endDate ? new Date(endDate) : new Date();
  
  // Si la période n'est pas spécifiée, générer les 30 derniers jours
  if (!startDate || !endDate) {
    end = new Date();
    start = new Date();
    start.setDate(end.getDate() - 30);
  }
  
  // S'assurer que start est avant end
  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }
  
  // Définir les valeurs nutritionnelles cibles
  const baseCalories = objectives ? objectives.calories : 2000;
  const baseProteins = objectives ? objectives.proteins : 120;
  const baseCarbs = objectives ? objectives.carbs : 250;
  const baseFats = objectives ? objectives.fats : 70;
  
  // Générer des données pour chaque jour de la période
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const date = day.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Déterminer s'il s'agit d'un week-end
    const dayOfWeek = day.getDay(); // 0 = dimanche, 6 = samedi
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Les week-ends ont généralement plus de calories
    const weekendFactor = isWeekend ? 1.1 : 1.0;
    
    // Variation de base +/- 15% en semaine, +/- 20% le week-end
    const variation = isWeekend ? 0.2 : 0.15;
    
    const caloriesVariation = (Math.random() * variation * 2 - variation) * weekendFactor;
    const proteinsVariation = Math.random() * variation * 2 - variation;
    const carbsVariation = (Math.random() * variation * 2 - variation) * (isWeekend ? 1.15 : 1.0); // Plus de glucides le week-end
    const fatsVariation = (Math.random() * variation * 2 - variation) * (isWeekend ? 1.2 : 1.0); // Plus de lipides le week-end
    
    const calories = Math.round(baseCalories * (1 + caloriesVariation));
    const proteins = Math.round(baseProteins * (1 + proteinsVariation));
    const carbs = Math.round(baseCarbs * (1 + carbsVariation));
    const fats = Math.round(baseFats * (1 + fatsVariation));
    
    // Générer des types de repas différents selon le jour
    let mealTypes = {};
    
    if (isWeekend) {
      // Week-end: petit-déjeuner plus important, déjeuner plus tardif et copieux
      mealTypes = {
        'petit-déjeuner': Math.round(calories * 0.3 * (1 + Math.random() * 0.15 - 0.05)),
        'déjeuner': Math.round(calories * 0.4 * (1 + Math.random() * 0.15 - 0.05)),
        'dîner': Math.round(calories * 0.25 * (1 + Math.random() * 0.15 - 0.05)),
        'collation': Math.round(calories * 0.05 * (1 + Math.random() * 0.15 - 0.05))
      };
    } else {
      // Jour de semaine: petit-déjeuner rapide, déjeuner standard, plus de collations
      mealTypes = {
        'petit-déjeuner': Math.round(calories * 0.2 * (1 + Math.random() * 0.1 - 0.05)),
        'déjeuner': Math.round(calories * 0.35 * (1 + Math.random() * 0.1 - 0.05)),
        'dîner': Math.round(calories * 0.3 * (1 + Math.random() * 0.1 - 0.05)),
        'collation': Math.round(calories * 0.15 * (1 + Math.random() * 0.1 - 0.05))
      };
    }
    
    // Ajuster légèrement pour que la somme des types de repas soit proche des calories totales
    const mealTypeTotal = Object.values(mealTypes).reduce((sum, val) => sum + val, 0);
    const adjustmentFactor = calories / mealTypeTotal;
    
    for (const type in mealTypes) {
      mealTypes[type] = Math.round(mealTypes[type] * adjustmentFactor);
    }
    
    // Stocker les données pour ce jour
    dataByDay[date] = {
      calories,
      proteins,
      carbs,
      fats,
      mealTypes
    };
  }
  
  return dataByDay;
}

// Supprimer les objectifs nutritionnels
app.delete('/api/objectives', protect, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Accès direct à la base de données
    const db = require('./src/utils/db').db;
    const userObjectives = db.get('objectives').find({ userId }).value();
    
    // Vérifier si l'utilisateur a des objectifs
    if (!userObjectives) {
      return res.status(404).json({
        success: false,
        message: 'Aucun objectif nutritionnel trouvé pour cet utilisateur'
      });
    }
    
    // Supprimer les objectifs
    db.get('objectives').remove({ userId }).write();
    
    // Renvoyer un message de succès
    res.status(200).json({
      success: true,
      message: 'Objectifs nutritionnels supprimés avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des objectifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des objectifs nutritionnels',
      error: error.message
    });
  }
});

// ==============================================
// ROUTES API ADDITIONNELLES
// ==============================================

// Routes pour les recommandations alimentaires
const foodRecommendationsRoutes = require('./src/routes/foodRecommendations');
app.use('/api/foods', foodRecommendationsRoutes);

// ==============================================
// ROUTES FRONTEND
// ==============================================

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes HTML principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/app-minimal.html'));
});

app.get('/app-minimal.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/app-minimal.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/profile.html'));
});

app.get('/meals.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/meals.html'));
});

app.get('/meal-planner.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/meal-planner.html'));
});

app.get('/objectives.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/objectives.html'));
});

app.get('/recommendations.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/recommendations.html'));
});

// Pour toutes les autres routes, rediriger vers la page d'accueil
app.get('*', (req, res) => {
  res.redirect('/');
});

// ==============================================
// DÉMARRAGE DU SERVEUR
// ==============================================

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`\n========== NutriTrack - Mode Local ==========`);
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Application accessible à: http://localhost:${PORT}`);
  console.log(`📊 API disponible à: http://localhost:${PORT}/api`);
  console.log(`📝 Données stockées localement (sans MongoDB)`);
  console.log(`==============================================\n`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', () => {
  console.log('Arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

module.exports = app;
