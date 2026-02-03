# Architecture

## Overview
Revenue Leak SRE is a Next.js application designed to ingest GTM data (Leads/Opps), scan for process leaks, quantify financial impact, and execute fixes.

## Component Diagram

```mermaid
graph TD
    User[User] -->|Uploads CSV| UI[Dashboard UI]
    UI -->|Stores State| Store[In-Memory Store]
    Store --> Scanner[Leak Scanner (lib/scanner)]
    Scanner -->|Raw Issues| Estimator[Impact Estimator (lib/estimator)]
    Estimator -->|Priced Issues| UI
    
    UI -->|Click issue| Drawer[Issue Drawer]
    Drawer -->|Generate| FixGen[Fix Generator (lib/fix-generator)]
    FixGen -->|Fix Pack| Drawer
    
    Drawer -->|Run Fix| Action[Live Action Handler]
    Action -->|POST| API[Next.js API Route (/api/slack)]
    API -->|Webhook| Slack[Slack API]
    
    Action -->|Update State| Store
    Store -->|Re-trigger| Scanner
```

## Key Modules

### 1. Data Layer (`lib/types.ts`)
- `FunnelRecord`: Unified schema for Leads and Opportunities.
- `LeakIssue`: Represents a detected problem with severity and cost.
- `FixPack`: Instructions and automation payload for resolving an issue.

### 2. Rules Engine (`lib/scanner.ts`)
- Iterates through all records to find specific patterns.
- Handles both single-record checks (SLA) and set-based checks (Duplicates).
- Returns a list of `LeakIssue`.

### 3. Impact Estimator (`lib/estimator.ts`)
- Augments `LeakIssue` with `estimated_loss_usd`.
- Uses business constants (rep cost, lead value) and decay functions.

### 4. Fix Generator (`lib/fix-generator.ts`)
- Maps `issue_type` to a `FixPack`.
- Generates human-readable steps and automation JSON payloads.
- Generates context-aware email drafts.

### 5. Live Action (`app/api/slack`)
- A secure API route to proxy requests to Slack.
- Protects the webhook URL (server-side environment variable).
