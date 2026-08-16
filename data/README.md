# Jurisdiction Data

## QC identifiers

Every resource in a jurisdiction JSON file has a human-readable `qc_id` for
QA reports, manual review, and update requests. A QC ID is separate from the
resource's numeric `id` and must not be used as an application relationship or
workflow identifier.

The naming convention is the jurisdiction code followed by the issued number,
with no separator:

- Connecticut: `CT1`, `CT2`, ...
- EPA / Federal: `EPA1`, `EPA2`, ...
- Non-EPA federal agencies: `FED1`, `FED2`, ...
- Massachusetts: `MA1`, `MA2`, ...
- Rhode Island: `RI1`, `RI2`, ...
- New York: `NY1`, `NY2`, ...
- New Hampshire: `NH1`, `NH2`, ...
- Vermont: `VT1`, `VT2`, ...
- Maine: `ME1`, `ME2`, ...
- Authoritative standards: `STD1`, `STD2`, ...

### Never recycle a QC ID

A QC ID is permanently retired when its resource is deleted. Do not renumber
remaining resources, reuse a gap, or assign a retired ID to another resource.
New resources must receive the next number above the jurisdiction's high-water
mark below, even when the current JSON file no longer contains that number.

Update the applicable high-water mark in the same commit that issues a new QC
ID. Git history and this table provide the audit trail for retired identifiers.

| Jurisdiction | Prefix | Highest issued |
| --- | --- | ---: |
| Connecticut | `CT` | 78 |
| EPA / Federal | `EPA` | 21 |
| Non-EPA federal agencies | `FED` | 1 |
| Massachusetts | `MA` | 8 |
| Rhode Island | `RI` | 4 |
| New York | `NY` | 7 |
| New Hampshire | `NH` | 5 |
| Vermont | `VT` | 4 |
| Maine | `ME` | 5 |
| Authoritative standards | `STD` | 2 |

### Retired identifiers

Retired identifiers remain unavailable for reuse even when their records are
removed from the current collection.

| Jurisdiction | QC ID | Numeric ID | Retirement note |
| --- | --- | ---: | --- |
| Connecticut | `CT20` | 27 | Duplicate LEP Program record retired in favor of `CT5` / `ct-lep-program`; Site Assessment remains an additional Directory assignment on the surviving canonical record. |

## Canonical collection ownership

Canonical ownership follows the resource's actual publisher or authority, not
the jurisdiction of a workflow that uses it. EPA resources belong in
`epa.json`; resources from other U.S. federal agencies belong in
`federal.json`; external standards-body resources belong in `standards.json`;
and state resources belong in the applicable state collection.

Before committing a new resource, confirm that its `qc_id` is unique across
all files in this directory and that its number is greater than the recorded
high-water mark. The existing numeric `id` field remains unchanged and serves
a separate purpose.

## Software resource identifiers

Resources referenced by workflows have an immutable string `resource_id`.
Unlike `qc_id`, this field is an application identifier rather than a label for
human QA communication.

- A `resource_id` must be globally unique across every resource collection.
- A `resource_id` must not change when a resource is reordered, renamed, or
  moved between display sections.
- A retired `resource_id` must never be recycled.
- Workflows must reference `resource_id`, never `qc_id` or the numeric `id`.
- Source URLs, canonical titles, directory descriptions, publisher metadata,
  and verification metadata remain owned by the canonical resource record.

## Directory classification integrity

Canonical resource ingestion and Directory classification are one transaction.
Every jurisdiction resource must resolve to at least one slug declared in that
jurisdiction's `focus_areas`: its primary `category`, or an additional slug in
its optional `focus_areas` array. A resource may belong to multiple focus areas
without duplicating its canonical record. Workflow relationships and Directory
classification are separate relationships to that same record; adding a
resource for a workflow does not exempt it from Directory classification.

The required workflow-ingestion sequence is:

1. Confirm the workflow need and authoritative resource.
2. Check for an existing canonical record.
3. Ingest a genuinely missing canonical record.
4. Assign its Directory focus area or areas.
5. Add the workflow relationship.
6. Run `node scripts/validate-data.js` before opening a PR.

Every workflow PR that ingests resources must list each new `qc_id` and
`resource_id`, its Directory focus area assignments, and its workflow use. The
integrity check must pass; unclassified canonical resources are not permitted.
