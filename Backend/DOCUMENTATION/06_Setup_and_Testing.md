# 06. Setup, Vercel Deployment & Testing

## 1. Prerequisites
- Node.js >= 20.x (`v22.x` recommended)
- MongoDB Atlas account (`M0` free tier works) — obtain an SRV URI (`mongodb+srv://...`)
- Google Gemini API Key (from Google AI Studio) — optional for fallback testing, recommended for live LLM mode
- Vercel account (connected to GitHub or using Vercel CLI)

## 2. Environment Variables
Copy `.env.example` to `.env` (never commit `.env` to GitHub):

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` / `production` |
| `PORT` | Local Express server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas SRV connection string | `mongodb+srv://user:pass@cluster.mongodb.net/cm_kerala_grievance?...` |
| `JWT_SECRET` | Secret key (>= 32 chars) for signing JWTs | `replace_with_strong_random_secret` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `GEMINI_MODEL` | Gemini model ID | `gemini-2.5-flash` |
| `CORS_ORIGIN` | Allowed frontend origin(s) | `http://localhost:5173` |
| `AUTO_SEED_DEMO` | Auto-seed demo data when DB is empty | `true` |
| `EXPOSE_DEMO_CREDENTIALS` | Enable `/api/auth/demo-accounts` | `true` |
| `MAX_ATTACHMENT_SIZE_MB` | Per-file upload limit (`<= 4` for Vercel) | `3` |

### MongoDB Atlas Network Whitelist for Vercel
Because Vercel Serverless Functions run on dynamic IP addresses, open **MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access from Anywhere (`0.0.0.0/0`)** (protected by strong database username/password in `MONGODB_URI`).

## 3. Local Installation & Execution
```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas MONGODB_URI, JWT_SECRET, and GEMINI_API_KEY

# Optional: manually seed fictional demo departments, users, and sample grievances
npm run seed

# Start Express REST API (port 5000)
npm run dev
```

## 4. Deploying on Vercel

### Standalone Backend API Deployment
1. Import the repository in Vercel and set **Root Directory** to `Backend`.
2. `vercel.json` + `api/` expose the Express REST API serverless functions (`/`, `/api`, `/api/index`, and `/api/*`).
3. Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGIN`, `AUTO_SEED_DEMO=true`, `EXPOSE_DEMO_CREDENTIALS=true`) in Vercel Project Settings.
4. Set `VITE_API_BASE_URL=https://<your-backend>.vercel.app/api` in your separate `Frontend` project.
5. Deploy and verify `https://<your-backend>.vercel.app/api/health`.

## 5. Automated & Manual Test Cases
Run automated server tests:
```bash
npm test
```

### Verification Checklist
- [ ] `GET /api/health` returns `200 OK` with `database.status = "connected"`.
- [ ] Citizen registers via `POST /api/auth/register` or logs in via demo credentials.
- [ ] Citizen enters raw complaint text and clicks **AI Optimize, Summarize & Highlight** (`POST /api/ai/optimize-complaint`).
- [ ] Citizen submits grievance with file attachment (`POST /api/grievances`) and receives `KL-CMO-YYYY-XXXXXX`.
- [ ] Public Reference ID tracker (`GET /api/grievances/track/:referenceId`) displays current status and timeline.
- [ ] CMO Admin logs in (`cmo.admin@prototype-portal.demo`), filters queue, views AI summary, and forwards grievance to PWD/Health/Water (`POST /api/cmo/grievances/:id/assign`).
- [ ] Department Officer logs in (`officer.pwd@prototype-portal.demo`), updates progress (`PATCH /api/officer/grievances/:id/progress`), and uploads/submits Action-Taken Report (`POST /api/officer/grievances/:id/action-report`).
- [ ] CMO Admin reviews report and marks grievance `Resolved` (`PATCH /api/cmo/grievances/:id/status`).
- [ ] Citizen submits post-resolution feedback or requests reopening (`POST /api/grievances/:id/feedback`).
