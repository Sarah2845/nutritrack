/**
 * Main Application Module for NutriTrack
 * Handles routing, page navigation, and app initialization
 * Using functional programming principles
 */

const App = (() => {
  // Private variables
  let currentPage = '';
  
  // DOM Elements
  const app = document.getElementById('app');
  const navLinks = document.querySelectorAll('.nav-link[data-page]');
  const pageContent = document.getElementById('pageContent');
  
  // Map of page names to their respective module render functions
  const pages = {
    dashboard: Dashboard.render,
    meals: Meals.render,
    goals: Goals.render,
    stats: Stats.render,
    profile: Profile.render
  };
  
  // Initialize app
  const init = () => {
    // Set up event listeners
    setupEventListeners();
    
    // Handle initial route
    handleRouteChange();
    
    // Add auth check listener
    checkAuthentication();
  };
  
  // Set up event listeners
  const setupEventListeners = () => {
    // Handle nav link clicks
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        navigateTo(page);
      });
    });
    
    // Handle hash change
    window.addEventListener('hashchange', handleRouteChange);
  };
  
  // Handle route change based on hash
  const handleRouteChange = () => {
    // Get page from hash (e.g., #dashboard)
    const hash = window.location.hash.substring(1); // Remove # character
    
    // Get page name and query parameters
    const [pageName, queryString] = hash.split('?');
    
    // Default to dashboard if no hash or unknown page
    const page = pageName && pages[pageName] ? pageName : 'dashboard';
    
    // Only render if page changed
    if (page !== currentPage) {
      renderPage(page);
      currentPage = page;
      
      // Update active nav link
      updateActiveNavLink(page);
    }
  };
  
  // Update active navigation link
  const updateActiveNavLink = (page) => {
    // Remove active class from all nav links
    navLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current page link
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  };
  
  // Navigate to a page
  const navigateTo = (page) => {
    window.location.hash = page;
  };
  
  // Render a page
  const renderPage = (page) => {
    if (pages[page]) {
      // Check if user is authenticated
      if (Auth.isAuthenticated()) {
        pages[page]();
      } else {
        // If not authenticated, show auth container
        Auth.showAuth();
      }
    } else {
      console.error(`Page "${page}" not found`);
      navigateTo('dashboard');
    }
  };
  
  // Check authentication and handle accordingly
  const checkAuthentication = () => {
    if (!Auth.isAuthenticated()) {
      // Show the auth container if not authenticated
      Auth.showAuth();
    }
  };
  
  // Public API
  const publicAPI = Object.freeze({
    init,
    navigateTo
  });
  
  // Rendre disponible globalement
  window.App = publicAPI;
  
  return publicAPI;
})();

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
