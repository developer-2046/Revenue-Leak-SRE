# Changelog

## [Hackathon Demo] - 2026-02-02
### Added
- **Demo Mode**: One-click simulation of revenue incidents.
- **War Room Dashboard**: Real-time view of Revenue at Risk, active incidents, and timeline.
- **SLO Engine**: Initial implementation of Service Level Objectives for GTM (Lead Response, Deal Velocity).
- **Error Budgets**: Visual tracking of permissible revenue leakage.
- **Fix Pack DSL**: TypeScript-based definition for remediation workflows (Dry-run capable).
- **Verification Reports**: Post-fix regression testing.
- **CI/CD**: GitHub Actions workflow for lint/test.
- **Documentation**: Comprehensive guides for Judges, Architecture, and Rules.

## [0.1.0] - 2026-01-20

### Added
-   **Revenue Reliability Dashboard**: Visual SLOs and Error Budget tracking (% remaining).
-   **Fix Packs & Audit**: GitOps-style "Approve & Apply" workflow with diff previews and immutable audit logs.
-   **Deterministic Demo Mode**: One-click "Run Full Demo" for perfect presentations.
-   **Quality Gates**: Added `vitest` unit tests and GitHub Actions CI workflow.
-   **Documentation**: Added `RELIABILITY_MODEL.md` and updated architecture docs.

### Changed
-   Refactored `IssueDrawer` to support preview mode.
-   Updated `README.md` with enterprise positioning.
