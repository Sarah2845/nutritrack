/**
 * Profile module for NutriTrack application
 * Handles user profile management and data export
 * Using functional programming principles
 */

const Profile = (() => {
  // Private variables
  let userProfile = null;
  
  // DOM Elements selectors - will be initialized when the page loads
  let pageContent;
  let profileForm;
  let exportJsonBtn;
  let exportCsvBtn;
  let deleteAccountBtn;
  
  // Initialize DOM elements
  const initElements = () => {
    pageContent = document.getElementById('pageContent');
    profileForm = document.getElementById('profileForm');
    exportJsonBtn = document.getElementById('exportJsonBtn');
    exportCsvBtn = document.getElementById('exportCsvBtn');
    deleteAccountBtn = document.getElementById('deleteAccountBtn');
  };
  
  // Set up event listeners
  const setupEventListeners = () => {
    // Export to JSON button
    exportJsonBtn.addEventListener('click', () => {
      exportDataToJson();
    });
    
    // Export to CSV button
    exportCsvBtn.addEventListener('click', () => {
      exportDataToCsv();
    });
    
    // Delete account button
    deleteAccountBtn.addEventListener('click', () => {
      confirmDeleteAccount();
    });
  };
  
  // Load user profile
  const loadProfile = async () => {
    try {
      Utils.showSpinner('Chargement du profil...');
      
      // Get profile from Auth module or API
      const user = Auth.getCurrentUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      userProfile = user;
      
      // Update profile form with user data
      document.getElementById('profileUsername').value = user.username;
      document.getElementById('profileEmail').value = user.email;
      
      // Format join date
      const joinDate = new Date(user.createdAt);
      document.getElementById('profileJoinDate').value = joinDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors du chargement du profil', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Export user data to JSON file
  const exportDataToJson = async () => {
    try {
      Utils.showSpinner('Préparation de l\'export JSON...');
      
      // Get user meals
      const mealsResponse = await API.meals.getAll();
      const meals = mealsResponse.meals;
      
      // Get user goals
      const goalsResponse = await API.goals.getAll();
      const goals = goalsResponse.goals;
      
      // Prepare export data
      const exportData = {
        user: {
          username: userProfile.username,
          email: userProfile.email,
          createdAt: userProfile.createdAt
        },
        meals,
        goals,
        exportDate: new Date().toISOString()
      };
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `nutritrack-export-${date}.json`;
      
      // Export to JSON file
      Utils.exportToJson(exportData, filename);
      
      Utils.showToast('Données exportées avec succès', 'success');
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de l\'export', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Export user data to CSV file
  const exportDataToCsv = async () => {
    try {
      Utils.showSpinner('Préparation de l\'export CSV...');
      
      // Get user meals
      const mealsResponse = await API.meals.getAll();
      const meals = mealsResponse.meals;
      
      // Prepare meals for CSV export
      const mealsForExport = meals.map(meal => ({
        name: meal.name,
        description: meal.description || '',
        date: meal.date,
        mealType: Utils.getMealTypeName(meal.mealType),
        calories: meal.calories,
        proteins: meal.proteins,
        carbs: meal.carbs,
        fats: meal.fats
      }));
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `nutritrack-meals-${date}.csv`;
      
      // Export to CSV file
      Utils.exportToCsv(mealsForExport, filename);
      
      Utils.showToast('Données exportées avec succès', 'success');
    } catch (error) {
      Utils.showToast(error.message || 'Erreur lors de l\'export', 'error');
    } finally {
      Utils.hideSpinner();
    }
  };
  
  // Confirm account deletion
  const confirmDeleteAccount = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.')) {
      // In a real app, we would call an API to delete the account
      // For this demo, we'll just log the user out
      Auth.logout();
      Utils.showToast('Compte supprimé avec succès', 'success');
    }
  };
  
  // Render profile page
  const render = () => {
    // Get the profile template
    const template = document.getElementById('profileTemplate');
    const content = template.content.cloneNode(true);
    
    // Clear the page content and append the profile template
    pageContent.innerHTML = '';
    pageContent.appendChild(content);
    
    // Initialize DOM elements
    initElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load profile data
    loadProfile();
  };
  
  // Public API
  return Object.freeze({
    render
  });
})();

// Make Profile available globally
window.Profile = Profile;
