# BewerbRadar Copilot - AI System Rules (AGENTS.md)

> **CRITICAL INSTRUCTION FOR ALL AI AGENTS:** 
> This file contains the foundational rules for working on this repository (`Liutasil501/bewerbradar-copilot`). You MUST follow these rules without exception.

## 1. Context Enforcement (The Golden Rule)
Before writing any code or making any architectural decisions, you **MUST read the `PROJECT_CONTEXT.md`** file located in the root directory. 
- It contains the source of truth for all VPS configurations, API ports, Paywall logic, and current deployment strategies.
- Do not make assumptions about the environment.

## 2. Change Log & Documentation
Whenever you make significant architectural changes (e.g., adding database fields, changing deployment logic, modifying the Stripe paywall, updating Docker configurations):
- You MUST update the `PROJECT_CONTEXT.md` file at the end of the session to reflect these changes.
- The `PROJECT_CONTEXT.md` is our "Survival Guide". It must always represent the exact, real-time state of the project.

## 3. Branching & Deployment Safety (Zero-Downtime Rule)
- **`main` is LIVE:** The Hostinger VPS automatically pulls from the `main` branch. Anything pushed here will instantly restart the live server (`docker-compose down && up`) and disconnect active users!
- **NEVER work on `main`:** You are STRICTLY FORBIDDEN to push directly to `main` during development. 
- **`beta` is for WORK:** 100% of development, bug fixing, and testing happens on the `beta` branch.
- **Controlled Deployments:** We only merge `beta` into `main` when a feature is fully tested and we are ready for a controlled server restart (e.g. during off-peak hours).

## 4. Secrets & Environment Variables
- `STRIPE_SECRET_KEY` and other sensitive environment variables are **NOT** stored in GitHub. They reside manually in the `.env` file on the VPS.
- If you add new required `.env` variables to the application, you MUST explicitly tell the user to SSH into the VPS and add them manually.
- To prevent Next.js build errors on the VPS, always provide fallback strings for critical env variables in the code (e.g., `process.env.STRIPE_KEY || 'dummy_key_for_build'`).
