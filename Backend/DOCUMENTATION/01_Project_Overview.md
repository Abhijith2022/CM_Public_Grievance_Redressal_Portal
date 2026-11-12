# 01. Project Overview — CM Kerala Public Grievance Redressal Portal

> **Recruitment Prototype Disclaimer:** This project is a recruitment assessment prototype built exclusively with fictional sample data for demonstration and evaluation purposes. It does **not** represent an official portal and does not imply authorization or endorsement by the Government of Kerala or the Chief Minister's Office.

## 1. Problem Statement
Citizens across Kerala's 14 districts frequently need an accessible digital channel to submit grievances concerning roads, public infrastructure, healthcare, water supply, power, education, revenue services, transport, and welfare programs directly to the Chief Minister's Office (CMO). Without structured intake, centralized triage, traceable department routing, and transparent status updates, citizen complaints risk delays, misrouting, or lack of accountability.

## 2. Objectives
- Provide a unified online portal with public information pages, grievance submission, and Reference ID tracking.
- Enforce role-based workflows across **three distinct roles**: **Citizens**, **CMO Administrators**, and **Department Officers**.
- Maintain an immutable, timestamped lifecycle trail across all mandatory statuses: `Submitted`, `Under Review`, `In Progress`, `Resolved`, and `Reopened`.
- Integrate an **AI Grievance Assistant** (powered by Google Gemini API with a clearly labelled deterministic fallback) to optimize citizen complaint wording, summarize complaints for the CMO, highlight key complaint details, recommend department/category/priority, and flag potential duplicates.
- Deploy seamlessly on **Vercel Serverless** backed by **MongoDB Atlas** (`mongodb+srv://`), including serverless-safe attachment storage inside MongoDB Atlas.

## 3. Scope & Core Features

### A. Public Website & APIs
- Portal overview statistics, featured departments, 14 Kerala districts, grievance categories, workflow guide, FAQs, and persisted Contact Us enquiries (`ContactEnquiry`).
- Public Reference ID tracker (`GET /api/grievances/track/:referenceId`) showing current status, assigned department, public remarks, and timeline history.

### B. Citizen Portal
- Registration (`name`, `email`, `mobileNumber`, `password`, optional `district`), login, and logout.
- Grievance submission with optional supporting image/document attachment (`JPG`, `PNG`, `WEBP`, `PDF`, `TXT`, `DOC`, `DOCX` up to 3 MB).
- Unique Reference ID generation (`KL-CMO-YYYY-XXXXXX`).
- AI Grievance Assistant preview allowing citizens to optimize complaint phrasing and inspect highlights/suggestions before submitting.
- Citizen dashboard counts, status history timeline, CMO/officer remarks, post-resolution feedback (1–5 rating), and reopening capability.

### C. Chief Minister's Office (CMO) Dashboard
- View all citizen grievances with multi-criteria filters (`district`, `category`, `priority`, `status`, `departmentId`, `escalated`, `overdue`, `search`).
- Summary metrics (`total`, `pending`, `resolved`, `overdue`, `escalated`) and district-wise / department-wise / category-wise analytics.
- Review AI summary & highlights, add public or internal administrative remarks, forward/assign grievances to specific departments and officers, escalate delayed grievances, and review officer action-taken reports before marking `Resolved`.

### D. Department Officer Dashboard
- Secure officer login via assigned credentials (`department_officer` role).
- View grievances forwarded to the officer's department, inspect citizen attachments, update investigation status (`In Progress`), add investigation remarks, and upload/submit an Action-Taken Report back to the CMO for final review.
