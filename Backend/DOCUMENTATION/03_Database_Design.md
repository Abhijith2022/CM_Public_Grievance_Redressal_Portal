# 03. Database Design (MongoDB Atlas + Mongoose)

## 1. MongoDB Atlas Serverless Design Principles
- **Cloud-Native Atlas URI (`mongodb+srv://`):** Configured strictly for MongoDB Atlas (not local MongoDB Compass).
- **Connection Pooling Reuse:** `src/config/db.js` caches the Mongoose connection promise on `global._mongooseCache` so Vercel serverless warm invocations reuse connections rather than exhausting Atlas M0 connection limits.
- **Fast Failover:** `mongoose.set('bufferCommands', false)` ensures disconnected states fail fast with HTTP 503 rather than stalling until serverless timeout.
- **Serverless Attachment Storage:** Binary attachments (`<= 3 MB`) are stored in the `attachments` collection (`data: Buffer` with `select: false`) so list queries remain lightweight while uploaded evidence and action reports persist reliably across Vercel stateless containers.

## 2. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
  USER ||--o{ GRIEVANCE : submits
  USER ||--o{ GRIEVANCE : assigned_as_officer
  USER ||--o{ GRIEVANCE_HISTORY : changes
  USER ||--o{ ATTACHMENT : uploads
  USER ||--o{ CITIZEN_FEEDBACK : gives
  DEPARTMENT ||--o{ USER : employs_officers
  DEPARTMENT ||--o{ GRIEVANCE : assigned_to
  DEPARTMENT ||--o{ DEPARTMENT_ASSIGNMENT : receives
  GRIEVANCE ||--|{ GRIEVANCE_HISTORY : tracks
  GRIEVANCE ||--o{ DEPARTMENT_ASSIGNMENT : routed_via
  GRIEVANCE ||--o{ ATTACHMENT : has_files
  GRIEVANCE ||--o| CITIZEN_FEEDBACK : receives_feedback

  USER {
    ObjectId _id PK
    string name
    string email UK
    string mobileNumber
    string passwordHash
    string role
    ObjectId department FK
    string district
    boolean isActive
  }
  DEPARTMENT {
    ObjectId _id PK
    string name UK
    string code UK
    string shortDescription
    array categories
    number slaDays
    boolean isFeatured
  }
  GRIEVANCE {
    ObjectId _id PK
    string referenceId UK
    ObjectId citizen FK
    string district
    string category
    string subject
    string description
    string originalDescription
    string status
    string priority
    ObjectId assignedDepartment FK
    ObjectId assignedOfficer FK
    boolean isEscalated
    date dueDate
    object aiAnalysis
    object actionTakenReport
  }
  GRIEVANCE_HISTORY {
    ObjectId _id PK
    ObjectId grievance FK
    string referenceId
    string action
    string fromStatus
    string toStatus
    string remark
    boolean isInternal
    ObjectId changedBy FK
    string changedByRole
    date createdAt
  }
  DEPARTMENT_ASSIGNMENT {
    ObjectId _id PK
    ObjectId grievance FK
    ObjectId department FK
    ObjectId assignedOfficer FK
    ObjectId assignedBy FK
    string priority
    date dueDate
    string status
  }
  ATTACHMENT {
    ObjectId _id PK
    string originalName
    string mimeType
    number size
    buffer data
    ObjectId uploadedBy FK
    ObjectId grievance FK
    string purpose
  }
  CITIZEN_FEEDBACK {
    ObjectId _id PK
    ObjectId grievance FK
    ObjectId citizen FK
    number rating
    boolean isSatisfied
    string comment
    boolean reopenRequested
  }
  CONTACT_ENQUIRY {
    ObjectId _id PK
    string name
    string email
    string subject
    string message
    string status
  }
```

## 3. Collection Specifications

1. **`users` (`User`)**
   - Supports three roles via `role`: `citizen`, `cmo_admin`, `department_officer`.
   - `passwordHash` (`select: false`) hashed via `bcryptjs`.
   - `department` links department officers to their `Department`.
2. **`departments` (`Department`)**
   - Holds sample government departments (`PWD`, `HLTH`, `EDU`, `WTR`, `PWR`, `REV`, `TRN`, `WEL`) with `slaDays`, `categories`, and descriptions.
3. **`grievances` (`Grievance`)**
   - Unique human-readable `referenceId` (`KL-CMO-YYYY-XXXXXX`).
   - Enforces the 14 Kerala districts enum, category enum, status enum (`Submitted`, `Under Review`, `In Progress`, `Resolved`, `Reopened`), and priority enum (`Low`, `Medium`, `High`).
   - Stores `originalDescription` alongside AI-accepted `description`, embedded `aiAnalysis` advisory snapshot, `cmoPublicRemark`, `cmoInternalRemarks`, `officerRemarks`, `actionTakenReport`, `dueDate`, and `isEscalated`.
   - Indexed on `referenceId`, `citizen`, `status`, `district`, `category`, `priority`, `assignedDepartment`, `dueDate`, `createdAt`, plus a text index on `subject` & `description`.
4. **`grievancehistories` (`GrievanceHistory`)**
   - Immutable audit log recording every status transition with `fromStatus`, `toStatus`, `action`, `remark`, `isInternal`, `changedBy`, `changedByRole`, `changedByName`, and `createdAt`.
5. **`departmentassignments` (`DepartmentAssignment`)**
   - Tracks formal CMO-to-department/officer handoffs with instructions, SLA `dueDate`, and assignment lifecycle (`Assigned`, `In Progress`, `Action Submitted`, `Completed`, `Reassigned`).
6. **`attachments` (`Attachment`)**
   - Stores `originalName`, `mimeType`, `size`, `purpose` (`citizen_evidence` | `action_report`), `uploadedBy`, `grievance`, and `data` (`Buffer`, `select: false`).
7. **`citizenfeedbacks` (`CitizenFeedback`)**
   - One-to-one feedback record per resolved grievance (`rating` 1–5, `isSatisfied`, `comment`, `reopenRequested`).
8. **`contactenquiries` (`ContactEnquiry`)**
   - Persists public Contact Us form submissions (`name`, `email`, `subject`, `message`, `status`).
