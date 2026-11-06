# MediCare+ — Hospital Management System

<p align="center">
  <strong>A full-stack platform for connected hospital operations, clinical workflows, and administration.</strong>
</p>

<p align="center">
  <a href="https://medicare2026-hospital-management.vercel.app/">Live Application</a> · <a href="#screenshots--feature-gallery">Screenshots</a> · <a href="#modules-and-features">Features</a> · <a href="#getting-started">Getting Started</a>
</p>

> **Project status:** Actively developed personal project. Feature availability and production readiness should be verified against the current code and deployment. **Aira AI Assistant is under development.**

## Overview

**MediCare+** is a full-stack hospital management application built to bring patient services, clinical operations, administrative workflows, and financial processes into a unified interface. The project explores how interconnected modules, reusable UI components, and role-based permissions can help hospital teams work with consistent information and fewer disconnected workflows.

Developed as a personal project using **VS Code and OpenAI Codex**, MediCare+ covers patient registration and appointments, admissions and bed management, clinical workflows, pharmacy, billing, insurance, inventory, staff administration, reporting, and more.

### Project goals

- Centralize key hospital workflows in a single application.
- Provide task-focused interfaces for different hospital staff roles.
- Connect clinical, operational, and financial information.
- Apply configurable permissions to sensitive workflows.
- Build reusable, responsive, maintainable application components.
- Explore permission-aware conversational assistance through **Aira**.

## Live demo

**Application:** https://medicare2026-hospital-management.vercel.app/

> Demo credentials are intentionally not published here. Add only safe, dedicated demo accounts if you choose to make them public. Never expose real patient data, secrets, or production credentials.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular, TypeScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Data access | Prisma ORM |
| Communication | REST APIs |
| Development | VS Code, OpenAI Codex |
| Deployment | Vercel (application URL) |

> Confirm exact framework versions, build tools, hosting topology, and integrations from the repository before documenting them as facts.

## Modules and features

The following describes the application's intended functional scope and documented workflows. Individual screens and actions should be checked against the current implementation.

### 1. Dashboard
- Overview of hospital activity, operational indicators, and summary widgets.
- Quick navigation to relevant modules and recent work.
- Role-appropriate information where permissions allow.

### 2. Patients and medical records
- Patient registration and demographic information.
- Patient profiles, medical information, and visit history.
- Patient detail views and authorized record updates.

### 3. Appointments
- Appointment scheduling, listing, and detail views.
- Doctor and patient association, status management, and rescheduling.
- Payment-status visibility and associated invoice actions where applicable.
- Restrictions for completed appointments and paid-invoice actions.

### 4. Admissions, wards, and beds
- Admission records and patient-to-bed assignment workflows.
- Ward and bed management, occupancy, and availability indicators.
- Admission details with clinical records, nursing, medication, investigation, and bed-history sections.

### 5. Nursing
- Assigned patient views and nursing documentation.
- Shift handover workflows.
- Medication Administration Record (MAR) and care notes.

### 6. Laboratory and radiology
- Diagnostic investigations and associated patient workflows.
- Laboratory and radiology records, statuses, and result-oriented views.

### 7. Procedures and operation theatre
- Procedure scheduling and tracking.
- Operation theatre information, statuses, and detail views.
- Filters for date, theatre, and status where available.

### 8. Pharmacy
- Medicine inventory and stock management.
- Stock movement and ledger information.
- Low-stock and expiry-related views and filters.

### 9. Billing and payments
- Invoice creation, review, and printing.
- Payment recording and payment status tracking.
- Refund workflows and associated records.

### 10. Insurance
- Insurance providers and policies.
- Claim creation, review, and approval workflows.
- Claim status and related administrative actions.

### 11. Inventory and operations
- Inventory items and stock-related records.
- Purchase requests, procurement, and supplier management.
- Ambulance and operational resource management.

### 12. Employees and user management
- Employee profiles and employment information.
- User administration and role assignment.
- Account and profile-related actions according to permissions.

### 13. Reports and analytics
- Hospital operational and departmental reporting.
- Charts, summaries, filtering, and supported exports.
- Department-wise activity and other administrative indicators.

### 14. Audit logs
- Administrative visibility into recorded application events.
- Log listing, filtering, and detail views.
- Access governed by appropriate permissions.

### 15. Settings and localization
- Application settings and configuration areas.
- Language administration, enabled-language selection, and translations.
- Language switching and right-to-left layout support as an implementation target, including Arabic.
- Help and support interfaces.

### 16. Authentication and profile
- Sign-in and account-related screens.
- Forgot/reset/change password flows.
- Profile management and session-aware navigation.

## Role-based access control (RBAC)

MediCare+ is designed around configurable, permission-based access rather than assuming every user can access every screen or action.

| Role | Typical responsibilities |
| --- | --- |
| Super Admin | Settings, roles, and permissions |
| Hospital Admin | Hospital operations and employee administration |
| Doctor | Patient care and clinical records |
| Nurse | Nursing documentation and assigned patients |
| Receptionist | Registration and appointment workflows |
| Pharmacist | Pharmacy and medicine stock workflows |
| Laboratory Staff | Laboratory and diagnostic workflows |
| Billing Staff | Invoices, payments, and insurance-related work |
| Inventory Manager | Stock, procurement, and suppliers |

**Security design principles:** enforce authorization on backend endpoints, scope access to permitted records, validate inputs, avoid exposing secrets, and keep sensitive data out of public demos. The table describes intended responsibilities; effective access depends on configured permissions and server-side enforcement.

## Aira — MediCare+ AI Assistant

**Status: Under development — not presented as a completed or generally available feature.**

**Aira** is the planned conversational assistant for MediCare+. The intended experience is to help authorized users find information without navigating several screens.

Example questions:

- “Show today's appointments.”
- “Which medicines are running low?”
- “Summarize today's admission activity.”

The planned hybrid approach combines guided application workflows with conversational interpretation. Development priorities include contextual follow-up questions, reporting support, permission-aware data retrieval, and controlled assistance for routine tasks. Access to hospital data must respect RBAC and data isolation; high-impact changes should require explicit authorization and confirmation.

**Interface branding:** Aira · **Launcher:** Ask Aira · **Tagline:** Your intelligent MediCare+ assistant.

## Application architecture

```text
User / Hospital Staff
        |
        v
Angular + TypeScript Frontend
  |-- Shared UI components
  |-- Feature modules and routes
  |-- Authentication / authorization UI
  |-- API services
        |
        v
REST API (Node.js + Express.js)
  |-- Authentication and authorization checks
  |-- Validation and business logic
  |-- Module-specific endpoints
        |
        v
Prisma ORM
        |
        v
PostgreSQL Database
```

This is a **conceptual architecture** based on the documented technology stack, not an automatically verified diagram of the repository. Update it to reflect actual middleware, service boundaries, authentication providers, deployment, and integrations.

## UI and UX approach

- Consistent navigation, headers, forms, tables, and status indicators.
- Reusable search, filter, export, sorting, and column-configuration patterns.
- Responsive layouts for common desktop and smaller-screen use cases.
- Clear loading, empty, validation, success, and error states.
- Modal layouts with usable scrolling and action placement.
- SVG-based iconography and a consistent visual theme.
- Accessibility and localization as ongoing quality goals.

## Screenshots & feature gallery

Screenshots are intentionally referenced as **placeholders**. Replace each file with a real capture from the application, using the same name, or update the path. Do not use fabricated screenshots as evidence of implemented features.

> **Before capturing:** use fictional/sample patient data, hide email addresses and phone numbers, remove credentials and tokens, and avoid displaying real clinical records. Prefer a consistent browser size and theme for all screenshots.

### Authentication

![MediCare+ Login](docs/screenshots/01-auth-login.png)
![MediCare+ Forgot Password](docs/screenshots/02-auth-forgot-password.png)
![MediCare+ Profile](docs/screenshots/03-profile.png)

### Dashboard

![MediCare+ Dashboard](docs/screenshots/04-dashboard.png)

### Patients and appointments

![Patient List](docs/screenshots/05-patients-list.png)
![Patient Details](docs/screenshots/06-patient-details.png)
![Appointments](docs/screenshots/07-appointments.png)
![New Appointment](docs/screenshots/08-new-appointment.png)
![Appointment Details](docs/screenshots/09-appointment-details.png)

### Admissions and nursing

![Admissions and Beds](docs/screenshots/10-admissions-beds.png)
![Admission Details](docs/screenshots/11-admission-details.png)
![Nursing](docs/screenshots/12-nursing.png)
![Medication Administration](docs/screenshots/13-medication-administration.png)

### Diagnostics and procedures

![Laboratory](docs/screenshots/14-laboratory.png)
![Radiology](docs/screenshots/15-radiology.png)
![Procedures and OT](docs/screenshots/16-procedures-ot.png)

### Pharmacy and finance

![Pharmacy](docs/screenshots/17-pharmacy.png)
![Billing and Invoices](docs/screenshots/18-billing.png)
![Record Payment](docs/screenshots/19-record-payment.png)
![Insurance Claims](docs/screenshots/20-insurance.png)

### Operations and administration

![Inventory](docs/screenshots/21-inventory.png)
![Procurement](docs/screenshots/22-procurement.png)
![Suppliers](docs/screenshots/23-suppliers.png)
![Ambulance Management](docs/screenshots/24-ambulance.png)
![Employees](docs/screenshots/25-employees.png)
![Doctors](docs/screenshots/26-doctors.png)
![Departments](docs/screenshots/27-departments.png)
![Roles and Permissions](docs/screenshots/28-roles-permissions.png)
![Reports](docs/screenshots/29-reports.png)
![Audit Logs](docs/screenshots/30-audit-logs.png)
![Settings](docs/screenshots/31-settings.png)
![Language Management](docs/screenshots/32-languages.png)
![Notifications](docs/screenshots/33-notifications.png)

### Aira (development preview only)

> Add a screenshot here **only when an actual development build or prototype is available**, and label it clearly as under development.

<!-- Once a real development screenshot exists, uncomment:
![Aira AI Assistant — Development Preview](docs/screenshots/31-aira-development-preview.png)
-->

### Screenshot directory

```text
docs/
└── screenshots/
    ├── 01-auth-login.png
    ├── 02-auth-forgot-password.png
    ├── 03-profile.png
    ├── 04-dashboard.png
    ├── 05-patients-list.png
    ├── 06-patient-details.png
    ├── 07-appointments.png
    ├── 08-new-appointment.png
    ├── 09-appointment-details.png
    ├── 10-admissions-beds.png
    ├── 11-admission-details.png
    ├── 12-nursing.png
    ├── 13-medication-administration.png
    ├── 14-laboratory.png
    ├── 15-radiology.png
    ├── 16-procedures-ot.png
    ├── 17-pharmacy.png
    ├── 18-billing.png
    ├── 19-record-payment.png
    ├── 20-insurance.png
    ├── 21-inventory.png
    ├── 22-procurement.png
    ├── 23-suppliers.png
    ├── 24-ambulance.png
    ├── 25-employees.png
    ├── 26-roles-permissions.png
    ├── 27-reports.png
    ├── 28-audit-logs.png
    ├── 29-settings.png
    ├── 30-languages.png
    └── 31-aira-development-preview.png  # optional, only when available
```

**Tip:** GitHub displays broken-image placeholders until the referenced screenshot files exist. If publishing before all captures are ready, temporarily comment out missing image lines or add screenshots gradually.

## Getting started

The exact repository folder names, scripts, environment variables, and Prisma commands have **not** been verified. Use the steps below as a checklist and replace placeholders with commands from the actual project.

### Prerequisites

- Node.js and npm compatible with the repository.
- PostgreSQL instance.
- Required environment variables and credentials for local development.

### Local setup checklist

1. Clone the repository and inspect the frontend and backend package manifests.
2. Install dependencies in the relevant application directories (`npm install` or `npm ci`, as supported).
3. Create local environment configuration using the repository's documented example files.
4. Configure the PostgreSQL connection securely.
5. Apply Prisma migrations **using the repository's documented migration workflow**.
6. Start backend and frontend using the scripts defined in their respective `package.json` files.
7. Verify login, API connectivity, database access, and role permissions.

Do not commit `.env` files, access tokens, connection strings, or private keys. Add verified, copy-paste setup commands here after inspecting the repository.

## Testing and quality checklist

- [ ] Frontend builds successfully.
- [ ] Backend starts with valid configuration.
- [ ] Database migrations work on a clean development database.
- [ ] Authentication, logout, and password flows are tested.
- [ ] Server-side RBAC is enforced for protected operations.
- [ ] Core create/read/update workflows persist correctly.
- [ ] Validation and error handling work consistently.
- [ ] Responsive screens and modals are checked.
- [ ] Reports, exports, and print flows are verified.
- [ ] Localization and RTL behavior are tested where supported.
- [ ] Screenshots contain only safe demo data.

These are recommended verification tasks, **not claims that the tests have already passed**.

## Deployment notes

The publicly shared application URL is hosted on a Vercel domain. Document the actual frontend/backend deployment layout, required build commands, database connectivity, environment variables, and migration strategy only after confirming them from deployment configuration. Keep production secrets out of this README.

## Roadmap

- Continue developing **Aira**, with permission-aware conversational retrieval and guided assistance.
- Improve cross-module workflow integration and consistency.
- Expand automated regression and authorization testing.
- Refine accessibility, localization, and RTL behavior.
- Add verified feature screenshots and a walkthrough video.
- Improve performance, observability, and deployment documentation.

## Project background

MediCare+ is an **independent personal project** developed with VS Code and assistance from OpenAI Codex. It has provided hands-on experience with full-stack architecture, modular Angular interfaces, REST API integration, relational data modeling, hospital-domain workflows, and permission-based design.

## Feedback

Feedback, suggestions, and constructive technical reviews are welcome. For issues or feature requests, use the repository's issue tracker when available.

---

**MediCare+** — Connecting hospital workflows in one place.
