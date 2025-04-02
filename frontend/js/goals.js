/**
 * Goals module for NutriTrack application
 * Handles nutritional goals management
 * Using functional programming principles
 */

const Goals = (() => {
  // Private variables
  let goals = [];
  let editingGoalId = null;
  
  // DOM Elements selectors - will be initialized when the page loads
  let pageContent;
  let activeGoalContainer;
  let currentProgressContainer;
  let goalsListContainer;
  let addGoalBtn;
  let goalModal;
  let goalForm;
  let goalModalTitle;
  let saveGoalBtn;
  
  // Initialize DOM elements
  const initElements = () => {
    pageContent = document.getElementById('pageContent');
    activeGoalContainer = document.getElementById('activeGoal');
    currentProgressContainer = document.getElementById('currentProgress');
    goalsListContainer = document.getElementById('goalsList');
    addGoalBtn = document.getElementById('addGoalBtn');
    goalModal = new bootstrap.Modal(document.getElementById('goalModal'));
    goalForm = document.getElementById('goalForm');
    goalModalTitle = document.getElementById('goalModalTitle');
    saveGoalBtn = document.getElementById('saveGoalBtn');
  };
  
  // Set up event listeners
  const setupEventListeners = () => {
    // Add goal button
    addGoalBtn.addEventListener('click', () => {
      openAddGoalModal();
    });
    
    // Save goal button
    saveGoalBtn.addEventListener('click', () => {
      if (goalForm.checkValidity()) {
        saveGoal();
      } else {
        goalForm.reportValidity();
      }
    });
  };
  
  // Open modal for adding a new goal
  const openAddGoalModal = () => {
    editingGoalId = null;
    goalModalTitle.textContent = 'Ajouter un objectif';
    goalForm.reset();
    
    // Set default values
    document.getElementById('goalStartDate').value = Utils.getTodayDate();
    document.getElementById('goalIsActive').checked = true;
    
    goalModal.show();
  };
  
  // Open modal for editing a goal
  const openEditGoalModal = async (goalId) => {
    try {
      Utils.showSpinner('Chargement de l\'objectif...');
      
      const response = await API.goals.getById(goalId);
      const goal = response.goal;
      
      editingGoalId = goalId;
      goalModalTitle.textContent = 'Modifier l\'objectif';
      
      // Fill the form with goal data
      document.getElementById('goalId').value = goal.id;
      document.getElementById('goalName').value = goal.name;
      document.getElementById('goalCalories').value = goal.calories;
      document.getElementById('goalProteins').value = goal.proteins;
      document.getElementById('goalCarbs').value = goal.carbs;
      document.getElementById('goalFats').value = goal.fats;
      document.getElementById('goalStartDate').value = goal.startDate;
      document.getElementById('goalEndDate').value = goal.endDate || '';
      document.getElementById('goalIsActive').checked = goal.isActive;
      
      goalModal.show();
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors du chargement de l\'objectif', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Save goal (create or update)
  const saveGoal = async () => {
    try {
      Utils.showSpinner(editingGoalId ? 'Mise à jour de l\'objectif...' : 'Création de l\'objectif...');
      
      // Get form data
      const goalData = {
        name: document.getElementById('goalName').value,
        calories: Number(document.getElementById('goalCalories').value),
        proteins: Number(document.getElementById('goalProteins').value),
        carbs: Number(document.getElementById('goalCarbs').value),
        fats: Number(document.getElementById('goalFats').value),
        startDate: document.getElementById('goalStartDate').value,
        endDate: document.getElementById('goalEndDate').value || null,
        isActive: document.getElementById('goalIsActive').checked
      };
      
      let response;
      
      if (editingGoalId) {
        // Update existing goal
        response = await API.goals.update(editingGoalId, goalData);
        Utils.showToast('Objectif mis à jour avec succès', 'success');
      } else {
        // Create new goal
        response = await API.goals.create(goalData);
        Utils.showToast('Objectif ajouté avec succès', 'success');
      }
      
      // Close modal and reload goals
      goalModal.hide();
      loadGoals();
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de l\'enregistrement de l\'objectif', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Delete a goal
  const deleteGoal = async (goalId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
      return;
    }
    
    try {
      Utils.showSpinner('Suppression de l\'objectif...');
      
      await API.goals.delete(goalId);
      
      Utils.showToast('Objectif supprimé avec succès', 'success');
      
      // Reload goals
      loadGoals();
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de la suppression de l\'objectif', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Set a goal as active
  const setActiveGoal = async (goalId) => {
    try {
      Utils.showSpinner('Activation de l\'objectif...');
      
      await API.goals.update(goalId, { isActive: true });
      
      Utils.showToast('Objectif activé avec succès', 'success');
      
      // Reload goals
      loadGoals();
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de l\'activation de l\'objectif', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Load all goals
  const loadGoals = async () => {
    try {
      Utils.showSpinner('Chargement des objectifs...');
      
      // Load active goal
      const activeGoalResponse = await API.goals.getActive();
      const activeGoal = activeGoalResponse.goal;
      
      // Load all goals
      const goalsResponse = await API.goals.getAll();
      goals = goalsResponse.goals;
      
      // Load current progress if there is an active goal
      let progress = null;
      if (activeGoal) {
        const progressResponse = await API.goals.getProgress();
        progress = progressResponse.progress;
      }
      
      // Render goals
      renderActiveGoal(activeGoal);
      renderCurrentProgress(progress);
      renderGoalsList(goals);
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors du chargement des objectifs', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Render active goal
  const renderActiveGoal = (goal) => {
    if (!activeGoalContainer) return;
    
    if (!goal) {
      activeGoalContainer.innerHTML = `
        <div class="alert alert-info mb-0">
          <i class="bi bi-info-circle"></i> Aucun objectif nutritionnel actif.
          <button class="btn btn-primary btn-sm ms-2" id="quickAddGoalBtn">
            <i class="bi bi-plus-circle"></i> Définir un objectif
          </button>
        </div>
      `;
      
      // Add event listener for quick add button
      const quickAddBtn = document.getElementById('quickAddGoalBtn');
      if (quickAddBtn) {
        quickAddBtn.addEventListener('click', openAddGoalModal);
      }
      
      return;
    }
    
    // Format dates
    const startDate = Utils.formatDateLong(goal.startDate);
    const endDate = goal.endDate ? Utils.formatDateLong(goal.endDate) : 'En cours';
    
    activeGoalContainer.innerHTML = `
      <div class="card goal-card active">
        <div class="card-body">
          <div class="goal-dates">${startDate} - ${endDate}</div>
          <h5 class="goal-name">${goal.name}</h5>
          
          <div class="goal-macros">
            <div>
              <span>Calories</span>
              <strong>${goal.calories} kcal</strong>
            </div>
            <div>
              <span>Protéines</span>
              <strong>${goal.proteins} g</strong>
            </div>
            <div>
              <span>Glucides</span>
              <strong>${goal.carbs} g</strong>
            </div>
            <div>
              <span>Lipides</span>
              <strong>${goal.fats} g</strong>
            </div>
          </div>
          
          <div class="mt-3">
            <button class="btn btn-sm btn-outline-primary edit-goal-btn" data-id="${goal.id}">
              <i class="bi bi-pencil"></i> Modifier
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for edit button
    const editBtn = activeGoalContainer.querySelector('.edit-goal-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        openEditGoalModal(goal.id);
      });
    }
  };
  
  // Render current progress
  const renderCurrentProgress = (progress) => {
    if (!currentProgressContainer) return;
    
    if (!progress) {
      currentProgressContainer.innerHTML = `
        <div class="alert alert-info mb-0">
          <i class="bi bi-info-circle"></i> Aucune progression à afficher.
          ${!progress ? 'Définissez un objectif actif pour voir votre progression.' : ''}
        </div>
      `;
      return;
    }
    
    currentProgressContainer.innerHTML = `
      <div class="mb-3">
        <label class="form-label d-flex justify-content-between">
          <span>Calories: ${progress.totals.calories} / ${progress.goal.calories} kcal</span>
          <span>${progress.calories}%</span>
        </label>
        <div class="progress">
          <div class="progress-bar bg-primary" role="progressbar" style="width: ${progress.calories}%" 
            aria-valuenow="${progress.calories}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label d-flex justify-content-between">
          <span>Protéines: ${progress.totals.proteins} / ${progress.goal.proteins} g</span>
          <span>${progress.proteins}%</span>
        </label>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar" style="width: ${progress.proteins}%" 
            aria-valuenow="${progress.proteins}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label d-flex justify-content-between">
          <span>Glucides: ${progress.totals.carbs} / ${progress.goal.carbs} g</span>
          <span>${progress.carbs}%</span>
        </label>
        <div class="progress">
          <div class="progress-bar bg-warning" role="progressbar" style="width: ${progress.carbs}%" 
            aria-valuenow="${progress.carbs}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      
      <div class="mb-0">
        <label class="form-label d-flex justify-content-between">
          <span>Lipides: ${progress.totals.fats} / ${progress.goal.fats} g</span>
          <span>${progress.fats}%</span>
        </label>
        <div class="progress">
          <div class="progress-bar bg-danger" role="progressbar" style="width: ${progress.fats}%" 
            aria-valuenow="${progress.fats}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      
      <div class="mt-3 text-center text-muted">
        <small>Date: ${Utils.formatDateLong(progress.date)}</small>
      </div>
    `;
  };
  
  // Render goals list
  const renderGoalsList = (goals) => {
    if (!goalsListContainer) return;
    
    if (goals.length === 0) {
      goalsListContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> Aucun objectif nutritionnel défini.
        </div>
      `;
      return;
    }
    
    // Sort goals by creation date (newest first)
    const sortedGoals = R.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt), goals);
    
    // Generate HTML
    const html = sortedGoals.map(goal => {
      // Format dates
      const startDate = Utils.formatDateLong(goal.startDate);
      const endDate = goal.endDate ? Utils.formatDateLong(goal.endDate) : 'En cours';
      
      return `
        <div class="card goal-card mb-3 ${goal.isActive ? 'active' : 'inactive'}">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <div class="goal-dates">${startDate} - ${endDate}</div>
                <h5 class="goal-name">${goal.name}</h5>
              </div>
              <div>
                ${goal.isActive ? '<span class="badge bg-success">Actif</span>' : ''}
              </div>
            </div>
            
            <div class="goal-macros">
              <div>
                <span>Calories</span>
                <strong>${goal.calories} kcal</strong>
              </div>
              <div>
                <span>Protéines</span>
                <strong>${goal.proteins} g</strong>
              </div>
              <div>
                <span>Glucides</span>
                <strong>${goal.carbs} g</strong>
              </div>
              <div>
                <span>Lipides</span>
                <strong>${goal.fats} g</strong>
              </div>
            </div>
            
            <div class="mt-3">
              ${!goal.isActive ? `
                <button class="btn btn-sm btn-outline-success activate-goal-btn" data-id="${goal.id}">
                  <i class="bi bi-check-circle"></i> Activer
                </button>
              ` : ''}
              <button class="btn btn-sm btn-outline-primary edit-goal-btn" data-id="${goal.id}">
                <i class="bi bi-pencil"></i> Modifier
              </button>
              <button class="btn btn-sm btn-outline-danger delete-goal-btn" data-id="${goal.id}">
                <i class="bi bi-trash"></i> Supprimer
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    goalsListContainer.innerHTML = html;
    
    // Add event listeners for buttons
    document.querySelectorAll('.edit-goal-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const goalId = e.target.closest('.edit-goal-btn').dataset.id;
        openEditGoalModal(goalId);
      });
    });
    
    document.querySelectorAll('.delete-goal-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const goalId = e.target.closest('.delete-goal-btn').dataset.id;
        deleteGoal(goalId);
      });
    });
    
    document.querySelectorAll('.activate-goal-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const goalId = e.target.closest('.activate-goal-btn').dataset.id;
        setActiveGoal(goalId);
      });
    });
  };
  
  // Check if we should open the add/edit goal modal based on URL parameters
  const checkUrlParameters = () => {
    const action = Utils.getQueryParam('action');
    const id = Utils.getQueryParam('id');
    
    if (action === 'new') {
      openAddGoalModal();
    } else if (action === 'edit' && id) {
      openEditGoalModal(id);
    }
  };
  
  // Render goals page
  const render = () => {
    // Get the goals template
    const template = document.getElementById('goalsTemplate');
    const content = template.content.cloneNode(true);
    
    // Clear the page content and append the goals template
    pageContent.innerHTML = '';
    pageContent.appendChild(content);
    
    // Initialize DOM elements
    initElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load goals
    loadGoals();
    
    // Check URL parameters
    checkUrlParameters();
  };
  
  // Public API
  return Object.freeze({
    render
  });
})();

// Make Goals available globally
window.Goals = Goals;
