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
  lastActiveElement: null,

  start() {
    if (document.getElementById('reservationModal')) return;

    // Store the currently focused element
    this.lastActiveElement = document.activeElement;

    const modalHTML = `
      <div id="reservationModal" class="modal" role="dialog" aria-modal="true" aria-hidden="false" aria-labelledby="modalTitle">
        <div class="modal__overlay" data-close></div>
        <div class="modal__panel">
          <button class="modal__close" aria-label="Close reservation form" data-close>&times;</button>
          <h3 id="modalTitle">Reserve a Table</h3>
          <form id="reservationForm">
            <div class="form-group">
              <label for="guestName">Name</label>
              <input type="text" id="guestName" name="guestName" placeholder="Your Name" required>
            </div>
            <div class="form-group">
              <label for="guestEmail">Email</label>
              <input type="email" id="guestEmail" name="guestEmail" placeholder="Your Email" required>
            </div>
            <div class="form-group">
              <label for="guestPhone">Phone</label>
              <input type="tel" id="guestPhone" name="guestPhone" placeholder="Your Phone" required>
            </div>
            <div class="form-row">
              <div class="col">
                <div class="form-group">
                  <label for="partySize">Party Size</label>
                  <input type="number" id="partySize" name="partySize" placeholder="Number of Guests" min="1" max="10" required>
                </div>
              </div>
              <div class="col stack">
                <div class="form-group">
                  <label for="date">Date</label>
                  <input type="date" id="date" name="date" required>
                </div>
                <div class="form-group">
                  <label for="time">Time</label>
                  <input type="time" id="time" name="time" required>
                </div>
              </div>
            </div>
            <div style="display:flex; gap:8px; margin-top:12px;">
              <button type="submit" class="cta">Reserve</button>
              <button type="button" data-close class="cta" style="background:#ccc;color:#000;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    // Hide main content from screen readers
    const main = document.querySelector('main');
    if (main) main.setAttribute('aria-hidden', 'true');

    // Set up event listeners
    this.setupModalEventListeners();

    // Focus management
    requestAnimationFrame(() => {
      const firstInput = document.getElementById('guestName');
      if (firstInput) {
        try {
          firstInput.focus({ preventScroll: true });
        } catch (err) {
          firstInput.focus();
        }
      }
    });
  },

  setupModalEventListeners() {
    const modal = document.getElementById('reservationModal');
    if (!modal) return;

    // Close button handlers
    modal.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    });

    // Overlay click to close
    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close')) {
        e.preventDefault();
        this.close();
      }
    });

    // Form submission
    const form = modal.querySelector('#reservationForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Focus trap and escape key
    modal.addEventListener('keydown', (e) => this.handleKeyDown(e));
  },

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === 'Tab') {
      const modal = document.getElementById('reservationModal');
      if (!modal) return;

      const focusableElements = Array.from(modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null);

      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    }
  },

  close() {
    const modal = document.getElementById('reservationModal');
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
      
      // Restore main content visibility
      const main = document.querySelector('main');
      if (main) main.removeAttribute('aria-hidden');

      // Restore focus to the element that opened the modal
      if (this.lastActiveElement && typeof this.lastActiveElement.focus === 'function') {
        try {
          this.lastActiveElement.focus({ preventScroll: true });
        } catch (err) {
          this.lastActiveElement.focus();
        }
      }
    }
  },

  handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = {
      guestName: form.guestName.value.trim(),
      guestEmail: form.guestEmail.value.trim(), 
      guestPhone: form.guestPhone.value.trim(),
      partySize: parseInt(form.partySize.value, 10),
      date: form.date.value,
      time: form.time.value.length === 5 ? form.time.value + ':00' : form.time.value
    };
    this.submitReservation(formData);
  },

  async submitReservation(formData) {
    const required = ['guestName', 'guestEmail', 'guestPhone', 'partySize', 'date', 'time'];
    const missing = required.filter(f => !formData[f]);

    if (missing.length > 0) return { success: false, error: `Missing required fields: ${missing.join(', ')}` };
    if (!APIUtils.isValidEmail(formData.guestEmail)) return { success: false, error: 'Invalid email' };
    if (!APIUtils.isValidPhone(formData.guestPhone)) return { success: false, error: 'Invalid phone number' };

    const result = await ReservationAPI.create(formData);
    if (result.success) {
      this.close();
      const confirmationNumber = result.data?.id || result.data?.confirmationNumber || `RES-${result.data?.id || 'N/A'}`;
      alert(`Reservation confirmed! Your confirmation number is ${confirmationNumber}`);
    } else {
      alert(`Error: ${result.error}`);
    }
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