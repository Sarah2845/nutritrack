/**
 * Meals module for NutriTrack application
 * Handles meal management (creation, listing, editing, deletion)
 * Using functional programming principles
 */

const Meals = (() => {
  // Private variables
  let meals = [];
  let editingMealId = null;
  
  // DOM Elements selectors - will be initialized when the page loads
  let pageContent;
  let mealsList;
  let addMealBtn;
  let mealFiltersForm;
  let mealModal;
  let mealForm;
  let mealModalTitle;
  let saveMealBtn;
  
  // Initialize DOM elements
  const initElements = () => {
    pageContent = document.getElementById('pageContent');
    mealsList = document.getElementById('mealsList');
    addMealBtn = document.getElementById('addMealBtn');
    mealFiltersForm = document.getElementById('mealFiltersForm');
    mealModal = new bootstrap.Modal(document.getElementById('mealModal'));
    mealForm = document.getElementById('mealForm');
    mealModalTitle = document.getElementById('mealModalTitle');
    saveMealBtn = document.getElementById('saveMealBtn');
  };
  
  // Set up event listeners
  const setupEventListeners = () => {
    // Add meal button
    addMealBtn.addEventListener('click', () => {
      openAddMealModal();
    });
    
    // Filter form
    mealFiltersForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters();
    });
    
    // Reset filters
    mealFiltersForm.addEventListener('reset', () => {
      setTimeout(() => {
        applyFilters();
      }, 0);
    });
    
    // Save meal button
    saveMealBtn.addEventListener('click', () => {
      if (mealForm.checkValidity()) {
        saveMeal();
      } else {
        mealForm.reportValidity();
      }
    });
  };
  
  // Open modal for adding a new meal
  const openAddMealModal = () => {
    editingMealId = null;
    mealModalTitle.textContent = 'Ajouter un repas';
    mealForm.reset();
    
    // Set default date to today
    document.getElementById('mealDate').value = Utils.getTodayDate();
    
    // Set default meal type based on time of day
    const hour = new Date().getHours();
    let defaultMealType = 'other';
    
    if (hour >= 5 && hour < 10) {
      defaultMealType = 'breakfast';
    } else if (hour >= 10 && hour < 15) {
      defaultMealType = 'lunch';
    } else if (hour >= 15 && hour < 22) {
      defaultMealType = 'dinner';
    }
    
    document.getElementById('mealTypeInput').value = defaultMealType;
    
    mealModal.show();
  };
  
  // Open modal for editing a meal
  const openEditMealModal = async (mealId) => {
    try {
      Utils.showSpinner('Chargement du repas...');
      
      const response = await API.meals.getById(mealId);
      const meal = response.meal;
      
      editingMealId = mealId;
      mealModalTitle.textContent = 'Modifier le repas';
      
      // Fill the form with meal data
      document.getElementById('mealId').value = meal.id;
      document.getElementById('mealName').value = meal.name;
      document.getElementById('mealDescription').value = meal.description || '';
      document.getElementById('mealDate').value = meal.date;
      document.getElementById('mealTypeInput').value = meal.mealType;
      document.getElementById('mealCalories').value = meal.calories;
      document.getElementById('mealProteins').value = meal.proteins;
      document.getElementById('mealCarbs').value = meal.carbs;
      document.getElementById('mealFats').value = meal.fats;
      
      mealModal.show();
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors du chargement du repas', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Save meal (create or update)
  const saveMeal = async () => {
    try {
      Utils.showSpinner(editingMealId ? 'Mise à jour du repas...' : 'Création du repas...');
      
      // Get form data
      const mealData = {
        name: document.getElementById('mealName').value,
        description: document.getElementById('mealDescription').value,
        date: document.getElementById('mealDate').value,
        mealType: document.getElementById('mealTypeInput').value,
        calories: Number(document.getElementById('mealCalories').value),
        proteins: Number(document.getElementById('mealProteins').value),
        carbs: Number(document.getElementById('mealCarbs').value),
        fats: Number(document.getElementById('mealFats').value)
      };
      
      let response;
      
      if (editingMealId) {
        // Update existing meal
        response = await API.meals.update(editingMealId, mealData);
        Utils.showToast('Repas mis à jour avec succès', 'success');
      } else {
        // Create new meal
        response = await API.meals.create(mealData);
        Utils.showToast('Repas ajouté avec succès', 'success');
      }
      
      // Close modal and reload meals
      mealModal.hide();
      loadMeals();
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de l\'enregistrement du repas', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Delete a meal
  const deleteMeal = async (mealId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce repas ?')) {
      return;
    }
    
    try {
      Utils.showSpinner('Suppression du repas...');
      
      await API.meals.delete(mealId);
      
      Utils.showToast('Repas supprimé avec succès', 'success');
      
      // Reload meals
      loadMeals();
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de la suppression du repas', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Apply filters and load meals
  const applyFilters = () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const mealType = document.getElementById('mealType').value;
    
    loadMeals(startDate, endDate, mealType);
  };
  
  // Load meals with optional filters
  const loadMeals = async (startDate = '', endDate = '', mealType = '') => {
    try {
      Utils.showSpinner('Chargement des repas...');
      
      // Build filters object
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (mealType) filters.mealType = mealType;
      
      // Update filter inputs if provided
      if (startDate) document.getElementById('startDate').value = startDate;
      if (endDate) document.getElementById('endDate').value = endDate;
      if (mealType) document.getElementById('mealType').value = mealType;
      
      // Call API
      const response = await API.meals.getAll(filters);
      meals = response.meals;
      
      // Render meals
      renderMeals(meals);
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors du chargement des repas', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Render meals list
  const renderMeals = (meals) => {
    if (!mealsList) return;
    
    if (meals.length === 0) {
      mealsList.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> Aucun repas trouvé. Ajoutez un nouveau repas en cliquant sur le bouton "Nouveau repas".
        </div>
      `;
      return;
    }
    
    // Group meals by date
    const mealsByDate = Utils.groupMealsByDate(meals);
    
    // Sort dates in descending order
    const sortedDates = Object.keys(mealsByDate).sort().reverse();
    
    // Generate HTML
    const html = sortedDates.map(date => {
      const dailyMeals = mealsByDate[date];
      
      // Sort meals by type
      const sortedMeals = R.sortBy(meal => {
        const typeOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4, other: 5 };
        return typeOrder[meal.mealType] || 999;
      }, dailyMeals);
      
      // Calculate daily totals
      const totals = Utils.calculateTotals(dailyMeals);
      
      return `
        <div class="date-group mb-4">
          <h5 class="date-header">${Utils.formatDateLong(date)}</h5>
          <div class="daily-summary mb-3">
            <span class="badge bg-primary rounded-pill">
              <i class="bi bi-fire"></i> ${totals.calories} kcal
            </span>
            <span class="badge bg-success rounded-pill">
              <i class="bi bi-egg-fill"></i> ${totals.proteins}g
            </span>
            <span class="badge bg-warning rounded-pill">
              <i class="bi bi-circle-fill"></i> ${totals.carbs}g
            </span>
            <span class="badge bg-danger rounded-pill">
              <i class="bi bi-droplet-fill"></i> ${totals.fats}g
            </span>
          </div>
          <div class="meals-list">
            ${sortedMeals.map(meal => `
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
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
    
    mealsList.innerHTML = html;
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-meal-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const mealId = e.target.closest('.edit-meal-btn').dataset.id;
        openEditMealModal(mealId);
      });
    });
    
    document.querySelectorAll('.delete-meal-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const mealId = e.target.closest('.delete-meal-btn').dataset.id;
        deleteMeal(mealId);
      });
    });
  };
  
  // Check if we should open the add/edit meal modal based on URL parameters
  const checkUrlParameters = () => {
    const action = Utils.getQueryParam('action');
    const id = Utils.getQueryParam('id');
    
    if (action === 'new') {
      openAddMealModal();
    } else if (action === 'edit' && id) {
      openEditMealModal(id);
    }
  };
  
  // Render meals page
  const render = () => {
    // Get the meals template
    const template = document.getElementById('mealsTemplate');
    const content = template.content.cloneNode(true);
    
    // Clear the page content and append the meals template
    pageContent.innerHTML = '';
    pageContent.appendChild(content);
    
    // Initialize DOM elements
    initElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load meals
    loadMeals();
    
    // Check URL parameters
    checkUrlParameters();
  };
  
  // Public API
  return Object.freeze({
    render
  });
})();

// Make Meals available globally
window.Meals = Meals;
