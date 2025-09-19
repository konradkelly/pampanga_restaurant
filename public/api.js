// api.js - API communication layer for restaurant operations

/**
 * API Configuration
 */
const API_CONFIG = {
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
};

/**
 * Generic API request handler with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const config = { headers: API_CONFIG.headers, ...options };

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
    return { success: false, error: error.message || 'Network error occurred' };
  }
}

/**
 * Restaurant Information API
 */
const RestaurantAPI = {
  async getInfo(restaurantId = 1) {
    return apiRequest(`/restaurant/${restaurantId}`);
  },

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
      return { ...result, data: { ...result.data, isOpen, status: isOpen ? 'open' : 'closed', todayHours } };
    }
    return result;
  }
};

/**
 * Reservation API
 */
const ReservationAPI = {
  async checkAvailability(date, partySize, restaurantId = 1) {
    const params = new URLSearchParams({ date, partySize: partySize.toString(), restaurantId: restaurantId.toString() });
    return apiRequest(`/availability?${params}`);
  },

  async create(reservationData) {
    return apiRequest('/reservations', { method: 'POST', body: JSON.stringify(reservationData) });
  },

  async getByConfirmation(confirmationNumber) {
    return apiRequest(`/reservations/${confirmationNumber}`);
  },

  async cancel(confirmationNumber) {
    return apiRequest(`/reservations/${confirmationNumber}`, { method: 'DELETE' });
  },

  async update(confirmationNumber, updateData) {
    return apiRequest(`/reservations/${confirmationNumber}`, { method: 'PUT', body: JSON.stringify(updateData) });
  }
};

/**
 * Reservation Flow (with validation)
 */
const ReservationFlow = {
  async submitReservation(formData) {
    const required = ['guestName', 'guestEmail', 'guestPhone', 'partySize', 'date', 'time'];
    const missing = required.filter(f => !formData[f]);

    if (missing.length > 0) return { success: false, error: `Missing required fields: ${missing.join(', ')}` };
    if (!APIUtils.isValidEmail(formData.guestEmail)) return { success: false, error: 'Invalid email' };
    if (!APIUtils.isValidPhone(formData.guestPhone)) return { success: false, error: 'Invalid phone number' };

    return await ReservationAPI.create(formData);
  }
};

/**
 * Menu API
 */
const MenuAPI = {
  async getItems(category = null) {
    const params = category ? `?category=${category}` : '';
    return apiRequest(`/menu${params}`);
  },
  async getSpecials() { return apiRequest('/menu/specials'); },
  async getDishOfDay() { return apiRequest('/menu/dish-of-day'); }
};

/**
 * Reviews API
 */
const ReviewsAPI = {
  async getReviews(restaurantId = 1, limit = 10) {
    const params = new URLSearchParams({ restaurantId: restaurantId.toString(), limit: limit.toString() });
    return apiRequest(`/reviews?${params}`);
  },
  async submit(reviewData) {
    return apiRequest('/reviews', { method: 'POST', body: JSON.stringify(reviewData) });
  }
};

/**
 * Utility functions
 */
const APIUtils = {
  showLoading(id, message = 'Loading...') { const el = document.getElementById(id); if (el) el.innerHTML = `<div class="loading">${message}</div>`; },
  showError(id, message = 'Something went wrong') { const el = document.getElementById(id); if (el) el.innerHTML = `<div class="error">❌ ${message}</div>`; },
  formatDate(date) { return date instanceof Date ? date.toISOString().split('T')[0] : date; },
  isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
  isValidPhone(phone) { return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, '')); }
};

/**
 * Real-time API (WebSocket)
 */
const RealTimeAPI = {
  initWebSocket() {
    if (typeof WebSocket === 'undefined') return;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    try {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = e => this.handleRealTimeUpdate(JSON.parse(e.data));
      ws.onerror = () => console.log('WebSocket failed, using polling');
      return ws;
    } catch { console.log('WebSocket not available'); return null; }
  },
  handleRealTimeUpdate(data) {
    switch (data.type) {
      case 'availability_changed': window.updateAvailability?.(data.payload); break;
      case 'restaurant_status_changed': window.updateRestaurantStatus?.(data.payload); break;
    }
  }
};

/**
 * Initialize API
 */
function initializeAPI() { RealTimeAPI.initWebSocket(); console.log('🔌 API layer initialized'); }

/**
 * Expose global API object
 */
window.PampanganAPI = {
  Restaurant: RestaurantAPI,
  Reservation: ReservationAPI,
  Flow: ReservationFlow,
  Menu: MenuAPI,
  Reviews: ReviewsAPI,
  Utils: APIUtils,
  RealTime: RealTimeAPI
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', initializeAPI);
