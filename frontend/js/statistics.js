/**
 * NutriTrack - Module de statistiques nutritionnelles
 * Ce module gère l'affichage et le calcul des statistiques basées sur les données nutritionnelles
 */

// Variables globales
let userObjectives = null;
let statisticsData = null;
let charts = {
    mealTypeChart: null,
    macroDistributionChart: null,
    weekdayCaloriesChart: null,
    goalsVsActualChart: null,
    weightTrendChart: null,
    performanceChart: null
};

// Couleurs pour les graphiques
const CHART_COLORS = {
    calories: 'rgba(255, 99, 132, 1)',
    caloriesBg: 'rgba(255, 99, 132, 0.2)',
    proteins: 'rgba(54, 162, 235, 1)',
    proteinsBg: 'rgba(54, 162, 235, 0.2)',
    carbs: 'rgba(75, 192, 192, 1)',
    carbsBg: 'rgba(75, 192, 192, 0.2)',
    fats: 'rgba(255, 206, 86, 1)',
    fatsBg: 'rgba(255, 206, 86, 0.2)'
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    checkAuth();
    
    // Initialiser les écouteurs d'événements
    setupEventListeners();
    
    // Charger les données utilisateur et les objectifs
    loadUserData();
    loadObjectives();
    
    // Charger les données statistiques
    loadStatisticsData();
});

/**
 * Configurer les écouteurs d'événements
 */
function setupEventListeners() {
    // Écouteur pour le bouton d'exportation
    document.getElementById('btnExportStats').addEventListener('click', exportStatisticsData);
    
    // Écouteur pour la déconnexion
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

/**
 * Charger les données de l'utilisateur connecté
 */
async function loadUserData() {
    try {
        const token = localStorage.getItem('nutritrack_token');
        if (!token) {
            redirectToLogin();
            return;
        }
        
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error('Échec de chargement du profil');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Mettre à jour les éléments d'interface avec les données utilisateur
            document.getElementById('navUsername').textContent = data.user.name;
            updateUserAvatar(data.user);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        showNotification('Erreur lors du chargement du profil', 'danger');
    }
}

/**
 * Charger les objectifs nutritionnels de l'utilisateur
 */
async function loadObjectives() {
    try {
        const token = localStorage.getItem('nutritrack_token');
        if (!token) return;
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/objectives?_=${timestamp}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('Aucun objectif nutritionnel trouvé');
                return;
            }
            throw new Error(`Erreur lors du chargement des objectifs: ${response.status}`);
        }
        
        const data = await response.json();
        userObjectives = data.objectives;
        console.log('Objectifs chargés:', userObjectives);
        
    } catch (error) {
        console.error('Erreur lors du chargement des objectifs:', error);
    }
}

/**
 * Charger les données statistiques
 */
async function loadStatisticsData() {
    try {
        const token = localStorage.getItem('nutritrack_token');
        if (!token) {
            console.warn('Aucun token trouvé, impossible de charger les données statistiques');
            createDemoData();
            initializeAllCharts();
            updateKeyMetrics();
            return;
        }
        
        // Récupérer le premier jour du mois dernier
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const startDate = formatDateForInput(lastMonth);
        const endDate = formatDateForInput(today);
        
        console.log(`Chargement des données nutritionnelles du ${startDate} au ${endDate}`);
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const apiUrl = `/api/nutrition-progress?startDate=${startDate}&endDate=${endDate}&_=${timestamp}`;
        console.log('Appel API:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors du chargement des données statistiques: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Données statistiques chargées:', data);
        
        // Vérifier si nous avons reçu des données valides
        if (!data || (!data.progressData && !data.objectives)) {
            console.warn('Réponse API valide mais aucune donnée nutritionnelle trouvée');
            createDemoData();
        } else {
            // Si nous avons des objectifs, mettre à jour la variable globale
            if (data.objectives) {
                userObjectives = data.objectives;
                console.log('Objectifs chargés avec les données statistiques:', userObjectives);
            }
            
            // Traiter les données nutritionnelles pour les statistiques
            if (data.progressData && Object.keys(data.progressData).length > 0) {
                processNutritionData(data.progressData);
            } else {
                console.warn('Aucune donnée de progression trouvée, utilisation de données de démonstration');
                createDemoData();
            }
        }
        
        // Initialiser tous les graphiques
        initializeAllCharts();
        
        // Mettre à jour les indicateurs clés
        updateKeyMetrics();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données statistiques:', error);
        showNotification('Utilisation de données de démonstration', 'info');
        // Générer des données de démonstration pour afficher quelque chose
        createDemoData();
        initializeAllCharts();
        updateKeyMetrics();
    }
}

/**
 * Formater une date pour un champ input type="date"
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Traiter les données brutes pour les statistiques
 */
function processNutritionData(dataByDay) {
    // Vérifier si les données sont vides ou nulles
    if (!dataByDay || Object.keys(dataByDay).length === 0) {
        console.log('Données nutritionnelles vides, utilisation de données de démonstration');
        createDemoData();
        return;
    }
    
    // Convertir en tableau trié par date
    const sortedDates = Object.keys(dataByDay).sort();
    
    // Vérifier s'il y a des dates valides
    if (sortedDates.length === 0) {
        console.log('Aucune date disponible, utilisation de données de démonstration');
        createDemoData();
        return;
    }
    
    try {
        // Préparer les données pour les statistiques
        statisticsData = {
            dates: sortedDates,
            calories: sortedDates.map(date => dataByDay[date].calories || 0),
            proteins: sortedDates.map(date => dataByDay[date].proteins || 0),
            carbs: sortedDates.map(date => dataByDay[date].carbs || 0),
            fats: sortedDates.map(date => dataByDay[date].fats || 0),
            mealTypes: sortedDates.map(date => dataByDay[date].mealTypes || {}),
            raw: dataByDay
        };
        
        console.log('Données nutritionnelles traitées:', statisticsData);
    } catch (error) {
        console.error('Erreur lors du traitement des données nutritionnelles:', error);
        createDemoData();
    }
}

/**
 * Générer des données de démonstration si aucune donnée n'est disponible
 */
function createDemoData() {
    console.log('Création de données de démonstration...');
    const today = new Date();
    const dates = [];
    const caloriesData = [];
    const proteinsData = [];
    const carbsData = [];
    const fatsData = [];
    const mealTypesData = [];
    
    // Définir des valeurs par défaut pour les objectifs si non disponibles
    const defaultCalories = 2000;
    const defaultProteins = 120;
    const defaultCarbs = 250;
    const defaultFats = 70;
    
    // Utiliser les objectifs de l'utilisateur s'ils sont disponibles, sinon utiliser les valeurs par défaut
    const baseCalories = userObjectives && userObjectives.calories ? userObjectives.calories : defaultCalories;
    const baseProteins = userObjectives && userObjectives.proteins ? userObjectives.proteins : defaultProteins;
    const baseCarbs = userObjectives && userObjectives.carbs ? userObjectives.carbs : defaultCarbs;
    const baseFats = userObjectives && userObjectives.fats ? userObjectives.fats : defaultFats;
    
    console.log('Valeurs de base pour les données de démonstration:', { baseCalories, baseProteins, baseCarbs, baseFats });
    
    // Générer des données pour les 30 derniers jours
    for (let i = 29; i >= 0; i--) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - i);
        const dateString = currentDate.toISOString().split('T')[0];
        dates.push(dateString);
        
        // Générer des valeurs aléatoires avec des tendances réalistes
        // Les jours de semaine ont des variations différentes des week-ends
        const dayOfWeek = currentDate.getDay(); // 0 = dimanche, 6 = samedi
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Les week-ends ont généralement plus de calories
        const weekendFactor = isWeekend ? 1.1 : 1.0;
        
        // Variation de base +/- 15% en semaine, +/- 20% le week-end
        const variation = isWeekend ? 0.2 : 0.15;
        
        const caloriesVariation = (Math.random() * variation * 2 - variation) * weekendFactor;
        const proteinsVariation = Math.random() * variation * 2 - variation;
        const carbsVariation = (Math.random() * variation * 2 - variation) * (isWeekend ? 1.15 : 1.0); // Plus de glucides le week-end
        const fatsVariation = (Math.random() * variation * 2 - variation) * (isWeekend ? 1.2 : 1.0); // Plus de lipides le week-end
        
        caloriesData.push(Math.round(baseCalories * (1 + caloriesVariation)));
        proteinsData.push(Math.round(baseProteins * (1 + proteinsVariation)));
        carbsData.push(Math.round(baseCarbs * (1 + carbsVariation)));
        fatsData.push(Math.round(baseFats * (1 + fatsVariation)));
        
        // Générer des données de repas pour chaque jour avec des variations selon le jour
        let mealTypeObj = {};
        
        // Distribution différente selon le jour de semaine
        if (isWeekend) {
            // Week-end: petit-déjeuner plus important, déjeuner plus tardif et copieux
            mealTypeObj = {
                'petit-déjeuner': Math.round(baseCalories * 0.3 * (1 + Math.random() * 0.15 - 0.05)),
                'déjeuner': Math.round(baseCalories * 0.4 * (1 + Math.random() * 0.15 - 0.05)),
                'dîner': Math.round(baseCalories * 0.25 * (1 + Math.random() * 0.15 - 0.05)),
                'collation': Math.round(baseCalories * 0.05 * (1 + Math.random() * 0.15 - 0.05))
            };
        } else {
            // Jour de semaine: petit-déjeuner rapide, déjeuner standard, plus de collations
            mealTypeObj = {
                'petit-déjeuner': Math.round(baseCalories * 0.2 * (1 + Math.random() * 0.1 - 0.05)),
                'déjeuner': Math.round(baseCalories * 0.35 * (1 + Math.random() * 0.1 - 0.05)),
                'dîner': Math.round(baseCalories * 0.3 * (1 + Math.random() * 0.1 - 0.05)),
                'collation': Math.round(baseCalories * 0.15 * (1 + Math.random() * 0.1 - 0.05))
            };
        }
        
        mealTypesData.push(mealTypeObj);
    }
    
    // Mettre à jour les données statistiques
    statisticsData = {
        dates: dates,
        calories: caloriesData,
        proteins: proteinsData,
        carbs: carbsData,
        fats: fatsData,
        mealTypes: mealTypesData,
        raw: {}
    };
    
    // Créer l'objet raw pour correspondre au format attendu
    dates.forEach((date, index) => {
        statisticsData.raw[date] = {
            calories: caloriesData[index],
            proteins: proteinsData[index],
            carbs: carbsData[index],
            fats: fatsData[index],
            mealTypes: mealTypesData[index]
        };
    });
    
    console.log('Données de démonstration créées avec succès:', statisticsData.dates.length, 'jours générés');
}

/**
 * Mettre à jour les métriques clés affichées sur la page
 */
function updateKeyMetrics() {
    if (!statisticsData || !statisticsData.dates.length) {
        console.warn('Aucune donnée statistique disponible pour mettre à jour les métriques clés');
        return;
    }
    
    try {
        // Calculer la moyenne quotidienne de calories
        const avgCalories = Math.round(
            statisticsData.calories.reduce((sum, val) => sum + (val || 0), 0) / statisticsData.dates.length
        );
        document.getElementById('avgCaloriesPerDay').textContent = `${avgCalories} kcal`;
        
        // Calculer le nombre de jours dans l'objectif
        let daysOnTarget = 0;
        if (userObjectives && userObjectives.calories) {
            const targetCalories = userObjectives.calories;
            const margin = targetCalories * 0.1; // 10% de marge
            daysOnTarget = statisticsData.calories.filter(cal => 
                cal >= targetCalories - margin && cal <= targetCalories + margin
            ).length;
        } else {
            daysOnTarget = Math.round(statisticsData.dates.length * 0.8); // 80% pour les données de démo
        }
        document.getElementById('daysOnTarget').textContent = `${daysOnTarget}/${statisticsData.dates.length}`;
        
        // Calculer la répartition moyenne des macros
        const avgProteins = Math.round(
            statisticsData.proteins.reduce((sum, val) => sum + (val || 0), 0) / statisticsData.dates.length
        );
        const avgCarbs = Math.round(
            statisticsData.carbs.reduce((sum, val) => sum + (val || 0), 0) / statisticsData.dates.length
        );
        const avgFats = Math.round(
            statisticsData.fats.reduce((sum, val) => sum + (val || 0), 0) / statisticsData.dates.length
        );
        
        // Calculer les pourcentages
        const proteinCals = avgProteins * 4;
        const carbCals = avgCarbs * 4;
        const fatCals = avgFats * 9;
        const totalCals = proteinCals + carbCals + fatCals;
        
        const proteinsPct = totalCals > 0 ? Math.round((proteinCals / totalCals) * 100) : 0;
        const carbsPct = totalCals > 0 ? Math.round((carbCals / totalCals) * 100) : 0;
        const fatsPct = totalCals > 0 ? Math.round((fatCals / totalCals) * 100) : 0;
        
        document.getElementById('macroRatio').textContent = `${proteinsPct}/${carbsPct}/${fatsPct}`;
        
        // Déterminer le meilleur jour de la semaine
        const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Dim, Lun, Mar, Mer, Jeu, Ven, Sam
        const dayCount = [0, 0, 0, 0, 0, 0, 0];
        
        statisticsData.dates.forEach((dateStr, index) => {
            const date = new Date(dateStr);
            const day = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
            dayTotals[day] += statisticsData.calories[index] || 0;
            dayCount[day]++;
        });
        
        // Calculer les moyennes par jour
        const dayAverages = dayTotals.map((total, idx) => dayCount[idx] ? total / dayCount[idx] : 0);
        
        // Trouver le jour avec la meilleure moyenne (le plus proche de l'objectif)
        let bestDayIdx = 0;
        let bestDeviation = Number.MAX_VALUE;
        
        dayAverages.forEach((avg, idx) => {
            if (dayCount[idx] > 0) {
                const targetCals = userObjectives && userObjectives.calories ? userObjectives.calories : 2000;
                const deviation = Math.abs(avg - targetCals);
                if (deviation < bestDeviation) {
                    bestDeviation = deviation;
                    bestDayIdx = idx;
                }
            }
        });
        
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        document.getElementById('bestDay').textContent = days[bestDayIdx];
        
        console.log('Métriques clés mises à jour avec succès');
    } catch (error) {
        console.error('Erreur lors de la mise à jour des métriques clés:', error);
    }
}

/**
 * Initialiser tous les graphiques
 */
function initializeAllCharts() {
    initializeMealTypeChart();
    initializeMacroDistributionChart();
    initializeWeekdayCaloriesChart();
    initializeGoalsVsActualChart();
    initializeWeightTrendChart();
    initializePerformanceChart();
}

/**
 * Initialiser le graphique de consommation par type de repas
 */
function initializeMealTypeChart() {
    const ctx = document.getElementById('mealTypeChart');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il y en a un
    if (charts.mealTypeChart) {
        charts.mealTypeChart.destroy();
    }
    
    // Calculer les moyennes par type de repas
    const mealTypeAvgs = {};
    
    statisticsData.mealTypes.forEach(mealType => {
        Object.entries(mealType).forEach(([type, calories]) => {
            if (!mealTypeAvgs[type]) mealTypeAvgs[type] = [];
            mealTypeAvgs[type].push(calories);
        });
    });
    
    const mealTypes = Object.keys(mealTypeAvgs);
    const mealTypeData = mealTypes.map(type => {
        const avg = mealTypeAvgs[type].reduce((sum, val) => sum + val, 0) / mealTypeAvgs[type].length;
        return Math.round(avg);
    });
    
    // Créer le graphique
    charts.mealTypeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mealTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            datasets: [{
                label: 'Calories moyennes',
                data: mealTypeData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} kcal`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialiser le graphique de répartition des macronutriments
 */
function initializeMacroDistributionChart() {
    const ctx = document.getElementById('macroDistributionChart');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il y en a un
    if (charts.macroDistributionChart) {
        charts.macroDistributionChart.destroy();
    }
    
    // Calculer les moyennes des macronutriments
    const avgProteins = Math.round(
        statisticsData.proteins.reduce((sum, val) => sum + val, 0) / statisticsData.dates.length
    );
    const avgCarbs = Math.round(
        statisticsData.carbs.reduce((sum, val) => sum + val, 0) / statisticsData.dates.length
    );
    const avgFats = Math.round(
        statisticsData.fats.reduce((sum, val) => sum + val, 0) / statisticsData.dates.length
    );
    
    // Calculer les calories par macronutriment
    const proteinCals = avgProteins * 4; // 4 calories par gramme de protéines
    const carbCals = avgCarbs * 4;      // 4 calories par gramme de glucides
    const fatCals = avgFats * 9;        // 9 calories par gramme de lipides
    
    // Créer le graphique
    charts.macroDistributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Protéines', 'Glucides', 'Lipides'],
            datasets: [{
                data: [proteinCals, carbCals, fatCals],
                backgroundColor: [
                    CHART_COLORS.proteinsBg,
                    CHART_COLORS.carbsBg,
                    CHART_COLORS.fatsBg
                ],
                borderColor: [
                    CHART_COLORS.proteins,
                    CHART_COLORS.carbs,
                    CHART_COLORS.fats
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${percentage}% (${value} kcal)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialiser le graphique des calories par jour de la semaine
 */
function initializeWeekdayCaloriesChart() {
    const ctx = document.getElementById('weekdayCaloriesChart');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il y en a un
    if (charts.weekdayCaloriesChart) {
        charts.weekdayCaloriesChart.destroy();
    }
    
    // Calculer les moyennes par jour de la semaine
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Dim, Lun, Mar, Mer, Jeu, Ven, Sam
    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    
    statisticsData.dates.forEach((dateStr, index) => {
        const date = new Date(dateStr);
        const day = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
        dayTotals[day] += statisticsData.calories[index];
        dayCount[day]++;
    });
    
    // Calculer les moyennes
    const dayAverages = dayTotals.map((total, idx) => dayCount[idx] ? Math.round(total / dayCount[idx]) : 0);
    
    // Créer le graphique
    charts.weekdayCaloriesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            datasets: [{
                label: 'Calories moyennes',
                data: dayAverages,
                backgroundColor: 'rgba(78, 115, 223, 0.7)',
                borderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return `${value} kcal`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialiser le graphique de comparaison des objectifs vs réalité
 */
function initializeGoalsVsActualChart() {
    const ctx = document.getElementById('goalsVsActualChart');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il y en a un
    if (charts.goalsVsActualChart) {
        charts.goalsVsActualChart.destroy();
    }
    
    // Définir les objectifs
    const targetCalories = userObjectives ? userObjectives.calories : 2000;
    const targetProteins = userObjectives ? userObjectives.proteins : 120;
    const targetCarbs = userObjectives ? userObjectives.carbs : 200;
    const targetFats = userObjectives ? userObjectives.fats : 70;
    
    // Calculer les moyennes réelles
    const avgCalories = Math.round(
        statisticsData.calories.reduce((sum, val) => sum + val, 0) / statisticsData.dates.length
    );
    const avgProteins = Math.round(
        statisticsData.proteins.reduce((sum, val) => sum + val, 0) / statisticsData.dates.length
    );
    const avgCarbs = Math.round(
        statisticsData.carbs.reduce((sum, val) => sum + val, 0) / statisticsData.dates.length
    );
    const avgFats = Math.round(
        statisticsData.fats.reduce((sum, val) => sum + val, 0) / statisticsData.dates.length
    );
    
    // Créer le graphique
    charts.goalsVsActualChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Calories (kcal)', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)'],
            datasets: [
                {
                    label: 'Objectif',
                    data: [targetCalories, targetProteins, targetCarbs, targetFats],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Réalité',
                    data: [avgCalories, avgProteins, avgCarbs, avgFats],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialiser le graphique de tendance du poids
 */
function initializeWeightTrendChart() {
    console.log('Initialisation du graphique de tendance de poids');
    const ctx = document.getElementById('weightTrendChart');
    if (!ctx) {
        console.error('Impossible de trouver l\'élément canvas weightTrendChart');
        return;
    }
    
    try {
        // Vérifier que le contexte est valide
        if (!ctx.getContext) {
            console.error('Contexte de canvas non disponible');
            return;
        }
        
        // Détruire le graphique existant s'il y en a un
        if (charts.weightTrendChart) {
            charts.weightTrendChart.destroy();
        }
        
        // S'assurer que nous avons des données statistiques
        if (!statisticsData || !statisticsData.dates || statisticsData.dates.length === 0) {
            console.error('Aucune donnée disponible pour le graphique de poids');
            return;
        }
        
        // Générer des données de démonstration pour le poids
        const weightData = [];
        const startWeight = 75; // Poids de départ en kg
        const targetWeight = userObjectives && userObjectives.targetWeight ? userObjectives.targetWeight : 70;
        const daysCount = statisticsData.dates.length;
        
        console.log('Génération de données de poids pour', daysCount, 'jours');
        
        // Créer une tendance légèrement à la baisse avec des variations
        for (let i = 0; i < daysCount; i++) {
            const progress = i / daysCount; // 0 au début, 1 à la fin
            const weight = startWeight - (progress * (startWeight - targetWeight)) + (Math.random() * 0.6 - 0.3); // +/- 0.3 kg de variation
            weightData.push(parseFloat(weight.toFixed(1)));
        }
        
        // Ne garder qu'un point tous les 3 jours pour la lisibilité
        const filteredDates = [];
        const filteredWeights = [];
        
        for (let i = 0; i < statisticsData.dates.length; i++) {
            if (i % 3 === 0 || i === statisticsData.dates.length - 1) {
                filteredDates.push(statisticsData.dates[i]);
                filteredWeights.push(weightData[i]);
            }
        }
        
        console.log('Données filtrées:', filteredDates.length, 'points');
        
        // S'assurer que nous avons au moins un point
        if (filteredDates.length === 0) {
            filteredDates.push(new Date().toISOString().split('T')[0]);
            filteredWeights.push(startWeight);
        }
        
        // Formater les dates pour l'affichage
        const formattedDates = filteredDates.map(date => {
            const d = new Date(date);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        });
        
        console.log('Dates formatées:', formattedDates);
        console.log('Poids:', filteredWeights);
        
        // Créer le graphique
        charts.weightTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedDates,
                datasets: [{
                    label: 'Poids (kg)',
                    data: filteredWeights,
                    fill: false,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Poids (kg)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return `Poids: ${context.parsed.y} kg`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        
        console.log('Graphique de tendance de poids initialisé avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du graphique de tendance de poids:', error);
    }
}

/**
 * Initialiser le graphique de performance nutritionnelle
 */
function initializePerformanceChart() {
    console.log('Initialisation du graphique de performance nutritionnelle');
    const ctx = document.getElementById('performanceChart');
    if (!ctx) {
        console.error('Impossible de trouver l\'élément canvas performanceChart');
        return;
    }
    
    try {
        // Vérifier que le contexte est valide
        if (!ctx.getContext) {
            console.error('Contexte de canvas non disponible');
            return;
        }
        
        // Détruire le graphique existant s'il y en a un
        if (charts.performanceChart) {
            charts.performanceChart.destroy();
        }
        
        // S'assurer que nous avons des données statistiques
        if (!statisticsData || !statisticsData.dates || statisticsData.dates.length === 0) {
            console.error('Aucune donnée disponible pour le graphique de performance');
            return;
        }
        
        // Calculer un score de performance nutritionnelle pour chaque jour
        const performanceScores = [];
        
        console.log('Calcul des scores de performance pour', statisticsData.dates.length, 'jours');
        
        statisticsData.dates.forEach((date, index) => {
            const calories = statisticsData.calories[index] || 0;
            const proteins = statisticsData.proteins[index] || 0;
            const carbs = statisticsData.carbs[index] || 0;
            const fats = statisticsData.fats[index] || 0;
            
            // Définir les objectifs
            const targetCalories = userObjectives && userObjectives.calories ? userObjectives.calories : 2000;
            const targetProteins = userObjectives && userObjectives.proteins ? userObjectives.proteins : 120;
            const targetCarbs = userObjectives && userObjectives.carbs ? userObjectives.carbs : 250;
            const targetFats = userObjectives && userObjectives.fats ? userObjectives.fats : 70;
            
            // Éviter la division par zéro
            if (targetCalories <= 0 || targetProteins <= 0 || targetCarbs <= 0 || targetFats <= 0) {
                performanceScores.push(50); // Score moyen par défaut
                return;
            }
            
            // Calculer les écarts en pourcentage par rapport aux objectifs
            const caloriesDeviation = Math.abs(1 - calories / targetCalories);
            const proteinsDeviation = Math.abs(1 - proteins / targetProteins);
            const carbsDeviation = Math.abs(1 - carbs / targetCarbs);
            const fatsDeviation = Math.abs(1 - fats / targetFats);
            
            // Calculer un score où 100% = parfaitement aligné avec les objectifs
            // 0% = complètement éloigné des objectifs
            const score = 100 - (caloriesDeviation * 30 + proteinsDeviation * 30 + 
                                carbsDeviation * 20 + fatsDeviation * 20);
            
            // Limiter le score entre 0 et 100
            performanceScores.push(Math.max(0, Math.min(100, score)));
        });
        
        console.log('Scores de performance calculés:', performanceScores.length, 'scores');
        
        // Ne conserver que les données des 14 derniers jours pour la lisibilité
        let recentDates = statisticsData.dates;
        let recentScores = performanceScores;
        
        if (statisticsData.dates.length > 14) {
            recentDates = statisticsData.dates.slice(-14);
            recentScores = performanceScores.slice(-14);
        }
        
        // S'assurer que nous avons au moins un point
        if (recentDates.length === 0) {
            recentDates.push(new Date().toISOString().split('T')[0]);
            recentScores.push(75); // Score moyen par défaut
        }
        
        // Formater les dates pour l'affichage
        const formattedDates = recentDates.map(date => {
            const d = new Date(date);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        });
        
        console.log('Dates formatées:', formattedDates);
        console.log('Scores:', recentScores);
        
        // Créer le graphique
        charts.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedDates,
                datasets: [{
                    label: 'Score nutritionnel',
                    data: recentScores,
                    fill: true,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(153, 102, 255, 1)',
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        display: true,
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Score nutritionnel (%)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return `Score: ${Math.round(context.parsed.y)}%`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        
        console.log('Graphique de performance nutritionnelle initialisé avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du graphique de performance:', error);
    }
}

/**
 * Exporter les données statistiques vers un fichier CSV
 */
function exportStatisticsData() {
    if (!statisticsData || !statisticsData.dates.length) {
        showNotification('Aucune donnée disponible à exporter', 'warning');
        return;
    }
    
    // Créer un tableau pour le CSV
    const csvRows = [];
    
    // Ajouter l'en-tête
    csvRows.push(['Date', 'Calories (kcal)', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)']);
    
    // Ajouter les données pour chaque jour
    statisticsData.dates.forEach((date, index) => {
        csvRows.push([
            date,
            statisticsData.calories[index],
            statisticsData.proteins[index],
            statisticsData.carbs[index],
            statisticsData.fats[index]
        ]);
    });
    
    // Convertir en CSV
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Créer un blob et un lien pour le téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nutrition_stats_${formatDateForInput(new Date()).replace(/-/g, '')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Statistiques exportées avec succès', 'success');
}

/**
 * Mettre à jour l'avatar de l'utilisateur
 */
function updateUserAvatar(user) {
    if (user && user.avatar) {
        document.getElementById('navAvatar').src = user.avatar;
    }
}

/**
 * Afficher une notification à l'utilisateur
 */
function showNotification(message, type = 'info') {
    const toast = document.getElementById('notification');
    
    // Définir le type (couleur) de la notification
    toast.className = 'toast align-items-center text-white';
    switch (type) {
        case 'success':
            toast.classList.add('bg-success');
            break;
        case 'danger':
        case 'error':
            toast.classList.add('bg-danger');
            break;
        case 'warning':
            toast.classList.add('bg-warning');
            toast.classList.remove('text-white');
            toast.classList.add('text-dark');
            break;
        default:
            toast.classList.add('bg-info');
    }
    
    // Mettre à jour le message
    toast.querySelector('.toast-body').textContent = message;
    
    // Créer et afficher la notification
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}
