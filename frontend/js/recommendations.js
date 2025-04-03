/**
 * NutriTrack - Module de recommandations alimentaires
 * Ce module fournit des recommandations personnalisées basées sur les objectifs nutritionnels
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation
    console.log('Initialisation du module de recommandations...');
    initRecommendations();
    
    // Gestionnaires d'événements
    document.getElementById('btnRefreshRecommendations').addEventListener('click', refreshRecommendations);
    document.getElementById('addToMealPlanBtn').addEventListener('click', addSelectedFoodToMealPlan);
});

/**
 * Initialise la page de recommandations
 */
async function initRecommendations() {
    // Masquer immédiatement toute alerte d'erreur qui pourrait être affichée
    hideErrorMessage();
    
    console.log('Initialisation de la page de recommandations...');
    
    try {
        // Vérifier l'authentification sans interrompre le flux
        let userData = null;
        try {
            userData = await checkAuthentication();
            if (!userData) {
                console.warn('Utilisateur non authentifié, redirection vers la page de connexion');
                window.location.href = 'login.html';
                return;
            }
            console.log('Utilisateur authentifié:', userData.email);
            updateUIWithUserData(userData);
        } catch (authError) {
            console.warn('Erreur lors de la vérification de l\'authentification:', authError);
            // Continuer avec des données par défaut si l'authentification échoue
        }
        
        // Charger les objectifs nutritionnels sans interruption
        let goals = null;
        try {
            goals = await loadNutritionalGoals();
            console.log('Objectifs nutritionnels chargés avec succès');
        } catch (goalsError) {
            console.warn('Erreur lors du chargement des objectifs, utilisation des valeurs par défaut:', goalsError);
            // Utiliser des valeurs par défaut si le chargement échoue
        }
        
        // Charger les progrès actuels sans interruption
        let progress = null;
        try {
            progress = await loadCurrentProgress();
            console.log('Progrès nutritionnels chargés avec succès');
        } catch (progressError) {
            console.warn('Erreur lors du chargement des progrès, utilisation des valeurs par défaut:', progressError);
            // Utiliser des valeurs par défaut si le chargement échoue
        }
        
        // Essayer de générer des recommandations personnalisées, sinon afficher des recommandations par défaut
        try {
            await generateRecommendations();
            console.log('Recommandations générées avec succès');
        } catch (recError) {
            console.warn('Erreur lors de la génération des recommandations, affichage des recommandations par défaut:', recError);
            generateDefaultRecommendations();
        }
        
        console.log('Initialisation de la page terminée');
        
    } catch (error) {
        // Même en cas d'erreur générale, assurer que des recommandations par défaut sont affichées
        console.error('Erreur générale lors de l\'initialisation des recommandations:', error);
        generateDefaultRecommendations();
    }
}

/**
 * Actualise les recommandations
 */
async function refreshRecommendations() {
    try {
        showNotification('Actualisation des recommandations...', 'info');
        
        // Montrer un indicateur de chargement
        document.getElementById('recommendationsContainer').innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-3">Chargement des recommandations...</p>
            </div>
        `;
        
        document.getElementById('recommendedFoodsContainer').innerHTML = '';
        
        // Recharger les données actuelles
        await loadNutritionalGoals();
        await loadCurrentProgress();
        
        // Générer de nouvelles recommandations
        await generateRecommendations();
        
        showNotification('Recommandations actualisées avec succès!', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'actualisation des recommandations:', error);
        showNotification('Erreur lors de l\'actualisation des recommandations.', 'danger');
        
        // En cas d'erreur, afficher au moins des recommandations par défaut
        generateDefaultRecommendations();
    }
}

/**
 * Charge les objectifs nutritionnels de l'utilisateur
 */
async function loadNutritionalGoals() {
    try {
        // Récupérer le token d'authentification depuis les cookies
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];
        
        // Préparer les en-têtes avec authentification et anti-cache (solution aux problèmes précédents)
        const headers = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
        
        // Ajouter le token d'authentification s'il existe
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('Chargement des objectifs nutritionnels avec authentification...');
        const response = await fetch('/api/objectives', {
            method: 'GET',
            headers: headers,
            credentials: 'include' // Inclure les cookies dans la requête
        });
        
        if (!response.ok) {
            console.error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const objectives = await response.json();
        console.log('Objectifs nutritionnels reçus:', objectives);
        
        if (objectives && objectives.length > 0) {
            // Supposer que le premier objectif est l'objectif actuel
            const currentObjective = objectives[0];
            console.log('Objectif utilisé:', currentObjective);
            
            // Mettre à jour l'interface avec les objectifs
            document.getElementById('caloriesGoal').textContent = `${currentObjective.calories || 2000} kcal`;
            document.getElementById('proteinGoal').textContent = `${currentObjective.proteins || 120} g`;
            document.getElementById('carbsGoal').textContent = `${currentObjective.carbs || 250} g`;
            document.getElementById('fatGoal').textContent = `${currentObjective.fats || 70} g`;
            
            // Normaliser les noms des propriétés pour être cohérent avec le reste du code
            return {
                calories: currentObjective.calories || 2000,
                protein: currentObjective.proteins || 120,
                carbs: currentObjective.carbs || 250,
                fat: currentObjective.fats || 70
            };
        } else {
            // Si aucun objectif n'est défini, utiliser des valeurs par défaut
            console.warn('Aucun objectif trouvé, utilisation des valeurs par défaut');
            return {
                calories: 2000,
                protein: 120,
                carbs: 250,
                fat: 70
            };
        }
    } catch (error) {
        console.error('Erreur lors du chargement des objectifs:', error);
        
        // En cas d'erreur, utiliser des valeurs par défaut
        return {
            calories: 2000,
            protein: 120,
            carbs: 250,
            fat: 70
        };
    }
}

/**
 * Charge la progression actuelle de l'utilisateur
 */
async function loadCurrentProgress() {
    try {
        // Obtenir la date actuelle au format YYYY-MM-DD
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        // Récupérer le token d'authentification depuis les cookies
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];
        
        // Préparer les en-têtes avec authentification et anti-cache (solution qui a résolu les problèmes des repas)
        const headers = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
        
        // Ajouter le token d'authentification s'il existe
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log(`Chargement de la progression nutritionnelle pour ${formattedDate} avec authentification sécurisée`);
        const response = await fetch(`/api/nutrition-progress?startDate=${formattedDate}&endDate=${formattedDate}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include' // Inclure les cookies dans la requête
        });
        
        if (!response.ok) {
            console.error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const progressData = await response.json();
        console.log('Données de progression reçues:', progressData);
        
        // Objectifs nutritionnels (utiliser les valeurs affichées dans l'interface)
        const caloriesGoal = parseInt(document.getElementById('caloriesGoal').textContent);
        const proteinGoal = parseInt(document.getElementById('proteinGoal').textContent);
        const carbsGoal = parseInt(document.getElementById('carbsGoal').textContent);
        const fatGoal = parseInt(document.getElementById('fatGoal').textContent);
        
        // Valeurs actuelles (ou 0 si aucune donnée n'est disponible)
        let currentCalories = 0;
        let currentProtein = 0;
        let currentCarbs = 0;
        let currentFat = 0;
        
        if (progressData && progressData.dailyNutrition && progressData.dailyNutrition.length > 0) {
            const todayData = progressData.dailyNutrition[0];
            currentCalories = todayData.calories || 0;
            currentProtein = todayData.protein || 0;
            currentCarbs = todayData.carbs || 0;
            currentFat = todayData.fat || 0;
        }
        
        // Calculer les pourcentages
        const caloriesPercent = Math.min(100, Math.round((currentCalories / caloriesGoal) * 100)) || 0;
        const proteinPercent = Math.min(100, Math.round((currentProtein / proteinGoal) * 100)) || 0;
        const carbsPercent = Math.min(100, Math.round((currentCarbs / carbsGoal) * 100)) || 0;
        const fatPercent = Math.min(100, Math.round((currentFat / fatGoal) * 100)) || 0;
        
        // Mettre à jour l'interface
        document.getElementById('caloriesPercent').textContent = `${caloriesPercent}%`;
        document.getElementById('caloriesProgressBar').style.width = `${caloriesPercent}%`;
        document.getElementById('caloriesProgressBar').setAttribute('aria-valuenow', caloriesPercent);
        
        document.getElementById('proteinPercent').textContent = `${proteinPercent}%`;
        document.getElementById('proteinProgressBar').style.width = `${proteinPercent}%`;
        document.getElementById('proteinProgressBar').setAttribute('aria-valuenow', proteinPercent);
        
        document.getElementById('carbsPercent').textContent = `${carbsPercent}%`;
        document.getElementById('carbsProgressBar').style.width = `${carbsPercent}%`;
        document.getElementById('carbsProgressBar').setAttribute('aria-valuenow', carbsPercent);
        
        document.getElementById('fatPercent').textContent = `${fatPercent}%`;
        document.getElementById('fatProgressBar').style.width = `${fatPercent}%`;
        document.getElementById('fatProgressBar').setAttribute('aria-valuenow', fatPercent);
        
        return {
            calories: {
                current: currentCalories,
                goal: caloriesGoal,
                percent: caloriesPercent
            },
            protein: {
                current: currentProtein,
                goal: proteinGoal,
                percent: proteinPercent
            },
            carbs: {
                current: currentCarbs,
                goal: carbsGoal,
                percent: carbsPercent
            },
            fat: {
                current: currentFat,
                goal: fatGoal,
                percent: fatPercent
            }
        };
    } catch (error) {
        console.error('Erreur lors du chargement des progrès:', error);
        
        // En cas d'erreur, utiliser des valeurs par défaut
        return {
            calories: { current: 0, goal: 2000, percent: 0 },
            protein: { current: 0, goal: 120, percent: 0 },
            carbs: { current: 0, goal: 250, percent: 0 },
            fat: { current: 0, goal: 70, percent: 0 }
        };
    }
}

/**
 * Génère des recommandations basées sur les objectifs et les progrès
 */
async function generateRecommendations() {
    try {
        // Récupérer les données actuelles
        const progress = await loadCurrentProgress();
        
        // Calculer ce qui manque pour atteindre les objectifs
        const caloriesNeeded = Math.max(0, progress.calories.goal - progress.calories.current);
        const proteinNeeded = Math.max(0, progress.protein.goal - progress.protein.current);
        const carbsNeeded = Math.max(0, progress.carbs.goal - progress.carbs.current);
        const fatNeeded = Math.max(0, progress.fat.goal - progress.fat.current);
        
        // Déterminer les priorités
        const priorities = [];
        
        // Si moins de 30% de l'objectif est atteint, c'est une priorité élevée
        if (progress.protein.percent < 30) priorities.push({ nutrient: 'protein', priority: 'high' });
        else if (progress.protein.percent < 70) priorities.push({ nutrient: 'protein', priority: 'medium' });
        
        if (progress.carbs.percent < 30) priorities.push({ nutrient: 'carbs', priority: 'high' });
        else if (progress.carbs.percent < 70) priorities.push({ nutrient: 'carbs', priority: 'medium' });
        
        if (progress.fat.percent < 30) priorities.push({ nutrient: 'fat', priority: 'high' });
        else if (progress.fat.percent < 70) priorities.push({ nutrient: 'fat', priority: 'medium' });
        
        // Si on a déjà atteint 100% d'un objectif, pas besoin de recommandations pour ce nutriment
        const needsProtein = progress.protein.percent < 100;
        const needsCarbs = progress.carbs.percent < 100;
        const needsFat = progress.fat.percent < 100;
        
        // Obtenir la base de données des aliments
        const foods = await getFoodDatabase();
        
        // Générer des recommandations pour chaque type de nutriment nécessaire
        let recommendations = [];
        let recommendedFoods = [];
        
        if (needsProtein) {
            const proteinRecs = generateNutrientRecommendations('protein', proteinNeeded, priorities, foods);
            recommendations.push(proteinRecs.recommendation);
            recommendedFoods = recommendedFoods.concat(proteinRecs.foods);
        }
        
        if (needsCarbs) {
            const carbsRecs = generateNutrientRecommendations('carbs', carbsNeeded, priorities, foods);
            recommendations.push(carbsRecs.recommendation);
            recommendedFoods = recommendedFoods.concat(carbsRecs.foods);
        }
        
        if (needsFat) {
            const fatRecs = generateNutrientRecommendations('fat', fatNeeded, priorities, foods);
            recommendations.push(fatRecs.recommendation);
            recommendedFoods = recommendedFoods.concat(fatRecs.foods);
        }
        
        // Si aucune recommandation spécifique n'est nécessaire, générer un message général
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'general',
                title: 'Félicitations!',
                message: 'Vous avez atteint tous vos objectifs nutritionnels pour aujourd\'hui. Continuez comme ça!',
                icon: 'bi-trophy'
            });
        }
        
        // Afficher les recommandations
        displayRecommendations(recommendations);
        
        // Afficher les aliments recommandés
        displayRecommendedFoods(recommendedFoods);
        
    } catch (error) {
        console.error('Erreur lors de la génération des recommandations:', error);
        // Afficher l'erreur dans l'alerte intégrée
        showErrorMessage('Erreur lors de la génération des recommandations. Des recommandations par défaut seront affichées.');
        generateDefaultRecommendations();
    }
}

/**
 * Génère des recommandations pour un nutriment spécifique
 */
function generateNutrientRecommendations(nutrientType, amountNeeded, priorities, foods) {
    console.log(`Génération de recommandations pour ${nutrientType}, quantité nécessaire: ${amountNeeded}g`);
    console.log('Aliments disponibles:', foods);
    
    // S'assurer que les aliments sont bien chargés
    if (!foods || !Array.isArray(foods) || foods.length === 0) {
        console.error('Aucun aliment disponible pour générer des recommandations');
        return {
            recommendation: {
                type: nutrientType,
                title: `Augmentez votre apport en ${nutrientType === 'protein' ? 'protéines' : nutrientType === 'carbs' ? 'glucides' : 'lipides'}`,
                message: 'Nous n\'avons pas pu charger les recommandations d\'aliments spécifiques. Veuillez réessayer.',
                priority: 'medium',
                icon: nutrientType === 'protein' ? 'bi-egg' : nutrientType === 'carbs' ? 'bi-basket' : 'bi-droplet'
            },
            foods: []
        };
    }
    
    // Déterminer la priorité pour ce nutriment
    const priorityInfo = priorities.find(p => p.nutrient === nutrientType) || { priority: 'low' };
    const priority = priorityInfo.priority;
    
    // Normaliser les noms de propriétés pour correspondre à l'API
    const propertyMap = {
        'protein': 'protein',
        'carbs': 'carbs',
        'fat': 'fat'
    };
    
    // Filtrer les aliments riches en ce nutriment
    let nutrientFoods = [];
    
    if (nutrientType === 'protein') {
        nutrientFoods = foods.filter(food => (food.protein || 0) > 10); // Aliments riches en protéines
    } else if (nutrientType === 'carbs') {
        nutrientFoods = foods.filter(food => (food.carbs || 0) > 15); // Aliments riches en glucides
    } else if (nutrientType === 'fat') {
        nutrientFoods = foods.filter(food => (food.fat || 0) > 5); // Aliments riches en lipides
    }
    
    console.log(`${nutrientFoods.length} aliments trouvés riches en ${nutrientType}`);
    
    // Trier les aliments par contenu en nutriment (du plus élevé au plus bas)
    nutrientFoods.sort((a, b) => {
        // S'assurer que les propriétés existent et ont des valeurs numériques
        const valA = a[propertyMap[nutrientType]] || 0;
        const valB = b[propertyMap[nutrientType]] || 0;
        return valB - valA;
    });
    
    // Sélectionner les 3 meilleurs aliments
    const selectedFoods = nutrientFoods.slice(0, 3);
    
    // Créer le message de recommandation
    let title, message, icon;
    
    if (nutrientType === 'protein') {
        title = 'Augmentez votre apport en protéines';
        icon = 'bi-egg';
        
        if (priority === 'high') {
            message = `Il vous manque encore <strong>${amountNeeded}g de protéines</strong> pour atteindre votre objectif quotidien. Essayez d'inclure des aliments riches en protéines à vos prochains repas.`;
        } else {
            message = `Pour compléter votre apport en protéines (${amountNeeded}g restants), envisagez d'ajouter quelques-unes des options ci-dessous.`;
        }
    } else if (nutrientType === 'carbs') {
        title = 'Complétez vos glucides';
        icon = 'bi-basket2';
        
        if (priority === 'high') {
            message = `Il vous manque encore <strong>${amountNeeded}g de glucides</strong> pour atteindre votre objectif quotidien. Les glucides sont essentiels pour votre énergie.`;
        } else {
            message = `Pour atteindre votre objectif en glucides (${amountNeeded}g restants), voici quelques options nutritives.`;
        }
    } else if (nutrientType === 'fat') {
        title = 'Ajoutez des lipides sains';
        icon = 'bi-droplet';
        
        if (priority === 'high') {
            message = `Il vous manque encore <strong>${amountNeeded}g de lipides</strong> pour atteindre votre objectif quotidien. N'oubliez pas que les lipides sains sont essentiels.`;
        } else {
            message = `Pour compléter votre apport en lipides sains (${amountNeeded}g restants), envisagez ces options.`;
        }
    }
    
    return {
        recommendation: {
            type: nutrientType,
            title: title,
            message: message,
            icon: icon,
            priority: priority
        },
        foods: selectedFoods
    };
}

/**
 * Récupère la base de données des aliments
 */
async function getFoodDatabase() {
    // Essayer d'abord de récupérer les aliments en mémoire cache
    const cachedFoods = sessionStorage.getItem('foodsCache');
    if (cachedFoods) {
        try {
            const parsed = JSON.parse(cachedFoods);
            console.log(`Utilisation de ${parsed.length} aliments depuis le cache.`);
            return parsed;
        } catch (e) {
            console.warn('Erreur lors de la lecture du cache:', e);
            sessionStorage.removeItem('foodsCache');
        }
    }
    
    try {
        // Récupérer le token d'authentification depuis les cookies
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];
        
        // Préparer les en-têtes avec authentification et anti-cache
        const headers = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
        
        // Ajouter le token d'authentification s'il existe
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Token d\'authentification ajouté aux en-têtes');
        } else {
            console.warn('Aucun token d\'authentification trouvé dans les cookies');
        }
        
        // Faire la requête avec les en-têtes appropriés
        console.log('Tentative de récupération des aliments depuis l\'API...');
        const response = await fetch('/api/foods', {
            method: 'GET',
            headers: headers,
            credentials: 'include' // Inclure les cookies dans la requête
        });
        
        // Vérifier la réponse
        if (!response.ok) {
            console.error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`${data.length} aliments récupérés avec succès.`);
        
        // Mettre en cache les aliments récupérés
        try {
            sessionStorage.setItem('foodsCache', JSON.stringify(data));
            console.log('Aliments mis en cache avec succès.');
        } catch (e) {
            console.warn('Impossible de mettre en cache les aliments:', e);
        }
        
        return data;
    } catch (error) {
        console.error('Erreur lors du chargement de la base de données des aliments:', error);
        console.log('Utilisation de la liste d\'aliments par défaut comme solution de secours.');
        
        // Utiliser les aliments par défaut et les mettre en cache
        const defaultFoods = getDefaultFoods();
        try {
            sessionStorage.setItem('foodsCache', JSON.stringify(defaultFoods));
        } catch (e) {}
        
        return defaultFoods;
    }
}

/**
 * Affiche les recommandations dans l'interface
 */
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsContainer');
    
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = '<p class="text-center py-3">Aucune recommandation disponible pour le moment.</p>';
        return;
    }
    
    let html = '';
    
    recommendations.forEach(rec => {
        let priorityClass = '';
        if (rec.type === 'protein') priorityClass = 'recommendation-type-protein';
        else if (rec.type === 'carbs') priorityClass = 'recommendation-type-carbs';
        else if (rec.type === 'fat') priorityClass = 'recommendation-type-fats';
        
        html += `
        <div class="card recommendation-card mb-3 ${priorityClass}">
            <div class="card-body">
                <h5 class="card-title">
                    <i class="bi ${rec.icon} me-2"></i>
                    ${rec.title}
                </h5>
                <p class="card-text">${rec.message}</p>
                ${rec.priority === 'high' ? '<span class="badge bg-danger">Priorité élevée</span>' : ''}
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Affiche les aliments recommandés
 */
function displayRecommendedFoods(foods) {
    const container = document.getElementById('recommendedFoodsContainer');
    
    if (!foods || foods.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-center py-3">Aucun aliment recommandé pour le moment.</p></div>';
        return;
    }
    
    let html = '<div class="col-12 mb-4"><h4>Aliments recommandés</h4></div>';
    
    foods.forEach(food => {
        // Déterminer quels badges de nutriments afficher
        const badges = [];
        
        if (food.protein > 10) {
            badges.push('<span class="nutrient-badge protein-badge">Riche en protéines</span>');
        }
        
        if (food.carbs > 15) {
            badges.push('<span class="nutrient-badge carbs-badge">Source de glucides</span>');
        }
        
        if (food.fat > 5) {
            badges.push('<span class="nutrient-badge fats-badge">Contient des lipides sains</span>');
        }
        
        html += `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="card food-card h-100" data-food-id="${food.id}" onclick="showFoodDetails(${food.id})">
                <img src="${food.image || 'https://via.placeholder.com/300x160?text=Aliment'}" class="card-img-top food-image" alt="${food.name}">
                <div class="card-body">
                    <h5 class="card-title">${food.name}</h5>
                    <div class="mb-2">
                        ${badges.join('')}
                    </div>
                    <p class="card-text">${food.description || 'Un aliment nutritif pour compléter votre alimentation.'}</p>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="small">
                        <span class="me-2"><i class="bi bi-lightning-charge"></i> ${food.calories} kcal</span>
                        <span class="me-2"><i class="bi bi-egg"></i> ${food.protein}g</span>
                        <span class="me-2"><i class="bi bi-basket2"></i> ${food.carbs}g</span>
                        <span><i class="bi bi-droplet"></i> ${food.fat}g</span>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Génère des recommandations par défaut en cas d'erreur
 */
function generateDefaultRecommendations() {
    console.log('Génération de recommandations par défaut...');
    
    // Recommandations génériques
    const recommendations = [
        {
            type: 'protein',
            title: 'Augmentez votre apport en protéines',
            message: 'Essayez d\'inclure des aliments riches en protéines à vos repas comme la viande maigre, le poisson, les œufs ou les légumineuses.',
            icon: 'bi-egg',
            priority: 'medium'
        },
        {
            type: 'carbs',
            title: 'Choisissez des glucides complexes',
            message: 'Privilégiez les glucides complexes comme les céréales complètes, le riz complet et les légumes féculents.',
            icon: 'bi-basket2',
            priority: 'medium'
        },
        {
            type: 'fat',
            title: 'Ajoutez des lipides sains',
            message: 'Intégrez des sources de lipides sains comme l\'avocat, les noix, les graines et l\'huile d\'olive à votre alimentation.',
            icon: 'bi-droplet',
            priority: 'medium'
        }
    ];
    
    // Afficher les recommandations
    displayRecommendations(recommendations);
    
    // Afficher des aliments recommandés par défaut
    displayRecommendedFoods(getDefaultFoods());
    
    // Masquer le message d'erreur après un délai pour que l'utilisateur puisse voir 
    // que les recommandations affichées sont des alternatives
    setTimeout(() => {
        hideErrorMessage();
        console.log('Message d\'erreur masqué après affichage des recommandations par défaut');
    }, 5000); // Masquer après 5 secondes
}

/**
 * Renvoie une liste d'aliments par défaut pour les recommandations
 */
function getDefaultFoods() {
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
            description: 'Excellent source de graisses monoinsaturées et de fibres.',
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
        }
    ];
}

/**
 * Met à jour l'interface utilisateur avec les données de l'utilisateur
 */
function updateUIWithUserData(userData) {
    // Mise à jour du nom de l'utilisateur et de l'avatar dans la navbar
    if (userData.name) {
        document.getElementById('userName').textContent = userData.name;
    }
    
    if (userData.email) {
        const avatarUrl = getGravatarUrl(userData.email);
        document.getElementById('userAvatar').src = avatarUrl;
    }
}

/**
 * Obtient l'URL Gravatar pour un email
 */
function getGravatarUrl(email) {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
}

/**
 * Fonction pour hacher l'email pour Gravatar (simpliée)
 */
function md5(string) {
    // Version simplifiée - en production, utilisez une bibliothèque MD5 réelle
    let hash = 0;
    if (string.length === 0) return hash.toString();
    
    for (let i = 0; i < string.length; i++) {
        const char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Affiche les détails d'un aliment dans une fenêtre modale
 */
function showFoodDetails(foodId) {
    try {
        // Trouver l'aliment par son ID (dans les aliments par défaut ou via une requête API)
        let food = getDefaultFoods().find(f => f.id === foodId);
        
        if (!food) {
            throw new Error('Aliment non trouvé');
        }
        
        // Créer le contenu de la modale
        const modalContent = document.getElementById('foodDetailContent');
        const modalTitle = document.getElementById('foodDetailModalLabel');
        
        modalTitle.textContent = food.name;
        
        modalContent.innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <img src="${food.image || 'https://via.placeholder.com/300x200?text=Aliment'}" class="img-fluid rounded" alt="${food.name}">
                </div>
                <div class="col-md-7">
                    <h5>Description</h5>
                    <p>${food.description || 'Aucune description disponible.'}</p>
                    
                    <h5 class="mt-3">Information nutritionnelle</h5>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Nutriment</th>
                                    <th>Quantité</th>
                                    <th>% Objectif</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Calories</td>
                                    <td>${food.calories} kcal</td>
                                    <td>${Math.round((food.calories / parseInt(document.getElementById('caloriesGoal').textContent)) * 100)}%</td>
                                </tr>
                                <tr>
                                    <td>Protéines</td>
                                    <td>${food.protein} g</td>
                                    <td>${Math.round((food.protein / parseInt(document.getElementById('proteinGoal').textContent)) * 100)}%</td>
                                </tr>
                                <tr>
                                    <td>Glucides</td>
                                    <td>${food.carbs} g</td>
                                    <td>${Math.round((food.carbs / parseInt(document.getElementById('carbsGoal').textContent)) * 100)}%</td>
                                </tr>
                                <tr>
                                    <td>Lipides</td>
                                    <td>${food.fat} g</td>
                                    <td>${Math.round((food.fat / parseInt(document.getElementById('fatGoal').textContent)) * 100)}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <h5 class="mt-3">Bénéfices</h5>
                    <ul>
                        ${food.protein > 10 ? '<li>Excellent pour la construction musculaire</li>' : ''}
                        ${food.carbs > 15 ? '<li>Bonne source d\'énergie</li>' : ''}
                        ${food.fat > 5 ? '<li>Contient des acides gras essentiels</li>' : ''}
                    </ul>
                </div>
            </div>
        `;
        
        // Stocker l'ID de l'aliment sélectionné pour l'ajout au plan de repas
        document.getElementById('addToMealPlanBtn').setAttribute('data-food-id', foodId);
        
        // Afficher la modale
        const modal = new bootstrap.Modal(document.getElementById('foodDetailModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage des détails de l\'aliment:', error);
        showNotification('Erreur lors du chargement des détails de l\'aliment.', 'danger');
    }
}

/**
 * Ajoute l'aliment sélectionné au plan de repas
 */
async function addSelectedFoodToMealPlan() {
    try {
        const foodId = document.getElementById('addToMealPlanBtn').getAttribute('data-food-id');
        
        if (!foodId) {
            throw new Error('Aucun aliment sélectionné');
        }
        
        // Trouver l'aliment
        const food = getDefaultFoods().find(f => f.id == foodId);
        
        if (!food) {
            throw new Error('Aliment non trouvé');
        }
        
        // Ajouter l'aliment au plan de repas (dans un vrai scénario, appelez l'API)
        // Ici, nous allons simplement simuler une requête réussie
        
        // Fermer la modale
        const modalElement = document.getElementById('foodDetailModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        
        // Afficher une notification de succès
        showNotification(`${food.name} a été ajouté à votre plan de repas avec succès!`, 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout au plan de repas:', error);
        showNotification('Erreur lors de l\'ajout au plan de repas.', 'danger');
    }
}

/**
 * Gère l'affichage des erreurs (version modifiée sans alerte intégrée)
 */
function showErrorMessage(message) {
    // Journaliser l'erreur mais ne pas l'afficher dans l'interface
    console.log('Erreur ignorée, chargement des recommandations par défaut:', message);
    
    // Générer directement des recommandations par défaut
    // sans encombrer l'interface d'un message d'erreur
    if (!document.getElementById('recommendationsContainer').innerHTML.includes('Augmentez votre apport')) {
        // Seulement si des recommandations ne sont pas déjà affichées
        generateDefaultRecommendations();
    }
}

/**
 * Fonction de compatibilité (ne fait plus rien car l'alerte a été supprimée)
 */
function hideErrorMessage() {
    // Ne fait plus rien, mais conservée pour compatibilité
    console.log('hideErrorMessage appelée (fonction conservée pour compatibilité)');
}

/**
 * Affiche une notification à l'utilisateur
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationBody = notification.querySelector('.toast-body');
    
    // Définir le type de notification (couleur)
    notification.className = notification.className.replace(/bg-\w+/, '');
    notification.classList.add(`bg-${type}`);
    
    // Définir le message
    notificationBody.innerHTML = message;
    
    // Afficher la notification
    const toast = new bootstrap.Toast(notification);
    toast.show();
    
    console.log(`Notification affichée (${type}):`, message);
}
