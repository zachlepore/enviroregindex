/* ============================================================
   EnviroRegIndex — app.js
   Multi-state environmental regulatory directory.
   Vanilla JS, no frameworks, no build tools.
   ============================================================ */

'use strict';

// ── App State ────────────────────────────────────────────────
let DOCS            = [];           // currently loaded documents
let STATE_META      = {};           // state metadata from JSON
let RECENT_UPDATES  = [];           // recent updates from JSON
let FOCUS_AREAS     = [];           // jurisdiction-defined program areas
let currentView     = 'home';
let currentJurisdiction = 'ct';     // default jurisdiction
let searchQuery     = '';
let activeFilters   = {};

// ── Badge helpers ────────────────────────────────────────────
function getBadgeClass(type) {
  const map = {
    regulation: 'badge-regulation',
    guidance:   'badge-guidance',
    permit:     'badge-permit',
    policy:     'badge-policy',
    form:       'badge-form',
    manual:     'badge-manual',
    database:   'badge-policy',
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

function getDocumentFocusAreas(doc) {
  const additionalAreas = Array.isArray(doc.focus_areas) ? doc.focus_areas : [];
  return [...new Set([doc.category, ...additionalAreas].filter(Boolean))];
}

function isDocumentInFocusArea(doc, slug) {
  return getDocumentFocusAreas(doc).includes(slug);
}

// ── Document card HTML ───────────────────────────────────────
function buildDocHTML(doc, q = '') {
  const titleHL = highlight(doc.title, q);
  const descHL  = highlight(doc.description, q);
  const tagsHL  = doc.tags.map(t => `<span class="tag">${highlight(t, q)}</span>`).join('');

  const quickGuideHTML = doc.detail_page
    ? `
      <a class="doc-link doc-link-primary" href="${doc.detail_page}">
        Quick Guide
        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M3 2H9M9 2V8M9 2L2 9" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>`
    : '';

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
        <div class="doc-footer">
          <div class="doc-tags">${tagsHL}</div>
          ${doc.verified ? `<span class="doc-verified">Verified: ${doc.verified}</span>` : ''}
        </div>
      </div>
      <div class="doc-actions">
        ${quickGuideHTML}
        <a class="doc-link" href="${doc.source_url}" target="_blank" rel="noopener">
          View Source
          <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>`;
}

// ── Focus areas ───────────────────────────────────────────────
const FOCUS_THEMES = ['green', 'blue', 'amber'];

function getVisibleFocusAreas() {
  const seen = new Set();
  return FOCUS_AREAS
    .filter(area => area && area.name && area.slug && area.description && area.icon)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .filter(area => {
      if (seen.has(area.slug) || !DOCS.some(doc => isDocumentInFocusArea(doc, area.slug))) return false;
      seen.add(area.slug);
      return true;
    });
}

function renderFocusAreas() {
  const areas = getVisibleFocusAreas();
  const grid = document.getElementById('focus-area-grid');
  const views = document.getElementById('focus-area-views');

  if (grid) {
    grid.innerHTML = areas.map((area, index) => {
      const count = DOCS.filter(doc => isDocumentInFocusArea(doc, area.slug)).length;
      return `
        <a class="cat-card focus-theme-${index % FOCUS_THEMES.length}" href="#"
           data-focus-area="${area.slug}" aria-label="${area.name} documents">
          <div class="cat-icon" aria-hidden="true">${area.icon}</div>
          <h3>${area.name}</h3>
          <p>${area.description}</p>
          <div class="cat-count mono">${count} document${count !== 1 ? 's' : ''}</div>
        </a>`;
    }).join('');
    grid.querySelectorAll('[data-focus-area]').forEach(card => {
      card.addEventListener('click', event => {
        event.preventDefault();
        showView(card.dataset.focusArea);
      });
    });
  }

  if (views) {
    views.innerHTML = areas.map((area, index) => {
      const theme = FOCUS_THEMES[index % FOCUS_THEMES.length];
      return `
        <div id="view-${area.slug}" class="view">
          <div class="container">
            <div class="page-header">
              <div class="breadcrumb">
                <a href="#" data-home-link>Home</a>
                <span>›</span>
                <span>${area.name}</span>
              </div>
              <div class="cat-header-bar color-${theme}"></div>
              <h1 class="page-title"><strong>${area.name}</strong></h1>
              <p class="page-desc">${area.description}</p>
            </div>
            <div class="filter-bar" id="filter-${area.slug}" role="toolbar" aria-label="Filter ${area.name} documents"></div>
            <div class="doc-list" id="list-${area.slug}" role="list"></div>
          </div>
        </div>`;
    }).join('');
    views.querySelectorAll('[data-home-link]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        showView('home');
      });
    });
  }
}

// ── Filter bar ───────────────────────────────────────────────
function buildFilterBar(cat) {
  const containerId = `filter-${cat}`;
  const container   = document.getElementById(containerId);
  if (!container) return;

  // Clear existing buttons (needed on state-switch re-render)
  container.innerHTML = '';

  const subcats = [...new Set(DOCS.filter(d => isDocumentInFocusArea(d, cat)).map(d => d.subcategory))];

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
  const filter = activeFilters[cat] || 'all';
  const listEl = document.getElementById(`list-${cat}`);
  if (!listEl) return;

  let docs = DOCS.filter(d => isDocumentInFocusArea(d, cat));
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
    if (currentView === 'search') showView('home');
    return;
  }

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
  const directoryHero = document.getElementById('directory-hero');
  if (directoryHero) directoryHero.hidden = name !== 'home' && name !== 'search';

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById(`view-${name}`);
  if (viewEl) viewEl.classList.add('active');

  if (name !== 'search') {
    const searchEl = document.getElementById('globalSearch');
    if (searchEl) searchEl.value = '';
    searchQuery = '';
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
  const totalEl = document.getElementById('total-resources');
  const focusAreaCountEl = document.getElementById('focus-area-count');
  const lastQaEl = document.getElementById('last-qa');

  if (totalEl)  totalEl.textContent  = DOCS.length;
  if (focusAreaCountEl) focusAreaCountEl.textContent = getVisibleFocusAreas().length;

  if (lastQaEl) {
    lastQaEl.textContent = formatMetadataDate(STATE_META.last_qa);
  }

  // Update page title
  if (STATE_META.name) {
    document.title = `EnviroRegIndex — ${STATE_META.name}`;
  }
}

function formatMetadataDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '—';

  const [year, month, day] = value.split('-').map(Number);
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).formatToParts(new Date(Date.UTC(year, month - 1, day)));
  const getPart = type => parts.find(part => part.type === type)?.value;
  const monthName = getPart('month');

  return `${monthName === 'May' ? monthName : `${monthName}.`} ${getPart('day')}, ${getPart('year')}`;
}

// ── Coming-soon state view ───────────────────────────────────
function renderComingSoonState() {
  getVisibleFocusAreas().forEach(area => {
    const listEl = document.getElementById(`list-${area.slug}`);
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

  const totalEl = document.getElementById('total-resources');
  if (totalEl) totalEl.textContent = '—';
}

// ── Jurisdiction loading ─────────────────────────────────────
function setLoadingIndicator(visible) {
  const el = document.getElementById('state-loading');
  if (!el) return;
  el.classList.toggle('visible', visible);
}

function syncJurisdictionControls(code) {
  const jurisdiction = JURISDICTION_REGISTRY.find(item => item.code === code);
  const federalButton = document.getElementById('federal-jurisdiction-btn');
  const stateSelect = document.getElementById('state-select');
  const isFederal = jurisdiction?.type === 'federal';

  if (federalButton) {
    federalButton.classList.toggle('active', isFederal);
    federalButton.setAttribute('aria-pressed', String(isFederal));
  }
  if (stateSelect) {
    stateSelect.value = isFederal ? '' : code;
  }
}

async function loadJurisdiction(code) {
  code = code.toLowerCase();
  if (code === currentJurisdiction && DOCS.length > 0) return; // already loaded

  // Optimistic UI: switch view, show loading
  currentJurisdiction = code;
  syncJurisdictionControls(code);

  setLoadingIndicator(true);

  try {
    const url = `data/${code}.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    STATE_META     = data.state     || {};
    RECENT_UPDATES = data.recent_updates || [];
    FOCUS_AREAS    = data.focus_areas || [];
    DOCS           = data.documents || [];

    // Reset filters
    activeFilters = Object.fromEntries(getVisibleFocusAreas().map(area => [area.slug, 'all']));

    // Re-render everything
    renderFocusAreas();
    renderHeroStats();

    if (STATE_META.status === 'coming-soon') {
      renderComingSoonState();
    } else {
      getVisibleFocusAreas().forEach(area => {
        buildFilterBar(area.slug);
        renderCategoryList(area.slug);
      });
    }

    renderRecentUpdates();

    // Re-run search if one is active
    if (searchQuery.length >= 2) {
      handleGlobalSearch(searchQuery);
    }

    // Navigate home after state switch
    showView('home');

  } catch (err) {
    console.error(`Failed to load data/${code}.json:`, err);
    DOCS = [];
    STATE_META = JURISDICTION_REGISTRY.find(item => item.code === code) || { code, name: code.toUpperCase() };
    STATE_META.status = 'coming-soon';
    renderComingSoonState();
    showView('home');
  } finally {
    setLoadingIndicator(false);
  }
}

// ── Jurisdiction selector bar ───────────────────────────────
function buildStateBar() {
  const inner = document.getElementById('state-bar-inner');
  if (!inner) return;

  // Clear any server-rendered placeholders
  inner.innerHTML = '';

  const controls = document.createElement('div');
  controls.className = 'jurisdiction-controls';

  const federal = JURISDICTION_REGISTRY.find(item => item.type === 'federal');
  if (federal) {
    const federalButton = document.createElement('button');
    federalButton.id = 'federal-jurisdiction-btn';
    federalButton.className = 'federal-jurisdiction-btn';
    federalButton.type = 'button';
    federalButton.textContent = federal.label;
    federalButton.setAttribute('aria-label', `Switch to ${federal.label}`);
    federalButton.onclick = () => loadJurisdiction(federal.code);
    controls.appendChild(federalButton);
  }

  const selectLabel = document.createElement('label');
  selectLabel.className = 'state-select-label';
  selectLabel.htmlFor = 'state-select';
  selectLabel.innerHTML = '<span>State:</span>';

  const stateSelect = document.createElement('select');
  stateSelect.id = 'state-select';
  stateSelect.className = 'state-select';
  stateSelect.setAttribute('aria-label', 'Select a state jurisdiction');

  const prompt = document.createElement('option');
  prompt.value = '';
  prompt.textContent = 'Select a state';
  prompt.disabled = true;
  stateSelect.appendChild(prompt);

  JURISDICTION_REGISTRY
    .filter(item => item.type === 'state')
    .sort((a, b) => a.label.localeCompare(b.label))
    .forEach(state => {
      const option = document.createElement('option');
      option.value = state.code;
      option.textContent = state.status === 'coming-soon'
        ? `${state.label} (Coming soon)`
        : state.label;
      stateSelect.appendChild(option);
    });

  stateSelect.onchange = event => loadJurisdiction(event.target.value);
  selectLabel.appendChild(stateSelect);
  controls.appendChild(selectLabel);
  inner.appendChild(controls);

  syncJurisdictionControls(currentJurisdiction);
}

// ── Expose globals needed by inline HTML event handlers ─────
// (nav tabs use onclick="showView(...)" directly in HTML)
window.showView = showView;
window.handleGlobalSearch = handleGlobalSearch;

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildStateBar();
  loadJurisdiction('ct'); // Default jurisdiction
});
