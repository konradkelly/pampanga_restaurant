// client.js - Frontend functionality for Bayanihan Eatery

/**
 * Utility Functions
 */
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
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
  items.forEach(item => {
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
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenu(btn.dataset.filter);
    });
  });
}

/**
 * Dish of the Day
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
  const idx = new Date().getDay() % dishes.length;
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
const kamayan = ['Grilled Pusit','Inihaw na Manok','Liempo','Talong','Okra','Ensaladang Mangga'];
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
 * Reviews
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
    const stars = '★'.repeat(review.stars)+'☆'.repeat(5-review.stars);
    card.innerHTML = `<div class="stars" aria-label="${review.stars} out of 5 stars">${stars}</div><strong>${review.name}</strong><p>${review.text}</p>`;
    track.append(card);
  });
}

/**
 * Header Scroll
 */
function setupScrollHeader() {
  const header = document.querySelector('header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 6 ? 'var(--shadow-sm)' : 'none';
  });
}

/**
 * Reservation
 */
function handleReservationButton() { scrollToId('visit'); }

function handleReservationFormSubmit(event) {
  event.preventDefault();
  const form = event.target;

    // Format time to HH:MM:SS
  const timeValue = form.time.value;
  const formattedTime = timeValue.length === 5 ? timeValue + ':00' : timeValue;

  const partySizeValue = parseInt(form.partySize.value, 10);

  if (Number.isNaN(partySizeValue) || partySizeValue < 1) {
    alert('Please enter a valid party size (1 or more).');
    return;
  }

  if (partySizeValue > 10) {
    alert('We currently accept parties up to 10 guests. For larger groups, please call the restaurant.');
    return;
  }

  const formData = {
    guestName: form.guestName.value.trim(),
    guestEmail: form.guestEmail.value.trim(),
    guestPhone: form.guestPhone.value.trim(),
    partySize: partySizeValue,
    date: form.date.value,
    time: formattedTime
  };

  // Async IIFE to call ReservationFlow
  (async () => {
    try {
      const result = await PampanganAPI.Flow.submitReservation(formData);
      if (result.success) {
        alert(`✅ Reservation confirmed! Your confirmation number is: ${result.data?.confirmationNumber || 'N/A'}`);
        form.reset();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Reservation submit error:', err);
      alert('❌ Something went wrong. Please try again.');
    }
  })();
}


/**
 * Initialize App
 */
function initializeApp() {
  setDishOfDay();
  renderKamayan();
  renderMenu();
  setupTabs();
  renderReviews();
  setupScrollHeader();

  // Attach scroll-to-visit only to CTAs that are meant to scroll, not to modal triggers.
  document.querySelectorAll('.cta').forEach(btn => {
    // If this button is a modal trigger (has aria-controls or data-modal), skip adding the scroll behavior
    if (btn.hasAttribute('aria-controls') || btn.dataset.modal !== undefined) return;
    if (btn.textContent.includes('Reserve')) btn.addEventListener('click', handleReservationButton);
  });

  const reservationForm = document.getElementById('reservationForm');
  if (reservationForm) reservationForm.addEventListener('submit', handleReservationFormSubmit);

  console.log('🍽️ Pampangan Restaurant initialized successfully!');
}

// DOM ready
document.addEventListener('DOMContentLoaded', initializeApp);
