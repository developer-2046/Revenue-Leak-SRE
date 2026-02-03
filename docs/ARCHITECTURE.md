# Revenue Leak SRE - Architecture

We apply **Site Reliability Engineering (SRE)** principles to Go-To-Market (GTM) operations.
Instead of treating revenue leaks as "bad data", we treat them as **System Incidents**.

## 🏗 High-Level Design

```mermaid
graph TD
    User[User / GTM Ops] -->|Click Demo Mode| UI[Next.js Frontend]
    
    subgraph "Core Engine (SRE Logic)"
        Scanner[Rules Engine / Scanner]
        Estimator[Impact Estimator ($)]
        IncidentMgr[Incident Commander]
        FixGen[Fix Pack Generator]
        DSL[DSL Runtime]
    end
    
    subgraph "Data Layer"
        CSV[CSV Parser]
        Store[In-Memory State]
    end

    UI --> Scanner
    Scanner -->|Raw Issues| Estimator
    Estimator -->|Priced Risks| IncidentMgr
    IncidentMgr -->|Sev-1 Alert| UI
    
    UI -->|Request Fix| FixGen
    FixGen -->|FixPack (JSON DSL)| UI
    UI -->|Approve| DSL
    DSL -->|Apply Changes| Store
    Store -->|Updated Data| Scanner
    
    Scanner -->|Re-Evaluate| Verifier[Regression Guard]
    Verifier -->|Pass/Fail| UI
```

## 🧩 Core Components

### 1. The Scanner (`lib/scanner.ts`)
- **Role**: The "Monitoring Agent".
- **Input**: Raw funnel records (Leads, Opps).
- **Logic**: Evaluates records against `DEFINED_RULES` (SLA checks, Stale limits).
- **Output**: Array of `LeakIssue` objects.

### 2. Impact Estimator (`lib/impact.ts`)
- **Role**: The "Business Context".
- **Logic**: 
  - `Risk = Deal Value * Stage Probability * Decay Factor`
  - Maps technical errors to financial loss.

### 3. Incident Manager (`lib/incident.ts`)
- **Role**: The "PagerDuty" of Revenue.
- **Logic**:
  - Aggregates priced risks.
  - Calculates **Error Budget Burn**.
  - Determines Incident Severity (SEV-1 to SEV-5).
  - Maintains the `WarRoom` timeline.

### 4. Fix Pack DSL (`lib/fixpack-dsl.ts`)
- **Purpose**: Infrastructure-as-Code for GTM.
- **Concept**: Fixes shouldn't be manual clicks. They should be code.
- **Structure**:
  ```typescript
  interface FixPackStep {
      action: 'email' | 'slack' | 'crm_update';
      params: Record<string, any>;
  }
  ```
- **Capabilities**: Dry-run simulation (predicting `BlastRadius`) and audit logging.

## 🔄 The Feedback Loop (SRE Model)
1. **Observe**: Scan the funnel.
2. **Prioritize**: Sort by `estimated_loss_usd`.
3. **Remediate**: Apply deterministic Fix Packs.
4. **Verify**: Re-scan to ensure the leak count decreased (Regression Guard).
