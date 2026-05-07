'use strict';

// ========================================
// CONSTANTS
// ========================================

// API attack array names and their display labels
const DMG_KEYS = [
  { api: 'Phy',  label: 'Physical',  filterVal: 'physical',  cssClass: 'physical'  },
  { api: 'Mag',  label: 'Magic',     filterVal: 'magic',     cssClass: 'magic'     },
  { api: 'Fire', label: 'Fire',      filterVal: 'fire',      cssClass: 'fire'      },
  { api: 'Ligt', label: 'Lightning', filterVal: 'lightning', cssClass: 'lightning' },
  { api: 'Holy', label: 'Holy',      filterVal: 'holy',      cssClass: 'holy'      },
];

// API requiredAttributes / scalesWith names keyed by the data-stat HTML attribute
const STAT_MAP = {
  str: 'Str',
  dex: 'Dex',
  int: 'Int',
  fai: 'Fai',
  arc: 'Arc',
};


function categoryColor(index, total) {
  return `hsl(${Math.round(index / total * 360)}, 65%, 60%)`;
}

// ========================================
// DATA ADAPTERS — Real Elden Ring Fan API format
// ========================================

function getDmg(w, apiKey) {
  return w.attack?.find(a => a.name === apiKey)?.amount || 0;
}

function getReq(w, apiKey) {
  return w.requiredAttributes?.find(r => r.name === apiKey)?.amount || 0;
}

function getScale(w, apiKey) {
  if (!w.scalesWith) return '-';
  const entry = w.scalesWith.find(s => s.name === apiKey);
  if (!entry || !entry.scaling) return '-';
  return entry.scaling;
}

function getTotalDamage(w) {
  return DMG_KEYS.reduce((sum, d) => sum + getDmg(w, d.api), 0);
}

// ========================================
// STATE
// ========================================

let allWeapons = [];
let activeCharts = {};
let compareList = [];

// ========================================
// DATA LOADING
// ========================================

async function loadWeapons() {
  const res = await fetch('weapons.json');
  if (!res.ok) throw new Error(`Failed to load weapons.json: ${res.status}`);
  allWeapons = await res.json();
  // Filter to only items with a category and attack array (exclude non-weapons)
  allWeapons = allWeapons.filter(w => w.category && Array.isArray(w.attack));
}

// ========================================
// FILTERING & SORTING
// ========================================

function getFilters() {
  const checkedCategories = [...document.querySelectorAll('#category-filter-list input:checked')]
    .map(el => el.value);

  // Map filter checkbox values (e.g. "physical") to API keys (e.g. "Phy")
  const checkedDmgApiKeys = [...document.querySelectorAll('input[name="dmgtype"]:checked')]
    .map(el => DMG_KEYS.find(d => d.filterVal === el.value)?.api)
    .filter(Boolean);

  const myStats = {};
  document.querySelectorAll('.stat-input').forEach(el => {
    const val = el.value.trim();
    myStats[el.dataset.stat] = val === '' ? null : parseInt(val, 10);
  });

  return { checkedCategories, checkedDmgApiKeys, myStats };
}

function filterWeapons(filters) {
  return allWeapons.filter(w => {
    if (filters.checkedCategories.length > 0 && !filters.checkedCategories.includes(w.category)) return false;

    if (filters.checkedDmgApiKeys.length > 0) {
      const hasType = filters.checkedDmgApiKeys.some(apiKey => getDmg(w, apiKey) > 0);
      if (!hasType) return false;
    }

    for (const [statKey, apiKey] of Object.entries(STAT_MAP)) {
      const myVal = filters.myStats[statKey];
      if (myVal !== null && myVal !== undefined) {
        if (getReq(w, apiKey) > myVal) return false;
      }
    }

    return true;
  });
}


// ========================================
// BROWSE VIEW — RENDERING
// ========================================

function populateCategoryFilter() {
  const categories = [...new Set(allWeapons.map(w => w.category))].sort();
  const list = document.getElementById('category-filter-list');
  list.innerHTML = categories.map(cat => `
    <label class="checkbox-item">
      <input type="checkbox" value="${cat}">
      ${cat}
    </label>
  `).join('');
}

function renderBrowseView() {
  const filters = getFilters();
  const filtered = filterWeapons(filters);

  document.getElementById('result-count').textContent =
    `${filtered.length} weapon${filtered.length !== 1 ? 's' : ''}`;

  const grid = document.getElementById('weapons-grid');
  const empty = document.getElementById('empty-state');

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = filtered.map(w => createWeaponCardHTML(w)).join('');

  grid.querySelectorAll('.weapon-card').forEach(card => {
    const name = card.dataset.name;
    card.addEventListener('click', e => {
      if (e.target.closest('.card-compare-btn')) return;
      const weapon = allWeapons.find(w => w.name === name);
      if (weapon) openDetailModal(weapon);
    });

    const btn = card.querySelector('.card-compare-btn');
    if (btn) btn.addEventListener('click', () => toggleCompare(name));
  });
}

function createWeaponCardHTML(w) {
  const total = getTotalDamage(w);
  const inCompare = compareList.some(c => c.name === w.name);

  const dmgPills = DMG_KEYS
    .filter(d => getDmg(w, d.api) > 0)
    .map(d => `<span class="dmg-pill ${d.cssClass}">${d.label} ${getDmg(w, d.api)}</span>`)
    .join('');

  const scalingParts = Object.entries(STAT_MAP)
    .map(([, apiKey]) => ({ apiKey, val: getScale(w, apiKey) }))
    .filter(({ val }) => val && val !== '-' && val !== '?')
    .map(({ apiKey, val }) =>
      `<span class="scaling-entry">${apiKey}: <span class="sc-val ${scalingClass(val)}">${val}</span></span>`
    ).join('');

  const imgHTML = w.image
    ? `<img class="card-img" src="${w.image}" alt="${w.name}" loading="lazy" onerror="this.style.display='none'">`
    : '';

  return `
    <div class="weapon-card" data-name="${w.name}">
      ${imgHTML}
      <div class="card-header">
        <span class="card-name">${w.name}</span>
        <span class="card-weight">${w.weight ?? '?'}wt</span>
      </div>
      <span class="category-badge">${w.category}</span>
      <div class="card-damage">
        <span class="card-damage-total">${total}</span>
        <span class="card-damage-label">total damage</span>
      </div>
      ${dmgPills ? `<div class="card-damage-types">${dmgPills}</div>` : ''}
      ${scalingParts ? `<div class="card-scaling">${scalingParts}</div>` : ''}
      <button class="card-compare-btn ${inCompare ? 'in-compare' : ''}" data-name="${w.name}">
        ${inCompare ? '✓ In Compare' : '+ Compare'}
      </button>
    </div>
  `;
}

function scalingClass(v) {
  if (v === 'S') return 's-tier';
  if (v === 'A') return 'a-tier';
  if (v === 'B') return 'b-tier';
  if (v === 'C') return 'c-tier';
  return '';
}

// ========================================
// DETAIL MODAL
// ========================================

function openDetailModal(weapon) {
  const total = getTotalDamage(weapon);

  const dmgRows = DMG_KEYS.map(d => {
    const val = getDmg(weapon, d.api);
    return `<div class="modal-stat-row">
      <span class="modal-stat-key">${d.label}</span>
      <span class="modal-stat-val ${val === 0 ? 'zero' : ''}">${val || '—'}</span>
    </div>`;
  }).join('');

  const reqRows = Object.entries(STAT_MAP).map(([, apiKey]) => {
    const val = getReq(weapon, apiKey);
    return `<div class="modal-stat-row">
      <span class="modal-stat-key">${apiKey}</span>
      <span class="modal-stat-val ${val === 0 ? 'zero' : ''}">${val || '—'}</span>
    </div>`;
  }).join('');

  const scaleRows = Object.entries(STAT_MAP).map(([, apiKey]) => {
    const val = getScale(weapon, apiKey);
    return `<div class="modal-stat-row">
      <span class="modal-stat-key">${apiKey}</span>
      <span class="modal-stat-val ${scalingClass(val)} ${(val === '-' || val === '?') ? 'zero' : ''}">${val}</span>
    </div>`;
  }).join('');

  const imgHTML = weapon.image
    ? `<img class="modal-img" src="${weapon.image}" alt="${weapon.name}" onerror="this.style.display='none'">`
    : '';

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-top">
      ${imgHTML}
      <div class="modal-top-info">
        <h2 class="modal-weapon-name">${weapon.name}</h2>
        <div class="modal-category-badge"><span class="category-badge">${weapon.category}</span></div>
        <div class="modal-weight-row">
          <span class="modal-stat-key">Weight</span>
          <span class="modal-weight-val">${weapon.weight ?? '—'}</span>
        </div>
      </div>
    </div>
    <p class="modal-description">${weapon.description || ''}</p>
    <div class="modal-stats-grid">
      <div class="modal-stat-section">
        <div class="modal-stat-section-title">Damage — Total: <span style="color:var(--gold)">${total}</span></div>
        ${dmgRows}
      </div>
      <div class="modal-stat-section">
        <div class="modal-stat-section-title">Scaling</div>
        ${scaleRows}
      </div>
      <div class="modal-stat-section">
        <div class="modal-stat-section-title">Requirements</div>
        ${reqRows}
      </div>
    </div>
  `;

  document.getElementById('detail-modal').removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('detail-modal').setAttribute('hidden', '');
  document.body.style.overflow = '';
}

// ========================================
// COMPARE VIEW
// ========================================

function toggleCompare(name) {
  const idx = compareList.findIndex(w => w.name === name);
  if (idx >= 0) {
    compareList.splice(idx, 1);
  } else {
    if (compareList.length >= 3) {
      alert('Up to 3 weapons at a time. Remove one first.');
      return;
    }
    const weapon = allWeapons.find(w => w.name === name);
    if (weapon) compareList.push(weapon);
  }

  const inCompare = compareList.some(c => c.name === name);
  document.querySelectorAll('.card-compare-btn').forEach(btn => {
    if (btn.dataset.name === name) {
      btn.textContent = inCompare ? '✓ In Compare' : '+ Compare';
      btn.classList.toggle('in-compare', inCompare);
    }
  });

  if (document.getElementById('compare-view').classList.contains('active')) {
    renderCompareView();
  }
}

function renderCompareView() {
  const tableWrap = document.getElementById('compare-table-wrap');
  const chartWrap = document.getElementById('compare-chart-wrap');
  const emptyMsg  = document.getElementById('compare-empty');

  if (compareList.length === 0) {
    tableWrap.classList.add('hidden');
    chartWrap.classList.add('hidden');
    emptyMsg.style.display = '';
    destroyChart('radar');
    return;
  }

  emptyMsg.style.display = 'none';
  tableWrap.classList.remove('hidden');
  chartWrap.classList.remove('hidden');
  tableWrap.innerHTML = buildCompareTableHTML();
  tableWrap.querySelectorAll('.remove-col-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleCompare(btn.dataset.name));
  });
  renderRadarChart();
}

function buildCompareTableHTML() {
  const weapons = compareList;

  const headerCols = weapons.map(w => `
    <th>
      ${w.name}
      <span class="th-category">${w.category}</span>
      <button class="remove-col-btn" data-name="${w.name}">Remove</button>
    </th>
  `).join('');

  const totalCells = weapons.map(w => `<td>${getTotalDamage(w)}</td>`).join('');
  const weightCells = weapons.map(w => `<td>${w.weight ?? '—'}</td>`).join('');

  const dmgRows = DMG_KEYS.map(d => {
    const cells = weapons.map(w => {
      const v = getDmg(w, d.api);
      return `<td class="${v === 0 ? 'zero' : ''}">${v || '—'}</td>`;
    }).join('');
    return `<tr><td class="row-label">${d.label}</td>${cells}</tr>`;
  }).join('');

  const reqRows = Object.entries(STAT_MAP).map(([, apiKey]) => {
    const cells = weapons.map(w => {
      const v = getReq(w, apiKey);
      return `<td class="${v === 0 ? 'zero' : ''}">${v || '—'}</td>`;
    }).join('');
    return `<tr><td class="row-label">${apiKey} Req</td>${cells}</tr>`;
  }).join('');

  const scaleRows = Object.entries(STAT_MAP).map(([, apiKey]) => {
    const cells = weapons.map(w => {
      const v = getScale(w, apiKey);
      return `<td class="sc-val ${scalingClass(v)} ${(v === '-' || v === '?') ? 'zero' : ''}">${v}</td>`;
    }).join('');
    return `<tr><td class="row-label">${apiKey} Scale</td>${cells}</tr>`;
  }).join('');

  return `
    <table class="compare-table">
      <thead>
        <tr><th class="row-label"></th>${headerCols}</tr>
      </thead>
      <tbody>
        <tr class="row-section"><td colspan="${weapons.length + 1}">Damage</td></tr>
        <tr><td class="row-label">Total Damage</td>${totalCells}</tr>
        ${dmgRows}
        <tr class="row-section"><td colspan="${weapons.length + 1}">General</td></tr>
        <tr><td class="row-label">Weight</td>${weightCells}</tr>
        <tr class="row-section"><td colspan="${weapons.length + 1}">Requirements</td></tr>
        ${reqRows}
        <tr class="row-section"><td colspan="${weapons.length + 1}">Scaling</td></tr>
        ${scaleRows}
      </tbody>
    </table>
  `;
}

// ========================================
// CHART MANAGEMENT
// ========================================

function destroyChart(key) {
  if (activeCharts[key]) {
    activeCharts[key].destroy();
    delete activeCharts[key];
  }
}

// ========================================
// COMPARE — RADAR CHART
// ========================================

function renderRadarChart() {
  destroyChart('radar');
  const canvas = document.getElementById('radar-chart');
  if (!canvas || compareList.length === 0) return;

  const colors = ['#c9a84c', '#54a0ff', '#ff6b6b'];

  activeCharts['radar'] = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: DMG_KEYS.map(d => d.label),
      datasets: compareList.map((w, i) => ({
        label: w.name,
        data: DMG_KEYS.map(d => getDmg(w, d.api)),
        borderColor: colors[i],
        backgroundColor: colors[i] + '22',
        pointBackgroundColor: colors[i],
        pointRadius: 4,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: '#9a9080', font: { family: 'Roboto Mono', size: 12 } } }
      },
      scales: {
        r: {
          beginAtZero: true,
          grid: { color: '#2a2a2a' },
          angleLines: { color: '#2a2a2a' },
          ticks: { color: '#555', backdropColor: 'transparent', font: { size: 10 } },
          pointLabels: { color: '#9a9080', font: { family: 'Roboto Mono', size: 11 } },
        }
      }
    }
  });
}

// ========================================
// STATS VIEW
// ========================================

function populateStatsCategorySelect() {
  const sel = document.getElementById('stats-category-select');
  const categories = [...new Set(allWeapons.map(w => w.category))].sort();
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function renderStatsView() {
  const catVal = document.getElementById('stats-category-select').value;
  const weapons = catVal === 'all' ? allWeapons : allWeapons.filter(w => w.category === catVal);
  destroyChart('scatter');
  destroyChart('bar');
  renderScatterChart(weapons);
  renderBarChart(weapons);
}

function renderScatterChart(weapons) {
  destroyChart('scatter');
  const canvas = document.getElementById('scatter-chart');
  if (!canvas) return;

  const categories = [...new Set(weapons.map(w => w.category))].sort();

  const datasets = categories.map((cat, i) => ({
    label: cat,
    data: weapons
      .filter(w => w.category === cat)
      .map(w => ({ x: w.weight ?? 0, y: getTotalDamage(w), name: w.name })),
    backgroundColor: categoryColor(i, categories.length) + 'cc',
    pointRadius: 5,
    pointHoverRadius: 8,
  }));

  activeCharts['scatter'] = new Chart(canvas, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: { color: '#9a9080', font: { family: 'Roboto Mono', size: 10 }, boxWidth: 10, padding: 6 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = ctx.raw;
              return `${d.name}: ${d.y} dmg, ${d.x}wt`;
            }
          },
          backgroundColor: '#1e1e1e',
          borderColor: '#333',
          borderWidth: 1,
          titleColor: '#c9a84c',
          bodyColor: '#e8e0d0',
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Weight', color: '#555', font: { family: 'Roboto Mono', size: 11 } },
          grid: { color: '#1e1e1e' },
          ticks: { color: '#555' },
        },
        y: {
          title: { display: true, text: 'Total Damage', color: '#555', font: { family: 'Roboto Mono', size: 11 } },
          grid: { color: '#1e1e1e' },
          ticks: { color: '#555' },
        }
      }
    }
  });
}

function renderBarChart(weapons) {
  destroyChart('bar');
  const canvas = document.getElementById('bar-chart');
  if (!canvas) return;

  const categories = [...new Set(weapons.map(w => w.category))].sort();
  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const physData  = categories.map(cat => avg(weapons.filter(w => w.category === cat).map(w => getDmg(w, 'Phy'))));
  const magicData = categories.map(cat => avg(weapons.filter(w => w.category === cat).map(w => getDmg(w, 'Mag'))));
  const fireData  = categories.map(cat => avg(weapons.filter(w => w.category === cat).map(w => getDmg(w, 'Fire'))));

  activeCharts['bar'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        { label: 'Physical', data: physData,  backgroundColor: '#c8b48c88', borderColor: '#c8b48c', borderWidth: 1 },
        { label: 'Magic',    data: magicData, backgroundColor: '#7aa0e088', borderColor: '#7aa0e0', borderWidth: 1 },
        { label: 'Fire',     data: fireData,  backgroundColor: '#e0704088', borderColor: '#e07040', borderWidth: 1 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#9a9080', font: { family: 'Roboto Mono', size: 12 }, boxWidth: 12 } },
        tooltip: {
          backgroundColor: '#1e1e1e', borderColor: '#333', borderWidth: 1,
          titleColor: '#c9a84c', bodyColor: '#e8e0d0',
        }
      },
      scales: {
        x: {
          grid: { color: '#1a1a1a' },
          ticks: { color: '#555', font: { size: 9 }, maxRotation: 45, minRotation: 30 }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#1e1e1e' },
          ticks: { color: '#555' },
          title: { display: true, text: 'Avg Damage', color: '#555', font: { size: 11 } }
        }
      }
    }
  });
}

// ========================================
// AUTOCOMPLETE (Compare Search)
// ========================================

function updateAutocomplete(query) {
  const dropdown = document.getElementById('autocomplete-dropdown');
  if (!query.trim()) {
    dropdown.setAttribute('hidden', '');
    dropdown.innerHTML = '';
    return;
  }

  const q = query.toLowerCase();
  const matches = allWeapons.filter(w => w.name.toLowerCase().includes(q)).slice(0, 10);

  if (matches.length === 0) {
    dropdown.setAttribute('hidden', '');
    dropdown.innerHTML = '';
    return;
  }

  dropdown.innerHTML = matches.map(w => `
    <div class="autocomplete-item" data-name="${w.name}">
      <span>${w.name}</span>
      <span class="ac-category">${w.category}</span>
    </div>
  `).join('');
  dropdown.removeAttribute('hidden');

  dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.name;
      if (compareList.length >= 3) { alert('Up to 3 weapons. Remove one first.'); return; }
      const weapon = allWeapons.find(w => w.name === name);
      if (weapon && !compareList.find(w => w.name === name)) {
        compareList.push(weapon);
        renderCompareView();
      }
      document.getElementById('compare-search-input').value = '';
      dropdown.setAttribute('hidden', '');
    });
  });
}

// ========================================
// EVENT HANDLING
// ========================================

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`${viewName}-view`).classList.add('active');
  document.querySelector(`.nav-btn[data-view="${viewName}"]`).classList.add('active');

  if (viewName === 'compare') renderCompareView();
  if (viewName === 'stats')   renderStatsView();
}

function clearAllFilters() {
  document.querySelectorAll('#category-filter-list input').forEach(el => el.checked = false);
  document.querySelectorAll('input[name="dmgtype"]').forEach(el => el.checked = false);
  document.querySelectorAll('.stat-input').forEach(el => el.value = '');
  renderBrowseView();
}

function initEventListeners() {
  document.querySelectorAll('.nav-btn').forEach(btn =>
    btn.addEventListener('click', () => switchView(btn.dataset.view))
  );

  let filterTimer;
  function scheduleRender() {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(renderBrowseView, 80);
  }

  document.getElementById('category-filter-list').addEventListener('change', scheduleRender);
  document.querySelectorAll('input[name="dmgtype"]').forEach(el => el.addEventListener('change', scheduleRender));
  document.querySelectorAll('.stat-input').forEach(el => el.addEventListener('input', scheduleRender));

  document.getElementById('clear-filters-btn').addEventListener('click', clearAllFilters);
  document.getElementById('empty-clear-btn').addEventListener('click', clearAllFilters);

  document.getElementById('modal-close-btn').addEventListener('click', closeDetailModal);
  document.getElementById('detail-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDetailModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailModal(); });

  const searchInput = document.getElementById('compare-search-input');
  searchInput.addEventListener('input', e => updateAutocomplete(e.target.value));
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('autocomplete-dropdown').setAttribute('hidden', '');
  });

  document.addEventListener('click', e => {
    if (!document.getElementById('autocomplete-wrapper').contains(e.target)) {
      document.getElementById('autocomplete-dropdown').setAttribute('hidden', '');
    }
  });

  document.getElementById('clear-compare-btn').addEventListener('click', () => {
    compareList.splice(0);
    document.querySelectorAll('.card-compare-btn').forEach(btn => {
      btn.textContent = '+ Compare';
      btn.classList.remove('in-compare');
    });
    renderCompareView();
  });

  document.getElementById('stats-category-select').addEventListener('change', renderStatsView);
}

// ========================================
// INIT
// ========================================

async function init() {
  try {
    const [_] = await Promise.all([
      loadWeapons(),
      new Promise(r => setTimeout(r, 3000)),
    ]);
    populateCategoryFilter();
    populateStatsCategorySelect();
    initEventListeners();
    renderBrowseView();
  } catch (err) {
    console.error('Failed to open The Armory:', err);
    document.getElementById('loading-overlay').innerHTML =
      `<div class="loading-inner">
        <p style="color:#b84848;font-family:Cinzel,serif;text-align:center">
          Failed to load weapon data.<br>
          <small style="color:#555">${err.message}</small>
        </p>
      </div>`;
    return;
  }

  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('fade-out');
  setTimeout(() => overlay.remove(), 450);
}

init();
