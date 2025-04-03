/**
 * Script de correction pour les graphiques de la page de progression
 * Ce script garantit l'initialisation correcte des graphiques avec des données démo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation de la correction des graphiques de progression...');
    setTimeout(initializeProgressChartsDirectly, 500);
});

function initializeProgressChartsDirectly() {
    console.log('Tentative d\'initialisation directe des graphiques de progression');
    
    try {
        // Vérifier si Chart.js est disponible
        if (typeof Chart === 'undefined') {
            console.error('Chart.js n\'est pas chargé!');
            loadChartJsDirectly();
            return;
        }
        
        // Créer les graphiques directement avec des données de démo
        // Onglet Chronologie
        createNutritionTimelineChart();
        createNutrientProgressChart();
        
        // Onglet Tendances
        createCaloriesTrendChart();
        createMacrosTrendChart();
        createWeeklyAveragesChart();
        
        // Onglet Comparaison
        createGoalsComparisonChart();
        createWeekdayWeekendChart();
        createMonthlyComparisonChart();
        
        // Onglet Distribution
        createMacroDistributionChart();
        createMealDistributionChart();
        createWeekdayDistributionChart();
        
        console.log('Tous les graphiques de progression ont été initialisés avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation directe des graphiques de progression:', error);
    }
}

// Charger Chart.js directement si nécessaire
function loadChartJsDirectly() {
    console.log('Chargement direct de Chart.js');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
        console.log('Chart.js chargé avec succès, initialisation des graphiques...');
        setTimeout(initializeProgressChartsDirectly, 300);
    };
    document.head.appendChild(script);
}

// Création directe des graphiques avec des données de démo

function createNutritionTimelineChart() {
    const canvas = document.getElementById('nutritionTimelineChart');
    if (!canvas) {
        console.error('Canvas nutritionTimelineChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour nutritionTimelineChart');
        return;
    }
    
    console.log('Création du graphique de chronologie nutritionnelle');
    
    // Générer des dates pour les 14 derniers jours
    const dates = [];
    const caloriesData = [];
    const proteinData = [];
    const carbsData = [];
    const fatsData = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        dates.push(dateStr);
        
        // Générer des valeurs nutritionnelles avec des variations
        const baseCalories = 2000;
        const variation = 0.15;
        
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekendFactor = isWeekend ? 1.1 : 1.0;
        
        const calories = Math.round(baseCalories * weekendFactor * (1 + (Math.random() * variation * 2 - variation)));
        caloriesData.push(calories);
        
        // Protéines, glucides et lipides basés sur les calories
        proteinData.push(Math.round(calories * 0.25 / 4)); // ~25% des calories, 4 cal/g
        carbsData.push(Math.round(calories * 0.5 / 4));    // ~50% des calories, 4 cal/g
        fatsData.push(Math.round(calories * 0.25 / 9));    // ~25% des calories, 9 cal/g
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Calories',
                    data: caloriesData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.1,
                    fill: false,
                    borderWidth: 2,
                    yAxisID: 'y',
                },
                {
                    label: 'Protéines (g)',
                    data: proteinData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.1,
                    fill: false,
                    borderWidth: 2,
                    yAxisID: 'y1',
                },
                {
                    label: 'Glucides (g)',
                    data: carbsData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.1,
                    fill: false,
                    borderWidth: 2,
                    yAxisID: 'y1',
                },
                {
                    label: 'Lipides (g)',
                    data: fatsData,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.1)',
                    tension: 0.1,
                    fill: false,
                    borderWidth: 2,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    },
                    type: 'linear',
                    min: 0
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Nutriments (g)'
                    },
                    type: 'linear',
                    min: 0,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function createNutrientProgressChart() {
    const canvas = document.getElementById('nutrientProgressChart');
    if (!canvas) {
        console.error('Canvas nutrientProgressChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour nutrientProgressChart');
        return;
    }
    
    console.log('Création du graphique de progression des nutriments');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Protéines', 'Glucides', 'Lipides', 'Fibres', 'Vitamines', 'Minéraux'],
            datasets: [
                {
                    label: 'Objectifs',
                    data: [100, 100, 100, 100, 100, 100],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                },
                {
                    label: 'Progrès',
                    data: [95, 85, 90, 75, 80, 70],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 120,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

function createCaloriesTrendChart() {
    const canvas = document.getElementById('caloriesTrendChart');
    if (!canvas) {
        console.error('Canvas caloriesTrendChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour caloriesTrendChart');
        return;
    }
    
    console.log('Création du graphique de tendance des calories');
    
    // Générer des données sur 30 jours
    const dates = [];
    const actualCalories = [];
    const targetCalories = [];
    const movingAverage = [];
    
    const today = new Date();
    const targetCalorie = 2000;
    let total = 0;
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        dates.push(dateStr);
        
        // Variations réalistes
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekendFactor = isWeekend ? 1.1 : 1.0;
        
        const calories = Math.round(targetCalorie * weekendFactor * (1 + (Math.random() * 0.2 - 0.1)));
        actualCalories.push(calories);
        targetCalories.push(targetCalorie);
        
        // Calculer la moyenne mobile sur 7 jours
        total += calories;
        if (i <= 22) { // Après les 7 premiers jours
            const dayToRemove = i + 7;
            total -= actualCalories[29 - dayToRemove];
            movingAverage.push(Math.round(total / 7));
        } else {
            movingAverage.push(null); // Pas assez de jours pour la moyenne mobile
        }
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Calories quotidiennes',
                    data: actualCalories,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 1,
                    pointRadius: 2,
                    fill: false
                },
                {
                    label: 'Objectif',
                    data: targetCalories,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'Moyenne mobile (7 jours)',
                    data: movingAverage,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    }
                }
            }
        }
    });
}

function createMacroDistributionChart() {
    const canvas = document.getElementById('macroDistributionChart');
    if (!canvas) {
        console.error('Canvas macroDistributionChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour macroDistributionChart');
        return;
    }
    
    console.log('Création du graphique de distribution des macronutriments');
    
    const proteins = 120; // g
    const carbs = 250;    // g
    const fats = 70;      // g
    
    // Conversion en calories
    const proteinCals = proteins * 4;  // 4 kcal/g
    const carbCals = carbs * 4;        // 4 kcal/g
    const fatCals = fats * 9;          // 9 kcal/g
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Protéines', 'Glucides', 'Lipides'],
            datasets: [{
                data: [proteinCals, carbCals, fatCals],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)'
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
                            const value = context.raw || 0;
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

function createWeekdayComparisonChart() {
    const canvas = document.getElementById('weekdayComparisonChart');
    if (!canvas) {
        console.error('Canvas weekdayComparisonChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour weekdayComparisonChart');
        return;
    }
    
    console.log('Création du graphique de comparaison par jour de semaine');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
            datasets: [
                {
                    label: 'Calories moyennes',
                    data: [1850, 1900, 2000, 1950, 2100, 2200, 2250],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Protéines (g)',
                    data: [110, 115, 120, 118, 125, 105, 100],
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valeur'
                    }
                }
            }
        }
    });
}

// Graphiques supplémentaires pour l'onglet Tendances

function createMacrosTrendChart() {
    const canvas = document.getElementById('macrosTrendChart');
    if (!canvas) {
        console.error('Canvas macrosTrendChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour macrosTrendChart');
        return;
    }
    
    console.log('Création du graphique de tendance des macronutriments');
    
    // Générer des données sur 14 jours
    const dates = [];
    const proteins = [];
    const carbs = [];
    const fats = [];
    
    const today = new Date();
    const baseProtein = 120; // g
    const baseCarbs = 250;   // g
    const baseFats = 70;     // g
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        dates.push(dateStr);
        
        // Variations réalistes
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekendProteinFactor = isWeekend ? 0.9 : 1.0; // Moins de protéines le weekend
        const weekendCarbsFactor = isWeekend ? 1.2 : 1.0;   // Plus de glucides le weekend
        const weekendFatsFactor = isWeekend ? 1.1 : 1.0;    // Plus de lipides le weekend
        
        proteins.push(Math.round(baseProtein * weekendProteinFactor * (1 + (Math.random() * 0.1 - 0.05))));
        carbs.push(Math.round(baseCarbs * weekendCarbsFactor * (1 + (Math.random() * 0.1 - 0.05))));
        fats.push(Math.round(baseFats * weekendFatsFactor * (1 + (Math.random() * 0.1 - 0.05))));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Protéines (g)',
                    data: proteins,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.1,
                    fill: false,
                    borderWidth: 2
                },
                {
                    label: 'Glucides (g)',
                    data: carbs,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.1,
                    fill: false,
                    borderWidth: 2
                },
                {
                    label: 'Lipides (g)',
                    data: fats,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.1)',
                    tension: 0.1,
                    fill: false,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantité (g)'
                    }
                }
            }
        }
    });
}

function createWeeklyAveragesChart() {
    const canvas = document.getElementById('weeklyAveragesChart');
    if (!canvas) {
        console.error('Canvas weeklyAveragesChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour weeklyAveragesChart');
        return;
    }
    
    console.log('Création du graphique des moyennes hebdomadaires');
    
    // Générer des données pour les 6 dernières semaines
    const weeks = [];
    const caloriesData = [];
    const proteinData = [];
    const carbsData = [];
    const fatsData = [];
    
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    
    for (let i = 5; i >= 0; i--) {
        const weekNum = currentWeek - i;
        weeks.push(`Semaine ${weekNum > 0 ? weekNum : 52 + weekNum}`);
        
        // Données de base avec légère tendance à l'amélioration
        const trend = i / 5; // 0 pour la semaine la plus ancienne, 1 pour la semaine actuelle
        const baseCalories = 2000 + (trend * 100); // Augmentation progressive
        
        // Variations réalistes
        const calories = Math.round(baseCalories * (1 + (Math.random() * 0.05 - 0.025)));
        caloriesData.push(calories);
        
        // Protéines, glucides et lipides basés sur les calories
        proteinData.push(Math.round(calories * 0.25 / 4)); // ~25% des calories, 4 cal/g
        carbsData.push(Math.round(calories * 0.5 / 4));    // ~50% des calories, 4 cal/g
        fatsData.push(Math.round(calories * 0.25 / 9));    // ~25% des calories, 9 cal/g
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeks,
            datasets: [
                {
                    label: 'Calories moyennes quotidiennes',
                    data: caloriesData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Protéines (g)',
                    data: proteinData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                },
                {
                    label: 'Glucides (g)',
                    data: carbsData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                },
                {
                    label: 'Lipides (g)',
                    data: fatsData,
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    },
                    type: 'linear',
                    min: 0
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Nutriments (g)'
                    },
                    type: 'linear',
                    min: 0,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Graphiques pour l'onglet Comparaison

function createGoalsComparisonChart() {
    const canvas = document.getElementById('goalsComparisonChart');
    if (!canvas) {
        console.error('Canvas goalsComparisonChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour goalsComparisonChart');
        return;
    }
    
    console.log('Création du graphique de comparaison avec les objectifs');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Calories', 'Protéines', 'Glucides', 'Lipides', 'Fibres', 'Eau'],
            datasets: [
                {
                    label: 'Objectifs',
                    data: [100, 100, 100, 100, 100, 100],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                },
                {
                    label: 'Réalisé',
                    data: [95, 110, 85, 90, 70, 80],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 120,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

function createWeekdayWeekendChart() {
    const canvas = document.getElementById('weekdayWeekendChart');
    if (!canvas) {
        console.error('Canvas weekdayWeekendChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour weekdayWeekendChart');
        return;
    }
    
    console.log('Création du graphique de comparaison jour de semaine vs. weekend');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Calories (kcal)', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)'],
            datasets: [
                {
                    label: 'Jours de semaine',
                    data: [1950, 120, 225, 65],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Weekend',
                    data: [2200, 110, 270, 75],
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valeur'
                    }
                }
            }
        }
    });
}

function createMonthlyComparisonChart() {
    const canvas = document.getElementById('monthlyComparisonChart');
    if (!canvas) {
        console.error('Canvas monthlyComparisonChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour monthlyComparisonChart');
        return;
    }
    
    console.log('Création du graphique de comparaison par mois');
    
    // Générer des données pour les 6 derniers mois
    const months = [];
    const caloriesData = [];
    
    const today = new Date();
    const currentMonth = today.getMonth();
    
    for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12; // Pour gérer le passage à l'année précédente
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        months.push(monthNames[monthIndex]);
        
        // Variations saisonnières
        let seasonalFactor = 1.0;
        
        // Été : moins de calories
        if (monthIndex >= 5 && monthIndex <= 7) { 
            seasonalFactor = 0.95;
        }
        // Hiver : plus de calories
        else if (monthIndex >= 11 || monthIndex <= 1) {
            seasonalFactor = 1.05;
        }
        
        const calories = Math.round(2000 * seasonalFactor * (1 + (Math.random() * 0.05 - 0.025)));
        caloriesData.push(calories);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Calories moyennes quotidiennes',
                data: caloriesData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    }
                }
            }
        }
    });
}

// Graphiques supplémentaires pour l'onglet Distribution

function createMealDistributionChart() {
    const canvas = document.getElementById('mealDistributionChart');
    if (!canvas) {
        console.error('Canvas mealDistributionChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour mealDistributionChart');
        return;
    }
    
    console.log('Création du graphique de distribution des calories par repas');
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collations'],
            datasets: [{
                data: [450, 750, 650, 250],
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
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
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

function createWeekdayDistributionChart() {
    const canvas = document.getElementById('weekdayDistributionChart');
    if (!canvas) {
        console.error('Canvas weekdayDistributionChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour weekdayDistributionChart');
        return;
    }
    
    console.log('Création du graphique de répartition par jour de la semaine');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
            datasets: [
                {
                    label: 'Calories',
                    data: [1850, 1900, 2000, 1950, 2100, 2200, 2250],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Pourcentage des objectifs atteints',
                    data: [90, 95, 100, 97, 105, 110, 112],
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    },
                    type: 'linear',
                    beginAtZero: true
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Objectifs atteints (%)'
                    },
                    type: 'linear',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Fonction utilitaire pour obtenir le numéro de la semaine
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
