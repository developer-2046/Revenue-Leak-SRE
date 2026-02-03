# Judge's Handoff Guide (60 Seconds)

**Goal**: Verify "One-Click Wow" & Engineering Quality.

## ⚡ Quickstart

1. **Clone & Install**
   ```bash
   git clone <repo_url>
   cd Revenue-Leak-SRE
   npm ci
   ```

2. **Run Tests (Engineering Check)**
   ```bash
   npm run test
   ```
   *(Expect: All tests pass, including DSL and Impact logic)*

3. **Start App**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

## 🚀 The Demo Flow (What to click)

1. **Click "START DEMO MODE"**.
   - *Why*: It deterministically loads a chaotic dataset and runs the SRE engine.
   - *Result*: War Room opens, "Severity 1" declared.

2. **Inspect "Top Causes"**.
   - *Why*: Shows we don't just list rows; we aggregate risk ($).

3. **Click "View Fix" (on the first issue)**.
   - *Why*: Opens the Incident Drawer.

4. **Scroll to "Fix Pack DSL Preview"**.
   - *Why*: **Innovation**. We generate code-based remediation steps (Infrastructure-as-Code for Revenue).

5. **Click "Approve & Apply Fix"**.
   - *Why*: Triggers the automation, updates the state, and runs the **Regression Guard**.
   - *Result*: "Verified" modal appears, "Saved Revenue" counter ticks up.

## 🏆 Why this wins
- **Impact**: Quantifiable revenue saved ($150k+ in demo).
- **Innovation**: Applying SRE (SLOs, Error Budgets, Incidents) to Sales.
- **Engineering**: Fully typed DSL, Vitest coverage, CI/CD ready.
