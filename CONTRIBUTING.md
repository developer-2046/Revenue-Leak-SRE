# Contributing to Revenue Leak SRE

## How to Run Locally

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/developer-2046/Revenue-Leak-SRE.git
    cd Revenue-Leak-SRE
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment**:
    Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
    (Optional) Add your SLACK_WEBHOOK_URL.

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## How to Add a New Leak Rule

1.  Navigate to `lib/rules/`.
2.  Create a new rule file or add to existing detector.
3.  Implement the logic to check `Lead` or `Opportunity` records.
4.  Throw or return an `Issue` object if a leak is found.

## How to Add a New Fix Pack

1.  Navigate to `lib/fixes/`.
2.  Define the fix steps and payload in the fix generator.
3.  Ensure you handle the `issue_type` in the generator switch case.
