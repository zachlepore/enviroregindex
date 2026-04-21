/* ============================================================
   EnviroRegIndex — app.js
   Multi-state environmental regulatory directory.
   Vanilla JS, no frameworks, no build tools.
   ============================================================ */

'use strict';

// ── State Registry ───────────────────────────────────────────
// Add new states here. "live" = data available; "coming-soon" = placeholder.
const STATE_REGISTRY = [
  { code: 'ct', label: 'Connecticut', status: 'live'        },
  { code: 'ma', label: 'Massachusetts', status: 'coming-soon' },
  { code: 'ri', label: 'Rhode Island',  status: 'coming-soon' },
  { code: 'ny', label: 'New York',      status: 'coming-soon' },
  { code: 'nh', label: 'New Hampshire', status: 'coming-soon' },
  { code: 'vt', label: 'Vermont',       status: 'coming-soon' },
  { code: 'me', label: 'Maine',         status: 'coming-soon' },
];

// ── App State ────────────────────────────────────────────────
let DOCS            = [];           // currently loaded documents
let STATE_META      = {};           // state metadata from JSON
let RECENT_UPDATES  = [];           // recent updates from JSON
let currentView     = 'home';
let currentState    = 'ct';         // default state
let searchQuery     = '';
let activeFilters   = { remediation: 'all', stormwater: 'all', assessment: 'all' };

// ── Badge helpers ────────────────────────────────────────────
function getBadgeClass(type) {
  const map = {
    regulation: 'badge-regulation',
    guidance:   'badge-guidance',
    permit:     'badge-permit',
    policy:     'badge-policy',
    form:       'badge-form',
    manual:     'badge-manual',
  };
  return map[type] || 'badge-form';
}

// ── Search / filter helpers ──────────────────────────────────
function highlight(text, query) {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function matchesQuery(doc, q) {
  if (!q || q.length < 2) return true;
  const lower = q.toLowerCase();
  return (
    doc.title.toLowerCase().includes(lower) ||
    doc.description.toLowerCase().includes(lower) ||
    doc.tags.some(t => t.toLowerCase().includes(lower)) ||
    doc.subcategory.toLowerCase().includes(lower) ||
    doc.document_type.toLowerCase().includes(lower)
  );
}

// ── Document card HTML ───────────────────────────────────────
function buildDocHTML(doc, q = '') {
  const titleHL = highlight(doc.title, q);
  const descHL  = highlight(doc.description, q);
  const tagsHL  = doc.tags.map(t => `<span class="tag">${highlight(t, q)}</span>`).join('');

  return `
    <div class="doc-item" data-id="${doc.id}" data-cat="${doc.category}" data-subcat="${doc.subcategory}">
      <span class="doc-type-badge ${getBadgeClass(doc.document_type)}">${doc.document_type}</span>
      <div class="doc-body">
        <div class="doc-meta">
          <span class="doc-subcat">${doc.subcategory}</span>
          ${doc.last_updated
            ? `<span class="doc-dot">·</span><span class="doc-updated">${doc.last_updated}</span>`
            : ''}
        </div>
        <div class="doc-title">${titleHL}</div>
        <p class="doc-desc">${descHL}</p>
        <div class="doc-tags">${tagsHL}</div>
      </div>
      <a class="doc-link" href="${doc.source_url}" target="_blank" rel="noopener">
        View Source
        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>`;
}

// ── Filter bar ───────────────────────────────────────────────
function buildFilterBar(cat) {
  const containerId = `filter-${cat}`;
  const container   = document.getElementById(containerId);
  if (!container) return;

  // Clear existing buttons (needed on state-switch re-render)
  container.innerHTML = '';

  const subcats = [...new Set(DOCS.filter(d => d.category === cat).map(d => d.subcategory))];

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = 'All';
  allBtn.setAttribute('data-filter', 'all');
  allBtn.onclick = () => setFilter(cat, 'all', allBtn);
  container.appendChild(allBtn);

  subcats.forEach(sub => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = sub;
    btn.setAttribute('data-filter', sub);
    btn.onclick = () => setFilter(cat, sub, btn);
    container.appendChild(btn);
  });

  const countSpan = document.createElement('span');
  countSpan.className = 'result-count';
  countSpan.id = `count-label-${cat}`;
  container.appendChild(countSpan);
}

function setFilter(cat, value, clickedBtn) {
  activeFilters[cat] = value;
  const bar = document.getElementById(`filter-${cat}`);
  bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  clickedBtn.classList.add('active');
  renderCategoryList(cat);
}

// ── Category list renderer ───────────────────────────────────
function renderCategoryList(cat) {
  const filter = activeFilters[cat];
  const listEl = document.getElementById(`list-${cat}`);
  if (!listEl) return;

  let docs = DOCS.filter(d => d.category === cat);
  if (filter !== 'all') docs = docs.filter(d => d.subcategory === filter);

  const countEl = document.getElementById(`count-label-${cat}`);
  if (countEl) countEl.textContent = `${docs.length} document${docs.length !== 1 ? 's' : ''}`;

  if (docs.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>No documents found</h3>
        <p>Try clearing your filter.</p>
      </div>`;
    return;
  }
  listEl.innerHTML = docs.map(d => buildDocHTML(d)).join('');
}

// ── Search handler ───────────────────────────────────────────
function handleGlobalSearch(value) {
  searchQuery = value.trim();

  if (searchQuery.length < 2) {
    document.getElementById('tab-search').style.display = 'none';
    if (currentView === 'search') showView('home');
    return;
  }

  document.getElementById('tab-search').style.display = '';
  showView('search');

  const results  = DOCS.filter(d => matchesQuery(d, searchQuery));
  const listEl   = document.getElementById('list-search');
  const labelEl  = document.getElementById('search-result-label');
  const titleEl  = document.querySelector('#view-search .page-title');

  labelEl.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} for "${searchQuery}"`;
  if (titleEl) titleEl.innerHTML = `Search: <strong>${searchQuery}</strong>`;

  if (results.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <h3>No results found</h3>
        <p>Try different keywords — e.g., "RSR", "MS4", "Phase II", "ECAF".</p>
      </div>`;
    return;
  }
  listEl.innerHTML = results.map(d => buildDocHTML(d, searchQuery)).join('');
}

// ── View switcher ────────────────────────────────────────────
function showView(name) {
  currentView = name;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const viewEl = document.getElementById(`view-${name}`);
  if (viewEl) viewEl.classList.add('active');

  const tabEl = document.getElementById(`tab-${name}`);
  if (tabEl) tabEl.classList.add('active');

  if (name !== 'search') {
    const searchEl = document.getElementById('globalSearch');
    if (searchEl) searchEl.value = '';
    searchQuery = '';
    document.getElementById('tab-search').style.display = 'none';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Recent updates section ───────────────────────────────────
function renderRecentUpdates() {
  const grid = document.getElementById('recent-updates-grid');
  if (!grid) return;

  if (!RECENT_UPDATES || RECENT_UPDATES.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="padding:32px 0;">
        <p>No recent updates for this state yet.</p>
      </div>`;
    return;
  }

  grid.innerHTML = RECENT_UPDATES.map(u => `
    <div class="update-card">
      <div class="update-dot" style="background:${u.color}"></div>
      <div>
        <h4>${u.title}</h4>
        <p>${u.description}</p>
        <span class="update-date">${u.date}</span>
      </div>
    </div>`).join('');
}

// ── Hero stats ───────────────────────────────────────────────
function renderHeroStats() {
  const totalEl = document.getElementById('total-docs');
  const remEl   = document.getElementById('count-remediation');
  const swEl    = document.getElementById('count-stormwater');
  const asEl    = document.getElementById('count-assessment');
  const agencyEl = document.getElementById('hero-agency');
  const heroLabelEl = document.getElementById('hero-label');

  const remCount = DOCS.filter(d => d.category === 'remediation').length;
  const swCount  = DOCS.filter(d => d.category === 'stormwater').length;
  const asCount  = DOCS.filter(d => d.category === 'assessment').length;

  if (totalEl)  totalEl.textContent  = DOCS.length;
  if (remEl)    remEl.textContent    = `${remCount} document${remCount !== 1 ? 's' : ''}`;
  if (swEl)     swEl.textContent     = `${swCount} document${swCount !== 1 ? 's' : ''}`;
  if (asEl)     asEl.textContent     = `${asCount} document${asCount !== 1 ? 's' : ''}`;

  if (agencyEl && STATE_META.agency) {
    agencyEl.textContent = STATE_META.agency;
  }
  if (heroLabelEl && STATE_META.name) {
    heroLabelEl.textContent = `${STATE_META.name} Environmental Regulatory Navigator`;
  }

  // Update page title
  if (STATE_META.name) {
    document.title = `EnviroRegIndex — ${STATE_META.name}`;
  }
}

// ── Coming-soon state view ───────────────────────────────────
function renderComingSoonState() {
  const cats = ['remediation', 'stormwater', 'assessment'];
  cats.forEach(cat => {
    const listEl = document.getElementById(`list-${cat}`);
    if (!listEl) return;
    listEl.innerHTML = `
      <div class="coming-soon-state">
        <div class="cs-icon">🗂️</div>
        <div class="cs-state-name">${STATE_META.code || ''} · ${STATE_META.agency || ''}</div>
        <h3>${STATE_META.name || 'This state'} coming soon</h3>
        <p>We're compiling verified regulatory documents from ${STATE_META.agency_full || 'the state environmental agency'}.
           Check back soon, or <a href="${STATE_META.agency_url || '#'}" target="_blank" rel="noopener"
           style="color:var(--accent-green-mid)">visit ${STATE_META.agency || 'the agency'} directly</a>.</p>
      </div>`;
  });

  // Update home category counts
  ['remediation','stormwater','assessment'].forEach(cat => {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.textContent = 'Coming soon';
  });

  const totalEl = document.getElementById('total-docs');
  if (totalEl) totalEl.textContent = '—';
}

// ── State loading ────────────────────────────────────────────
function setLoadingIndicator(visible) {
  const el = document.getElementById('state-loading');
  if (!el) return;
  el.classList.toggle('visible', visible);
}

async function loadState(code) {
  code = code.toLowerCase();
  if (code === currentState && DOCS.length > 0) return; // already loaded

  // Optimistic UI: switch view, show loading
  currentState = code;

  // Highlight active state button
  document.querySelectorAll('.state-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-state') === code);
  });

  setLoadingIndicator(true);

  try {
    const url = `data/${code}.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    STATE_META     = data.state     || {};
    RECENT_UPDATES = data.recent_updates || [];
    DOCS           = data.documents || [];

    // Reset filters
    activeFilters = { remediation: 'all', stormwater: 'all', assessment: 'all' };

    // Re-render everything
    renderHeroStats();

    if (STATE_META.status === 'coming-soon') {
      renderComingSoonState();
    }

    renderRecentUpdates();

    ['remediation', 'stormwater', 'assessment'].forEach(cat => {
      buildFilterBar(cat);
      renderCategoryList(cat);
    });

    // Re-run search if one is active
    if (searchQuery.length >= 2) {
      handleGlobalSearch(searchQuery);
    }

    // Navigate home after state switch
    showView('home');

  } catch (err) {
    console.error(`Failed to load data/${code}.json:`, err);
    DOCS = [];
    STATE_META = STATE_REGISTRY.find(s => s.code === code) || { code, name: code.toUpperCase() };
    STATE_META.status = 'coming-soon';
    renderComingSoonState();
    showView('home');
  } finally {
    setLoadingIndicator(false);
  }
}

// ── State selector bar ───────────────────────────────────────
function buildStateBar() {
  const inner = document.getElementById('state-bar-inner');
  if (!inner) return;

  // Clear any server-rendered placeholders
  inner.innerHTML = `
    <span class="state-bar-label">State</span>`;

  STATE_REGISTRY.forEach(state => {
    const btn = document.createElement('button');
    btn.className = 'state-btn';
    btn.setAttribute('data-state', state.code);
    btn.setAttribute('aria-label', `Switch to ${state.label}`);

    if (state.status === 'coming-soon') {
      btn.classList.add('coming-soon');
      btn.innerHTML = `${state.label} <span class="state-coming-tag">Soon</span>`;
      btn.title = `${state.label} — coming soon`;
      // Still clickable to preview the coming-soon state
      btn.onclick = () => loadState(state.code);
    } else {
      btn.textContent = state.label;
      btn.onclick = () => loadState(state.code);
    }

    if (state.code === currentState) btn.classList.add('active');
    inner.appendChild(btn);
  });

  // Loading indicator
  const loadingEl = document.createElement('div');
  loadingEl.id = 'state-loading';
  loadingEl.className = 'state-loading';
  loadingEl.innerHTML = `<div class="state-loading-dot"></div><span>Loading…</span>`;
  inner.appendChild(loadingEl);
}

// ── Expose globals needed by inline HTML event handlers ─────
// (nav tabs use onclick="showView(...)" directly in HTML)
window.showView = showView;
window.handleGlobalSearch = handleGlobalSearch;

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildStateBar();
  loadState('ct'); // Default state
});
