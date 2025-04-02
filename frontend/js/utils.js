/**
 * Utility functions for the NutriTrack application
 * Using functional programming principles
 */

// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Pure functions for data transformation
const Utils = {
  // Format date to YYYY-MM-DD
  formatDate: (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  
  // Get today's date in YYYY-MM-DD format
  getTodayDate: () => Utils.formatDate(new Date()),
  
  // Format date to locale format (e.g., "Monday, January 1, 2023")
  formatDateLong: (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  },
  
  // Immutable way to update an object
  updateObject: (obj, updates) => Object.freeze({...obj, ...updates}),
  
  // Pipe functions (similar to Ramda's pipe but without dependency)
  pipe: (...fns) => (x) => fns.reduce((y, f) => f(y), x),
  
  // Calculate total nutrition from an array of meals
  calculateTotals: (meals) => meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      proteins: totals.proteins + (meal.proteins || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fats: totals.fats + (meal.fats || 0)
    }),
    { calories: 0, proteins: 0, carbs: 0, fats: 0 }
  ),
  
  // Calculate percentage of goal reached (capped at 100%)
  calculatePercentage: (value, goal) => Math.min(100, Math.round((value / goal) * 100)),
  
  // Calculate progress for each nutrient
  calculateProgress: (totals, goals) => ({
    calories: Utils.calculatePercentage(totals.calories, goals.calories),
    proteins: Utils.calculatePercentage(totals.proteins, goals.proteins),
    carbs: Utils.calculatePercentage(totals.carbs, goals.carbs),
    fats: Utils.calculatePercentage(totals.fats, goals.fats)
  }),
  
  // Calculate remaining nutrients
  calculateRemaining: (totals, goals) => ({
    calories: Math.max(0, goals.calories - totals.calories),
    proteins: Math.max(0, goals.proteins - totals.proteins),
    carbs: Math.max(0, goals.carbs - totals.carbs),
    fats: Math.max(0, goals.fats - totals.fats)
  }),
  
  // Group meals by date
  groupMealsByDate: (meals) => 
    meals.reduce((grouped, meal) => {
      const date = meal.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(meal);
      return grouped;
    }, {}),
  
  // Get meal type display name
  getMealTypeName: (type) => {
    const types = {
      breakfast: 'Petit-déjeuner',
      lunch: 'Déjeuner',
      dinner: 'Dîner',
      snack: 'Collation',
      other: 'Autre'
    };
    return types[type] || 'Repas';
  },
  
  // Filter meals by date range
  filterMealsByDateRange: (meals, startDate, endDate) => 
    meals.filter(meal => 
      (!startDate || meal.date >= startDate) && 
      (!endDate || meal.date <= endDate)
    ),
  
  // Show a toast notification
  showToast: (message, type = 'info') => {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set message and styling
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    
    // Create Bootstrap toast instance and show it
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  },
  
  // Show a loading spinner
  showSpinner: (message = 'Chargement en cours...') => {
    // Create spinner element if it doesn't exist
    if (!document.getElementById('spinnerOverlay')) {
      const spinnerHTML = `
        <div id="spinnerOverlay" class="spinner-overlay">
          <div class="spinner-container">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
            <div id="spinnerMessage" class="spinner-message">${message}</div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', spinnerHTML);
    } else {
      // Update message if spinner already exists
      document.getElementById('spinnerMessage').textContent = message;
      document.getElementById('spinnerOverlay').style.display = 'flex';
    }
  },
  
  // Hide the loading spinner
  hideSpinner: () => {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) {
      spinner.style.display = 'none';
    }
  },
  
  // Format number with thousand separators
  formatNumber: (number) => number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
  
  // Validate email format
  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  // Get initials from a name
  getInitials: (name) => name.split(' ').map(n => n[0]).join('').toUpperCase(),
  
  // Get query string parameter
  getQueryParam: (name) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },
  
  // Export data to JSON file
  exportToJson: (data, filename) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.json';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  },
  
  // Export data to CSV file
  exportToCsv: (data, filename) => {
    // Handle array of objects
    if (data.length && typeof data[0] === 'object') {
      const headers = Object.keys(data[0]);
      let csv = headers.join(',') + '\n';
      
      csv += data.map(row => {
        return headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : row[header];
          // Handle strings with commas, quotes, etc.
          cell = typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell;
          return cell;
        }).join(',');
      }).join('\n');
      
      const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'export.csv';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }
  }
};

// Export as a frozen object to maintain immutability
Object.freeze(Utils);

// Rendre disponible globalement
window.Utils = Utils;
