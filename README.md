# SBMS Paadayatra Website (SBMS_Website)

A small static site for SBMS 2026 paadayatra booking and admin manifests.

Quick links to workspace files:
- [index.html](index.html)
- [style.css](style.css)
- [script.js](script.js)
- Images and assets:
  - [shiva_lingam.png](shiva_lingam.png)
  - [sbms_full_logo.png](sbms_full_logo.png)
  - [qr_basu.jpg](qr_basu.jpg)
  - [qr_shiva.jpg](qr_shiva.jpg)
  - [qr_veeresh.jpg](qr_veeresh.jpg)
  - [qr_venkat.jpg](qr_venkat.jpg)
  - [gallery1.jpg](gallery1.jpg)
  - [gallery2.jpg](gallery2.jpg)
  - [gallery3.jpg](gallery3.jpg)
  - [gallery4.jpg](gallery4.jpg)
  - [gallery5.jpg](gallery5.jpg)
  - [gallery6.jpg](gallery6.jpg)
  - [gallery7.jpg](gallery7.jpg)
  - [gallery8.jpg](gallery8.jpg)
  - [gallery9.jpg](gallery9.jpg)
  - [gallery10.jpg](gallery10.jpg)
  - [gallery11.jpg](gallery11.jpg)
  - [gallery12.jpg](gallery12.jpg)
  - [gallery13.jpg](gallery13.jpg)
  - [gallery14.jpg](gallery14.jpg)
  - [gallery15.jpg](gallery15.jpg)

Project overview
- Static website implemented with HTML, CSS and vanilla JavaScript.
- Booking flow is implemented in [script.js](script.js). Key functions:
  - [`openModal`](script.js) — booking modal entry (currently blocked with booking-closed alert).
  - [`generatePassengerSteps`](script.js) — dynamically builds per-passenger form steps.
  - [`validateAndNext`](script.js) — validates passenger form and advances steps.
  - [`checkAvailabilityAndShowPayment`](script.js) / [`processSeatLimit`](script.js) — checks seat availability via Google Apps Script endpoint.
  - [`showPayment`](script.js) / [`renderPayeeDetails`](script.js) — payment UI and payee rendering.
  - [`handleFileSelect`](script.js) — client-side image resize and encode for payment screenshot.
  - [`submitBooking`](script.js) — posts booking payload to the Google Apps Script endpoint.
  - [`openAdminLogin`](script.js) / [`loadAdminData`](script.js) — admin login and manifest loader.
  - [`downloadExcel`](script.js) — exports manifest tables via SheetJS (XLSX).

Notable configuration and constants in [script.js](script.js)
- `GOOGLE_SCRIPT_URL` — endpoint used for reads and writes.
- `LIMIT_BANGALORE`, `LIMIT_BELAGAVI` — seat limits for regions.
- `bangaloreStops`, `belagaviStops` — pickup stop lists.
- `qrCodes` — mapping of payee info and QR image files.

How to run locally
- Simple static server recommended:
  - Node: npm install (see provided package.json), then:
    - npm run start
  - Or Python built-in server:
    - python3 -m http.server 8080
  - Open http://localhost:8080 in a browser.

Notes & development tips
- Booking currently disabled: [`openModal`](script.js) shows "BOOKINGS CLOSED" alert and returns early.
- The client expects the Google Apps Script to return JSON arrays of booking objects. See [`processSeatLimit`](script.js) and [`loadAdminData`](script.js).
- The site uses SheetJS via CDN from [index.html](index.html) for Excel export; no local bundler required.
- Images are referenced directly from root, e.g. [qr_basu.jpg](qr_basu.jpg).
- For local testing of POST behavior, you may stub `GOOGLE_SCRIPT_URL` to a local endpoint or use a lightweight mock.

Security / admin
- The admin password is assembled inside [`openAdminLogin`](script.js) as string parts; do not hardcode a production password in client-side code.

Editing and extending
- Add or modify pickup stops in [script.js](script.js) (`bangaloreStops`, `belagaviStops`).
- Styles live in [style.css](style.css). Modify classes like `.gallery-grid`, `.modal`, `.admin-overlay` for layout updates.
- The booking modal and admin overlay elements are in [index.html](index.html).

License
- Add a license file if needed (e.g. MIT).

Contact
- This repository is intended as a small static project; update `README.md` as the project evolves.