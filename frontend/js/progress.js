/**
 * NutriTrack - Module de visualisation de progression
 * Ce module gère les graphiques dynamiques pour visualiser la progression nutritionnelle
 */

// Variables globales
let userObjectives = null;
let nutritionData = null;
let charts = {
    nutritionTimeline: null,
    caloriesTrend: null, 
    macrosTrend: null,
    weeklyAverages: null,
    goalsComparison: null,
    weekdayWeekend: null,
    monthlyComparison: null,
    macroDistribution: null,
    mealDistribution: null,
    weekdayDistribution: null
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
    
    // Charger les données de progression
    loadProgressData();
    
    // Initialiser les dates par défaut
    initializeDateRange();
});

/**
 * Configurer les écouteurs d'événements
 */
function setupEventListeners() {
    // Écouteur pour le bouton d'exportation
    document.getElementById('btnExportData').addEventListener('click', exportProgressData);
    
    // Écouteur pour le bouton d'application des filtres
    document.getElementById('btnApplyFilters').addEventListener('click', applyFilters);
    
    // Écouteur pour le sélecteur de période
    document.getElementById('timeRange').addEventListener('change', handleTimeRangeChange);
    
    // Écouteur pour le changement d'onglet
    const tabEls = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabEls.forEach(tabEl => {
        tabEl.addEventListener('shown.bs.tab', (event) => {
            // Redimensionner les graphiques lors du changement d'onglet
            Object.values(charts).forEach(chart => {
                if (chart) chart.resize();
            });
        });
    });
    
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
                'Authorization': `Bearer ${token}`
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
        
        // Mettre à jour les barres de progression d'objectifs
        updateProgressBars();
        
    } catch (error) {
        console.error('Erreur lors du chargement des objectifs:', error);
    }
}

/**
 * Initialiser la plage de dates par défaut
 */
function initializeDateRange() {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7); // 7 jours par défaut
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    startDateInput.value = formatDateForInput(startDate);
    endDateInput.value = formatDateForInput(today);
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
 * Charger les données de progression nutritionnelle
 */
async function loadProgressData() {
    try {
        const token = localStorage.getItem('nutritrack_token');
        if (!token) return;
        
        // Récupérer les dates sélectionnées
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/nutrition-progress?startDate=${startDate}&endDate=${endDate}&_=${timestamp}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache', 
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des données de progression: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données de progression chargées:', data);
        
        // Si nous avons des objectifs, mettre à jour la variable globale
        if (data.objectives) {
            userObjectives = data.objectives;
            console.log('Objectifs chargés avec les données de progression:', userObjectives);
        }
        
        // Traiter les données nutritionnelles pour les graphiques
        processNutritionData(data.progressData);
        
        // Initialiser tous les graphiques
        initializeAllCharts();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données de progression:', error);
        showNotification('Erreur lors du chargement des données de progression', 'danger');
    }
}

/**
 * Traiter les données brutes pour les graphiques
 */
function processNutritionData(dataByDay) {
    // Convertir en tableau trié par date
    const sortedDates = Object.keys(dataByDay).sort();
    
    // Préparer les données pour les graphiques
    nutritionData = {
        dates: sortedDates,
        calories: sortedDates.map(date => dataByDay[date].calories),
        proteins: sortedDates.map(date => dataByDay[date].proteins),
        carbs: sortedDates.map(date => dataByDay[date].carbs),
        fats: sortedDates.map(date => dataByDay[date].fats),
        mealTypes: sortedDates.map(date => dataByDay[date].mealTypes),
        raw: dataByDay
    };
    
    // Si aucune donnée n'est disponible, utiliser des données de démonstration
    if (sortedDates.length === 0) {
        console.log('Aucune donnée disponible, utilisation de données de démonstration');
        createDemoData();
    }
    
    // Calculer les moyennes
    calculateAverages();
}

/**
 * Générer des données de démonstration si aucune donnée n'est disponible
 */
function createDemoData() {
    const today = new Date();
    const dates = [];
    const caloriesData = [];
    const proteinsData = [];
    const carbsData = [];
    const fatsData = [];
    
    // Générer des données pour les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - i);
        const dateString = currentDate.toISOString().split('T')[0];
        dates.push(dateString);
        
        // Générer des valeurs aléatoires mais plausibles
        const baseCalories = userObjectives ? userObjectives.calories : 2000;
        const baseProteins = userObjectives ? userObjectives.proteins : 120;
        const baseCarbs = userObjectives ? userObjectives.carbs : 200;
        const baseFats = userObjectives ? userObjectives.fats : 70;
        
        const variation = 0.15; // Variation de +/- 15%
        
        const caloriesVariation = Math.random() * variation * 2 - variation; // Entre -15% et +15%
        const proteinsVariation = Math.random() * variation * 2 - variation;
        const carbsVariation = Math.random() * variation * 2 - variation;
        const fatsVariation = Math.random() * variation * 2 - variation;
        
        caloriesData.push(Math.round(baseCalories * (1 + caloriesVariation)));
        proteinsData.push(Math.round(baseProteins * (1 + proteinsVariation)));
        carbsData.push(Math.round(baseCarbs * (1 + carbsVariation)));
        fatsData.push(Math.round(baseFats * (1 + fatsVariation)));
    }
    
    // Mettre à jour les données nutritionnelles
    nutritionData = {
        dates: dates,
        calories: caloriesData,
        proteins: proteinsData,
        carbs: carbsData,
        fats: fatsData,
        mealTypes: dates.map(() => ({ 'petit-déjeuner': 400, 'déjeuner': 700, 'dîner': 600, 'collation': 300 })),
        raw: {}
    };
    
    // Créer l'objet raw pour correspondre au format attendu
    dates.forEach((date, index) => {
        nutritionData.raw[date] = {
            calories: caloriesData[index],
            proteins: proteinsData[index],
            carbs: carbsData[index],
            fats: fatsData[index],
            mealTypes: { 'petit-déjeuner': 400, 'déjeuner': 700, 'dîner': 600, 'collation': 300 }
        };
    });
}

/**
 * Calculer les moyennes pour l'affichage du résumé
 */
function calculateAverages() {
    if (!nutritionData || nutritionData.dates.length === 0) {
        return;
    }
    
    const avgCalories = nutritionData.calories.reduce((sum, val) => sum + val, 0) / nutritionData.dates.length;
    const avgProteins = nutritionData.proteins.reduce((sum, val) => sum + val, 0) / nutritionData.dates.length;
    const avgCarbs = nutritionData.carbs.reduce((sum, val) => sum + val, 0) / nutritionData.dates.length;
    const avgFats = nutritionData.fats.reduce((sum, val) => sum + val, 0) / nutritionData.dates.length;
    
    // Mettre à jour l'affichage
    document.getElementById('avgCalories').textContent = `${Math.round(avgCalories)} kcal`;
    document.getElementById('avgProteins').textContent = `${Math.round(avgProteins)} g`;
    document.getElementById('avgCarbs').textContent = `${Math.round(avgCarbs)} g`;
    document.getElementById('avgFats').textContent = `${Math.round(avgFats)} g`;
}
