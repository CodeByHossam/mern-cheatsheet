# AGENTS.md — Agent Context for this Project

## What this project is

- **This is NOT a runnable MERN application.** It is a **static multi-file reference/cheatsheet site** containing copy-paste snippets for building a MERN stack app.
- Project files (8 total, opened directly — no server/build needed, just double-click `index.html`):
  - `index.html` — the **hub**: links to every section, every page, and every project file (also holds the shared sidebar + search).
  - `backend/backend.html` — Sections 3–9 (7 sections).
  - `frontend/frontend.html` — Sections 10–15 (6 sections).
  - `devops/devops.html` — Sections 16–17, 19–22 (6 sections).
  - `reference/reference.html` — Sections 1–2, 18, 23–25 (6 sections).
  - `css/styles.css` — all styling (shared by every page, linked relatively: `css/…` from index, `../css/…` from pages).
  - `js/main.js` — all behaviour: sidebar search, scrollspy, mobile menu, copy buttons (same relative-link rule).
  - `verify.js` — optional consistency checker at the project root. **Run `node verify.js` after any edit** (see "Verification"). It is a plain Node script, not a build step: nothing imports it, the site works without it. Keep it in the root — it must not become a new folder.
- Exactly **4 content folders** (`backend/`, `frontend/`, `devops/`, `reference/`) + `css/` + `js/` — do not add more folders without asking.
- There is **no** `package.json`, server, client, `node_modules`, git repo, test suite, lint, or build step. Do **not** attempt to `npm install`, build, lint, or run anything.

## Current status

- Restructured from the old single huge file into hub + 4 pages + shared css/js (pre-split backup exists only in temp). Last verified by `node verify.js`: 176 `<pre><code>` blocks escape-checked, 197 internal links/anchors resolve, `s1`–`s25` each exist exactly once, all 5 sidebars byte-identical, `js/main.js` parses.
- **Hardening pass done:** search now also matches the hub's per-section descriptions and keeps nested sub-links (18A/18B) reachable when only a sub-link matches the query; the mobile menu button tracks `aria-expanded`; Esc closes an open mobile sidebar; `css/styles.css` and `js/main.js` dedented to normal top-level indentation; `verify.js` added at the root to automate the checklist (it also fails if the 5 sidebars diverge). A later audit sweep also: fixed an inline `<code>` split across lines in `devops/devops.html` (broke regex tooling), extended inline-code chip styling to `.callout code` (with `overflow-wrap: anywhere` for long URIs), and confirmed every in-text "Section N" cross-reference (22 of them) points at the right heading.
- **Added Vitest UI testing (Section 17B):** Section 17 now has two sub-anchors — `s17a` API (Jest + Supertest) and `s17b` UI (Vitest + React Testing Library): the `test` block in `vite.config.js`, `src/test/setup.js` (jest-dom matchers + a `matchMedia` stub), a `renderWithProviders`/`makeStore` helper with a fresh store per test, a reducer test for the Section 12 `counterSlice`, a component test for the Section 12 `Counter`, a `vi.mock` page test, MSW notes, client scripts + CI step, and an optional Vitest-for-the-API config. Mirrors the `s18a`/`s18b` pattern, so nothing was renumbered; all 5 sidebars, the hub and `verify.js` expectations were updated.
- **25 sections** ordered by **MERN build workflow** (setup → folder structure → backend → frontend → realtime → tooling/quality → deploy → cheat sheets). Sections 17 and 18 each nest two sub-links (`#s17a`/`#s17b`, `#s18a`/`#s18b`). The sidebar has a **search bar** (`#navSearch` → `filterNav` in `js/main.js`) filtering entries by title + same-page section content; Enter jumps to the first match, Esc clears. HTML escapes verified (`&lt;`/`&gt;`/`&amp;&amp;` in snippets; no raw `<`, `&&`, `=>` inside any `<pre><code>`).
- Backend **JavaScript** snippets use **CommonJS** (`require`) on purpose — keep it that way unless explicitly asked. Backend **TypeScript** snippets (Section 18, Type A) use plain `require`/`module.exports` with `lib: ["esnext"]`, `types: ["node"]`, `moduleResolution: "bundler"`, and extensionless relative requires.
- Contributors' explicit asks historically covered: async/await everywhere (no `.then()`), rate limiter extracted to middleware, React Router wrapper-tag route guards, TypeScript setup, deployment, command cheat sheets, WebSockets, search, Vitest testing, and MERN-workflow ordering.

## File layout rules (IMPORTANT — multi-file)

- **Which page holds which section:** see the index table below. Keep a section in its page unless the user asks to move it.
- **Sidebar** (same markup on all 5 HTML files): `<li><a href="…#sN">` deep links must match the section's page + `<h2 id="sN">`. Format: `#sN` on the page that owns it is written as the full relative path everywhere (`backend/backend.html#s3` from index, `../backend/backend.html#s3` from other pages) so one uniform list works on every file. Changing the sidebar = editing **all 5** HTML files (search for `id="navList"`) — `node verify.js` fails loudly if the five copies diverge. Section 17 and Section 18 each nest two sub-links (`#s17a` A. API / `#s17b` B. UI in `devops/devops.html`; `#s18a` Type A / `#s18b` Type B in `reference/reference.html`) — the only exceptions to the 1:1 rule.
- **index.html** must keep a link to *every* section (deep link) and to every project file (`css/styles.css`, `js/main.js`, `AGENTS.md`, `verify.js`, the 4 pages).
- Each section page: `<h1>` + `<p class="subtitle">` + its sections; each section is `<h2 id="sN">…</h2>` → `<h3>` → `<pre><code>…</code></pre>`. Ends `</main>` → `<script src="…/js/main.js"></script>` → `</body>` → `</html>`.
- Extra UI classes available: `.callout` (info boxes), `.table-wrapper` + `table` (reference tables).
- Relative paths: pages live one level deep, so they use `../css/styles.css`, `../js/main.js`, `../index.html`; index uses `css/…`, `js/…`.

## Code organization conventions (features / services / utils / middlewares)

Snippets should follow these four layered concepts when new examples are added or refactored. Reference domain used in the doc: a **dental clinic** app with `auth / patients / appointments / invoices`.

### 1. Features — organize code by business domain
- `features/auth/`, `features/patients/`, `features/appointments/`, `features/invoices/`
- Each feature bundles everything for one slice of the app, e.g. `features/appointments/`:
  - `AppointmentsPage.jsx` — the UI
  - `appointmentsApi.js` — API requests (RTK Query / axios)
  - `appointmentsSlice.js` — Redux state
  - `appointmentController.js` — backend handlers (feature-based backend layout)

### 2. Services — business logic & operations
- Reusable operation functions. May call external providers (email, Cloudinary, payments) **or** only the DB — external contact is not required.
- `emailService.js`, `cloudinaryService.js`, `paymentService.js`, `appointmentService.js`

### 3. Utils — small general-purpose helpers
- Not tied to any single feature; reusable anywhere. e.g. `formatDate.js`, `generateCode.js`, `calculateAge.js`, `formatCurrency.js` (wraps `Intl.NumberFormat`).

### 4. Middlewares — HTTP request/response processing
- `protect.js` (auth), `restrictTo.js` (role/permissions), `errorHandler.js` (central errors), `uploadMiddleware.js` (file uploads)
- Pattern: `protect = (req, res, next) => { if (!req.user) return res.status(401).json({ message: 'Authentication required' }); next(); };`
- Keeps request handling consistent instead of repeating it per route.

| Concept | Main responsibility | Example |
|---------|--------------------|---------|
| Features | Organize code by functionality | `appointments/` |
| Services | Operations + business logic | `emailService.js` |
| Utils | Small general reusable helpers | `formatDate.js` |
| Middlewares | Process HTTP request-response cycle | `protect.js` |

### How they work together (receptionist books an appointment)
`Feature` (appointments) organizes the flow → `Middleware` checks auth/permissions → `Service` checks availability & creates the appointment → `Utils` format dates / time as needed.

**Overlap is allowed:** services may live at `features/appointments/services/`; utils may be feature-specific or shared. The goal is a clear single responsibility per file, not one mandatory layout. Feature-based layout complements (does not replace) the doc's `controllers/`/`routes/`/`models/` baseline in Section 2.

## Section index (id → section → file)

| # | id | Section | File |
|----|----|---------|------|
| 1 | `s1` | Environment Setup | `reference/reference.html` |
| 2 | `s2` | MERN Folder Structure Diagram | `reference/reference.html` |
| 3 | `s3` | Backend — Node.js + Express Initialization | `backend/backend.html` |
| 4 | `s4` | Backend — Express Server Boilerplate | `backend/backend.html` |
| 5 | `s5` | Backend — Common Middlewares | `backend/backend.html` |
| 6 | `s6` | Database — MongoDB + Mongoose | `backend/backend.html` |
| 7 | `s7` | Backend — Models, Controllers, Routes | `backend/backend.html` |
| 8 | `s8` | Validation, Pagination & Response Format | `backend/backend.html` |
| 9 | `s9` | Auth Deep-Dive — JWT Access + Refresh (Cookies) | `backend/backend.html` |
| 10 | `s10` | Frontend — Vite + React Initialization | `frontend/frontend.html` |
| 11 | `s11` | Frontend — Tailwind CSS Setup | `frontend/frontend.html` |
| 12 | `s12` | Frontend — Redux Toolkit (Counter Example) | `frontend/frontend.html` |
| 13 | `s13` | Frontend — RTK Query Base API + Endpoint Injection | `frontend/frontend.html` |
| 14 | `s14` | Frontend — Common React Boilerplate | `frontend/frontend.html` |
| 15 | `s15` | WebSockets — Backend (Node.js) + Frontend (Vite + React) | `frontend/frontend.html` |
| 16 | `s16` | Dev Workflow | `devops/devops.html` |
| 17 | `s17` | Testing — Jest + Supertest (API, `s17a`) + Vitest + RTL (UI, `s17b`) | `devops/devops.html` |
| 18 | `s18` | TypeScript Setup — Type A Node/Express (`s18a`) + Type B Vite (`s18b`) | `reference/reference.html` |
| 19 | `s19` | CI/CD + Docs | `devops/devops.html` |
| 20 | `s20` | Docker Setup | `devops/devops.html` |
| 21 | `s21` | VPS Setup + Nginx + SSL | `devops/devops.html` |
| 22 | `s22` | SSL & Certificate Authority (CA) | `devops/devops.html` |
| 23 | `s23` | Commands Cheat Sheet | `reference/reference.html` |
| 24 | `s24` | Ubuntu Commands Cheat Sheet | `reference/reference.html` |
| 25 | `s25` | Git & GitHub | `reference/reference.html` |

## Rules for editing the HTML pages (IMPORTANT)

1. **HTML-escape everything inside `<pre><code>` blocks** (these are plain HTML documents; raw `<`, `>`, and `&` will break rendering):
   - `<` → `&lt;`
   - `>` → `&gt;`
   - `&&` → `&amp;&amp;`
   - `=>` → `=&gt;`
   - `&` in shell commands (e.g. `apt update && apt upgrade`) → `&amp;&amp;`
2. Never put raw `<script>`-style JS arrows inside sections; raw `=>` is only allowed in the real JS file `js/main.js` (scrollspy / mobile toggle / copy buttons / sidebar search). `css/styles.css` and `js/main.js` are never HTML-escaped.
3. Keep backend **JavaScript** snippets **CommonJS** (`const express = require('express')`) unless the user asks for ESM. Frontend snippets are ES modules (`import … from …`) — that matches real Vite/React. The **TypeScript** setup (Section 18) is the exception: Type A (Node/Express) uses `require`/`module.exports` with `lib: ["esnext"]`, `types: ["node"]`, `moduleResolution: "bundler"`, and extensionless relative requires; Type B (Vite) uses `import`/`export`. Never introduce `nodenext`/`node16` resolution or `.js` import extensions.
4. Code snippets are authored as they would be run/copied. Stay consistent with existing naming and structure shown in the folder tree (Section 2) and Section 7.
5. Fictional authoring conventions in the doc are fact (e.g. routes live in `routes/`, handlers in `controllers/`, guards `protect`/`admin` in `middleware/`). Keep new snippets consistent with those paths.
6. When a snippet demonstrates domain logic (bookings, patients, invoices…), prefer the **feature-based organization** from "Code organization conventions" — business operations go in `services/`, bare helpers in `utils/`.
7. In-text "Section N" cross-references must keep pointing at the right heading after any move/rename — check the index table above.

## Verification checklist after any edit

**Fastest path: `node verify.js` from the project root.** It automates every box below (layout, escaping, tag balance, link/anchor resolution, section ids, sidebar uniformity, hub completeness, css/js depth, js syntax, css braces) and prints each failure with its file name. Exit code 0 = all good.

Then eyeball what a script can't know:

- [ ] New/moved sections are listed in the index table above **and** added to the hub list in `index.html`.
- [ ] In-text "Section N" cross-references still point at the right heading (check the index table).
- [ ] Snippets follow the code-organization conventions and CommonJS/ESM split below.

What `node verify.js` checks for you:

- [ ] Sidebar link exists for every `<h2 id="sN">`; the sidebar is **identical on all 5 files** and lists all 25 sections + `#s17a`/`#s17b`/`#s18a`/`#s18b`.
- [ ] index.html still deep-links every section and every project file (incl. `verify.js`).
- [ ] `<pre>` count == `</pre>` count; `<h2` count == `</h2>` count (per file).
- [ ] No raw `<`, `>`, `&` inside `<pre><code>` content; no double-escaped entities (`&amp;amp;`, `&amp;lt;`).
- [ ] Every internal `href`/`src` resolves: file exists and `#anchor` exists in the target file.
- [ ] Each file ends `</main>` → `<script src="…/js/main.js"></script>` → `</body>` → `</html>`; css/js links use the right depth (`css/…` vs `../css/…`).
- [ ] `js/main.js` parses (`node --check js/main.js` also works); `css/styles.css` braces balance.

## Common user requests seen so far

- Replace `.then()` with async/await in server startup (currently `start()` with try/catch + graceful shutdown).
- Move third-party/app middleware usage into the middleware section (Section 5 now has a full middleware table + configs).
- React Router: layout routes with `<Outlet/>`, guards mounted as `<Route element={…}/>` wrappers (not prop-children).
- Add cheat-sheet sections (TypeScript, Ubuntu, SSL/CA, Git/GitHub) and a MERN folder-structure diagram.
- Replaced the old NodeNext / `.js`-extension TypeScript section with the bundler-resolution two-track guide: Type A (Node/Express, CommonJS output, no extensions) and Type B (Vite, `tsconfig.json` + scoped `tsconfig.node.json`), with sidebar sub-links.
- Explicitly document the four-layer code organization (features / services / utils / middlewares) with a dental-clinic example.
- Added a **WebSockets section (now 15)**: Socket.IO on the backend attached to `http.createServer(app)`, JWT cookie handshake auth, `emitToUser`/`emitToRoom` helpers from a REST controller, and on the Vite side the socket singleton, `useSocket` hook, `RealtimeNotifications` mounted in `Layout.jsx`, RTK Query `onCacheEntryAdded` cache updates, plus `ws: true` dev proxy and Nginx `Upgrade` headers.
- Added a **sidebar search bar** that filters nav entries by title + section content (Enter → first match, Esc → clear).
- **Reordered all sections into MERN build sequence** (folder structure moved up front, auth/validation before frontend, websockets after React boilerplate, testing/TS/CI before deploy, cheat sheets last) and renumbered ids `s1`–`s25`; every in-text "Section N" cross-reference was remapped to the new numbering.
- **Split the single huge file into hub + 4 content pages + `css/` + `js/`** (max 4 content folders): `index.html` links to everything, shared stylesheet/script, uniform deep-linking sidebar on every file.
- **Hardening pass** ("fix any problem"): sidebar search matches the hub's description text too and no longer hides a parent item (18) when only its nested sub-link matches; `aria-expanded` on the mobile toggle; Esc closes the open mobile sidebar; shared css/js dedented; **`verify.js`** added at the root to automate the checklist, including a byte-comparison of the 5 sidebar copies.
- **Added Vitest testing** ("add testing using vitest") — split Section 17 into `s17a` (API: Jest + Supertest) and `s17b` (UI: Vitest + React Testing Library) sub-anchors, mirroring the `s18a`/`s18b` pattern so nothing had to be renumbered; all 5 sidebars, the hub list and `verify.js` expectations updated.

## Environment notes

- Platform: Windows (PowerShell 5.1). Use the `edit`/`read`/`grep` tools for file work; avoid PowerShell file cmdlets.
- No repo, no build step — editing these files is editing documentation only. Do not "fix" it into an app. `verify.js` is the one runnable script: it only reads the files and reports (`node verify.js`), it is never imported and never part of the site.
