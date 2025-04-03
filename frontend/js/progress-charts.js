/**
 * NutriTrack - Fonctions d'initialisation des graphiques de progression
 * Ce fichier contient les fonctions de création et de mise à jour des graphiques
 */

/**
 * Initialiser tous les graphiques
 */
function initializeAllCharts() {
    // Onglet Chronologie
    initializeNutritionTimelineChart();
    
    // Onglet Tendances
    initializeCaloriesTrendChart();
    initializeMacrosTrendChart();
    initializeWeeklyAveragesChart();
    
    // Onglet Comparaison
    initializeGoalsComparisonChart();
    initializeWeekdayWeekendChart();
    initializeMonthlyComparisonChart();
    
    // Onglet Distribution
    initializeMacroDistributionChart();
    initializeMealDistributionChart();
    initializeWeekdayDistributionChart();
    
    // Mettre à jour les barres de progression
    updateProgressBars();
}

/**
 * Initialiser le graphique de chronologie nutritionnelle
 */
function initializeNutritionTimelineChart() {
    const ctx = document.getElementById('nutritionTimelineChart');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il y en a un
    if (charts.nutritionTimeline) {
        charts.nutritionTimeline.destroy();
    }
    
    // S'assurer qu'il y a des données
    if (!nutritionData || nutritionData.dates.length === 0) {
        return;
    }
    
    // Formater les dates pour l'affichage
    const formattedDates = nutritionData.dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    });
    
    // Créer le graphique
    charts.nutritionTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [
                {
                    label: 'Calories (kcal)',
                    data: nutritionData.calories,
                    backgroundColor: CHART_COLORS.caloriesBg,
                    borderColor: CHART_COLORS.calories,
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Protéines (g)',
                    data: nutritionData.proteins,
                    backgroundColor: CHART_COLORS.proteinsBg,
                    borderColor: CHART_COLORS.proteins,
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    hidden: true
                },
                {
                    label: 'Glucides (g)',
                    data: nutritionData.carbs,
                    backgroundColor: CHART_COLORS.carbsBg,
                    borderColor: CHART_COLORS.carbs,
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    hidden: true
                },
                {
                    label: 'Lipides (g)',
                    data: nutritionData.fats,
                    backgroundColor: CHART_COLORS.fatsBg,
                    borderColor: CHART_COLORS.fats,
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Macronutriments (g)'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

/**
 * Initialiser le graphique de tendance des calories
 */
function initializeCaloriesTrendChart() {
    const ctx = document.getElementById('caloriesTrendChart');
    if (!ctx) return;
    
    // Détruire le graphique existant s'il y en a un
    if (charts.caloriesTrend) {
        charts.caloriesTrend.destroy();
    }
    
    // S'assurer qu'il y a des données
    if (!nutritionData || nutritionData.dates.length === 0) {
        return;
    }
    
    // Formater les dates pour l'affichage
    const formattedDates = nutritionData.dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    });
    
    // Calculer la ligne de tendance (régression linéaire simple)
    const trendline = calculateTrendline(nutritionData.calories);
    
    // Créer le graphique
    charts.caloriesTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [
                {
                    label: 'Calories quotidiennes',
                    data: nutritionData.calories,
                    backgroundColor: CHART_COLORS.caloriesBg,
                    borderColor: CHART_COLORS.calories,
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Tendance',
                    data: trendline,
                    borderColor: 'rgba(128, 128, 128, 0.8)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                },
                {
                    label: 'Objectif',
                    data: Array(nutritionData.dates.length).fill(userObjectives ? userObjectives.calories : 2000),
                    borderColor: 'rgba(128, 0, 0, 0.5)',
                    borderWidth: 2,
                    borderDash: [10, 5],
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

/**
 * Fonction pour calculer une ligne de tendance simple
 */
function calculateTrendline(data) {
    const n = data.length;
    if (n <= 1) return data;
    
    // Calculer les moyennes
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
    }
    const avgX = sumX / n;
    const avgY = sumY / n;
    
    // Calculer les coefficients de la régression
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (i - avgX) * (data[i] - avgY);
        denominator += Math.pow(i - avgX, 2);
    }
    
    const slope = denominator ? numerator / denominator : 0;
    const intercept = avgY - slope * avgX;
    
    // Générer les points de la ligne de tendance
    const trendline = [];
    for (let i = 0; i < n; i++) {
        trendline.push(slope * i + intercept);
    }
    
    return trendline;
}

/**
 * Mettre à jour les barres de progression par rapport aux objectifs
 */
function updateProgressBars() {
    if (!userObjectives || !nutritionData) return;
    
    // Calculer les moyennes
    const avgCalories = nutritionData.calories.reduce((sum, val) => sum + val, 0) / nutritionData.dates.length;
    const avgProteins = nutritionData.proteins.reduce((sum, val) => sum + val, 0) / nutritionData.dates.length;
    const avgCarbs = nutritionData.carbs.reduce((sum, val) => sum + val, 0) / nutritionData.dates.length;
    const avgFats = nutritionData.fats.reduce((sum, val) => sum + val, 0) / nutritionData.dates.length;
    
    // Calculer les pourcentages par rapport aux objectifs
    const caloriesPercentage = Math.min(Math.round((avgCalories / userObjectives.calories) * 100), 100);
    const proteinsPercentage = Math.min(Math.round((avgProteins / userObjectives.proteins) * 100), 100);
    const carbsPercentage = Math.min(Math.round((avgCarbs / userObjectives.carbs) * 100), 100);
    const fatsPercentage = Math.min(Math.round((avgFats / userObjectives.fats) * 100), 100);
    
    // Mettre à jour les barres de progression
    document.getElementById('caloriesProgress').style.width = `${caloriesPercentage}%`;
    document.getElementById('proteinsProgress').style.width = `${proteinsPercentage}%`;
    document.getElementById('carbsProgress').style.width = `${carbsPercentage}%`;
    document.getElementById('fatsProgress').style.width = `${fatsPercentage}%`;
    
    // Mettre à jour les textes de pourcentage
    document.querySelector('#caloriesProgress').parentElement.nextElementSibling.textContent = `Calories: ${caloriesPercentage}%`;
    document.querySelector('#proteinsProgress').parentElement.nextElementSibling.textContent = `Protéines: ${proteinsPercentage}%`;
    document.querySelector('#carbsProgress').parentElement.nextElementSibling.textContent = `Glucides: ${carbsPercentage}%`;
    document.querySelector('#fatsProgress').parentElement.nextElementSibling.textContent = `Lipides: ${fatsPercentage}%`;
}

/**
 * Gérer le changement de période
 */
function handleTimeRangeChange() {
    const timeRange = document.getElementById('timeRange').value;
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - parseInt(timeRange));
    
    document.getElementById('startDate').value = formatDateForInput(startDate);
    document.getElementById('endDate').value = formatDateForInput(today);
}

/**
 * Appliquer les filtres
 */
function applyFilters() {
    loadProgressData();
}

/**
 * Exporter les données de progression
 */
function exportProgressData() {
    if (!nutritionData) {
        showNotification('Aucune donnée à exporter', 'warning');
        return;
    }
    
    // Préparer les données pour l'export CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Calories,Protéines,Glucides,Lipides\n";
    
    for (let i = 0; i < nutritionData.dates.length; i++) {
        const row = [
            nutritionData.dates[i],
            nutritionData.calories[i],
            nutritionData.proteins[i],
            nutritionData.carbs[i],
            nutritionData.fats[i]
        ].join(",");
        csvContent += row + "\n";
    }
    
    // Créer un lien de téléchargement
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "progression-nutritionnelle.csv");
    document.body.appendChild(link);
    
    // Déclencher le téléchargement
    link.click();
    document.body.removeChild(link);
    
    showNotification('Données exportées avec succès', 'success');
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
