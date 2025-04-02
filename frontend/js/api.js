/**
 * API service for the NutriTrack application
 * Handles all communication with the backend
 * Using functional programming principles
 */

// API service with immutable methods
const API = (() => {
  // Private variables
  const BASE_URL = 'http://localhost:3001/api';
  
  // Helper function to get authentication token
  const getToken = () => localStorage.getItem('nutritrack_token');
  
  // Helper function for making API requests
  const fetchAPI = async (endpoint, options = {}) => {
    // Prepare headers with authentication if token exists
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };
    
    try {
      // Make the fetch request
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      // Parse the JSON response
      const data = await response.json();
      
      // Handle API errors
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };
  
  // Public API methods
  return Object.freeze({
    // Auth endpoints
    auth: Object.freeze({
      register: (userData) => 
        fetchAPI('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData)
        }),
      
      login: (credentials) => 
        fetchAPI('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials)
        }),
      
      getProfile: () => fetchAPI('/auth/profile')
    }),
    
    // Meals endpoints
    meals: Object.freeze({
      getAll: (filters = {}) => {
        // Build query string from filters
        const queryString = Object.entries(filters)
          .filter(([_, value]) => value) // Remove empty filters
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
        
        return fetchAPI(`/meals${queryString ? `?${queryString}` : ''}`);
      },
      
      getById: (id) => fetchAPI(`/meals/${id}`),
      
      create: (mealData) => 
        fetchAPI('/meals', {
          method: 'POST',
          body: JSON.stringify(mealData)
        }),
      
      update: (id, mealData) => 
        fetchAPI(`/meals/${id}`, {
          method: 'PUT',
          body: JSON.stringify(mealData)
        }),
      
      delete: (id) => 
        fetchAPI(`/meals/${id}`, {
          method: 'DELETE'
        }),
      
      getDailyTotals: (startDate, endDate) => {
        const queryParams = [];
        if (startDate) queryParams.push(`startDate=${startDate}`);
        if (endDate) queryParams.push(`endDate=${endDate}`);
        
        const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
        return fetchAPI(`/meals/daily${queryString}`);
      }
    }),
    
    // Goals endpoints
    goals: Object.freeze({
      getAll: () => fetchAPI('/goals'),
      
      getActive: () => fetchAPI('/goals/active'),
      
      getById: (id) => fetchAPI(`/goals/${id}`),
      
      create: (goalData) => 
        fetchAPI('/goals', {
          method: 'POST',
          body: JSON.stringify(goalData)
        }),
      
      update: (id, goalData) => 
        fetchAPI(`/goals/${id}`, {
          method: 'PUT',
          body: JSON.stringify(goalData)
        }),
      
      delete: (id) => 
        fetchAPI(`/goals/${id}`, {
          method: 'DELETE'
        }),
      
      getProgress: (date) => {
        const queryString = date ? `?date=${date}` : '';
        return fetchAPI(`/goals/progress${queryString}`);
      }
    }),
    
    // Stats endpoints
    stats: Object.freeze({
      getAll: () => fetchAPI('/stats'),
      
      getRecommendations: (date) => {
        const queryString = date ? `?date=${date}` : '';
        return fetchAPI(`/stats/recommendations${queryString}`);
      },
      
      getTrends: (startDate, endDate) => {
        const queryParams = [];
        if (startDate) queryParams.push(`startDate=${startDate}`);
        if (endDate) queryParams.push(`endDate=${endDate}`);
        
        const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
        return fetchAPI(`/stats/trends${queryString}`);
      }
    })
  });
})();

// Make API available globally
window.API = API;
