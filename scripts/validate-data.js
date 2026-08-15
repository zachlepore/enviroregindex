#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const workflowDir = path.join(dataDir, 'workflows');
const explorerFile = path.join(workflowDir, 'explorer.json');
const jsonFiles = fs.readdirSync(dataDir)
  .filter(name => name.endsWith('.json'))
  .map(name => path.join(dataDir, name));
const workflowFiles = fs.readdirSync(workflowDir)
  .filter(name => name.endsWith('.json') && name !== 'explorer.json')
  .map(name => path.join(workflowDir, name));

const failures = [];
const resourceIds = new Map();
const qcIds = new Map();
const canonicalResources = new Map();
const workflowReferences = new Map();
const jurisdictionInventories = new Map();
const workflowDefinitions = new Map();

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push(`${path.relative(root, file)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function documentFocusAreas(document) {
  const additionalAreas = Array.isArray(document.focus_areas) ? document.focus_areas : [];
  return [...new Set([document.category, ...additionalAreas].filter(Boolean))];
}

for (const file of jsonFiles) {
  const data = readJSON(file);
  if (!data) continue;

  const relativeFile = path.relative(root, file);
  const declaredAreas = new Set((data.focus_areas || []).map(area => area.slug));
  if (declaredAreas.size !== (data.focus_areas || []).length) {
    failures.push(`${relativeFile} has duplicate Directory focus-area slugs`);
  }
  const documents = data.documents || [];
  const jurisdictionCode = data.state?.code;
  const inventory = [];
  const numericIds = new Set();

  for (const document of documents) {
    if (numericIds.has(document.id)) {
      failures.push(`${relativeFile} has duplicate numeric id ${document.id}`);
    }
    numericIds.add(document.id);

    if (document.qc_id) {
      if (qcIds.has(document.qc_id)) {
        failures.push(`Duplicate QC ID ${document.qc_id}: ${qcIds.get(document.qc_id)} and ${relativeFile}`);
      }
      qcIds.set(document.qc_id, relativeFile);
    }

    if (document.resource_id) {
      if (resourceIds.has(document.resource_id)) {
        failures.push(`Duplicate resource_id ${document.resource_id}: ${resourceIds.get(document.resource_id)} and ${relativeFile}`);
      }
      resourceIds.set(document.resource_id, relativeFile);
      canonicalResources.set(document.resource_id, document);
    }

    if (jurisdictionCode) {
      if (document.focus_areas !== undefined && !Array.isArray(document.focus_areas)) {
        failures.push(`${jurisdictionCode}: ${document.qc_id || document.id} focus_areas must be an array`);
      }
      const assignments = documentFocusAreas(document);
      if (!assignments.length) {
        failures.push(`${jurisdictionCode}: ${document.qc_id || document.id} has no Directory focus area`);
      }
      for (const assignment of assignments) {
        if (!declaredAreas.has(assignment)) {
          failures.push(`${jurisdictionCode}: ${document.qc_id || document.id} references nonexistent focus area "${assignment}"`);
        }
      }
      inventory.push({ document, assignments });
    }
  }

  if (jurisdictionCode) jurisdictionInventories.set(jurisdictionCode.toLowerCase(), inventory);
}

for (const file of workflowFiles) {
  const data = readJSON(file);
  if (!data) continue;
  const relativeFile = path.relative(root, file);
  const workflowId = data.workflow?.workflow_id;
  const fileId = path.basename(file, '.json');
  if (!workflowId) {
    failures.push(`${relativeFile} has no workflow.workflow_id`);
    continue;
  }
  if (workflowId !== fileId) {
    failures.push(`${relativeFile} workflow_id ${workflowId} does not match filename ${fileId}`);
  }
  if (workflowDefinitions.has(workflowId)) {
    failures.push(`Duplicate workflow_id ${workflowId}: ${workflowDefinitions.get(workflowId).relativeFile} and ${relativeFile}`);
  }
  workflowDefinitions.set(workflowId, { data, relativeFile });
  for (const relationship of data.relationships || []) {
    const id = relationship.resource_id;
    if (!canonicalResources.has(id)) {
      failures.push(`${path.relative(root, file)} has unresolved resource_id ${id}`);
    }
    if (!workflowReferences.has(id)) workflowReferences.set(id, []);
    workflowReferences.get(id).push(data.workflow?.workflow_id || path.basename(file, '.json'));
  }
}

// Explorer availability is derived from implemented workflow definitions.
// Discovery metadata alone must never expose an unfinished workflow.
const explorerData = readJSON(explorerFile);
if (explorerData) {
  const businessLineIds = new Set();
  for (const line of explorerData.business_lines || []) {
    if (!line.id) failures.push('data/workflows/explorer.json has a business line without an id');
    if (businessLineIds.has(line.id)) failures.push(`Duplicate Explorer business line id ${line.id}`);
    businessLineIds.add(line.id);
  }

  const discoveryRecords = new Map();
  for (const discovery of explorerData.workflows || []) {
    if (!discovery.id) {
      failures.push('data/workflows/explorer.json has production discovery metadata without an id');
      continue;
    }
    if (discoveryRecords.has(discovery.id)) {
      failures.push(`Duplicate production Explorer workflow id ${discovery.id}`);
      continue;
    }
    discoveryRecords.set(discovery.id, discovery);
    const definitionRecord = workflowDefinitions.get(discovery.id);
    if (!definitionRecord) {
      failures.push(`Explorer exposes ${discovery.id}, but no production workflow definition exists`);
      continue;
    }
    const definition = definitionRecord.data.workflow;
    if (!discovery.title || !discovery.description || !discovery.businessLine) {
      failures.push(`Explorer discovery metadata for ${discovery.id} is incomplete`);
    }
    if (!businessLineIds.has(discovery.businessLine)) {
      failures.push(`Explorer workflow ${discovery.id} references unknown business line ${discovery.businessLine}`);
    }
    if (discovery.businessLine !== definition.business_line) {
      failures.push(`Explorer workflow ${discovery.id} business line does not match its definition`);
    }
    const advertised = discovery.jurisdictions || [];
    if (!advertised.length || advertised.includes('all')) {
      failures.push(`Explorer workflow ${discovery.id} must advertise explicit implemented jurisdictions`);
    }
    for (const jurisdiction of advertised) {
      if (!(definition.supported_jurisdictions || []).includes(jurisdiction)) {
        failures.push(`Explorer workflow ${discovery.id} advertises unsupported jurisdiction ${jurisdiction}`);
      }
      const expectedDestination = `workflow.html?workflow=${discovery.id}&jurisdiction=${jurisdiction}`;
      if (discovery.destinations?.[jurisdiction] !== expectedDestination) {
        failures.push(`Explorer workflow ${discovery.id} has invalid destination for ${jurisdiction}`);
      }
    }
    for (const jurisdiction of Object.keys(discovery.destinations || {})) {
      if (!advertised.includes(jurisdiction)) {
        failures.push(`Explorer workflow ${discovery.id} configures an unadvertised destination for ${jurisdiction}`);
      }
    }
  }

  for (const workflowId of workflowDefinitions.keys()) {
    if (!discoveryRecords.has(workflowId)) {
      failures.push(`Production workflow ${workflowId} has no Explorer discovery metadata`);
    }
  }

  const allDiscoveryIds = new Set(discoveryRecords.keys());
  for (const future of explorerData.future_workflows || []) {
    if (!future.id) continue;
    if (allDiscoveryIds.has(future.id)) failures.push(`Workflow id ${future.id} conflicts across production and future discovery metadata`);
    allDiscoveryIds.add(future.id);
  }
}

const inventoryArg = process.argv.find(argument => argument.startsWith('--inventory='));
if (inventoryArg) {
  const code = inventoryArg.split('=')[1].toLowerCase();
  const inventory = jurisdictionInventories.get(code);
  if (!inventory) {
    failures.push(`No jurisdiction inventory found for ${code.toUpperCase()}`);
  } else {
    console.log('id\tqc_id\tresource_id\ttitle\tfocus_areas\tdirectory_visible\tworkflows');
    for (const { document, assignments } of inventory) {
      console.log([
        document.id,
        document.qc_id || '',
        document.resource_id || '',
        document.title,
        assignments.join(','),
        assignments.length ? 'yes' : 'no',
        (workflowReferences.get(document.resource_id) || []).join(',')
      ].join('\t'));
    }
  }
}

if (failures.length) {
  console.error('DIRECTORY INTEGRITY FAILED\n');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Directory integrity passed: ${resourceIds.size} resource IDs, ${qcIds.size} QC IDs, ${workflowFiles.length} workflows.`);
