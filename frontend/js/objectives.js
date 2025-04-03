/**
 * Gestion des objectifs nutritionnels - NutriTrack
 */

// Variables globales
let userObjectives = null; // Stockage local des objectifs de l'utilisateur
let macroChart = null; // Graphique de distribution des macronutriments
let weeklyProgressChart = null; // Graphique de progression hebdomadaire

// Vérifier l'authentification au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('nutritrack_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Charger les objectifs existants
    loadObjectives();
    
    // Configurer les événements
    setupEventListeners();
    
    // Initialiser le graphique de progression
    initWeeklyProgressChart();
    
    console.log('Module des objectifs initialisé');
});



/**
 * Configurer tous les écouteurs d'événements
 */
function setupEventListeners() {
    console.log("Configuration des écouteurs d'événements");
    
    // Bouton d'édition des objectifs
    document.getElementById('btnEditObjectives').addEventListener('click', function() {
        console.log('Bouton modifier cliqué');
        // Le modal s'ouvre automatiquement grâce aux attributs data-bs
        // Mais on pré-remplit les champs ici
        if (userObjectives) {
            document.getElementById('caloriesInput').value = userObjectives.calories;
            document.getElementById('proteinsInput').value = userObjectives.proteins;
            document.getElementById('carbsInput').value = userObjectives.carbs;
            document.getElementById('fatsInput').value = userObjectives.fats;
            document.getElementById('activityLevel').value = userObjectives.activityLevel || 'moderate';
            document.getElementById('goalType').value = userObjectives.goalType || 'maintain';
        }
    });
    
    // Bouton pour calculer automatiquement les besoins
    document.getElementById('btnCalculateNeeds').addEventListener('click', function() {
        // Récupérer les informations utilisateur si disponibles
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        // Pré-remplir le formulaire avec les informations de profil
        if (userProfile) {
            if (userProfile.gender) document.getElementById('gender').value = userProfile.gender;
            if (userProfile.age) document.getElementById('age').value = userProfile.age;
            if (userProfile.weight) document.getElementById('weight').value = userProfile.weight;
            if (userProfile.height) document.getElementById('height').value = userProfile.height;
        }
    });
    
    // Bouton de calcul dans la modale de calcul des besoins
    document.getElementById('btnCalculate').addEventListener('click', calculateNutritionalNeeds);
    
    // Bouton de sauvegarde des objectifs
    document.getElementById('btnSaveObjectives').addEventListener('click', saveObjectives);
    
    // Changement d'objectif (perte/maintien/prise de poids)
    document.getElementById('goalType').addEventListener('change', adjustMacrosByGoal);
}

/**
 * Charger les objectifs depuis l'API ou le stockage local
 */
async function loadObjectives() {
    try {
        const token = localStorage.getItem('nutritrack_token');
        if (!token) {
            showNotification('Vous devez être connecté pour accéder à vos objectifs');
            return;
        }
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const url = `/api/objectives?_=${timestamp}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        console.log('Réponse API objectifs:', response.status);
        
        if (!response.ok) {
            // Si les objectifs n'existent pas encore (404), ce n'est pas une erreur critique
            if (response.status === 404) {
                console.log('Aucun objectif nutritionnel trouvé');
                userObjectives = null;
                displayObjectives(); // Cette fonction gère déjà le cas où userObjectives est null
                return;
            }
            
            // Tentative de récupérer le message d'erreur
            const errorText = await response.text();
            console.error('Erreur de réponse:', response.status, errorText);
            throw new Error(`Erreur lors du chargement des objectifs: ${response.status}\n${errorText}`);
        }
        
        const data = await response.json();
        userObjectives = data.objectives;
        console.log('Objectifs chargés:', userObjectives);
        
        // Afficher les objectifs s'ils existent
        displayObjectives();
        
    } catch (error) {
        console.error('Erreur lors du chargement des objectifs:', error);
        showNotification(`Impossible de charger vos objectifs nutritionnels: ${error.message}`, 'danger');
        
        // Assurer que l'interface est correctement mise à jour même en cas d'erreur
        userObjectives = null;
        displayObjectives();
        
        // Supprimer le message d'erreur après 5 secondes
        setTimeout(() => {
            const errorAlert = document.querySelector('.alert-danger');
            if (errorAlert) {
                errorAlert.remove();
            }
        }, 5000);
    }
}

/**
 * Afficher le message "pas d'objectifs"
 */
function displayObjectives() {
    const noObjectivesElement = document.getElementById('noObjectives');
    const objectivesDisplayElement = document.getElementById('objectivesDisplay');
    
    if (!userObjectives) {
        // Pas d'objectifs définis
        noObjectivesElement.classList.remove('d-none');
        objectivesDisplayElement.classList.add('d-none');
        return;
    }
    
    // Objectifs définis, les afficher
    noObjectivesElement.classList.add('d-none');
    objectivesDisplayElement.classList.remove('d-none');
    
    // Mettre à jour les valeurs affichées
    document.getElementById('caloriesValue').textContent = userObjectives.calories;
    document.getElementById('proteinsValue').textContent = userObjectives.proteins;
    document.getElementById('carbsValue').textContent = userObjectives.carbs;
    document.getElementById('fatsValue').textContent = userObjectives.fats;
    
    // Mettre à jour les totaux
    document.getElementById('caloriesTotal').textContent = userObjectives.calories;
    document.getElementById('proteinsTotal').textContent = userObjectives.proteins;
    document.getElementById('carbsTotal').textContent = userObjectives.carbs;
    document.getElementById('fatsTotal').textContent = userObjectives.fats;
    
    try {
        // Mettre à jour les barres de progression (exemple avec des valeurs fictives pour l'instant)
        // Plus tard, ces valeurs seront remplacées par les données réelles de consommation
        updateProgressBars(userObjectives.calories * 0.8, userObjectives.proteins * 0.7, userObjectives.carbs * 0.75, userObjectives.fats * 0.6);
        
        // Mettre à jour le graphique des progrès - peut être null la première fois
        if (document.getElementById('weeklyProgressChart')) {
            updateProgressChart();
        }
        
        // Mettre à jour le graphique de distribution des macros - peut être null la première fois
        if (document.getElementById('macroChart')) {
            updateMacroChart(userObjectives.proteins, userObjectives.carbs, userObjectives.fats);
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des graphiques:', error);
    }
}

/**
 * Charger la progression actuelle par rapport aux objectifs
 */
async function loadCurrentProgress() {
    try {
        const token = localStorage.getItem('nutritrack_token');
        if (!token) return;
        
        // Obtenir la date du jour au format YYYY-MM-DD
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        // Récupérer les repas planifiés pour aujourd'hui
        const timestamp = new Date().getTime();
        const url = `/api/meal-plans?date=${formattedDate}&_=${timestamp}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des repas planifiés: ${response.status}`);
        }
        
        const data = await response.json();
        const todayMealPlans = data.mealPlans || [];
        
        // Calculer les totaux nutritionnels pour la journée
        let todayCalories = 0;
        let todayProteins = 0;
        let todayCarbs = 0;
        let todayFats = 0;
        
        // Récupérer les repas pour obtenir les valeurs nutritionnelles
        for (const plan of todayMealPlans) {
            const mealResponse = await fetch(`/api/meals/${plan.mealId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (mealResponse.ok) {
                const mealData = await mealResponse.json();
                const meal = mealData.meal;
                
                // Additionner les valeurs nutritionnelles en fonction du nombre de portions
                todayCalories += meal.calories * plan.servings;
                todayProteins += meal.proteins * plan.servings;
                todayCarbs += meal.carbs * plan.servings;
                todayFats += meal.fats * plan.servings;
            }
        }
        
        // Mettre à jour les barres de progression
        updateProgressBars(todayCalories, todayProteins, todayCarbs, todayFats);
        
    } catch (error) {
        console.error('Erreur lors du chargement de la progression actuelle:', error);
    }
}

/**
 * Mettre à jour les barres de progression
 */
function updateProgressBars(calories, proteins, carbs, fats) {
    if (!userObjectives) return;
    
    // Calculer les pourcentages de progression
    const caloriesPercentage = Math.min(Math.round((calories / userObjectives.calories) * 100), 100);
    const proteinsPercentage = Math.min(Math.round((proteins / userObjectives.proteins) * 100), 100);
    const carbsPercentage = Math.min(Math.round((carbs / userObjectives.carbs) * 100), 100);
    const fatsPercentage = Math.min(Math.round((fats / userObjectives.fats) * 100), 100);
    
    // Mettre à jour les barres de progression
    document.getElementById('caloriesProgress').style.width = `${caloriesPercentage}%`;
    document.getElementById('proteinsProgress').style.width = `${proteinsPercentage}%`;
    document.getElementById('carbsProgress').style.width = `${carbsPercentage}%`;
    document.getElementById('fatsProgress').style.width = `${fatsPercentage}%`;
}

/**
 * Ouvrir la modale de calcul des besoins nutritionnels
 */
function openCalculateNeedsModal() {
    // Récupérer les informations utilisateur si disponibles
    const user = Auth.getCurrentUser();
    if (user) {
        if (user.gender) document.getElementById('gender').value = user.gender;
        if (user.age) document.getElementById('age').value = user.age;
        if (user.weight) document.getElementById('weight').value = user.weight;
        if (user.height) document.getElementById('height').value = user.height;
    }
    
    // Afficher la modale
    const objectivesModal = bootstrap.Modal.getInstance(document.getElementById('objectivesModal'));
    objectivesModal.hide();
    
    const calculatorModal = new bootstrap.Modal(document.getElementById('calculateNeedsModal'));
    calculatorModal.show();
}

/**
 * Calculer les besoins nutritionnels en fonction des caractéristiques physiques
 */
function calculateNutritionalNeeds() {
    // Récupérer les valeurs du formulaire
    const gender = document.getElementById('gender').value;
    const age = parseInt(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const activityLevel = document.getElementById('activityLevel').value;
    const goalType = document.getElementById('goalType').value;
    
    // Valider les entrées
    if (!age || !weight || !height) {
        showNotification('Veuillez remplir tous les champs', 'warning');
        return;
    }
    
    // Calculer le métabolisme de base (BMR) selon la formule de Mifflin-St Jeor
    let bmr = 0;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // Appliquer le facteur d'activité
    let tdee = 0; // Total Daily Energy Expenditure
    switch (activityLevel) {
        case 'sedentary':
            tdee = bmr * 1.2;
            break;
        case 'light':
            tdee = bmr * 1.375;
            break;
        case 'moderate':
            tdee = bmr * 1.55;
            break;
        case 'active':
            tdee = bmr * 1.725;
            break;
        case 'extreme':
            tdee = bmr * 1.9;
            break;
        default:
            tdee = bmr * 1.55; // Activité modérée par défaut
    }
    
    // Ajuster selon l'objectif
    let targetCalories = tdee;
    switch (goalType) {
        case 'lose':
            targetCalories = tdee * 0.8; // Déficit de 20%
            break;
        case 'gain':
            targetCalories = tdee * 1.1; // Surplus de 10%
            break;
    }
    
    // Arrondir les calories
    targetCalories = Math.round(targetCalories);
    
    // Calculer la répartition des macronutriments
    let targetProteins = 0;
    let targetCarbs = 0;
    let targetFats = 0;
    
    // Répartition par défaut: 30% protéines, 40% glucides, 30% lipides
    if (goalType === 'lose') {
        // Plus de protéines pour préserver la masse musculaire
        targetProteins = Math.round((targetCalories * 0.35) / 4); // 35% de protéines (4 cal/g)
        targetCarbs = Math.round((targetCalories * 0.35) / 4);    // 35% de glucides (4 cal/g)
        targetFats = Math.round((targetCalories * 0.3) / 9);      // 30% de lipides (9 cal/g)
    } else if (goalType === 'gain') {
        // Plus de glucides pour l'énergie et la construction musculaire
        targetProteins = Math.round((targetCalories * 0.25) / 4); // 25% de protéines (4 cal/g)
        targetCarbs = Math.round((targetCalories * 0.5) / 4);     // 50% de glucides (4 cal/g)
        targetFats = Math.round((targetCalories * 0.25) / 9);     // 25% de lipides (9 cal/g)
    } else {
        // Répartition équilibrée pour maintien
        targetProteins = Math.round((targetCalories * 0.3) / 4);  // 30% de protéines (4 cal/g)
        targetCarbs = Math.round((targetCalories * 0.4) / 4);     // 40% de glucides (4 cal/g)
        targetFats = Math.round((targetCalories * 0.3) / 9);      // 30% de lipides (9 cal/g)
    }
    
    // Mettre à jour les champs de la modale d'objectifs
    document.getElementById('caloriesInput').value = targetCalories;
    document.getElementById('proteinsInput').value = targetProteins;
    document.getElementById('carbsInput').value = targetCarbs;
    document.getElementById('fatsInput').value = targetFats;
    
    // Fermer la modale de calcul et réouvrir celle des objectifs
    const calculatorModal = bootstrap.Modal.getInstance(document.getElementById('calculateNeedsModal'));
    calculatorModal.hide();
    
    const objectivesModal = new bootstrap.Modal(document.getElementById('objectivesModal'));
    objectivesModal.show();
    
    // Afficher une notification de succès
    showNotification('Calcul des besoins nutritionnels effectué avec succès', 'success');
}

/**
 * Ajuster les macronutriments en fonction de l'objectif sélectionné
 */
function adjustMacrosByGoal() {
    const goalType = document.getElementById('goalType').value;
    const caloriesInput = document.getElementById('caloriesInput');
    
    // Si aucune calorie n'est définie, ne rien faire
    if (!caloriesInput.value) return;
    
    const calories = parseInt(caloriesInput.value);
    let proteins = 0;
    let carbs = 0;
    let fats = 0;
    
    if (goalType === 'lose') {
        // Régime riche en protéines pour préserver la masse musculaire
        proteins = Math.round((calories * 0.35) / 4); // 35% de protéines (4 cal/g)
        carbs = Math.round((calories * 0.35) / 4);    // 35% de glucides (4 cal/g)
        fats = Math.round((calories * 0.3) / 9);      // 30% de lipides (9 cal/g)
    } else if (goalType === 'gain') {
        // Régime riche en glucides pour l'énergie et la construction musculaire
        proteins = Math.round((calories * 0.25) / 4); // 25% de protéines (4 cal/g)
        carbs = Math.round((calories * 0.5) / 4);     // 50% de glucides (4 cal/g)
        fats = Math.round((calories * 0.25) / 9);     // 25% de lipides (9 cal/g)
    } else {
        // Répartition équilibrée pour maintien
        proteins = Math.round((calories * 0.3) / 4);  // 30% de protéines (4 cal/g)
        carbs = Math.round((calories * 0.4) / 4);     // 40% de glucides (4 cal/g)
        fats = Math.round((calories * 0.3) / 9);      // 30% de lipides (9 cal/g)
    }
    
    // Mettre à jour les champs de macronutriments
    document.getElementById('proteinsInput').value = proteins;
    document.getElementById('carbsInput').value = carbs;
    document.getElementById('fatsInput').value = fats;
}

/**
 * Sauvegarder les objectifs nutritionnels
 */
async function saveObjectives() {
    try {
        // Récupérer les valeurs du formulaire
        const calories = parseInt(document.getElementById('caloriesInput').value);
        const proteins = parseInt(document.getElementById('proteinsInput').value);
        const carbs = parseInt(document.getElementById('carbsInput').value);
        const fats = parseInt(document.getElementById('fatsInput').value);
        const activityLevel = document.getElementById('activityLevel').value;
        const goalType = document.getElementById('goalType').value;
        
        // Valider les entrées
        if (!calories || !proteins || !carbs || !fats) {
            showNotification('Veuillez remplir tous les champs', 'warning');
            return;
        }
        
        // Préparer les données
        const objectivesData = {
            calories,
            proteins,
            carbs,
            fats,
            activityLevel,
            goalType
        };
        
        // Récupérer le token d'authentification
        const token = localStorage.getItem('nutritrack_token');
        if (!token) {
            showNotification('Vous devez être connecté pour enregistrer vos objectifs', 'danger');
            return;
        }
        
        // Faire la requête AJAX avec anti-cache
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/objectives?_=${timestamp}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify(objectivesData)
        });
        
        console.log('Réponse API POST objectives:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur de réponse:', response.status, errorText);
            throw new Error(`Erreur lors de l'enregistrement des objectifs: ${response.status}\n${errorText}`);
        }
        
        const data = await response.json();
        console.log('Objectifs enregistrés:', data);
        
        // Mise à jour des objectifs locaux avec les données retournées par l'API
        userObjectives = data.objectives || objectivesData;
        console.log('Objectifs mis à jour localement:', userObjectives);
        
        // Fermer la modale
        const modal = bootstrap.Modal.getInstance(document.getElementById('objectivesModal'));
        modal.hide();
        
        // Mettre à jour l'affichage
        displayObjectives();
        
        // Afficher une notification
        showNotification('Objectifs nutritionnels enregistrés avec succès', 'success');
        
        // Masquer le message d'erreur s'il est présent
        const errorAlert = document.querySelector('.alert-danger');
        if (errorAlert) {
            errorAlert.remove();
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des objectifs:', error);
        showNotification(`Erreur lors de l'enregistrement des objectifs: ${error.message}`, 'danger');
    }
}

/**
 * Initialiser le graphique de progression hebdomadaire
 */
function initWeeklyProgressChart() {
    const ctx = document.getElementById('weeklyProgressChart').getContext('2d');
    
    // Générer les données pour la semaine (derniers 7 jours)
    const labels = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }));
    }
    
    // Données initiales vides
    const caloriesData = Array(7).fill(0);
    const proteinsData = Array(7).fill(0);
    const carbsData = Array(7).fill(0);
    const fatsData = Array(7).fill(0);
    
    // Créer le graphique
    weeklyProgressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Calories (% de l\'objectif)',
                    data: caloriesData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Protéines (% de l\'objectif)',
                    data: proteinsData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Glucides (% de l\'objectif)',
                    data: carbsData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Lipides (% de l\'objectif)',
                    data: fatsData,
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: '% de l\'objectif'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
    
    // Charger les données réelles
    loadWeeklyProgressData();
}

/**
 * Charger les données de progression hebdomadaire
 */
async function loadWeeklyProgressData() {
    try {
        if (!userObjectives) return;
        
        const token = localStorage.getItem('nutritrack_token');
        if (!token) return;
        
        // Générer les dates pour les 7 derniers jours
        const dates = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        // Tableaux pour stocker les données de progression
        const caloriesProgress = Array(7).fill(0);
        const proteinsProgress = Array(7).fill(0);
        const carbsProgress = Array(7).fill(0);
        const fatsProgress = Array(7).fill(0);
        
        // Récupérer les repas planifiés pour chaque jour
        for (let i = 0; i < 7; i++) {
            const date = dates[i];
            const timestamp = new Date().getTime();
            const url = `/api/meal-plans?date=${date}&_=${timestamp}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const dayMealPlans = data.mealPlans || [];
                
                // Calculer les totaux nutritionnels pour la journée
                let dayCalories = 0;
                let dayProteins = 0;
                let dayCarbs = 0;
                let dayFats = 0;
                
                // Récupérer les repas pour obtenir les valeurs nutritionnelles
                for (const plan of dayMealPlans) {
                    const mealResponse = await fetch(`/api/meals/${plan.mealId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (mealResponse.ok) {
                        const mealData = await mealResponse.json();
                        const meal = mealData.meal;
                        
                        // Additionner les valeurs nutritionnelles en fonction du nombre de portions
                        dayCalories += meal.calories * plan.servings;
                        dayProteins += meal.proteins * plan.servings;
                        dayCarbs += meal.carbs * plan.servings;
                        dayFats += meal.fats * plan.servings;
                    }
                }
                
                // Calculer les pourcentages par rapport aux objectifs
                caloriesProgress[i] = Math.min(Math.round((dayCalories / userObjectives.calories) * 100), 100);
                proteinsProgress[i] = Math.min(Math.round((dayProteins / userObjectives.proteins) * 100), 100);
                carbsProgress[i] = Math.min(Math.round((dayCarbs / userObjectives.carbs) * 100), 100);
                fatsProgress[i] = Math.min(Math.round((dayFats / userObjectives.fats) * 100), 100);
            }
        }
        
        // Mettre à jour le graphique avec les données réelles
        weeklyProgressChart.data.datasets[0].data = caloriesProgress;
        weeklyProgressChart.data.datasets[1].data = proteinsProgress;
        weeklyProgressChart.data.datasets[2].data = carbsProgress;
        weeklyProgressChart.data.datasets[3].data = fatsProgress;
        weeklyProgressChart.update();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données de progression hebdomadaire:', error);
    }
}

/**
 * Mettre à jour l'interface utilisateur avec les informations de l'utilisateur
 */
function updateUserInterface(user) {
    if (!user) return;
    
    // Mettre à jour l'avatar et le nom d'utilisateur dans la barre latérale
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarUsername = document.getElementById('sidebarUsername');
    
    if (sidebarAvatar && user.avatar) {
        sidebarAvatar.src = user.avatar;
    }
    
    if (sidebarUsername) {
        sidebarUsername.textContent = user.name || 'Utilisateur';
    }
}

/**
 * Afficher une notification toast
 */
function showNotification(message, type = 'success') {
    const toastElement = document.getElementById('notification');
    const toastBody = toastElement.querySelector('.toast-body');
    
    // Supprimer les classes de couleur précédentes
    toastElement.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    
    // Ajouter la classe de couleur appropriée
    toastElement.classList.add(`bg-${type}`);
    
    // Définir le message
    toastBody.textContent = message;
    
    // Afficher la notification
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

/**
 * Mettre à jour le graphique de distribution des macros
 */
function updateMacroChart(proteins, carbs, fats) {
    if (!macroChart) {
        // Initialisation du graphique de distribution des macronutriments
        const ctx = document.getElementById('macroChart').getContext('2d');
        macroChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protéines', 'Glucides', 'Lipides'],
                datasets: [{
                    data: [proteins, carbs, fats],
                    backgroundColor: ['#4e73df', '#1cc88a', '#f6c23e'],
                    hoverBackgroundColor: ['#2e59d9', '#17a673', '#f4b619'],
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                                const percentage = Math.round((value * 100) / total);
                                return `${label}: ${value}g (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    } else {
        // Mise à jour des données
        macroChart.data.datasets[0].data = [proteins, carbs, fats];
        macroChart.update();
    }
}
