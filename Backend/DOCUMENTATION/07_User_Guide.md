# 07. User Guide (Citizens, CMO Administrators & Department Officers)

> **Prototype Notice:** All sample accounts and sample grievances in this guide are fictional test data for recruitment assessment only.

## 1. Fictional Demo Login Credentials
| Role | Email | Password | Capabilities |
|---|---|---|---|
| **Citizen** | `citizen.ananya@prototype-portal.demo` | `CitizenDemo@2026` | Submit complaints, run AI Optimizer, track status, submit feedback / reopen |
| **CMO Administrator** | `cmo.admin@prototype-portal.demo` | `CmoDemo@2026` | Review all complaints, inspect AI summary/highlights, forward to dept/officer, escalate, resolve |
| **Department Officer (PWD)** | `officer.pwd@prototype-portal.demo` | `OfficerDemo@2026` | View PWD-assigned grievances, update investigation remarks, upload action-taken report |
| **Department Officer (Health)** | `officer.health@prototype-portal.demo` | `OfficerDemo@2026` | View Health-assigned grievances and submit action-taken report |
| **Department Officer (Water)** | `officer.water@prototype-portal.demo` | `OfficerDemo@2026` | View Water-assigned grievances and submit action-taken report |

---

## 2. Citizen Workflow
1. **Register or Log In:** Open **Auth & Demo Logins** to register a new citizen account or use the quick Citizen demo login.
2. **Draft & Optimize with AI:** Open **Citizen Portal**, select District and Category, enter Subject and Description, and click **AI Optimize, Summarize & Highlight**.
3. **Review AI Suggestions:** Inspect the AI-rewritten complaint text, CMO summary, bullet highlights, recommended department/priority, and duplicate warnings. Click **Apply AI Optimization to Form** if desired.
4. **Attach Files & Submit:** Optionally attach supporting JPG/PNG/PDF files (`<= 3 MB`), then click **Submit Grievance**. Save your unique Reference ID (`KL-CMO-YYYY-XXXXXX`).
5. **Track Progress & Give Feedback:** Enter the Reference ID under **Public & Track** or inspect your grievance in **Citizen Portal** to read CMO/officer remarks and status history. Once `Resolved`, submit a 1–5 rating and comment, or request reopening if unresolved.

## 3. Chief Minister's Office (CMO) Administrator Workflow
1. Log in as **CMO Administrator** (`cmo.admin@prototype-portal.demo`).
2. Inspect dashboard totals (`Total`, `Pending`, `Resolved`, `Overdue`, `Escalated`), district statistics, and department statistics.
3. Filter grievances by district, category, priority, or status, then click **Review / Assign** on any record.
4. Read the AI executive summary & key highlights (or click **Re-analyze**), inspect citizen attachments, and forward the grievance to the appropriate department and officer (`Forward / Assign Department`).
5. Use **Escalate** for delayed/overdue cases with internal justification.
6. After the department submits its Action-Taken Report, review it and update the official status to **Resolved** (or send back to **In Progress** / **Reopened**).

## 4. Department Officer Workflow
1. Log in with assigned officer credentials (e.g., `officer.pwd@prototype-portal.demo`).
2. View grievances forwarded to your department under **Department Officer**.
3. Click **Investigate** to review citizen complaint details and attachments.
4. Update status to **In Progress** with investigation remarks (`Update Progress`).
5. Once field action is completed, enter the **Action-Taken Report Summary**, detailed findings, and optional proof attachment, then click **Submit Action-Taken Report to CMO**.
