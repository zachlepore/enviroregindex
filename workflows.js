'use strict';

const workflowState = {
  jurisdiction: '',
  businessLine: '',
  query: '',
};

const jurisdictionSelect = document.getElementById('workflow-jurisdiction');
const searchInput = document.getElementById('workflow-search');
const businessLineGrid = document.getElementById('business-line-grid');
const resultsSection = document.getElementById('workflow-results');
const resultsHeading = document.getElementById('workflow-results-heading');
const resultsContext = document.getElementById('workflow-results-context');
const resultCount = document.getElementById('workflow-result-count');
const workflowList = document.getElementById('workflow-list');
const jurisdictionSection = document.getElementById('jurisdiction-workflows');
const jurisdictionHeading = document.getElementById('jurisdiction-workflows-heading');
const jurisdictionGrid = document.getElementById('jurisdiction-workflow-grid');

function getJurisdictionLabel(code) {
  return JURISDICTION_REGISTRY.find(item => item.code === code)?.label || '';
}

function workflowsForJurisdiction() {
  if (!workflowState.jurisdiction) return [];
  return PLACEHOLDER_WORKFLOW_DATA.workflows.filter(workflow =>
    workflow.jurisdictions.includes('all') || workflow.jurisdictions.includes(workflowState.jurisdiction)
  );
}

function matchesWorkflowSearch(workflow, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const businessLine = PLACEHOLDER_WORKFLOW_DATA.businessLines.find(line => line.id === workflow.businessLine);
  return [
    workflow.title,
    workflow.description,
    businessLine?.title,
    ...(workflow.keywords || []),
    ...(workflow.synonyms || []),
  ].some(value => value?.toLowerCase().includes(normalized));
}

function renderBusinessLines() {
  const available = workflowsForJurisdiction().filter(workflow => !workflow.jurisdictionSpecific);
  businessLineGrid.innerHTML = [...PLACEHOLDER_WORKFLOW_DATA.businessLines]
    .sort((a, b) => a.order - b.order)
    .map(line => {
      const count = available.filter(workflow => workflow.businessLine === line.id).length;
      const disabled = !workflowState.jurisdiction || count === 0;
      const countLabel = workflowState.jurisdiction
        ? `${count} ${count === 1 ? 'workflow' : 'workflows'}`
        : 'Select a jurisdiction';
      return `
        <button class="business-line-card${workflowState.businessLine === line.id ? ' active' : ''}"
          type="button" data-business-line="${line.id}" ${disabled ? 'disabled' : ''}>
          <span class="business-line-icon" aria-hidden="true">${line.icon}</span>
          <span class="business-line-copy">
            <strong>${line.title}</strong>
            <span>${line.description}</span>
          </span>
          <span class="business-line-count">${countLabel}<span aria-hidden="true"> →</span></span>
        </button>`;
    }).join('');
}

function renderResults() {
  if (!workflowState.jurisdiction || (!workflowState.businessLine && !workflowState.query.trim())) {
    resultsSection.hidden = true;
    workflowList.innerHTML = '';
    return;
  }

  const activeLine = PLACEHOLDER_WORKFLOW_DATA.businessLines.find(line => line.id === workflowState.businessLine);
  const matches = workflowsForJurisdiction()
    .filter(workflow => workflowState.query.trim() || !workflow.jurisdictionSpecific)
    .filter(workflow => !workflowState.businessLine || workflow.businessLine === workflowState.businessLine)
    .filter(workflow => matchesWorkflowSearch(workflow, workflowState.query));

  resultsContext.textContent = getJurisdictionLabel(workflowState.jurisdiction);
  resultsHeading.textContent = workflowState.query.trim()
    ? `Results for “${workflowState.query.trim()}”`
    : activeLine?.title || 'Workflows';
  resultCount.textContent = `${matches.length} ${matches.length === 1 ? 'workflow' : 'workflows'}`;
  workflowList.innerHTML = matches.length
    ? matches.map(workflow => `
        <button class="workflow-row" type="button" data-workflow-id="${workflow.id}" aria-label="Open ${workflow.title} placeholder">
          <span>
            <strong>${workflow.title}</strong>
            <span>${workflow.description}</span>
          </span>
          <span class="workflow-row-arrow" aria-hidden="true">→</span>
        </button>`).join('')
    : `<div class="workflow-empty"><strong>No matching workflows</strong><span>Try a different keyword or area of work.</span></div>`;
  resultsSection.hidden = false;
}

function renderJurisdictionWorkflows() {
  const records = workflowsForJurisdiction().filter(workflow => workflow.jurisdictionSpecific);
  if (!workflowState.jurisdiction || records.length === 0) {
    jurisdictionSection.hidden = true;
    jurisdictionGrid.innerHTML = '';
    return;
  }

  jurisdictionHeading.textContent = `${getJurisdictionLabel(workflowState.jurisdiction)}-Specific Workflows`;
  jurisdictionGrid.innerHTML = records.map(workflow => `
    <button class="jurisdiction-workflow-card" type="button" data-workflow-id="${workflow.id}" aria-label="Open ${workflow.title} placeholder">
      <strong>${workflow.title}</strong>
      <span>${workflow.description}</span>
      <span class="jurisdiction-workflow-action">View workflow <span aria-hidden="true">→</span></span>
    </button>`).join('');
  jurisdictionSection.hidden = false;
}

function renderWorkflowExplorer() {
  renderBusinessLines();
  renderResults();
  renderJurisdictionWorkflows();
}

JURISDICTION_REGISTRY.forEach(jurisdiction => {
  const option = document.createElement('option');
  option.value = jurisdiction.code;
  option.textContent = jurisdiction.label;
  jurisdictionSelect.append(option);
});

jurisdictionSelect.addEventListener('change', event => {
  workflowState.jurisdiction = event.target.value;
  workflowState.businessLine = '';
  workflowState.query = '';
  searchInput.value = '';
  searchInput.disabled = !workflowState.jurisdiction;
  renderWorkflowExplorer();
});

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

renderWorkflowExplorer();
