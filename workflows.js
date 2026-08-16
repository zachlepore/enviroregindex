'use strict';

const workflowState = { jurisdiction: '', businessLine: '', query: '', availableWorkflows: [] };
let explorerData = { business_lines: [], workflows: [] };

const jurisdictionSelect = document.getElementById('workflow-jurisdiction');
const searchInput = document.getElementById('workflow-search');
const businessLineGrid = document.getElementById('business-line-grid');
const resultsSection = document.getElementById('workflow-results');
const resultsHeading = document.getElementById('workflow-results-heading');
const workflowList = document.getElementById('workflow-list');

function matchesWorkflowSearch(workflow, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const businessLine = explorerData.business_lines.find(line => line.id === workflow.businessLine);
  return [workflow.title, workflow.description, businessLine?.title, ...(workflow.keywords || []), ...(workflow.synonyms || [])]
    .some(value => value?.toLowerCase().includes(normalized));
}

function renderBusinessLines() {
  businessLineGrid.innerHTML = [...explorerData.business_lines]
    .sort((a, b) => a.order - b.order)
    .map(line => {
      const count = workflowState.availableWorkflows.filter(workflow => workflow.businessLine === line.id).length;
      const disabled = !workflowState.jurisdiction || count === 0;
      return `
        <button class="business-line-card${workflowState.businessLine === line.id ? ' active' : ''}"
          type="button" data-business-line="${line.id}" ${disabled ? 'disabled' : ''}>
          <span class="business-line-icon" aria-hidden="true">${line.icon}</span>
          <span class="business-line-copy"><strong>${line.title}</strong><span>${line.description}</span></span>
        </button>`;
    }).join('');
}

function renderResults() {
  if (!workflowState.jurisdiction || (!workflowState.businessLine && !workflowState.query.trim())) {
    resultsSection.hidden = true;
    workflowList.innerHTML = '';
    return;
  }
  const activeLine = explorerData.business_lines.find(line => line.id === workflowState.businessLine);
  const matches = workflowState.availableWorkflows
    .filter(workflow => !workflowState.businessLine || workflow.businessLine === workflowState.businessLine)
    .filter(workflow => matchesWorkflowSearch(workflow, workflowState.query));

  resultsHeading.textContent = workflowState.query.trim()
    ? `Results for “${workflowState.query.trim()}”`
    : activeLine?.title || 'Workflows';
  workflowList.innerHTML = matches.length
    ? matches.map(workflow => `
        <a class="workflow-row" href="${workflow.destination}" aria-label="Open ${workflow.title}">
          <span><strong>${workflow.title}</strong><span>${workflow.description}</span></span>
          <span class="workflow-row-arrow" aria-hidden="true">→</span>
        </a>`).join('')
    : `<div class="workflow-empty"><strong>No matching workflows</strong><span>Try a different keyword or area of work.</span></div>`;
  resultsSection.hidden = false;
}

function renderWorkflowExplorer() {
  renderBusinessLines();
  renderResults();
}

async function resolveImplementedWorkflows(jurisdiction) {
  // Explorer availability is derived from implemented workflow definitions.
  // Discovery metadata alone must never expose an unfinished workflow.
  const candidates = explorerData.workflows.filter(workflow =>
    workflow.jurisdictions.includes(jurisdiction) && workflow.destinations?.[jurisdiction]
  );
  const resolved = await Promise.all(candidates.map(async workflow => {
    try {
      const response = await fetch(`data/workflows/${encodeURIComponent(workflow.id)}.json`);
      if (!response.ok) return null;
      const definition = await response.json();
      if (definition.workflow?.workflow_id !== workflow.id) return null;
      if (!definition.workflow?.supported_jurisdictions?.includes(jurisdiction)) return null;
      return { ...workflow, destination: workflow.destinations[jurisdiction] };
    } catch {
      return null;
    }
  }));
  return resolved.filter(Boolean);
}

async function selectJurisdiction(code) {
  workflowState.jurisdiction = code;
  workflowState.businessLine = '';
  workflowState.query = '';
  workflowState.availableWorkflows = [];
  searchInput.value = '';
  searchInput.disabled = true;
  renderWorkflowExplorer();
  if (code) workflowState.availableWorkflows = await resolveImplementedWorkflows(code);
  searchInput.disabled = !code;
  renderWorkflowExplorer();
}

jurisdictionSelect.addEventListener('change', event => selectJurisdiction(event.target.value));
searchInput.addEventListener('input', event => {
  workflowState.query = event.target.value;
  workflowState.businessLine = '';
  renderWorkflowExplorer();
});
businessLineGrid.addEventListener('click', event => {
  const card = event.target.closest('[data-business-line]');
  if (!card || card.disabled) return;
  workflowState.businessLine = card.dataset.businessLine;
  workflowState.query = '';
  searchInput.value = '';
  renderWorkflowExplorer();
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

async function initializeWorkflowExplorer() {
  const response = await fetch('data/workflows/explorer.json');
  if (!response.ok) throw new Error(`Unable to load workflow discovery data (HTTP ${response.status})`);
  explorerData = await response.json();
  JURISDICTION_REGISTRY.forEach(jurisdiction => {
    const option = document.createElement('option');
    option.value = jurisdiction.code;
    option.textContent = jurisdiction.label;
    jurisdictionSelect.append(option);
  });
  renderWorkflowExplorer();
}

initializeWorkflowExplorer().catch(error => {
  businessLineGrid.innerHTML = `<div class="workflow-empty"><strong>Workflows unavailable</strong><span>${error.message}</span></div>`;
});
