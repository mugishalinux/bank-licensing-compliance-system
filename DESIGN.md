# Design Document

## Overview

This portal helps banks, insurance companies, microfinance institutions, and individuals apply for licenses from the National Bank of Rwanda.

Applicants submit applications and documents through the portal. Inside BNR, reviewers and approvers process applications step by step until they are approved or rejected.

The goal was to build something simple, secure, and easy to understand while still handling the important rules required in a regulatory system.

---

# Architecture

## System Architecture

![Architecture](docs/architecture.gif)

The system has 3 main parts:

| Component | Purpose |
|---|---|
| Frontend (React) | User interface used by applicants and BNR staff |
| Licensing Service (NestJS) | Main backend API that handles authentication, applications, documents, workflow, and audit logs |
| Mailing Service (NestJS) | Handles email sending in the background |

---

## How Components Communicate

1. The frontend sends requests to the Licensing Service
2. The Licensing Service stores data in MySQL
3. When an email is needed, the Licensing Service sends an event through Kafka
4. The Mailing Service receives the event and sends the email
5. Redis is used for OTP storage, caching, and queues
6. MinIO stores uploaded files

The frontend communicates only with the Licensing Service.  
The Mailing Service works internally in the background.

---

## Why This Structure

The backend was split into two services because sending emails should not slow down the main application.

The Licensing Service focuses on business logic while the Mailing Service handles email jobs separately.

Using Kafka between the services makes the system more reliable because application requests can still succeed even if email delivery temporarily fails.

### Trade-off

Using Kafka and multiple services adds more setup complexity compared to a single backend service.

However, the separation keeps the API cleaner and avoids blocking user requests while emails are being processed.

---

# Authentication Strategy

The system uses JWT authentication.

JWT was chosen because it works well for APIs and keeps the backend stateless.

It also makes it easier to separate frontend and backend services without storing server sessions.

The system uses:

- short-lived access tokens
- refresh tokens
- email OTP verification during login

Access tokens expire after 15 minutes and refresh tokens expire after 7 days.

---

# API Design

The API follows a consistent JSON response structure for both success and error responses.

Unauthorized actions return HTTP 403 responses.

Validation errors return 400 responses.

Unexpected server errors are handled globally so raw stack traces are never exposed to users.

Swagger documentation is included for testing and API exploration.

---

# Data Model

## Users

Stores all users in the system.

| Field | Description |
|---|---|
| id | User ID |
| full_name | User full name |
| email | Login email |
| password_hash | Encrypted password |
| role | APPLICANT, REVIEWER, APPROVER, ADMIN |
| department_id | User department |
| applicant_type | INDIVIDUAL or ORGANIZATION |
| institution_name | Organization name |
| is_active | Account status |

---

## Applications

Stores license applications.

| Field | Description |
|---|---|
| id | Application ID |
| reference_id | Human-readable reference |
| applicant_id | Owner of application |
| license_type_id | Selected license |
| department_id | Responsible department |
| status | Current application state |
| reviewer_id | Assigned reviewer |
| approver_id | Assigned approver |
| submission_version | Tracks resubmissions |
| submitted_at | Submission time |
| decided_at | Final decision time |

---

## Documents

Stores uploaded files.

| Field | Description |
|---|---|
| id | Document ID |
| application_id | Related application |
| original_name | Uploaded filename |
| object_key | File path in storage |
| mime_type | File type |
| size | File size |
| status | READY, PENDING_UPLOAD, REJECTED |
| uploader_id | User who uploaded |

Files are stored in MinIO.

Documents are versioned so older submissions remain accessible after resubmission.

---

## Audit Logs

Stores activity history.

| Field | Description |
|---|---|
| id | Audit ID |
| application_id | Related application |
| actor_id | User who performed action |
| action | Action name |
| previous_state | Old status |
| new_state | New status |
| timestamp | Action time |

The audit log helps track everything that happens in the system.

The audit log was designed as an append-only history because application decisions may later need to be reviewed as legal or compliance evidence.

Audit records are never updated or deleted.

---

# State Machine

## Application Workflow

![State Machine](docs/state-machine.png)

---

## Application States

| State | Meaning |
|---|---|
| DRAFT | Application is being prepared |
| SUBMITTED | Sent for review |
| UNDER_REVIEW | Reviewer is checking it |
| ADDITIONAL_INFO_REQUIRED | More information needed |
| REVIEWED | Reviewer completed review |
| APPROVED | Application accepted |
| REJECTED | Application denied |

---

## Valid Transitions

| From | Action | To |
|---|---|---|
| DRAFT | submit | SUBMITTED |
| SUBMITTED | start review | UNDER_REVIEW |
| UNDER_REVIEW | request info | ADDITIONAL_INFO_REQUIRED |
| UNDER_REVIEW | complete review | REVIEWED |
| ADDITIONAL_INFO_REQUIRED | resubmit | SUBMITTED |
| REVIEWED | approve | APPROVED |
| REVIEWED | reject | REJECTED |

No other transitions are allowed.

Illegal state transitions are rejected at the API level.

---

## Rules Behind the Workflow

### One reviewer at a time

Once a reviewer starts reviewing an application, only that reviewer can continue working on it.

This avoids conflicts and duplicate work.

---

### Reviewer and approver separation

The reviewer and approver must always be different users.

This rule is enforced in the backend and cannot be bypassed from the frontend.

---

### Department-based access

Reviewers and approvers can only see applications from their department.

For example:

- Banking staff only see banking applications
- Insurance staff only see insurance applications

---

### Approved and rejected are final

Once an application is approved or rejected, it cannot move to another state.

If changes are needed later, a new application must be created.

---

### Every action is logged

Every important action creates an audit log entry.

This helps with tracking and accountability.

---

# Concurrent Access Handling

The system prevents two users from changing the same application at the same time.

When an application transition starts, the application row is locked inside a database transaction until the operation finishes.

This prevents situations where two reviewers try to update the same application simultaneously and create inconsistent data.

---

# Roles and Permissions

## Applicant

Can:

- Register and log in
- Create applications
- Upload documents
- Submit applications
- Respond to information requests
- View own applications

Cannot:

- Review applications
- Approve or reject applications
- Access other users' applications

---

## Reviewer

Can:

- View applications in their department
- Start review
- Request additional information
- Complete review
- Add comments

Cannot:

- Approve or reject applications
- Access other departments

---

## Approver

Can:

- View reviewed applications
- Approve applications
- Reject applications
- Add comments

Cannot:

- Start reviews
- Request additional information
- Access other departments

---

## Admin

Can:

- Manage users
- Manage departments
- Manage license types
- Manage requirements
- View audit logs

Cannot:

- Approve applications
- Review applications
- Make licensing decisions

---

## Why The Roles Were Split This Way

The reviewer and approver roles were separated to improve accountability.

The person checking an application should not be the same person making the final decision.

Admins were also separated from approval decisions. This keeps system management separate from licensing decisions.

All permission checks are enforced in the backend.  
Even if a user bypasses the frontend and calls the API directly, unauthorized actions are still rejected.

---

# Hard Decisions and Trade-offs

## OTP Login

### What was implemented

Login uses:

- email and password
- a 6-digit OTP sent by email

The OTP expires after 5 minutes.

Redis stores temporary OTPs.

---

### Why

This adds extra security without making login too complicated for users.

---

### Trade-off

Email OTP is simple and easy to implement, but it depends on email delivery speed.

---

### What could be improved later

- SMS OTP support
- authenticator app support
- stronger OTP rate limiting

---

## Role-Based Access

### What was implemented

Role guards protect backend endpoints.

Department checks are also done inside services.

---

### Why

Checking permissions only in controllers is not enough.

Service-level checks add another layer of protection.

---

### Trade-off

The authorization logic becomes slightly more complex, but it improves security and reduces the risk of permission bypass.

---

### What could be improved later

- more advanced permission rules
- temporary delegated access
- attribute-based access control

---

## Audit Trail

### What was implemented

Every important action writes to the audit log.

Audit records are append-only and are never edited or deleted.

Each audit entry stores:

- acting user
- action performed
- timestamp
- previous application state
- new application state

---

### Why

The system needs accountability and traceability because licensing decisions are sensitive and may later be reviewed as legal evidence.

---

### Trade-off

Append-only logs improve trust and traceability, but correcting mistakes becomes harder because records cannot simply be edited.

---

### What could be improved later

- audit admin actions
- export audit reports
- immutable external log storage

---

## Workflow State Management

### What was implemented

Applications move through a strict state machine.

Invalid transitions are rejected by the backend API.

Approved and rejected applications are final.

---

### Why

A strict workflow prevents inconsistent application states and keeps the review process predictable.

---

### Trade-off

Strict workflows reduce flexibility, but they improve reliability and process integrity.

---

### What could be improved later

- configurable workflows
- workflow analytics
- escalation flows

---

## Concurrent Access Protection

### What was implemented

Database transactions and row locking are used during application state transitions.

---

### Why

This prevents two users from updating the same application at the same time and causing inconsistent data.

---

### Trade-off

Database locking adds some complexity and may slightly reduce performance under heavy load, but consistency is more important for this type of system.

---

### What could be improved later

- distributed locking
- better retry handling
- monitoring for lock contention

---

## Document Upload Validation

### What was implemented

Files upload directly to MinIO using presigned URLs.

Uploaded files are validated before being accepted.

Allowed files:

- PDF
- PNG
- JPG
- DOC
- DOCX

Maximum file size is 5MB and is enforced server-side.

Documents are versioned when applications are resubmitted.

---

### Why

Direct uploads reduce backend load and improve performance.

Validation helps prevent unsafe or invalid files.

Versioning keeps older submissions accessible for review history.

---

### Trade-off

Direct upload flows are slightly more complex than normal uploads, but they scale better and reduce backend memory usage.

---

### What could be improved later

- virus scanning
- resumable uploads
- larger file support

---

## Asynchronous Email

### What was implemented

Emails are sent through Kafka and processed by the Mailing Service.

---

### Why

This prevents email delivery delays from slowing down the main API.

---

### Trade-off

Using Kafka adds more infrastructure complexity, but it improves reliability and keeps the main application responsive.

---

### What could be improved later

- email templates
- retry dashboards
- SMS notifications

---

## Caching

### What was implemented

Redis caches lookup data like:

- departments
- license types
- institution types

---

### Why

These values change rarely but are requested often.

Caching improves response speed and reduces unnecessary database queries.

---

### Trade-off

The cache must be invalidated whenever data changes, which adds some extra complexity.

---

### What could be improved later

- smarter cache invalidation
- cache monitoring
- distributed caching

---

# Testing

The project includes tests for:

- valid state transitions
- invalid state transitions
- role authorization rules
- concurrent access handling

The focus of testing was business rules, permission boundaries, and workflow integrity because these areas are the most critical in a regulatory system.

---

# Seed Data

Seed scripts are included to create:

- at least one user for every role
- sample applications in different states

This allows reviewers to run and test the system immediately without manual database setup.

---

# What Was Deliberately Left Out

Some production-level features were intentionally left out to keep the project focused and manageable for the assessment.

Examples include:

- virus scanning
- Kubernetes deployment
- advanced monitoring
- SMS notifications
- resumable uploads
- distributed microservices

The goal was to prioritize correctness, workflow integrity, security, and maintainability first.

---

# Final Notes

The main goal of this project was to build a licensing system that is:

- simple
- secure
- maintainable
- easy to understand

The design focused more on clear structure, business rules.