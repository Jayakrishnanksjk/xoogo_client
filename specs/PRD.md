# Product Requirements Document (`PRD.md`)

## 1. Product Overview & Purpose
- **Product Name**: {{PRODUCT_NAME}}
- **Vision Statement**: [One concise sentence describing the product and core value proposition.]
- **Customer Zero Hypothesis**: [How does the author/builder personally experience this problem? What daily test determines if the product works?]

---

## 2. Core MVP Scope (The 5-Minute Proof)
Before building full-scale infrastructure, the MVP must validate that the core loop feels right:
1. **User Sign-In / Session**: Frictionless authentication or initial session creation.
2. **Primary User Flow**: The central action (e.g., browse items, configure an order, make a booking) achievable in under 60 seconds.
3. **Coordination / Team Connection**: Direct way for the user and fulfillment/admin team to coordinate on the order.

---

## 3. Detailed Feature Breakdown
All individual feature specifications must reside in `specs/features/`:
- `specs/features/01_auth.md` — User registration, sessions, and role boundaries.
- `specs/features/02_catalog_booking.md` — Item listing, configuration, and booking checkout.
- `specs/features/03_coordination.md` — Communication and team messaging for order fulfillment.

---

## 4. Architectural Constraints & Non-Negotiables
- Reference: All implementations must adhere strictly to `specs/MUST_NOT_TRADE_OFF.md`.
- No feature is considered complete until verified by `npm run build` and tested against the `specs/` documentation via the `direction` command.

---

## 5. Success Metrics for MVP
- **Time to First Value**: Under 60 seconds from landing page to completed primary flow.
- **Error-Free Sessions**: 100% of happy-path testing journeys complete without console errors or layout shifts.
- **Direction Score**: Minimum 90/100 on the `/direction` alignment audit.
