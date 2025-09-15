// client.js - Frontend functionality for Bayanihan Eatery

/**
 * Utility Functions
 */
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) { 
    el.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
  }
}

function money(n) { 
  return new Intl.NumberFormat(undefined, {
    style: 'currency', 
    currency: 'USD'
  }).format(n); 
}

/**
 * Menu Data & Management
 */
const menuItems = [
  {name:'Lumpiang Shanghai', price:12, cat:'appetizer', desc:'Crispy pork spring rolls with sweet chili.'},
  {name:'Ukoy', price:11, cat:'appetizer', desc:'Shrimp & vegetable fritters.'},
  {name:'Chicken Adobo', price:17, cat:'main', desc:'Soy-vinegar braise, garlic rice.'},
  {name:'Sinigang Baboy', price:18, cat:'main', desc:'Tamarind sour soup with pork.'},
  {name:'Kare-Kare', price:20, cat:'main', desc:'Peanut stew, vegetables, bagoong.'},
  {name:'Pancit Bihon', price:15, cat:'main', desc:'Stir-fried rice noodles, veg, calamansi.'},
  {name:'Turon', price:8, cat:'dessert', desc:'Caramelized banana + jackfruit roll.'},
  {name:'Halo-Halo', price:10, cat:'dessert', desc:'Layered shaved ice, ube, leche flan.'},
  {name:'Buko Pandan', price:9, cat:'dessert', desc:'Coconut jelly with pandan cream.'},
  {name:'Calamansi Juice', price:5, cat:'drinks', desc:'Bright and refreshing.'},
  {name:'Sago\'t Gulaman', price:6, cat:'drinks', desc:'Palm pearls, jelly, arnibal.'},
  {name:'Ube Latte', price:6, cat:'drinks', desc:'House-made ube syrup.'},
];

function renderMenu(filter = 'all') {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  const items = filter === 'all' ? menuItems : menuItems.filter(i => i.cat === filter);
  
  items.forEach((item, idx) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('tabindex', '0');
    
    const img = document.createElement('div');
    img.className = 'card__img';
    img.textContent = item.name.split(' ')[0];
    img.setAttribute('aria-hidden', 'true');
    
    const body = document.createElement('div');
    body.className = 'card__body';
    
    const title = document.createElement('strong');
    title.textContent = item.name;
    
    const desc = document.createElement('p');
    desc.textContent = item.desc;
    
    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = money(item.price);
    
    body.append(title, desc, price);
    card.append(img, body);
    grid.append(card);
  });
}

/**
 * Menu Tabs Setup
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll('.menu-controls .tab');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      // Remove active class from all tabs
      tabButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked tab
      btn.classList.add('active');
      
      // Filter menu
      renderMenu(btn.dataset.filter);
    });
  });
}

/**
 * Dish of the Day Management
 */
const dishes = [
  { name: 'Chicken Adobo', tags: ['Savory','Vinegar','Classic'] },
  { name: 'Sinigang sa Sampalok', tags: ['Tamarind','Sour','Comfort'] },
  { name: 'Kare-Kare', tags: ['Peanut','Rich','Beef/Oxtail'] },
  { name: 'Inihaw na Liempo', tags: ['Grilled','Smoky'] },
  { name: 'Chicken Inasal', tags: ['Calamansi','Achiote'] },
  { name: 'Laing', tags: ['Taro Leaves','Coconut'] },
];

function setDishOfDay() {
  const idx = new Date().getDay() % dishes.length; // rotates daily
  const dish = dishes[idx];
  
  const dishEl = document.getElementById('dishOfDay');
  const tagsEl = document.getElementById('dishTags');
  
  if (!dishEl || !tagsEl) return;
  
  dishEl.textContent = dish.name;
  tagsEl.innerHTML = '';
  
  dish.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'pill';
    span.textContent = tag;
    tagsEl.appendChild(span);
  });
}

/**
 * Kamayan Friday Special
 */
const kamayan = [
  'Grilled Pusit',
  'Inihaw na Manok',
  'Liempo',
  'Talong',
  'Okra',
  'Ensaladang Mangga'
];

function renderKamayan() {
  const wrap = document.getElementById('kamayanList');
  if (!wrap) return;
  
  wrap.innerHTML = '';
  
  kamayan.forEach(item => {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = item;
    wrap.appendChild(pill);
  });
}

/**
 * Reviews Management
 */
const sampleReviews = [
  {name:'Mika', text:'The sinigang tastes like home. Perfect balance of sour and savory!', stars:5},
  {name:'Jordan', text:'Kamayan night was such a vibe—massive spread and fun with friends.', stars:5},
  {name:'Aria', text:'Ube latte + turon = match made in heaven.', stars:4},
  {name:'Luis', text:'Adobo is tender and garlicky; portions are generous.', stars:5},
  {name:'Sam', text:'Halo-halo is loaded and not too sweet. Will be back!', stars:4},
];

function renderReviews() {
  const track = document.getElementById('reviewTrack');
  if (!track) return;
  
  sampleReviews.forEach(review => {
    const card = document.createElement('div');
    card.className = 'review';
    
    const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
    
    card.innerHTML = `
      <div class="stars" aria-label="${review.stars} out of 5 stars">${stars}</div>
      <strong>${review.name}</strong>
      <p>${review.text}</p>
    `;
    
    track.append(card);
  });
}

/**
 * Header Scroll Enhancement
 */
function setupScrollHeader() {
  const header = document.querySelector('header');
  if (!header) return;
  
  let lastY = 0;
  
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.style.boxShadow = y > 6 ? 'var(--shadow-sm)' : 'none';
    lastY = y;
  });
}

/**
 * Reservation Button Handler
 */
function handleReservation() {
  // This will be connected to the reservation system
  // For now, just scroll to visit section
  scrollToId('visit');
  
  // Later this could open a reservation modal or redirect to reservation page
  // window.location.href = '/reservation.html';
}

/**
 * Initialize Application
 */
function initializeApp() {
  // Set up all the dynamic content
  setDishOfDay();
  renderKamayan();
  renderMenu();
  setupTabs();
  renderReviews();
  setupScrollHeader();
  
  // Add event listeners for reservation buttons
  const reserveButtons = document.querySelectorAll('.cta');
  reserveButtons.forEach(btn => {
    if (btn.textContent.includes('Reserve')) {
      btn.addEventListener('click', handleReservation);
    }
  });
  
  console.log('🍽️ Bayanihan Eatery initialized successfully!');
}

/**
 * DOM Content Loaded Event
 */
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Export functions for use in other modules (if using modules)
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    scrollToId,
    money,
    renderMenu,
    setupTabs,
    setDishOfDay,
    renderKamayan,
    renderReviews,
    setupScrollHeader,
    handleReservation,
    initializeApp
  };
}