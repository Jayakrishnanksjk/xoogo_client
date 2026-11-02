# MUST NOT TRADE OFF

These are not negotiable for deadlines, scope cuts, "quick fixes", or simpler code. 
If a proposed change would weaken one, STOP and raise it to the user instead of shipping it.
If two rules conflict, the earlier one in this list wins.

---

### 1. Security & Privacy (Highest Priority)
- **Server Verification**: Every Server Action and API route must re-check the session, role, and resource ownership on the server. Never trust client state.
- **Credential Storage**: Passwords must be hashed (scrypt/argon2/bcrypt). Session tokens, reset tokens, and API keys must be stored only as cryptographic hashes.
- **Zero Enumeration**: Authentication and password reset responses must never reveal whether an email address exists in the system.
- **Data Protection**: Customer data must be isolated by tenant/user ID in all database queries.

### 2. Data Integrity & Correctness
- **Atomic Operations**: Any booking, payment, inventory mutation, or multi-step checkout must occur within an atomic database transaction.
- **Race Condition Prevention**: Enforce database-level uniqueness, row locks, or idempotency keys to prevent double-booking or duplicate orders.
- **Truth in State**: UI state must always reflect verified server state; never invent optimistic updates that cannot be safely rolled back upon server rejection.

### 3. Availability & Fault Isolation
- **Graceful Degradation**: A failing third-party integration (email provider, SMS, maps, analytics) must degrade that isolated feature only; core booking, browsing, and dashboard operations must keep working.
- **Strict Timeouts**: No single request or server action may hang indefinitely on an external dependency. All outbound calls must enforce a strict timeout (max 5000ms).
- **Target Uptime**: Critical paths (booking, dashboard, product listing) must maintain high availability without single points of failure.

### 4. User Experience & Micro-Feel
- **Time to Action**: The primary user flow (e.g. booking or discovery) must take under 60 seconds from the landing screen.
- **Interactive States**: Every interactive element (button, link, input) must have explicit `hover`, `active`, `focus-visible`, and `disabled/pending` states.
- **No Alert Modals**: Never use `window.alert()`, `confirm()`, or generic "Something went wrong" text. Show specific, actionable, inline human error messages.
- **Input Preservation**: Every form must preserve the user's input across validation errors.
- **Zero Dead-Ends**: Every page must have a visible navigation path back or forward. Never leave a user stranded on a blank or error screen.
- **Zero Cumulative Layout Shift (CLS = 0)**: Every asynchronous content boundary must render an exact dimension-matching skeleton loader.

### 5. Accessibility (WCAG 2.2 AA)
- **Semantic Structure**: Proper HTML5 landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`).
- **Form Controls**: Every input, select, and textarea must have an associated, accessible `<label>` and proper `aria-describedby` for error messages.
- **Keyboard Operability**: Full navigation capability via keyboard alone; visible focus rings must never be suppressed with `outline: none` without a visible replacement.
