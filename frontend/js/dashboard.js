/**
 * Dashboard module for NutriTrack application
 * Handles the main dashboard view and functionality
 * Using functional programming principles
 */

const Dashboard = (() => {
  // Private variables
  let currentDate = Utils.getTodayDate();
  let todaysMeals = [];
  let activeGoal = null;
  
  // DOM Elements selectors - will be initialized when the page loads
  let dashboardContent;
  let currentDateInput;
  let previousDateBtn;
  let nextDateBtn;
  let todayDateBtn;
  let goalProgressContainer;
  let todayMealsContainer;
  let noMealsMessage;
  let nutritionSummaryContainer;
  let recommendationsContainer;
  let addMealBtn;
  let quickAddMealBtn;
  
  // Initialize DOM elements
  const initElements = () => {
    dashboardContent = document.getElementById('pageContent');
    currentDateInput = document.getElementById('currentDate');
    previousDateBtn = document.getElementById('previousDate');
    nextDateBtn = document.getElementById('nextDate');
    todayDateBtn = document.getElementById('todayDate');
    goalProgressContainer = document.getElementById('goalProgress');
    todayMealsContainer = document.getElementById('todayMeals');
    noMealsMessage = document.getElementById('noMealsMessage');
    nutritionSummaryContainer = document.getElementById('nutritionSummary');
    recommendationsContainer = document.getElementById('recommendations');
    addMealBtn = document.getElementById('addMealBtn');
    quickAddMealBtn = document.getElementById('quickAddMealBtn');
  };
  
  // Set up event listeners
  const setupEventListeners = () => {
    // Date navigation
    currentDateInput.addEventListener('change', () => {
      currentDate = currentDateInput.value;
      loadDashboardData();
    });
    
    previousDateBtn.addEventListener('click', () => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - 1);
      currentDate = Utils.formatDate(date);
      currentDateInput.value = currentDate;
      loadDashboardData();
    });
    
    nextDateBtn.addEventListener('click', () => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + 1);
      currentDate = Utils.formatDate(date);
      currentDateInput.value = currentDate;
      loadDashboardData();
    });
    
    todayDateBtn.addEventListener('click', () => {
      currentDate = Utils.getTodayDate();
      currentDateInput.value = currentDate;
      loadDashboardData();
    });
    
    // Add meal buttons
    if (addMealBtn) {
      addMealBtn.addEventListener('click', () => {
        window.location.hash = 'meals?action=new';
      });
    }
    
    if (quickAddMealBtn) {
      quickAddMealBtn.addEventListener('click', () => {
        window.location.hash = 'meals?action=new';
      });
    }
  };
  
  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      Utils.showSpinner('Chargement du tableau de bord...');
      
      // Load active goal
      const goalResponse = await API.goals.getActive();
      activeGoal = goalResponse.goal;
      
      // Load meals for the selected date
      const mealsResponse = await API.meals.getAll({ 
        startDate: currentDate, 
        endDate: currentDate 
      });
      todaysMeals = mealsResponse.meals;
      
      // Load recommendations
      const recommendationsResponse = await API.stats.getRecommendations(currentDate);
      
      // Update UI with loaded data
      updateDashboardUI(todaysMeals, activeGoal, recommendationsResponse);
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors du chargement des données', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Update dashboard UI with data
  const updateDashboardUI = (meals, goal, recommendationsData) => {
    // Set current date in the input
    currentDateInput.value = currentDate;
    
    // Update meals section
    renderMeals(meals);
    
    // Calculate nutrition totals
    const totals = Utils.calculateTotals(meals);
    
    // Update nutrition summary
    renderNutritionSummary(totals, goal);
    
    // Update goal progress
    renderGoalProgress(totals, goal);
    
    // Update recommendations
    renderRecommendations(recommendationsData);
  };
  
  // Render meals list
  const renderMeals = (meals) => {
    if (!todayMealsContainer) return;
    
    if (meals.length === 0) {
      todayMealsContainer.innerHTML = '';
      noMealsMessage.style.display = 'block';
    } else {
      noMealsMessage.style.display = 'none';
      
      // Sort meals by creation time
      const sortedMeals = R.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt), meals);
      
      // Generate HTML for each meal
      const mealsHTML = sortedMeals.map(meal => `
        <div class="card meal-card mb-3 ${meal.mealType}" data-id="${meal.id}">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="meal-time">${Utils.getMealTypeName(meal.mealType)}</div>
                <h5 class="meal-name">${meal.name}</h5>
                ${meal.description ? `<p class="text-muted small">${meal.description}</p>` : ''}
              </div>
              <div class="text-end">
                <h5 class="meal-calories">${meal.calories} kcal</h5>
              </div>
            </div>
            <div class="meal-macros">
              <div><i class="bi bi-egg-fill"></i> <strong>${meal.proteins}g</strong> Protéines</div>
              <div><i class="bi bi-circle-fill"></i> <strong>${meal.carbs}g</strong> Glucides</div>
              <div><i class="bi bi-droplet-fill"></i> <strong>${meal.fats}g</strong> Lipides</div>
            </div>
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-primary edit-meal-btn" data-id="${meal.id}">
                <i class="bi bi-pencil"></i> Modifier
              </button>
              <button class="btn btn-sm btn-outline-danger delete-meal-btn" data-id="${meal.id}">
                <i class="bi bi-trash"></i> Supprimer
              </button>
            </div>
          </div>
        </div>
      `).join('');
      
      todayMealsContainer.innerHTML = mealsHTML;
      
      // Add event listeners for edit and delete buttons
      document.querySelectorAll('.edit-meal-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          const mealId = e.target.closest('.edit-meal-btn').dataset.id;
          window.location.hash = `meals?action=edit&id=${mealId}`;
        });
      });
      
      document.querySelectorAll('.delete-meal-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          const mealId = e.target.closest('.delete-meal-btn').dataset.id;
          if (confirm('Êtes-vous sûr de vouloir supprimer ce repas ?')) {
            try {
              Utils.showSpinner('Suppression du repas...');
              await API.meals.delete(mealId);
              Utils.showToast('Repas supprimé avec succès', 'success');
              loadDashboardData(); // Reload data
            } catch (error) {
              Utils.showToast(error.message || 'Erreur lors de la suppression', 'error');
            } finally {
              Utils.hideSpinner();
            }
          }
        });
      });
    }
  };
  
  // Render nutrition summary
  const renderNutritionSummary = (totals, goal) => {
    if (!nutritionSummaryContainer) return;
    
    if (!goal) {
      nutritionSummaryContainer.innerHTML = `
        <div class="alert alert-info mb-0">
          <i class="bi bi-info-circle"></i> Aucun objectif nutritionnel défini.
          <a href="#goals?action=new" class="alert-link">Définir un objectif</a>
        </div>
      `;
      return;
    }
    
    const remaining = Utils.calculateRemaining(totals, goal);
    
    nutritionSummaryContainer.innerHTML = `
      <div class="nutrition-stat">
        <div class="nutrition-stat-icon calories-icon">
          <i class="bi bi-fire"></i>
        </div>
        <div class="nutrition-stat-content">
          <div class="nutrition-stat-label">Calories</div>
          <div class="nutrition-stat-value">${totals.calories} / ${goal.calories} kcal</div>
          <div class="text-muted small">Reste: ${remaining.calories} kcal</div>
        </div>
      </div>
      
      <div class="nutrition-stat">
        <div class="nutrition-stat-icon proteins-icon">
          <i class="bi bi-egg-fill"></i>
        </div>
        <div class="nutrition-stat-content">
          <div class="nutrition-stat-label">Protéines</div>
          <div class="nutrition-stat-value">${totals.proteins} / ${goal.proteins} g</div>
          <div class="text-muted small">Reste: ${remaining.proteins} g</div>
        </div>
      </div>
      
      <div class="nutrition-stat">
        <div class="nutrition-stat-icon carbs-icon">
          <i class="bi bi-circle-fill"></i>
        </div>
        <div class="nutrition-stat-content">
          <div class="nutrition-stat-label">Glucides</div>
          <div class="nutrition-stat-value">${totals.carbs} / ${goal.carbs} g</div>
          <div class="text-muted small">Reste: ${remaining.carbs} g</div>
        </div>
      </div>
      
      <div class="nutrition-stat">
        <div class="nutrition-stat-icon fats-icon">
          <i class="bi bi-droplet-fill"></i>
        </div>
        <div class="nutrition-stat-content">
          <div class="nutrition-stat-label">Lipides</div>
          <div class="nutrition-stat-value">${totals.fats} / ${goal.fats} g</div>
          <div class="text-muted small">Reste: ${remaining.fats} g</div>
        </div>
      </div>
    `;
  };
  
  // Render goal progress
  const renderGoalProgress = (totals, goal) => {
    if (!goalProgressContainer) return;
    
    if (!goal) {
      goalProgressContainer.innerHTML = `
        <div class="alert alert-info mb-0">
          <i class="bi bi-info-circle"></i> Aucun objectif nutritionnel défini.
          <a href="#goals?action=new" class="alert-link">Définir un objectif</a>
        </div>
      `;
      return;
    }
    
    const progress = Utils.calculateProgress(totals, goal);
    
    goalProgressContainer.innerHTML = `
      <div class="mb-3">
        <label class="form-label d-flex justify-content-between">
          <span>Calories: ${totals.calories} / ${goal.calories} kcal</span>
          <span>${progress.calories}%</span>
        </label>
        <div class="progress">
          <div class="progress-bar bg-primary" role="progressbar" style="width: ${progress.calories}%" 
            aria-valuenow="${progress.calories}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label d-flex justify-content-between">
          <span>Protéines: ${totals.proteins} / ${goal.proteins} g</span>
          <span>${progress.proteins}%</span>
        </label>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar" style="width: ${progress.proteins}%" 
            aria-valuenow="${progress.proteins}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label d-flex justify-content-between">
          <span>Glucides: ${totals.carbs} / ${goal.carbs} g</span>
          <span>${progress.carbs}%</span>
        </label>
        <div class="progress">
          <div class="progress-bar bg-warning" role="progressbar" style="width: ${progress.carbs}%" 
            aria-valuenow="${progress.carbs}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      
      <div class="mb-0">
        <label class="form-label d-flex justify-content-between">
          <span>Lipides: ${totals.fats} / ${goal.fats} g</span>
          <span>${progress.fats}%</span>
        </label>
        <div class="progress">
          <div class="progress-bar bg-danger" role="progressbar" style="width: ${progress.fats}%" 
            aria-valuenow="${progress.fats}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `;
  };
  
  // Render recommendations
  const renderRecommendations = (recommendationsData) => {
    if (!recommendationsContainer) return;
    
    if (!recommendationsData || !recommendationsData.recommendations || recommendationsData.recommendations.length === 0) {
      recommendationsContainer.innerHTML = `
        <div class="alert alert-info mb-0">
          <i class="bi bi-lightbulb"></i> Aucune recommandation disponible pour aujourd'hui.
        </div>
      `;
      return;
    }
    
    const { remaining, recommendations } = recommendationsData;
    
    const recommendationsHTML = recommendations.map(meal => `
      <div class="recommendation-item">
        <div class="recommendation-name">${meal.name}</div>
        <div class="recommendation-macros">
          <div><i class="bi bi-fire"></i> ${meal.calories} kcal</div>
          <div><i class="bi bi-egg-fill"></i> ${meal.proteins}g</div>
          <div><i class="bi bi-circle-fill"></i> ${meal.carbs}g</div>
          <div><i class="bi bi-droplet-fill"></i> ${meal.fats}g</div>
        </div>
        <button class="btn btn-sm btn-outline-primary mt-2 add-recommended-meal" 
                data-meal='${JSON.stringify(meal)}'>
          <i class="bi bi-plus-circle"></i> Ajouter
        </button>
      </div>
    `).join('');
    
    const remainingHTML = `
      <div class="mb-3">
        <h6 class="text-muted">Nutrition restante :</h6>
        <div class="d-flex flex-wrap">
          <div class="me-3"><i class="bi bi-fire"></i> ${remaining.calories} kcal</div>
          <div class="me-3"><i class="bi bi-egg-fill"></i> ${remaining.proteins}g</div>
          <div class="me-3"><i class="bi bi-circle-fill"></i> ${remaining.carbs}g</div>
          <div class="me-3"><i class="bi bi-droplet-fill"></i> ${remaining.fats}g</div>
        </div>
      </div>
    `;
    
    recommendationsContainer.innerHTML = remainingHTML + recommendationsHTML;
    
    // Add event listeners for add recommended meal buttons
    document.querySelectorAll('.add-recommended-meal').forEach(button => {
      button.addEventListener('click', async (e) => {
        try {
          const mealData = JSON.parse(e.target.closest('.add-recommended-meal').dataset.meal);
          
          // Prepare meal data for today's date
          const newMeal = {
            ...mealData,
            date: currentDate,
            id: undefined, // Remove id to create a new meal
            userId: undefined // Remove userId to use the current user's id
          };
          
          Utils.showSpinner('Ajout du repas...');
          await API.meals.create(newMeal);
          Utils.showToast('Repas ajouté avec succès', 'success');
          loadDashboardData(); // Reload data
        } catch (error) {
          Utils.showToast(error.message || 'Erreur lors de l\'ajout du repas', 'error');
        } finally {
          Utils.hideSpinner();
        }
      });
    });
  };
  
  // Render dashboard page
  const render = () => {
    // Get the dashboard template
    const template = document.getElementById('dashboardTemplate');
    const content = template.content.cloneNode(true);
    
    // Clear the page content and append the dashboard template
    dashboardContent.innerHTML = '';
    dashboardContent.appendChild(content);
    
    // Initialize DOM elements
    initElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load dashboard data
    loadDashboardData();
  };
  
  // Public API
  return Object.freeze({
    render
  });
})();

// Make Dashboard available globally
window.Dashboard = Dashboard;
