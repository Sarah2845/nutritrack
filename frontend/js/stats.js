/**
 * Stats module for NutriTrack application
 * Handles statistics, trends and data analysis
 * Using functional programming principles
 */

const Stats = (() => {
  // Private variables
  let caloriesChart = null;
  let macrosChart = null;
  
  // DOM Elements selectors - will be initialized when the page loads
  let pageContent;
  let trendsStartDate;
  let trendsEndDate;
  let loadTrendsBtn;
  let topProteinMealsContainer;
  let balancedMealsContainer;
  let statsCardContainer;
  
  // Initialize DOM elements
  const initElements = () => {
    pageContent = document.getElementById('pageContent');
    trendsStartDate = document.getElementById('trendsStartDate');
    trendsEndDate = document.getElementById('trendsEndDate');
    loadTrendsBtn = document.getElementById('loadTrendsBtn');
    topProteinMealsContainer = document.getElementById('topProteinMeals');
    balancedMealsContainer = document.getElementById('balancedMeals');
    statsCardContainer = document.getElementById('statsCardContainer');
  };
  
  // Set up event listeners
  const setupEventListeners = () => {
    // Load trends button
    loadTrendsBtn.addEventListener('click', () => {
      loadTrends(trendsStartDate.value, trendsEndDate.value);
    });
  };
  
  // Load stats
  const loadStats = async () => {
    try {
      Utils.showSpinner('Chargement des statistiques...');
      
      // Set default dates for trends - last 7 days
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      trendsStartDate.value = Utils.formatDate(weekAgo);
      trendsEndDate.value = Utils.formatDate(today);
      
      // Load overall stats
      const statsResponse = await API.stats.getAll();
      const stats = statsResponse.stats;
      
      // Load nutrition trends for the last week
      await loadTrends(trendsStartDate.value, trendsEndDate.value);
      
      // Render stats
      renderTopProteinMeals(stats.topProteinMeals);
      renderBalancedMeals(stats.mostBalancedMeals);
      renderStatsCards(stats);
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors du chargement des statistiques', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Load nutrition trends
  const loadTrends = async (startDate, endDate) => {
    try {
      Utils.showSpinner('Chargement des tendances...');
      
      // Validate dates
      if (!startDate || !endDate) {
        Utils.showToast('Veuillez sélectionner une période valide', 'error');
        return;
      }
      
      // Load trends data
      const trendsResponse = await API.stats.getTrends(startDate, endDate);
      const trendsData = trendsResponse.trends;
      const goal = trendsResponse.goal;
      
      // Render charts
      renderTrendsCharts(trendsData, goal);
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors du chargement des tendances', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Render trends charts
  const renderTrendsCharts = (trendsData, goal) => {
    // Destroy existing charts if they exist
    if (caloriesChart) caloriesChart.destroy();
    if (macrosChart) macrosChart.destroy();
    
    // Parse data for charts
    const dates = trendsData.map(day => day.date);
    const calories = trendsData.map(day => day.calories);
    const proteins = trendsData.map(day => day.proteins);
    const carbs = trendsData.map(day => day.carbs);
    const fats = trendsData.map(day => day.fats);
    
    // Format dates for display
    const formattedDates = dates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    
    // Draw calories chart
    const caloriesCtx = document.getElementById('caloriesChart').getContext('2d');
    caloriesChart = new Chart(caloriesCtx, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [{
          label: 'Calories (kcal)',
          data: calories,
          backgroundColor: 'rgba(78, 115, 223, 0.2)',
          borderColor: 'rgba(78, 115, 223, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(78, 115, 223, 1)',
          pointRadius: 3,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Apport calorique quotidien',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: (context) => `Calories: ${context.raw} kcal`
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Calories (kcal)'
            },
            grid: {
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
    
    // Draw macros chart
    const macrosCtx = document.getElementById('macrosChart').getContext('2d');
    macrosChart = new Chart(macrosCtx, {
      type: 'bar',
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: 'Protéines (g)',
            data: proteins,
            backgroundColor: 'rgba(28, 200, 138, 0.8)',
            borderWidth: 0
          },
          {
            label: 'Glucides (g)',
            data: carbs,
            backgroundColor: 'rgba(246, 194, 62, 0.8)',
            borderWidth: 0
          },
          {
            label: 'Lipides (g)',
            data: fats,
            backgroundColor: 'rgba(231, 74, 59, 0.8)',
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Répartition des macronutriments',
            font: { size: 16 }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            stacked: false,
            title: {
              display: true,
              text: 'Grammes (g)'
            },
            grid: {
              drawBorder: false,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  };
  
  // Render top protein meals
  const renderTopProteinMeals = (meals) => {
    if (!topProteinMealsContainer) return;
    
    if (!meals || meals.length === 0) {
      topProteinMealsContainer.innerHTML = `
        <div class="alert alert-info mb-0">
          <i class="bi bi-info-circle"></i> Aucun repas à afficher.
        </div>
      `;
      return;
    }
    
    const html = meals.map((meal, index) => `
      <div class="card mb-2">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-0">${meal.name}</h6>
              <div class="text-muted small">${Utils.getMealTypeName(meal.mealType)}</div>
            </div>
            <div class="text-end">
              <div class="fw-bold">${meal.proteins}g de protéines</div>
              <div class="text-muted small">${meal.calories} kcal</div>
            </div>
          </div>
          <div class="progress mt-2" style="height: 5px;">
            <div class="progress-bar bg-success" style="width: ${(meal.proteins / 50) * 100}%"></div>
          </div>
        </div>
      </div>
    `).join('');
    
    topProteinMealsContainer.innerHTML = html;
  };
  
  // Render balanced meals
  const renderBalancedMeals = (meals) => {
    if (!balancedMealsContainer) return;
    
    if (!meals || meals.length === 0) {
      balancedMealsContainer.innerHTML = `
        <div class="alert alert-info mb-0">
          <i class="bi bi-info-circle"></i> Aucun repas à afficher.
        </div>
      `;
      return;
    }
    
    const html = meals.map((meal, index) => {
      const totalMacros = meal.proteins + meal.carbs + meal.fats;
      const proteinPercent = Math.round((meal.proteins / totalMacros) * 100);
      const carbsPercent = Math.round((meal.carbs / totalMacros) * 100);
      const fatsPercent = Math.round((meal.fats / totalMacros) * 100);
      
      return `
        <div class="card mb-2">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-0">${meal.name}</h6>
                <div class="text-muted small">${Utils.getMealTypeName(meal.mealType)}</div>
              </div>
              <div class="text-end">
                <div class="fw-bold">${meal.calories} kcal</div>
              </div>
            </div>
            <div class="progress mt-2" style="height: 15px;">
              <div class="progress-bar bg-success" style="width: ${proteinPercent}%" 
                data-bs-toggle="tooltip" title="Protéines: ${proteinPercent}%"></div>
              <div class="progress-bar bg-warning" style="width: ${carbsPercent}%" 
                data-bs-toggle="tooltip" title="Glucides: ${carbsPercent}%"></div>
              <div class="progress-bar bg-danger" style="width: ${fatsPercent}%" 
                data-bs-toggle="tooltip" title="Lipides: ${fatsPercent}%"></div>
            </div>
            <div class="d-flex justify-content-between mt-1">
              <small class="text-muted">P: ${proteinPercent}%</small>
              <small class="text-muted">G: ${carbsPercent}%</small>
              <small class="text-muted">L: ${fatsPercent}%</small>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    balancedMealsContainer.innerHTML = html;
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  };
  
  // Render stats cards
  const renderStatsCards = (stats) => {
    if (!statsCardContainer) return;
    
    statsCardContainer.innerHTML = `
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-icon bg-primary text-white">
            <i class="bi bi-calendar-check"></i>
          </div>
          <div class="stat-value">${stats.totalMeals}</div>
          <div class="stat-label">Repas enregistrés</div>
        </div>
      </div>
      
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-icon bg-success text-white">
            <i class="bi bi-fire"></i>
          </div>
          <div class="stat-value">${stats.averageCalories}</div>
          <div class="stat-label">Calories moyennes par repas</div>
        </div>
      </div>
      
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-icon bg-warning text-white">
            <i class="bi bi-egg-fill"></i>
          </div>
          <div class="stat-value">${stats.topProteinMeals.length > 0 ? stats.topProteinMeals[0].proteins : 0}g</div>
          <div class="stat-label">Record de protéines/repas</div>
        </div>
      </div>
      
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-icon bg-info text-white">
            <i class="bi bi-graph-up"></i>
          </div>
          <div class="stat-value">${stats.mostBalancedMeals.length > 0 ? Math.round(stats.mostBalancedMeals[0].calories) : 0}</div>
          <div class="stat-label">Calories du repas le plus équilibré</div>
        </div>
      </div>
    `;
  };
  
  // Render stats page
  const render = () => {
    // Get the stats template
    const template = document.getElementById('statsTemplate');
    const content = template.content.cloneNode(true);
    
    // Clear the page content and append the stats template
    pageContent.innerHTML = '';
    pageContent.appendChild(content);
    
    // Initialize DOM elements
    initElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load stats
    loadStats();
  };
  
  // Public API
  return Object.freeze({
    render
  });
})();

// Make Stats available globally
window.Stats = Stats;
