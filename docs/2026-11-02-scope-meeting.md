# NOOL Bus Segment — Scope Meeting Notes

**Date:** 2 November 2026
**Status:** Draft for confirmation — items marked *Open* are not yet decided.

---

## 1. Accounts & Environments (prerequisites)

| Item | Action |
|---|---|
| Google Play developer account | Set up and secure before any Android release work |
| Apple developer account | Set up and secure before any iOS release work |
| Server environments | Separate **staging** and **production** environments |
| Preview builds | Staging builds distributed for review before production |
| Wireframes | For all apps, ahead of build |
| Project plan | Delivery plan covering the above |

Also agreed: the end-to-end process is validated before build starts.

---

## 2. Applications in this phase

Three applications, built on the **existing backend**:

1. **Nool Partner** — merchant/operator app (Android, distributed via Play Store)
2. **Passenger app** — NOOL passenger application
3. **Admin dashboard** — existing dashboard, extended

The existing backend is the base; this phase extends it rather than replacing it.

---

## 3. Nool Partner (merchant app)

- Operator onboarding.
- Staff logins created by the operator — conductors and other staff.
- Ticketing-machine flows replicated in the partner app, so a ticket can be issued from the phone.
- QR generation for tickets.
- Three ticketing scenarios:
  1. **No phone / hard cash** — physical ticket as today.
  2. **Cash collected, digital ticket** — ticket stored against the passenger's phone instead of a physical ticket.
  3. **UPI payment** — digital ticket, with the fare amount filled automatically.
- Merchant settlement account: collections are held and settled to the operator at end of day.

---

## 4. Passenger app

- **Tracking:** stop-based, not continuous.
- **Prepaid tickets** supported.
- **Wallet** option for passengers.
- On scan and confirmation of the amount, funds move to the operator's account, managed through the NOOL account.
- A ticket that is purchased but never scanned is returned to the passenger's account.
- Payment gateway: **Easebuzz** (planned).
- **Courier option** with PIN-based confirmation.
- Tracking rules:
  - The most recently logged-in device has first priority for tracking.
  - The app is not usable unless location is enabled.
  - Trip start requires a PIN, with location turned on.

---

## 5. Decisions taken

- Payment gateway: Easebuzz.
- Settlement model: end-of-day settlement to the merchant.
- Funds flow is managed centrally through the NOOL account.
- Android app name: **Nool Partner**.

---

## 6. Open items

1. **Ticketing scenario count** — the notes describe three scenarios but list four statements. Confirm whether "cash paid, ticket stored on phone" and "digital ticket instead of physical" are one scenario or two.
2. **Unscanned-ticket return** — how long before funds return, and is the return automatic or operator-approved?
3. **Courier scope** — PIN-confirmed handover only, or live courier tracking as well?
4. **Trip start** — which role starts the trip (driver only, or any logged-in staff), and what the PIN authorises.
5. **Location requirement** — the app being unusable without location needs to be checked against Play Store / App Store policy, which generally expects limited access when permission is denied.
6. **Wallet readiness** — whether the wallet requires KYC before use.
7. **Process validation** — what this covers: wireframe review, staging walkthrough, or both.

---

*Prepared from the scope discussion of 2 November 2026.*
