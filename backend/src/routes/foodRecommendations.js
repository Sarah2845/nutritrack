/**
 * Module de recommandations alimentaires personnalisées
 * Ce module fournit des API pour obtenir des recommandations d'aliments basées sur les objectifs nutritionnels
 */

const express = require('express');
const router = express.Router();

// Importer le middleware de protection
const jwt = require('jsonwebtoken');

// Middleware de protection pour les routes
const protect = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Authentification requise'
      });
    }
    
    const decoded = jwt.verify(token, 'local-dev-secret-123456789');
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

/**
 * @route GET /api/foods
 * @desc Récupère la liste des aliments recommandés
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  console.log('GET /api/foods - Récupération des aliments recommandés');
  
  try {
    // Identifiant de l'utilisateur pour journalisation
    const userId = req.user ? req.user.id : 'utilisateur non identifié';
    console.log(`GET /api/foods - Accès pour l'utilisateur ${userId}`);
    
    // Accès direct à la base de données (approche qui a résolu les problèmes précédents)
    const db = require('../utils/db').db;
    
    // Vérifier si la collection 'foods' existe dans la base de données
    if (!db.has('foods').value()) {
      // Si non, initialiser avec des données par défaut
      console.log('Aucune collection foods trouvée, création de données par défaut');
      db.set('foods', getDefaultFoodsList()).write();
    }
    
    // Récupérer les aliments directement depuis lowdb
    let foods = db.get('foods').value();
    
    // Vérifier que la liste n'est pas vide
    if (!foods || foods.length === 0 || !Array.isArray(foods)) {
      console.log('Liste d\'aliments vide ou invalide, restauration des données par défaut');
      const defaultFoods = getDefaultFoodsList();
      db.set('foods', defaultFoods).write();
      foods = defaultFoods;
    }
    
    // Ajouter des en-têtes anti-cache (même approche que pour les repas)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log(`Renvoi de ${foods.length} aliments recommandés pour l'utilisateur ${userId}`);
    return res.json(foods);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des aliments recommandés:', error);
    
    // En cas d'erreur, retourner les aliments par défaut
    try {
      console.log('Tentative de récupération des aliments par défaut suite à une erreur');
      const defaultFoods = getDefaultFoodsList();
      
      // Ajouter des en-têtes anti-cache
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.json(defaultFoods);
    } catch (fallbackError) {
      console.error('Erreur catastrophique, même les aliments par défaut ne peuvent pas être récupérés:', fallbackError);
      
      // En dernier recours, renvoyer une liste vide
      console.log('Erreur - Renvoi d\'une liste vide comme solution de dernier recours');
      return res.status(500).json([]);
    }
  }
});

/**
 * @route GET /api/foods/recommendations
 * @desc Obtient des recommandations personnalisées basées sur les objectifs et la progression
 * @access Private
 */
router.get('/recommendations', protect, async (req, res) => {
  const userId = req.user.id;
  
  try {
    console.log(`GET /api/foods/recommendations - Recommandations pour l'utilisateur: ${userId}`);
    
    // Accès direct à la base de données
    const db = require('../utils/db').db;
    
    // Récupérer les objectifs de l'utilisateur
    let objectives = db.get('objectives').find({ userId }).value();
    
    // Utiliser des objectifs par défaut si nécessaire
    if (!objectives) {
      objectives = {
        calories: 2000,
        proteins: 120,
        carbs: 250,
        fats: 70
      };
    }
    
    // Récupérer la progression actuelle (dernier jour)
    const today = new Date().toISOString().split('T')[0];
    
    // Essayer de récupérer les données du jour ou générer des données de démonstration
    let todaysProgress;
    const mealPlans = db.get('meal-plans').filter({ userId, date: today }).value();
    
    if (mealPlans && mealPlans.length > 0) {
      // Calculer la nutrition totale d'aujourd'hui à partir des repas planifiés
      todaysProgress = {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0
      };
      
      mealPlans.forEach(plan => {
        const meal = db.get('meals').find({ id: plan.mealId }).value();
        if (meal) {
          todaysProgress.calories += meal.calories || 0;
          todaysProgress.proteins += meal.proteins || 0;
          todaysProgress.carbs += meal.carbs || 0;
          todaysProgress.fats += meal.fats || 0;
        }
      });
    } else {
      // Générer des données de démonstration (50-70% des objectifs)
      todaysProgress = {
        calories: Math.round(objectives.calories * (0.5 + Math.random() * 0.2)),
        proteins: Math.round(objectives.proteins * (0.5 + Math.random() * 0.2)),
        carbs: Math.round(objectives.carbs * (0.5 + Math.random() * 0.2)),
        fats: Math.round(objectives.fats * (0.5 + Math.random() * 0.2))
      };
    }
    
    // Calculer ce qui manque pour atteindre les objectifs
    const missing = {
      calories: Math.max(0, objectives.calories - todaysProgress.calories),
      proteins: Math.max(0, objectives.proteins - todaysProgress.proteins),
      carbs: Math.max(0, objectives.carbs - todaysProgress.carbs),
      fats: Math.max(0, objectives.fats - todaysProgress.fats)
    };
    
    // Déterminer les priorités nutritionnelles
    const priorities = [];
    
    // Si moins de 60% de l'objectif est atteint, c'est une priorité
    const proteinPercent = Math.round((todaysProgress.proteins / objectives.proteins) * 100);
    const carbsPercent = Math.round((todaysProgress.carbs / objectives.carbs) * 100);
    const fatsPercent = Math.round((todaysProgress.fats / objectives.fats) * 100);
    
    if (proteinPercent < 60) priorities.push('protein');
    if (carbsPercent < 60) priorities.push('carbs');
    if (fatsPercent < 60) priorities.push('fats');
    
    // Si aucune priorité, utiliser celle qui a le plus bas pourcentage
    if (priorities.length === 0) {
      const minPercent = Math.min(proteinPercent, carbsPercent, fatsPercent);
      if (minPercent === proteinPercent) priorities.push('protein');
      else if (minPercent === carbsPercent) priorities.push('carbs');
      else priorities.push('fats');
    }
    
    // Récupérer tous les aliments
    const allFoods = db.get('foods').value() || getDefaultFoodsList();
    
    // Filtrer les aliments en fonction des priorités
    let recommendedFoods = [];
    
    priorities.forEach(nutrient => {
      let filteredFoods;
      if (nutrient === 'protein') {
        filteredFoods = allFoods.filter(food => food.protein > 10);
      } else if (nutrient === 'carbs') {
        filteredFoods = allFoods.filter(food => food.carbs > 15);
      } else { // fats
        filteredFoods = allFoods.filter(food => food.fat > 5);
      }
      
      // Trier par contenu nutritionnel
      filteredFoods.sort((a, b) => {
        if (nutrient === 'protein') return b.protein - a.protein;
        if (nutrient === 'carbs') return b.carbs - a.carbs;
        return b.fat - a.fat;
      });
      
      // Prendre les 3 premiers
      const topFoods = filteredFoods.slice(0, 3);
      recommendedFoods = [...recommendedFoods, ...topFoods];
    });
    
    // Éliminer les doublons
    recommendedFoods = [...new Map(recommendedFoods.map(food => [food.id, food])).values()];
    
    // Générer les recommandations textuelles
    const recommendations = [];
    
    if (priorities.includes('protein')) {
      recommendations.push({
        type: 'protein',
        title: 'Augmentez votre apport en protéines',
        message: `Il vous manque ${missing.proteins}g de protéines pour atteindre votre objectif. Essayez d'incorporer plus de viandes maigres, poissons, œufs ou légumineuses.`,
        priority: proteinPercent < 40 ? 'high' : 'medium'
      });
    }
    
    if (priorities.includes('carbs')) {
      recommendations.push({
        type: 'carbs',
        title: 'Complétez vos glucides',
        message: `Il vous manque ${missing.carbs}g de glucides pour atteindre votre objectif. Les fruits, légumes, céréales complètes et légumineuses sont d'excellentes options.`,
        priority: carbsPercent < 40 ? 'high' : 'medium'
      });
    }
    
    if (priorities.includes('fats')) {
      recommendations.push({
        type: 'fat',
        title: 'Ajoutez des lipides sains',
        message: `Il vous manque ${missing.fats}g de lipides pour atteindre votre objectif. Les avocats, noix, graines et huile d'olive sont de bonnes sources.`,
        priority: fatsPercent < 40 ? 'high' : 'medium'
      });
    }
    
    // Renvoyer les recommandations et les aliments recommandés
    res.json({
      success: true,
      progress: {
        current: todaysProgress,
        objectives: objectives,
        missing: missing,
        percentages: {
          protein: proteinPercent,
          carbs: carbsPercent,
          fats: fatsPercent
        }
      },
      recommendations: recommendations,
      recommendedFoods: recommendedFoods
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération des recommandations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des recommandations',
      error: error.message
    });
  }
});

/**
 * Fournit une liste par défaut d'aliments pour les recommandations
 * Cette approche garantit qu'il y a toujours des données à afficher
 */
function getDefaultFoodsList() {
  return [
    {
      id: 1,
      name: 'Blanc de poulet',
      description: 'Excellente source de protéines maigres, idéal pour la récupération musculaire.',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      image: 'https://via.placeholder.com/300x160?text=Poulet'
    },
    {
      id: 2,
      name: 'Saumon',
      description: 'Riche en protéines et en oméga-3, excellente source de vitamine D.',
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      image: 'https://via.placeholder.com/300x160?text=Saumon'
    },
    {
      id: 3,
      name: 'Quinoa',
      description: 'Céréale complète riche en protéines et contenant tous les acides aminés essentiels.',
      calories: 120,
      protein: 4.4,
      carbs: 21.3,
      fat: 1.9,
      image: 'https://via.placeholder.com/300x160?text=Quinoa'
    },
    {
      id: 4,
      name: 'Œufs',
      description: 'Source complète de protéines avec une grande biodisponibilité.',
      calories: 72,
      protein: 6.3,
      carbs: 0.6,
      fat: 5,
      image: 'https://via.placeholder.com/300x160?text=Oeufs'
    },
    {
      id: 5,
      name: 'Avocat',
      description: 'Excellente source de graisses monoinsaturées et de fibres.',
      calories: 160,
      protein: 2,
      carbs: 8.5,
      fat: 14.7,
      image: 'https://via.placeholder.com/300x160?text=Avocat'
    },
    {
      id: 6,
      name: 'Patate douce',
      description: 'Riche en glucides complexes, fibres et vitamine A.',
      calories: 86,
      protein: 1.6,
      carbs: 20.1,
      fat: 0.1,
      image: 'https://via.placeholder.com/300x160?text=Patate+douce'
    },
    {
      id: 7,
      name: 'Lentilles',
      description: 'Excellente source de protéines végétales et de fibres.',
      calories: 115,
      protein: 9,
      carbs: 20,
      fat: 0.4,
      image: 'https://via.placeholder.com/300x160?text=Lentilles'
    },
    {
      id: 8,
      name: 'Amandes',
      description: 'Riches en graisses saines, protéines et vitamine E.',
      calories: 576,
      protein: 21,
      carbs: 22,
      fat: 49,
      image: 'https://via.placeholder.com/300x160?text=Amandes'
    },
    {
      id: 9,
      name: 'Yaourt grec',
      description: 'Riche en protéines et en probiotiques bénéfiques pour la digestion.',
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      image: 'https://via.placeholder.com/300x160?text=Yaourt+grec'
    }
  ];
}

module.exports = router;
