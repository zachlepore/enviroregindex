/* Shared jurisdiction registry for platform experiences. */
'use strict';

const JURISDICTION_REGISTRY = Object.freeze([
  { code: 'ct',  label: 'Connecticut',  type: 'state',   status: 'live'        },
  { code: 'epa', label: 'EPA / Federal', type: 'federal', status: 'live'        },
  { code: 'ma',  label: 'Massachusetts', type: 'state',   status: 'coming-soon' },
  { code: 'ri',  label: 'Rhode Island',  type: 'state',   status: 'coming-soon' },
  { code: 'ny',  label: 'New York',      type: 'state',   status: 'coming-soon' },
  { code: 'nh',  label: 'New Hampshire', type: 'state',   status: 'coming-soon' },
  { code: 'vt',  label: 'Vermont',       type: 'state',   status: 'coming-soon' },
  { code: 'me',  label: 'Maine',         type: 'state',   status: 'coming-soon' },
]);
