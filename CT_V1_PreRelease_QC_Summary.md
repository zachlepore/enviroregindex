# Connecticut v1 Pre-Release / Internal-Beta QC Summary

**Audit date:** August 16, 2026
**Candidate base:** `d9945b4`
**Overall recommendation:** **READY FOR INTERNAL BETA**

**CONNECTICUT V1 IS READY FOR INTERNAL BETA.**

This release-blocker pass repaired the CT58 official statutory destination, completed immutable canonical identity and publisher metadata for the 13 legacy records identified by the first audit, hardened Connecticut production validation, and reran the complete Connecticut QC package. It did not change workflow scope, regulatory descriptions, workflow notes, taxonomy, search, Explorer behavior, or UI.

## Git and branch-state finding

The repository has one local branch, `work`, and no configured Git remote. Commit `d9945b4` itself contains only the three QC artifacts (261 added lines). The large 46-file review display was accumulated branch history: its parent, `241105a`, contains the Connecticut platform, canonical data, workflows, and validator work. No destructive reset or rebase was performed. This cleanup is a narrow child of the audit commit, so its commit-specific diff is understandable even though a hosting service may display the accumulated Connecticut feature branch when compared with an older external base.

## Final inventory

- **Unique Connecticut canonical resources:** 83
- **Directory-discoverable Connecticut resources:** 83
- **Directory focus areas:** 9
- **Live Connecticut workflows:** 15
- **Workflow relationships:** 101
- **CT QC-ID high-water mark:** CT84
- **Numeric ID coverage:** 83/83 (100%)
- **QC-ID coverage:** 83/83 (100%)
- **Immutable `resource_id` coverage:** 83/83 (100%)
- **Publisher/source-type coverage:** 83/83 (100%)
- **Verification-date coverage:** 83/83 (100%)

### Directory focus-area counts

Counts are unique within each focus area; multi-area records legitimately occur in more than one count.

| Focus area | Resources |
|---|---:|
| Site Remediation | 24 |
| Stormwater | 16 |
| Site Assessment | 17 |
| Waste & Materials | 8 |
| Tanks & Oil | 9 |
| Water & Wastewater | 7 |
| Natural Resources | 6 |
| Coastal | 6 |
| Air | 6 |

- **Orphaned Directory-eligible resources:** 0
- **Invalid classifications:** 0
- **Multi-area canonical resources:** 15
- **Duplicate numeric IDs:** 0
- **Duplicate QC IDs:** 0
- **Duplicate resource IDs:** 0
- **Duplicate normalized URLs in live collections:** 0

## Release-blocker corrections

### CT58 official URL

CT58 retains numeric ID 67, QC ID `CT58`, resource ID `ct-inland-wetlands-watercourses-act`, title, classifications, and workflow relationships. Its canonical destination is now:

`https://prdext3.cga.ct.gov/current/pub/chap_440.htm#sec_22a-36`

The official Connecticut General Assembly host returned HTTP 200, served current Chapter 440, contained the Section 22a-36 anchor and Inland Wetlands and Watercourses Act text, showed a March 16, 2026 last-modified response, and did not redirect to an archive or unrelated destination. Verification metadata was refreshed to August 16, 2026.

### Immutable resource IDs assigned

| QC ID | Immutable resource ID |
|---|---|
| CT2 | `ct-environmental-cleanup-overview` |
| CT3 | `ct-technical-impracticability-variance` |
| CT4 | `ct-engineered-controls-overview` |
| CT6 | `ct-lep-verifications` |
| CT7 | `ct-release-remediation-closure-report-guide` |
| CT8 | `ct-voluntary-remediation-programs` |
| CT9 | `ct-remediation-forms` |
| CT16 | `ct-stormwater-quality-manual-interactive` |
| CT17 | `ct-stormwater-program` |
| CT21 | `ct-brownfields-program` |
| CT27 | `ct-react-resources-instructions` |
| CT28 | `ct-environmental-use-restrictions` |
| CT30 | `ct-pfas-program` |

Existing numeric IDs and QC IDs were preserved. Global populated `resource_id` count increased from 89 to 102, and all identifiers remain unique.

### Publisher/source-type normalization

| QC ID | Publisher | Source type |
|---|---|---|
| CT2 | Connecticut Department of Energy and Environmental Protection | `government-agency` |
| CT6 | Connecticut Department of Energy and Environmental Protection | `government-agency` |
| CT7 | Connecticut Department of Energy and Environmental Protection | `government-agency` |
| CT9 | Connecticut Department of Energy and Environmental Protection | `government-agency` |
| CT16 | University of Connecticut NEMO | `government-agency` |
| CT17 | Connecticut Department of Energy and Environmental Protection | `government-agency` |
| CT21 | Connecticut Department of Energy and Environmental Protection | `government-agency` |
| CT27 | Connecticut Department of Energy and Environmental Protection | `government-agency` |
| CT28 | Connecticut Department of Energy and Environmental Protection | `government-agency` |
| CT30 | Connecticut Department of Energy and Environmental Protection | `government-agency` |

## Validation results

The existing validator now requires every Connecticut v1 production Directory resource to have a valid integer ID, QC ID, immutable resource ID, publisher, controlled source type, verification date, valid HTTP(S) canonical URL, and at least one declared focus-area assignment. It continues checking per-collection numeric uniqueness, global QC/resource-ID uniqueness, normalized URL uniqueness across live collections, focus areas, workflow references, and Explorer/definition integrity.

- Validator result: **PASS — 102 resource IDs, 140 QC IDs, 15 workflows.**
- Connecticut inventory validator: **PASS — 83 resources, all Directory-visible.**
- All 101 workflow relationships resolve to exactly one canonical resource.
- No production Explorer metadata lacks a definition, and no definition lacks production discovery metadata.
- No placeholder/future workflow is production-visible.

A negative validation check removed CT2's resource ID in a temporary test and correctly failed with `has no immutable resource_id`; the original file was restored before final validation.

## Live-source verification

- **83/83 Connecticut canonical URLs returned HTTP 2xx.**
- **CT58 returned HTTP 200 at the repaired official URL.**
- Automated checks detected no soft 404, archive notice, unexpected third-party redirect, or failed destination.
- CT19 (REACT), CT29 (ArcGIS), CT34/CT35 (government datasets), and CT41 (ezFile) remain authoritative interactive destinations whose full authenticated or application behavior cannot be exhaustively automated.

## Workflow, search, routing, and shell regression

- **15/15 workflows passed desktop QA at 1440×900.**
- **15/15 workflows passed mobile QA at 390×844.**
- All expected sections, 101 resource cards, notes, publisher labels, and Open Resource links rendered.
- No missing-reference panel, dead route, or horizontal overflow appeared.
- Workflow and Directory searches returned results for Phase I, Phase II, RBCR, UST, SPCC, SWPPP, MS4, hazardous waste, waste characterization, pretreatment, wetlands, vapor intrusion, air permit, and coastal.
- Connecticut exposed all nine business lines. EPA/Federal and every coming-soon state exposed zero Connecticut workflows.
- Shared headers, footers, logo route, Directory navigation, and Workflow navigation rendered consistently at both viewport sizes.
- No application-code console error occurred. External font certificate failures from the automated environment remain non-blocking and did not affect local scripts, data, routing, or rendering.

## Release-gate matrix

| Gate | Result | Basis |
|---|---|---|
| A. All nine business lines have a live workflow | **PASS** | Nine enabled CT business-line cards; 15 workflows. |
| B. Zero visible placeholders/dead ends | **PASS** | Only implemented, resolved definitions rendered. |
| C. Zero orphaned Directory resources | **PASS** | 83/83 resources have valid Directory paths. |
| D. All workflow canonical references resolve | **PASS** | 101/101 relationships resolve. |
| E. Canonical IDs/QC IDs/resource IDs pass | **PASS** | 83/83 CT records complete; all identifiers unique. |
| F. No clearly superseded resource represented as current | **PASS** | No contrary live-source evidence identified. |
| G. No material workflow-note regulatory misstatement | **PASS** | Notes remain navigational and non-determinative. |
| H. Search and jurisdiction routing work | **PASS** | Representative searches and jurisdiction isolation passed. |
| I. Shared product shell works | **PASS** | Header/footer/navigation passed on all tested page types. |
| J. Desktop/mobile basic QA passes | **PASS** | All workflows and shell routes passed without overflow. |
| K. Human-review items are documented and non-critical | **PASS** | Remaining checks concern interactive behavior only. |
| L. No trust-undermining FIX REQUIRED issue remains | **PASS** | Directory QC contains zero FIX REQUIRED records. |

## Remaining non-blocking human checks

1. **CT29 ArcGIS:** run one known-property query and confirm expected layers.
2. **CT41 ezFile:** after authenticated login, confirm the construction-stormwater filing path without submitting data.
3. **CT19 REACT:** exercise one property search.
4. **CT34/CT35:** optionally download one current dataset during beta review.

These checks do not conceal a known broken route, regulatory error, or canonical-integrity problem and therefore do not block internal beta.

## Final disposition

**READY FOR INTERNAL BETA.** All twelve release gates pass, all 83 Connecticut resources pass required canonical-integrity validation, CT58 resolves, and all 15 production workflows pass regression QA.

**CONNECTICUT V1 IS READY FOR INTERNAL BETA.**
