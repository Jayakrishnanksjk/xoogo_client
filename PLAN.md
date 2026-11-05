# Product Implementation Plan (`PLAN.md`)

## Goal & Scope Summary
Systematically resolve all security vulnerabilities identified in the Deepsec audit and align with `specs/MUST_NOT_TRADE_OFF.md`. Focus is on authentication hardening, cryptographic token hashing, multi-tenant isolation, file upload protection, and atomic transactions.

---

## Task Execution State
- Current Active Phase: `Completed`
- Current Active Task: `None (All security tasks completed & verified)`
- Next Approval Gate: `Awaiting human review of completed security fixes`

---

## Phase 1: Critical Auth & Credential Hardening
> Focus: Eliminate authentication bypass vectors and plaintext credential storage.

- [x] **Task 1.1: Mandatory JWT Secret & Fail-Fast Boot Check**
  - **Objective**: Remove hardcoded fallback JWT secret in `server/routes/auth.js` and `server/middleware/auth.js`. Add server startup check in `server/index.js` to fail fast if `JWT_SECRET` is missing.
  - **Verification**: Clean AST and presence checks verifying zero fallback tokens and server boot guard.
  - **Gate**: Passed.

- [x] **Task 1.2: Cryptographic API Key Hashing & Timing-Safe Verification**
  - **Objective**: Eliminate `'default_bus_key'` fallback, migrate `BusApiKey` to SHA-256 hashed storage, return raw keys only once upon generation, and use `crypto.timingSafeEqual`.
  - **Verification**: Verified SHA-256 hash lookup in `server/middleware/apiKeyAuth.js` and masked key listings in `server/routes/api-keys.js`.
  - **Gate**: Passed.

---

## Phase 2: Authorization & Multi-Tenant Isolation
> Focus: Prevent cross-tenant data leaks and privilege escalation.

- [x] **Task 2.1: Group & Bus Multi-Tenant Scoping**
  - **Objective**: Protect group mutations with `requireRole('superadmin')` and enforce `group_id` filtering on buses and groups for non-superadmin users.
  - **Verification**: Verified role gate and `req.user.group_id` scoping in `server/routes/groups.js` and `server/routes/buses.js`.
  - **Gate**: Passed.

- [x] **Task 2.2: User Privilege Escalation Guards**
  - **Objective**: Block `admin` users from creating or escalating accounts to `superadmin` or editing accounts outside their group in `server/routes/users.js`.
  - **Verification**: Verified 403 authorization checks on role elevation and tenant boundaries.
  - **Gate**: Passed.

---

## Phase 3: Filesystem, Injection & Transaction Integrity
> Focus: Path traversal, SVG/upload sanitization, SQL injection, and database transaction atomicity.

- [x] **Task 3.1: Path Traversal Enclosure in Asset Server**
  - **Objective**: Strictly constrain `/assets/*` path resolution within `distPath` in `server/app.js`.
  - **Verification**: Verified path boundary enforcement with `path.resolve` and `fs.statSync.isFile`.
  - **Gate**: Passed.

- [x] **Task 3.2: Secure Upload Handling (SVG / Logo Sanitization)**
  - **Objective**: Restrict logo uploads to safe formats or sanitize SVG inputs in `server/routes/settings.js`.
  - **Verification**: Disallowed SVG in upload filter; added `nosniff` and CSP headers to static `/uploads`.
  - **Gate**: Passed.

- [x] **Task 3.3: DDL SQL Injection & Seeder Hardening**
  - **Objective**: Enforce strict regex validation on database names in `CREATE DATABASE` queries and remove hardcoded seed passwords.
  - **Verification**: Enforced `/^[a-zA-Z0-9_]+$/` validation on database identifiers and blocked mock seeder from production.
  - **Gate**: Passed.

- [x] **Task 3.4: Atomic Transactions for Route & Stop Mutations**
  - **Objective**: Enforce `sequelize.transaction()` on multi-table stop updates and re-sequencing in `server/routes/routes.js`.
  - **Verification**: Wrapped stop update, re-sequencing, and deletion handlers in atomic transactions.
  - **Gate**: Passed.
