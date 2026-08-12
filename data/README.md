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
| Connecticut | `CT` | 43 |
| EPA / Federal | `EPA` | 13 |
| Massachusetts | `MA` | 8 |
| Rhode Island | `RI` | 4 |
| New York | `NY` | 7 |
| New Hampshire | `NH` | 5 |
| Vermont | `VT` | 4 |
| Maine | `ME` | 5 |
| Authoritative standards | `STD` | 2 |

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
