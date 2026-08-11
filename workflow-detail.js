'use strict';

const collectionUrls = {
  ct: 'data/ct.json',
  epa: 'data/epa.json',
  standards: 'data/standards.json',
};

function sourceTypeLabel(value) {
  const labels = {
    'government-agency': 'Government agency',
    'standards-body': 'Standards body',
  };
  return labels[value] || 'Authoritative source';
}

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url} (HTTP ${response.status})`);
  return response.json();
}

function buildResourceIndex(collections) {
  const index = new Map();
  collections.forEach(collection => {
    (collection.documents || []).forEach(resource => {
      if (resource.resource_id) index.set(resource.resource_id, resource);
    });
  });
  return index;
}

function renderResource(relationship, resource) {
  if (!resource) {
    return `
      <div class="workflow-reference-error" data-missing-resource="${escapeHTML(relationship.resource_id)}">
        <strong>Referenced resource unavailable</strong>
        <span>This workflow references ${escapeHTML(relationship.resource_id)}, but its canonical record could not be resolved.</span>
      </div>`;
  }

  return `
    <article class="workflow-resource">
      <div class="workflow-resource-copy">
        <div class="workflow-resource-source">${escapeHTML(resource.publisher)} · ${escapeHTML(sourceTypeLabel(resource.source_type))}</div>
        <h3>${escapeHTML(resource.title)}</h3>
        <p>${escapeHTML(relationship.workflow_note)}</p>
      </div>
      <a class="workflow-resource-link" href="${escapeHTML(resource.source_url)}" target="_blank" rel="noopener">
        Open resource <span aria-hidden="true">↗</span>
      </a>
    </article>`;
}

function renderWorkflow(data, resourceIndex, jurisdictionCode) {
  const workflow = data.workflow;
  const jurisdiction = JURISDICTION_REGISTRY.find(item => item.code === jurisdictionCode);
  if (!workflow.supported_jurisdictions.includes(jurisdictionCode) || !jurisdiction) {
    throw new Error('This workflow is not available for the selected jurisdiction.');
  }

  document.title = `${workflow.title} — ${jurisdiction.label} | EnviroRegIndex`;
  document.getElementById('workflow-context').textContent = `${workflow.business_line_label} · ${jurisdiction.label}`;
  document.getElementById('workflow-title').textContent = workflow.title;
  document.getElementById('workflow-description').textContent = workflow.description;

  const relationships = data.relationships || [];
  const sectionsHTML = [...(data.sections || [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map(section => {
      if (section.section_id === 'related-workflows') {
        const related = data.related_workflows || [];
        if (!related.length) return '';
      }
      const sectionRelationships = relationships
        .filter(item => item.section === section.section_id)
        .sort((a, b) => a.display_order - b.display_order);
      if (!sectionRelationships.length) return '';
      return `
        <section class="workflow-detail-section" aria-labelledby="section-${escapeHTML(section.section_id)}">
          <h2 id="section-${escapeHTML(section.section_id)}">${escapeHTML(section.title)}</h2>
          <div class="workflow-resource-list">
            ${sectionRelationships.map(item => renderResource(item, resourceIndex.get(item.resource_id))).join('')}
          </div>
        </section>`;
    }).join('');

  document.getElementById('workflow-sections').innerHTML = sectionsHTML;
  document.getElementById('workflow-loading').hidden = true;
  document.getElementById('workflow-content').hidden = false;
}

async function loadWorkflow() {
  const params = new URLSearchParams(window.location.search);
  const workflowId = params.get('workflow') || 'phase-i-esa';
  const jurisdictionCode = params.get('jurisdiction') || 'ct';
  try {
    const data = await fetchJSON(`data/workflows/${encodeURIComponent(workflowId)}.json`);
    const collectionNames = data.workflow.resource_collections || [];
    const collections = await Promise.all(collectionNames.map(name => {
      if (!collectionUrls[name]) throw new Error(`Unknown resource collection: ${name}`);
      return fetchJSON(collectionUrls[name]);
    }));
    renderWorkflow(data, buildResourceIndex(collections), jurisdictionCode);
  } catch (error) {
    document.getElementById('workflow-loading').hidden = true;
    const errorElement = document.getElementById('workflow-error');
    errorElement.textContent = error.message;
    errorElement.hidden = false;
  }
}

loadWorkflow();
