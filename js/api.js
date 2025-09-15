// api.js - API communication layer for restaurant operations

/**
 * API Configuration
 */
const API_CONFIG = {
  baseURL: '/api', // Adjust based on your server setup
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

/**
 * Generic API request handler with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  const config = {
    headers: API_CONFIG.headers,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { 
      success: false, 
      error: error.message || 'Network error occurred' 
    };
  }
}

/**
 * Restaurant Information API
 */
const RestaurantAPI = {
  /**
   * Get restaurant details and operating hours
   */
  async getInfo(restaurantId = 1) {
    return apiRequest(`/restaurant/${restaurantId}`);
  },

  /**
   * Get current operating status
   */
  async getStatus(restaurantId = 1) {
    const result = await this.getInfo(restaurantId);
    
    if (result.success) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5);
      
      const todayHours = result.data.operatingHours?.find(h => h.day_of_week === currentDay);
      
      if (!todayHours || todayHours.is_closed) {
        return { ...result, data: { ...result.data, isOpen: false, status: 'closed' } };
      }
      
      const isOpen = currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
      return { 
        ...result, 
        data: { 
          ...result.data, 
          isOpen, 
          status: isOpen ? 'open' : 'closed',
          todayHours 
        } 
      };
    }
    
    return result;
  }
};

/**
 * Reservation API
 */
const ReservationAPI = {
  /**
   * Check availability for specific date and party size
   */
  async checkAvailability(date, partySize, restaurantId = 1) {
    const params = new URLSearchParams({
      date,
      partySize: partySize.toString(),
      restaurantId: restaurantId.toString()
    });
    
    return apiRequest(`/availability?${params}`);
  },

  /**
   * Create a new reservation
   */
  async create(reservationData) {
    return apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
  },

  /**
   * Get reservation details by confirmation number
   */
  async getByConfirmation(confirmationNumber) {
    return apiRequest(`/reservations/${confirmationNumber}`);
  },

  /**
   * Cancel a reservation
   */
  async cancel(confirmationNumber) {
    return apiRequest(`/reservations/${confirmationNumber}`, {
      method: 'DELETE'
    });
  },

  /**
   * Update a reservation (modify party size, time, etc.)
   */
  async update(confirmationNumber, updateData) {
    return apiRequest(`/reservations/${confirmationNumber}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }
};

/**
 * Menu API (for future dynamic menu management)
 */
const MenuAPI = {
  /**
   * Get current menu items
   */
  async getItems(category = null) {
    const params = category ? `?category=${category}` : '';
    return apiRequest(`/menu${params}`);
  },

  /**
   * Get daily specials
   */
  async getSpecials() {
    return apiRequest('/menu/specials');
  },

  /**
   * Get dish of the day
   */
  async getDishOfDay() {
    return apiRequest('/menu/dish-of-day');
  }
};

/**
 * Reviews API
 */
const ReviewsAPI = {
  /**
   * Get restaurant reviews
   */
  async getReviews(restaurantId = 1, limit = 10) {
    const params = new URLSearchParams({
      restaurantId: restaurantId.toString(),
      limit: limit.toString()
    });
    
    return apiRequest(`/reviews?${params}`);
  },

  /**
   * Submit a new review
   */
  async submit(reviewData) {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }
};

/**
 * Utility functions for common API operations
 */
const APIUtils = {
  /**
   * Show loading state
   */
  showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `<div class="loading">${message}</div>`;
    }
  },

  /**
   * Show error message
   */
  showError(elementId, message = 'Something went wrong') {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `<div class="error">❌ ${message}</div>`;
    }
  },

  /**
   * Format date for API calls
   */
  formatDate(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number format
   */
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
};

/**
 * Enhanced Reservation Flow Integration
 */
const ReservationFlow = {
  /**
   * Initialize reservation process
   */
  async start() {
    try {
      // Check if restaurant is open
      const statusResult = await RestaurantAPI.getStatus();
      
      if (!statusResult.success) {
        throw new Error('Unable to check restaurant status');
      }
      
      // You could redirect to reservation page or show modal
      window.location.href = '/reservation.html';
      
    } catch (error) {
      console.error('Error starting reservation:', error);
      alert('Sorry, reservations are not available right now. Please call us directly.');
    }
  },

  /**
   * Get available time slots for date picker
   */
  async getAvailableSlots(date, partySize) {
    APIUtils.showLoading('timeSlots', 'Checking availability...');
    
    const result = await ReservationAPI.checkAvailability(date, partySize);
    
    if (result.success) {
      return result.data.availableSlots || [];
    } else {
      APIUtils.showError('timeSlots', result.error);
      return [];
    }
  },

  /**
   * Submit reservation with validation
   */
  async submitReservation(formData) {
    // Validate required fields
    const required = ['guestName', 'guestEmail', 'guestPhone', 'partySize', 'date', 'time'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      return { success: false, error: `Missing required fields: ${missing.join(', ')}` };
    }
    
    // Validate email and phone
    if (!APIUtils.isValidEmail(formData.guestEmail)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    
    if (!APIUtils.isValidPhone(formData.guestPhone)) {
      return { success: false, error: 'Please enter a valid phone number' };
    }
    
    // Submit to API
    return await ReservationAPI.create(formData);
  }
};

/**
 * Real-time features (if using WebSocket)
 */
const RealTimeAPI = {
  /**
   * Initialize WebSocket connection for real-time updates
   */
  initWebSocket() {
    if (typeof WebSocket === 'undefined') return;
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleRealTimeUpdate(data);
      };
      
      ws.onerror = (error) => {
        console.log('WebSocket connection failed, using polling instead');
      };
      
      return ws;
    } catch (error) {
      console.log('WebSocket not available, using polling instead');
      return null;
    }
  },

  /**
   * Handle real-time updates
   */
  handleRealTimeUpdate(data) {
    switch (data.type) {
      case 'availability_changed':
        // Update availability display
        if (window.updateAvailability) {
          window.updateAvailability(data.payload);
        }
        break;
      case 'restaurant_status_changed':
        // Update restaurant status
        if (window.updateRestaurantStatus) {
          window.updateRestaurantStatus(data.payload);
        }
        break;
    }
  }
};

/**
 * Initialize API connections
 */
function initializeAPI() {
  // Set up real-time connections if needed
  RealTimeAPI.initWebSocket();
  
  console.log('🔌 API layer initialized');
}

/**
 * Export for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RestaurantAPI,
    ReservationAPI,
    MenuAPI,
    ReviewsAPI,
    APIUtils,
    ReservationFlow,
    RealTimeAPI,
    initializeAPI
  };
}

/**
 * Global API object for easy access
 */
window.BayanihanAPI = {
  Restaurant: RestaurantAPI,
  Reservation: ReservationAPI,
  Menu: MenuAPI,
  Reviews: ReviewsAPI,
  Utils: APIUtils,
  Flow: ReservationFlow,
  RealTime: RealTimeAPI
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAPI);