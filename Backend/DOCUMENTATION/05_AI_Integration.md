# 05. AI Grievance Assistant Integration

## 1. Model & API Configuration
- **Provider:** Google Gemini REST API (`https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`)
- **Primary Model:** `gemini-2.5-flash` (configurable via `GEMINI_MODEL`, with automatic secondary fallback to `gemini-2.0-flash` if a model identifier returns HTTP 404).
- **Output Format:** Structured JSON (`responseMimeType: "application/json"`, `temperature: 0.2`) with a 12-second `AbortSignal` timeout to respect Vercel Serverless execution limits.

## 2. Capabilities Implemented (`src/services/aiService.js`)
When a citizen enters complaint text (`POST /api/ai/optimize-complaint` or `POST /api/ai/analyze-grievance`) or a CMO administrator triggers re-analysis (`POST /api/ai/grievances/:id/analyze`), the assistant performs:
1. **Complaint Optimization:** Rewrites unstructured or informal citizen text into a clear, polite, factual `optimizedSubject` and `optimizedDescription` while explicitly preserving original facts without inventing details. When accepted by the citizen, the original text is preserved in `originalDescription`.
2. **CMO Executive Summary:** Produces a concise 2–3 sentence `summary` for rapid administrative triage.
3. **Key Complaint Highlights:** Extracts 3–5 concise bullet strings (`highlights`) capturing core issue, affected location/district, public impact, and urgency.
4. **Department & Category Recommendation:** Matches the complaint against active MongoDB Atlas `Department` records (`suggestedDepartmentCode`, `suggestedDepartmentName`) and `GRIEVANCE_CATEGORIES`.
5. **Priority Recommendation:** Assigns `Low`, `Medium`, or `High` based on public safety, medical/health criticality, outage severity, and vulnerable group impact.
6. **Optional Potential Duplicate Flagging:** Compares the complaint against recent grievances in the same district/category using both lexical Jaccard similarity (`computeJaccardSimilarity`) and Gemini semantic evaluation, surfacing candidate matches (`potentialDuplicates`) for human verification.

## 3. Safeguards & Human-in-the-Loop Governance
- **Advisory Only:** Every AI response includes an explicit `disclaimer` stating suggestions require human review.
- **No Autonomous Official Actions:** AI suggestions never automatically set `assignedDepartment`, change official `status`, or reject complaints. Citizens explicitly choose whether to apply optimized phrasing (`reviewedByCitizen`), and CMO administrators make all official routing, priority, escalation, and resolution decisions (`reviewedByCmo`).
- **Rate Limiting & Auth:** `/api/ai/*` routes require JWT authentication and enforce request rate limiting (`express-rate-limit`).

## 4. Labelled Fallback Policy & Limitations
- **Trigger Conditions:** If `GEMINI_API_KEY` is absent, set to a placeholder, rate-limited (`429`), timed out, or unreachable, the service runs `buildFallbackAnalysis()`.
- **Explicit Transparency:** Fallback responses always set `source: "fallback"`, `isFallback: true`, `modelUsed: "rule-based-heuristic-fallback-v1"`, and `fallbackReason` so evaluators and UI clients can clearly badge fallback output and never mistake heuristic results for live LLM output.
- **Known Limitations:** LLM outputs depend on network availability and external quota; complex Malayalam-transliterated inputs may require citizen verification before accepting optimized English text.
