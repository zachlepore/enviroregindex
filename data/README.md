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

### Never recycle a QC ID

A QC ID is permanently retired when its resource is deleted. Do not renumber
remaining resources, reuse a gap, or assign a retired ID to another resource.
New resources must receive the next number above the jurisdiction's high-water
mark below, even when the current JSON file no longer contains that number.

Update the applicable high-water mark in the same commit that issues a new QC
ID. Git history and this table provide the audit trail for retired identifiers.

| Jurisdiction | Prefix | Highest issued |
| --- | --- | ---: |
| Connecticut | `CT` | 31 |
| EPA / Federal | `EPA` | 11 |
| Massachusetts | `MA` | 8 |
| Rhode Island | `RI` | 4 |
| New York | `NY` | 7 |
| New Hampshire | `NH` | 5 |
| Vermont | `VT` | 4 |
| Maine | `ME` | 5 |

Before committing a new resource, confirm that its `qc_id` is unique across
all files in this directory and that its number is greater than the recorded
high-water mark. The existing numeric `id` field remains unchanged and serves
a separate purpose.
