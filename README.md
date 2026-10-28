# Hospital Qswift — Realtime Walk-in OPD Queue & Token Platform

Hospital Qswift is a real-time, digital walk-in OPD (Outpatient Department) queue and token management platform. It removes physical waiting-room queues by letting patients grab a digital token remotely and track their live position, while hospital staff run the queue from a live console.

---

## 🔁 1. The Core Workflow

```
[ Patient — Mobile/Web ]
  1. Browse nearby clinics & live queue status
  2. Grab a digital OPD token (self or a saved family member)
  3. Track live token number, patients-ahead count, and estimated wait
  4. Get notified (push/SMS + in-app chime) as their turn approaches
  5. Arrive right when called

[ Hospital Front Desk / Doctor ]
  1. Call Next Token with one click
  2. System notifies the patient instantly (push notification + chime if app is open)
  3. Mark token Done / No-show / Cancelled
```

**Important:** once a patient can book remotely, the hospital's queue is shared state across devices — the patient's phone and the front-desk screen must both read/write the *same* backend record in real time. Local-only storage cannot do this; see §3.

---

## 👥 2. Operating Modes

### A. 🩺 Patient Portal

**Discover clinics & doctors**
- Filter nearby clinics by specialty, distance, shortest wait, or rating.
- Interactive map view (Leaflet + OpenStreetMap, no API key).

**Grab a digital OPD token**
- Choose a doctor. Booking is only allowed within that doctor's configured `available_days` / `available_from` / `available_to` — outside those hours the doctor shows as "Unavailable" instead of allowing a token to be created.
- Book for yourself or a **saved family member** (Mother, Child, Spouse) pulled from the patient's own family-member list — not a free-text field, so history and reviews attach to the right person.
- Flag senior citizen (70+) or emergency priority. A priority token is inserted directly behind whoever is currently `serving`, not just tagged — everyone behind it gets their position/wait time recomputed immediately.

**Live digital token slip**
- Your token number (e.g. #16)
- Currently serving token (e.g. #14)
- Patients ahead (recomputed live, including priority insertions)
- Estimated wait, based on the doctor's average consultation time
- QR code + OPD reference ID, for the front desk to pull up your record on arrival

**Notifications**
- In-app chime + gentle pulse animation if the app/tab is open.
- Push notification (via service worker / Web Push) as a fallback so the patient is still alerted with the phone locked or the app closed.

**No-show handling**
- If a called patient doesn't check in within a configurable window (e.g. 5 minutes), they're auto-marked `no_show` and the doctor moves to the next token. The patient can rejoin the queue, added at the back.

**Past visits & reviews**
- Completed consultations move to Past Visits; patients can rate and review afterward.

**Payment**
- v1: pay the consultation fee at the hospital (cash/card at the desk) — keeps the build simple and avoids adding a payment gateway to the stack.

### B. 🏢 Staff & Doctor Console

**Live OPD queue monitor**
- Staff select a doctor and see all waiting patients, sorted by token number with priority patients correctly repositioned near the front.

**One-click Call Next**
- Advances `serving` to the next token, updates the doctor's live "Now Serving" number, and fires a notification to that patient.

**Queue controls**
- Mark Completed / Cancelled / No-show.
- Add walk-in patients directly at the desk.
- Toggle priority flags for emergency cases, which re-sorts the queue.

**Onboarding**
- Registered clinic owners add doctors, set consultation fees, average consultation time, and available days/hours.

---

## ⚡ 3. Technical Architecture

| Feature Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite |
| Styling | Tailwind CSS, clinical color palette, restrained micro-animations |
| State & Data Sync | `QueueContext` + `AuthContext` for global state |
| **Persistence (dev/offline only)** | Browser `localStorage` — single device, for local testing without a backend. |
| **Persistence (production)** | Supabase Postgres + Row Level Security + Realtime — shared source of truth across all devices. |
| Maps & Geocoding | Leaflet + OpenStreetMap tiles |
| Notifications | Browser AudioContext chime (in-app) + Web Push via service worker |
| Queue/priority logic | Server-side / Postgres function for real-time recalculations |

---

## 🛠️ Getting Started (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev
```

Server runs locally at `http://localhost:5173/`.

