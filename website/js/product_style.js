/* script.js */
(() => {
  // DOM refs
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const perPageSelect = document.getElementById('perPageSelect');
  const productsGrid = document.getElementById('productsGrid');
  const categoryFilters = document.getElementById('categoryFilters');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const minRatingSelect = document.getElementById('minRating');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const resultsCount = document.getElementById('resultsCount');
  const activeFilters = document.getElementById('activeFilters');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');

  // state
  let state = {
    q: '',
    categories: new Set(),
    minPrice: null,
    maxPrice: null,
    minRating: 0,
    sortBy: 'default',
    page: 1,
    perPage: parseInt(perPageSelect.value, 10)
  };

  // utilities
  const debounce = (fn, delay=250) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), delay); };
  };

  // init categories from PRODUCTS
  const categories = Array.from(new Set(PRODUCTS.map(p=>p.category))).sort();
  function renderCategoryCheckboxes(){
    categoryFilters.innerHTML = '';
    // Add "All" checkbox (select none means all)
    categories.forEach(cat => {
      const id = `cat-${cat.replace(/\s+/g,'-')}`;
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" data-cat="${cat}" id="${id}"> <span>${cat}</span>`;
      categoryFilters.appendChild(label);
    });
  }

  // compute min / max price for placeholders
  function setPricePlaceholders(){
    const prices = PRODUCTS.map(p => Number(p.price)).filter(p => !Number.isNaN(p));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    minPriceInput.placeholder = `Min (${min.toFixed(2)})`;
    maxPriceInput.placeholder = `Max (${max.toFixed(2)})`;
  }

  // read UI filters into state
  function readFiltersFromUI(){
    state.q = (searchInput.value || '').trim().toLowerCase();
    state.categories = new Set(Array.from(categoryFilters.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.dataset.cat));
    const minVal = parseFloat(minPriceInput.value);
    const maxVal = parseFloat(maxPriceInput.value);
    state.minPrice = Number.isFinite(minVal) ? minVal : null;
    state.maxPrice = Number.isFinite(maxVal) ? maxVal : null;
    state.minRating = parseFloat(minRatingSelect.value) || 0;
    state.sortBy = sortSelect.value;
    state.perPage = parseInt(perPageSelect.value, 10) || 12;
    state.page = 1; // reset to first page when filters change
  }

  // filter + sort business logic
  function applyFiltersAndSort(){
    readFiltersFromUI();

    let list = PRODUCTS.slice();

    // search (name + description)
    if (state.q) {
      list = list.filter(p => (p.name + ' ' + p.description).toLowerCase().includes(state.q));
    }

    // categories (if any selected)
    if (state.categories.size > 0) {
      list = list.filter(p => state.categories.has(p.category));
    }

    // price range
    if (state.minPrice !== null) list = list.filter(p => Number(p.price) >= state.minPrice);
    if (state.maxPrice !== null) list = list.filter(p => Number(p.price) <= state.maxPrice);

    // rating
    if (state.minRating && state.minRating > 0) list = list.filter(p => Number(p.rating) >= state.minRating);

    // sort
    switch (state.sortBy) {
      case 'price-asc': list.sort((a,b)=> a.price - b.price); break;
      case 'price-desc': list.sort((a,b)=> b.price - a.price); break;
      case 'rating-desc': list.sort((a,b)=> b.rating - a.rating); break;
      case 'name-asc': list.sort((a,b)=> a.name.localeCompare(b.name)); break;
      default: /* relevance/default, keep original order */ break;
    }

    return list;
  }

  // render products (with pagination)
  function renderProducts(){
    const filtered = applyFiltersAndSort();
    const total = filtered.length;
    const perPage = state.perPage;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    // render result count & active filters
    resultsCount.textContent = `${total} product${total !== 1 ? 's' : ''}`;
    renderActiveFilters();

    // build DOM using fragment
    productsGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const p of pageItems) {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.image}" alt="${escapeHtml(p.name)}">
        <h4>${escapeHtml(p.name)}</h4>
        <div class="price-row-small">
          <div class="price">₹${Number(p.price).toFixed(2)}</div>
          <div class="rating">${Number(p.rating).toFixed(1)} ★</div>
        </div>
        <p class="muted small">${escapeHtml(p.description)}</p>
        <div style="margin-top:auto; display:flex; justify-content:space-between; gap:8px;">
          <button data-id="${p.id}" class="btn view">View</button>
          <button data-id="${p.id}" class="btn add">Add to cart</button>
        </div>
      `;
      frag.appendChild(card);
    }
    productsGrid.appendChild(frag);

    // pagination UI
    pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
    prevPageBtn.disabled = state.page <= 1;
    nextPageBtn.disabled = state.page >= totalPages;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderActiveFilters(){
    activeFilters.innerHTML = '';
    const pills = [];
    if (state.q) pills.push({text: `Search: "${state.q}"`});
    if (state.categories.size) state.categories.forEach(c=> pills.push({text: c}));
    if (state.minPrice !== null) pills.push({text: `Min ₹${state.minPrice.toFixed(2)}`});
    if (state.maxPrice !== null) pills.push({text: `Max ₹${state.maxPrice.toFixed(2)}`});
    if (state.minRating > 0) pills.push({text: `Rating ≥ ${state.minRating}`});
    for (const p of pills){
      const el = document.createElement('div');
      el.className = 'filter-pill';
      el.textContent = p.text;
      activeFilters.appendChild(el);
    }
  }

  // events
  const debouncedRender = debounce(() => { state.page = 1; renderProducts(); }, 240);
  searchInput.addEventListener('input', () => { state.q = searchInput.value.trim().toLowerCase(); debouncedRender(); });

  sortSelect.addEventListener('change', () => { state.sortBy = sortSelect.value; state.page = 1; renderProducts(); });
  perPageSelect.addEventListener('change', () => { state.perPage = parseInt(perPageSelect.value,10); state.page = 1; renderProducts(); });

  applyFiltersBtn.addEventListener('click', () => { readFiltersFromUI(); renderProducts(); });
  resetFiltersBtn.addEventListener('click', () => {
    // reset UI
    searchInput.value = '';
    categoryFilters.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
    minPriceInput.value = '';
    maxPriceInput.value = '';
    minRatingSelect.value = '0';
    sortSelect.value = 'default';
    perPageSelect.value = '12';
    state = { q:'', categories:new Set(), minPrice:null, maxPrice:null, minRating:0, sortBy:'default', page:1, perPage:12 };
    renderProducts();
  });

  prevPageBtn.addEventListener('click', () => { if (state.page > 1) { state.page--; renderProducts(); } });
  nextPageBtn.addEventListener('click', () => { state.page++; renderProducts(); });

  // product button demo handlers (delegated)
  productsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('view')) {
      const p = PRODUCTS.find(x=>x.id === id);
      alert(`${p.name}\n\n${p.description}\n\nPrice: ₹${p.price.toFixed(2)} • Rating: ${p.rating}★`);
    } else if (btn.classList.contains('add')) {
      // demo: persist simple cart count in localStorage (optional)
      const cart = JSON.parse(localStorage.getItem('demo_cart') || '[]');
      cart.push(id);
      localStorage.setItem('demo_cart', JSON.stringify(cart));
      alert('Added to cart (demo). Items in cart: ' + cart.length);
    }
  });

  // initialization
  function init(){
    renderCategoryCheckboxes();
    setPricePlaceholders();
    // when a category checkbox changes -> re-render
    categoryFilters.addEventListener('change', () => { state.page = 1; renderProducts(); });
    renderProducts();
  }

  // expose readFiltersFromUI to other handlers
  function readFiltersFromUI(){
    // same as earlier but without resetting page
    state.q = (searchInput.value || '').trim().toLowerCase();
    state.categories = new Set(Array.from(categoryFilters.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.dataset.cat));
    const minVal = parseFloat(minPriceInput.value);
    const maxVal = parseFloat(maxPriceInput.value);
    state.minPrice = Number.isFinite(minVal) ? minVal : null;
    state.maxPrice = Number.isFinite(maxVal) ? maxVal : null;
    state.minRating = parseFloat(minRatingSelect.value) || 0;
    state.sortBy = sortSelect.value;
    state.perPage = parseInt(perPageSelect.value, 10) || 12;
  }

  init();
})();
