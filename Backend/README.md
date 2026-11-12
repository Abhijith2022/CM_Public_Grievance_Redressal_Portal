# CM Kerala – Chief Minister's Public Grievance Redressal Portal (Recruitment Prototype)

> **Important Prototype Disclaimer:** This application is a **recruitment assessment prototype** created strictly with fictional sample data for demonstration purposes. It is **not** an official system and does not imply authorization or endorsement by the Government of Kerala or the Chief Minister's Office.

## Overview
A standalone Express.js + MongoDB Atlas REST API backend for the CM Kerala Public Grievance Redressal Portal, structured for both local Node.js development and Vercel serverless deployment, with Google Gemini AI integration (+ clearly labelled heuristic fallback) supporting all three mandatory roles:

1. **Citizen (`citizen`)** — Public registration/login, AI complaint optimizer & highlighter, supporting file uploads (persisted in MongoDB Atlas), unique Reference ID tracking, status timeline, post-resolution feedback & reopen requests.
2. **CMO Administrator (`cmo_admin`)** — Central grievance triage, total/pending/resolved/overdue/escalated counts, district & department analytics, AI summary/highlights inspection, forwarding to departments/officers, escalation, and final resolution review.
3. **Department Officer (`department_officer`)** — Department-scoped login, investigation remarks, progress updates, and Action-Taken Report submission (with optional file upload) back to the CMO.

---

## Project Structure
```text
Backend/
├── api/                        # Vercel serverless entry points (/api & /api/*)
│   ├── index.js                # Handles /api and /api/index
│   └── [...all].js             # Catch-all for /api/* routes
├── src/
│   ├── config/                 # Serverless-cached MongoDB Atlas connection
│   ├── constants/              # 14 Kerala districts, categories, statuses, roles, FAQs
│   ├── controllers/            # Auth, Public, AI, Attachments, Grievances, CMO, Officer
│   ├── middleware/             # JWT + RBAC, DB readiness, Multer memoryStorage, errors
│   ├── models/                 # 8 Mongoose schemas (User, Dept, Grievance, History, Assignment, Attachment, Feedback, Contact)
│   ├── routes/                 # Express REST routers
│   ├── services/               # Gemini AI Assistant (+ labelled fallback) & fictional demo seeder
│   ├── scripts/                # CLI seed script
│   ├── utils/                  # Errors, Reference ID generator, validators
│   ├── app.js                  # Express app configuration & middleware pipeline
│   └── server.js               # Local HTTP server entry point
├── tests/                      # Automated API & unit tests (node --test)
├── DOCUMENTATION/              # Architecture, DB, API, AI, setup & user guide docs
├── .env.example                # Environment variables template (no secrets)
├── package.json                # Standalone REST API package & scripts
└── vercel.json                 # Vercel API serverless routing configuration
```

---

## Demo Login Credentials (Fictional Test Accounts Only)

| Role | Email | Password |
|---|---|---|
| **Citizen** | `citizen.ananya@prototype-portal.demo` | `CitizenDemo@2026` |
| **CMO Administrator (CM Login)** | `cmo.admin@prototype-portal.demo` | `CmoDemo@2026` |
| **Department Officer (PWD)** | `officer.pwd@prototype-portal.demo` | `OfficerDemo@2026` |
| **Department Officer (Health)** | `officer.health@prototype-portal.demo` | `OfficerDemo@2026` |
| **Department Officer (Water)** | `officer.water@prototype-portal.demo` | `OfficerDemo@2026` |

Sample Reference IDs for instant public tracking: `KL-CMO-2026-1001` through `KL-CMO-2026-1006`.

---

## Quick Start (Local Development)
1. Copy `.env.example` to `.env` and fill in your **MongoDB Atlas** URI (`mongodb+srv://...`), `JWT_SECRET`, and `GEMINI_API_KEY` (optional — runs in clearly labelled fallback mode if omitted).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Optional manual seed (auto-seeds automatically on first DB connection when `AUTO_SEED_DEMO=true`):
   ```bash
   npm run seed
   ```
4. Start the API server (`http://localhost:5000`):
   ```bash
   npm run dev
   ```
   (Or run `npm start` for production mode.)
5. Run automated tests:
   ```bash
   npm test
   ```

---

## Vercel & MongoDB Atlas Hosting Guide
- **MongoDB Atlas:** Add `0.0.0.0/0` under Atlas **Network Access** so Vercel dynamic serverless IPs can connect via `mongodb+srv://`. File uploads (`<= 3 MB`) are stored as binary buffers inside MongoDB Atlas (`Attachment` model) so no local filesystem is required.
- **Vercel API Deployment:** Set Vercel **Root Directory** to `Backend` (uses `vercel.json` and `api/`), configure `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGIN` (your frontend origin), `AUTO_SEED_DEMO=true`, `EXPOSE_DEMO_CREDENTIALS=true`, and connect your React frontend using `VITE_API_BASE_URL=https://<your-backend>.vercel.app/api`.

---

## Documentation Index
- [01. Project Overview](DOCUMENTATION/01_Project_Overview.md)
- [02. System Architecture & Diagram](DOCUMENTATION/02_System_Architecture.md)
- [03. Database Design & ER Diagram](DOCUMENTATION/03_Database_Design.md)
- [04. API Documentation](DOCUMENTATION/04_API_Documentation.md)
- [05. AI Integration & Safeguards](DOCUMENTATION/05_AI_Integration.md)
- [06. Setup, Vercel Deployment & Testing](DOCUMENTATION/06_Setup_and_Testing.md)
- [07. User Guide](DOCUMENTATION/07_User_Guide.md)
- Diagrams: [System Architecture](DOCUMENTATION/diagrams/system_architecture.mmd) | [Database ER](DOCUMENTATION/diagrams/database_er.mmd)
