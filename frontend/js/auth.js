/**
 * Authentication module for NutriTrack application
 * Handles user registration, login, and session management
 * Using functional programming principles
 */

const Auth = (() => {
  // Private variables
  const TOKEN_KEY = 'nutritrack_token';
  const USER_KEY = 'nutritrack_user';
  
  // DOM Elements - Vérifier l'existence des éléments avant de les utiliser
  const authContainer = document.getElementById('authContainer');
  const appContainer = document.getElementById('app'); // Peut ne pas exister sur la page de login
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const usernameDisplay = document.getElementById('username'); // Peut ne pas exister sur la page de login
  const logoutBtn = document.getElementById('logoutBtn'); // Peut ne pas exister sur la page de login
  
  // Event listeners
  const setupEventListeners = () => {
    // Login form submission
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        Utils.showSpinner('Connexion en cours...');
        
        const credentials = {
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value
        };
        
        const response = await API.auth.login(credentials);
        
        // Store token and user data
        saveSession(response.token, response.user);
        
        // Update UI
        updateUIForAuthenticatedUser(response.user);
        showApp();
        
        Utils.showToast('Connexion réussie !', 'success');
      } catch (error) {
        Utils.showToast(error.message || 'Échec de la connexion', 'error');
      } finally {
        Utils.hideSpinner();
      }
    });
    }
    
    // Registration form submission
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        Utils.showSpinner('Création du compte...');
        
        const userData = {
          username: document.getElementById('registerUsername').value,
          email: document.getElementById('registerEmail').value,
          password: document.getElementById('registerPassword').value
        };
        
        const response = await API.auth.register(userData);
        
        // Store token and user data
        saveSession(response.token, response.user);
        
        // Update UI
        updateUIForAuthenticatedUser(response.user);
        showApp();
        
        Utils.showToast('Inscription réussie !', 'success');
      } catch (error) {
        Utils.showToast(error.message || 'Échec de l\'inscription', 'error');
      } finally {
        Utils.hideSpinner();
      }
    });
    }
    
    // Logout button
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!getToken();
  };
  
  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };
  
  // Get current user from localStorage
  const getCurrentUser = () => {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  };
  
  // Save session data to localStorage
  const saveSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };
  
  // Clear session data from localStorage
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };
  
  // Update UI elements for authenticated user
  const updateUIForAuthenticatedUser = (user) => {
    if (usernameDisplay) {
      usernameDisplay.textContent = user.username;
    }
  };
  
  // Show the auth container, hide the app
  const showAuth = () => {
    if (authContainer) {
      authContainer.classList.remove('hidden');
    }
    if (appContainer) {
      appContainer.style.display = 'none';
    }
  };
  
  // Hide the auth container, show the app
  const showApp = () => {
    if (authContainer) {
      authContainer.classList.add('hidden');
    }
    if (appContainer) {
      appContainer.style.display = 'block';
    } else {
      // Si on est sur la page de login et qu'on est authentifié, permettre l'accès aux différentes pages
      const currentPage = window.location.pathname;
      
      // Si on est sur la page de login ou la page d'accueil, rediriger vers le dashboard
      if (currentPage.includes('login.html') || currentPage === '/' || currentPage.endsWith('index.html')) {
        window.location.href = '/dashboard.html';
      }
      // Sinon, rester sur la page actuelle (meal-planner.html, etc.)
    }
  };
  
  // Logout user
  const logout = () => {
    clearSession();
    showAuth();
    // Reset forms
    loginForm.reset();
    registerForm.reset();
    Utils.showToast('Déconnexion réussie', 'info');
  };
  
  // Initialize auth module
  const init = () => {
    setupEventListeners();
    
    // Check if user is already authenticated
    if (isAuthenticated()) {
      const user = getCurrentUser();
      updateUIForAuthenticatedUser(user);
      
      // Vérifier si nous sommes sur la page de login
      if (window.location.pathname.includes('login.html')) {
        // Rediriger vers le dashboard si déjà connecté
        window.location.href = '/dashboard.html';
        return;
      }
      
      showApp();
    } else {
      // Si non authentifié et pas sur les pages autorisées, rediriger
      const allowedPages = ['login.html', 'index.html', '/'];
      const isAllowedPage = allowedPages.some(page => 
        window.location.pathname.includes(page) || window.location.pathname.endsWith(page)
      );
      
      if (!isAllowedPage) {
        window.location.href = '/login.html';
        return;
      }
      
      showAuth();
    }
  };
  
  // Public API
  const publicAPI = Object.freeze({
    init,
    isAuthenticated,
    getCurrentUser,
    getToken,
    showAuth,
    showApp,
    logout
  });
  
  // Rendre disponible globalement
  window.Auth = publicAPI;
  
  return publicAPI;
})();

// Initialize auth when DOM is fully loaded
document.addEventListener('DOMContentLoaded', Auth.init);
