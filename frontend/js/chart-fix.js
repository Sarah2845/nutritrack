/**
 * Script de correction pour les graphiques
 * Ce script garantit l'initialisation correcte des graphiques avec des données démo
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation de la correction des graphiques...');
    setTimeout(initializeChartsDirectly, 500);
});

function initializeChartsDirectly() {
    console.log('Tentative d\'initialisation directe des graphiques');
    
    try {
        // Vérifier si Chart.js est disponible
        if (typeof Chart === 'undefined') {
            console.error('Chart.js n\'est pas chargé!');
            loadChartJsDirectly();
            return;
        }
        
        // Créer les graphiques directement avec des données de démo
        createMealTypeChart();
        createMacroDistributionChart();
        createWeekdayCaloriesChart();
        createGoalsVsActualChart();
        createWeightTrendChart();
        createPerformanceChart();
        
        console.log('Tous les graphiques ont été initialisés avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation directe des graphiques:', error);
    }
}

// Charger Chart.js directement si nécessaire
function loadChartJsDirectly() {
    console.log('Chargement direct de Chart.js');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
        console.log('Chart.js chargé avec succès, initialisation des graphiques...');
        setTimeout(initializeChartsDirectly, 300);
    };
    document.head.appendChild(script);
}

// Création directe des graphiques avec des données de démo

function createMealTypeChart() {
    const canvas = document.getElementById('mealTypeChart');
    if (!canvas) {
        console.error('Canvas mealTypeChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour mealTypeChart');
        return;
    }
    
    console.log('Création du graphique de types de repas');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation'],
            datasets: [{
                label: 'Calories moyennes',
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
            scales: {
                y: {
                    beginAtZero: true,
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
    
    console.log('Création du graphique de distribution des macros');
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Protéines', 'Glucides', 'Lipides'],
            datasets: [{
                data: [480, 800, 720], // Calories: protéines 120g*4, glucides 200g*4, lipides 80g*9
                backgroundColor: [
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(255, 206, 86, 0.2)'
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
            maintainAspectRatio: false
        }
    });
}

function createWeekdayCaloriesChart() {
    const canvas = document.getElementById('weekdayCaloriesChart');
    if (!canvas) {
        console.error('Canvas weekdayCaloriesChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour weekdayCaloriesChart');
        return;
    }
    
    console.log('Création du graphique des calories par jour de semaine');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            datasets: [{
                label: 'Calories moyennes',
                data: [2200, 1850, 1900, 2000, 1950, 2100, 2300],
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
            }
        }
    });
}

function createGoalsVsActualChart() {
    const canvas = document.getElementById('goalsVsActualChart');
    if (!canvas) {
        console.error('Canvas goalsVsActualChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour goalsVsActualChart');
        return;
    }
    
    console.log('Création du graphique objectifs vs réalité');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Calories (kcal)', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)'],
            datasets: [
                {
                    label: 'Objectif',
                    data: [2000, 120, 250, 70],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Réalité',
                    data: [2100, 115, 270, 65],
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
            }
        }
    });
}

function createWeightTrendChart() {
    const canvas = document.getElementById('weightTrendChart');
    if (!canvas) {
        console.error('Canvas weightTrendChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour weightTrendChart');
        return;
    }
    
    console.log('Création du graphique de tendance de poids');
    
    // Générer des dates et des poids pour les 30 derniers jours
    const dates = [];
    const weights = [];
    const today = new Date();
    const startWeight = 75.0;
    const targetWeight = 72.0;
    
    for (let i = 29; i >= 0; i -= 3) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        dates.push(dateStr);
        
        const progress = (29 - i) / 29;
        const weight = startWeight - (progress * (startWeight - targetWeight)) + (Math.random() * 0.6 - 0.3);
        weights.push(parseFloat(weight.toFixed(1)));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Poids (kg)',
                data: weights,
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
                y: {
                    title: {
                        display: true,
                        text: 'Poids (kg)'
                    }
                }
            }
        }
    });
}

function createPerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) {
        console.error('Canvas performanceChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D pour performanceChart');
        return;
    }
    
    console.log('Création du graphique de performance nutritionnelle');
    
    // Générer des dates et des scores pour les 14 derniers jours
    const dates = [];
    const scores = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        dates.push(dateStr);
        
        // Générer un score entre 60 et 95 avec une tendance légèrement à la hausse
        const baseScore = 75 + (13 - i) * 1;
        const randomVariation = Math.random() * 10 - 5;
        const score = Math.min(95, Math.max(60, baseScore + randomVariation));
        scores.push(parseFloat(score.toFixed(1)));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Score nutritionnel',
                data: scores,
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
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score nutritionnel (%)'
                    }
                }
            }
        }
    });
}
