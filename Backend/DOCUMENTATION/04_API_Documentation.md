# 04. API Documentation

Base URL:
- Local Dev: `http://localhost:5000/api`
- Vercel Unified Deployment: `https://<your-project>.vercel.app/api`

Authentication Header (for protected routes):
```http
Authorization: Bearer <jwt_token>
```

---

## 1. Health & Public Endpoints

### `GET /api/health`
Returns server, MongoDB Atlas connection, and Gemini AI configuration status.

### `GET /api/public/overview`
Returns portal summary statistics, featured departments, 14 Kerala districts, categories, workflow steps, FAQs, and prototype disclaimer.

### `GET /api/departments`
Lists all active sample government departments along with assigned/resolved/pending counts.

### `POST /api/contact`
Saves a public Contact Us enquiry in MongoDB Atlas (`ContactEnquiry`).
```json
{
  "name": "Citizen Name",
  "email": "citizen@example.com",
  "subject": "Portal Query",
  "message": "How do I attach supporting documents?"
}
```

---

## 2. Authentication & Role Endpoints

### `POST /api/auth/register` (Citizen Registration)
```json
{
  "name": "Ananya Krishnan",
  "email": "ananya@example.com",
  "mobileNumber": "9876543210",
  "password": "Password@123",
  "district": "Ernakulam"
}
```

### `POST /api/auth/login` (Citizen / CMO Admin / Department Officer)
Optional `expectedRole` (`"citizen"` | `"cmo_admin"` | `"department_officer"`) enforces portal-specific login validation.
```json
{
  "email": "cmo.admin@prototype-portal.demo",
  "password": "CmoDemo@2026"
}
```
Response (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "<jwt_token>",
    "user": {
      "_id": "...",
      "name": "CMO Nodal Administrator (Demo)",
      "email": "cmo.admin@prototype-portal.demo",
      "role": "cmo_admin"
    }
  }
}
```

### `POST /api/auth/logout` | `GET /api/auth/me` | `GET /api/auth/demo-accounts`
- `GET /api/auth/me`: Returns authenticated user profile (`Bearer` required).
- `GET /api/auth/demo-accounts`: Lists fictional test accounts when `EXPOSE_DEMO_CREDENTIALS=true`.

---

## 3. AI Grievance Assistant Endpoints (Auth Required)

### `POST /api/ai/optimize-complaint` & `POST /api/ai/analyze-grievance`
Optimizes complaint wording, generates a CMO summary, extracts highlights, recommends department/category/priority, and checks potential duplicates.

Request:
```json
{
  "subject": "broken pipe flooding road",
  "description": "main drinking water pipe broke yesterday near kaloor market road 40 houses no water urgent",
  "district": "Ernakulam",
  "category": "Water Supply & Drainage"
}
```
Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "source": "gemini",
    "isFallback": false,
    "modelUsed": "gemini-2.5-flash",
    "disclaimer": "AI suggestions are advisory only and require human review by the citizen or CMO administrator. AI does not make official decisions.",
    "optimizedSubject": "Urgent Repair of Burst Drinking Water Pipeline near Kaloor Market Road, Ernakulam",
    "optimizedDescription": "Respected Sir/Madam, ...",
    "summary": "Citizen reports a burst main drinking water pipeline near Kaloor Market Road disrupting water supply to 40 households.",
    "highlights": [
      "Core Issue: Burst main drinking water pipeline",
      "Location: Kaloor Market Road, Ernakulam",
      "Impact: 40 households without drinking water and street flooding"
    ],
    "suggestedDepartment": {
      "code": "WTR",
      "name": "Water Resources & Supply Authority"
    },
    "suggestedCategory": "Water Supply & Drainage",
    "suggestedPriority": "High",
    "reasoning": "Potable water disruption for 40 households requires high-priority response.",
    "potentialDuplicates": []
  }
}
```

### `POST /api/ai/grievances/:id/analyze`
Re-runs AI analysis on an existing grievance and updates `grievance.aiAnalysis` (Citizen owner or CMO Admin).

---

## 4. Grievance Submission, Tracking & Feedback

### `POST /api/grievances` (Citizen, JSON or `multipart/form-data`)
Fields: `district`, `category`, `subject`, `description`, optional `originalDescription`, `priority`, `aiAnalysis`, `files` (up to 3 files, max 3 MB each). Returns `201 Created` with generated `referenceId`.

### `GET /api/grievances/track/:referenceId` (Public)
Tracks any grievance by Reference ID (`KL-CMO-2026-1001`) and returns status, assigned department, public remarks, action summary, and non-internal history timeline.

### `GET /api/grievances/my` (Citizen)
Returns citizen's grievances and status summary counts (`total`, `submitted`, `underReview`, `inProgress`, `resolved`, `reopened`, `pending`).

### `GET /api/grievances/:id` (RBAC Protected)
Returns complete grievance details, attachments, history, assignments, and feedback (Citizen owner / assigned Dept Officer / CMO Admin).

### `POST /api/grievances/:id/feedback` & `POST /api/grievances/:id/reopen` (Citizen)
Submits post-resolution rating (`1–5`), satisfaction flag, comment, and optional reopen request (`reopenRequested: true`), or reopens a resolved grievance with `reason`.

---

## 5. Attachments (MongoDB Atlas Binary Storage)
- `POST /api/attachments/upload` (`multipart/form-data`, field `files`) — Stores up to 3 files (`<= 3 MB`) in MongoDB Atlas.
- `GET /api/attachments/:id` — Streams attachment file with RBAC check (supports `Authorization: Bearer` or `?token=`).

---

## 6. CMO Administrator Endpoints (`cmo_admin`)
- `GET /api/cmo/stats` — Totals (`total`, `pending`, `resolved`, `overdue`, `escalated`), `districtStats`, `departmentStats`, `categoryStats`, `byStatus`, `byPriority`, `recentActivity`.
- `GET /api/cmo/officers` — Lists active department officers (filterable by `departmentId`).
- `GET /api/cmo/grievances` — Filterable queue (`district`, `category`, `priority`, `status`, `departmentId`, `escalated`, `overdue`, `search`, `page`, `limit`).
- `PATCH /api/cmo/grievances/:id/review` — Save CMO public/internal remarks, adjust priority/category, move to `Under Review`.
- `POST /api/cmo/grievances/:id/assign` — Forward grievance to `departmentId` (+ optional `officerId`, `dueDate`, `priority`, `instructions`).
- `PATCH /api/cmo/grievances/:id/escalate` — Escalate delayed grievance with `reason`.
- `PATCH /api/cmo/grievances/:id/status` — Update status (`Under Review`, `In Progress`, `Resolved`, `Reopened`) with `remark`.

---

## 7. Department Officer Endpoints (`department_officer`)
- `GET /api/officer/stats` — Department queue metrics (`totalAssigned`, `underReview`, `inProgress`, `actionSubmitted`, `resolved`, `overdue`).
- `GET /api/officer/grievances` — Grievances forwarded to the logged-in officer's department.
- `PATCH /api/officer/grievances/:id/progress` — Update investigation status (`Under Review` / `In Progress`) and `officerRemarks`.
- `POST /api/officer/grievances/:id/action-report` (`multipart/form-data` or JSON) — Submit `summary`, `details`, and optional proof `files` back to CMO for final resolution review.
