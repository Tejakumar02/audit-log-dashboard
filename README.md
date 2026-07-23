# Auditline — Audit Log Investigation Dashboard

A dashboard for security engineers to bulk-upload, browse and investigate system audit logs.
Built with React (Vite), Node.js, Express and MongoDB.

- **Repository:** `<add your GitHub URL here>`
- **Live demo:** `<add your deployed URL here>`
- **Setup / deploy instructions:** see [`SETUP.md`](./SETUP.md)

---

## 1. What's implemented

| Requirement | Status | Where |
|---|---|---|
| Bulk upload 10,000 records in a single request | ✅ | `POST /api/logs/bulk` — accepts a JSON file, `backend/src/controllers/logsController.js` |
| Dashboard to view stored logs | ✅ | `frontend/src/App.jsx` + `LogsTable.jsx` |
| Filter by field | ✅ | Severity, status, region, role, resource type, action, IP, date range |
| Search | ✅ | Free-text across actor, action, resource, IP, resource type |
| Sort | ✅ | Click any sortable column header (timestamp, actor, action, region, severity, status) |
| Paginate | ✅ | Page controls + adjustable page size (25/50/100) |
| Filter/sort/paginate on the server | ✅ | All done in MongoDB queries in `getLogs()` — the client only sends query params and renders the response |

A generated 10,000-record sample file is included at
`backend/sample-data/sample-logs-10000.json` so the bulk upload can be tested immediately
without hand-writing data. Regenerate it (or a different size) with:

```
cd backend
node scripts/generateSampleData.js 10000
```

---

## 2. Architecture

```
frontend (React/Vite, port 5173)  --->  backend (Express, port 5000)  --->  MongoDB
```

Two independent apps, one repo. No monorepo tooling (Nx/Turborepo/Lerna) because there
are only two packages and they don't share code — a build orchestrator would be solving
a problem this project doesn't have.

**Backend** — `backend/`
```
server.js                    Express app, CORS, error handler, DB connect
src/config/db.js              Mongoose connection
src/models/AuditLog.js        Schema + indexes
src/constants/fields.js       Single source of truth for filterable/sortable/searchable fields
src/middleware/upload.js      Multer (in-memory) config for the upload endpoint
src/controllers/logsController.js   bulkUpload / getLogs / getFacets
src/routes/logs.js             Route wiring
scripts/generateSampleData.js  Test-data generator
```

**Frontend** — `frontend/`
```
src/App.jsx                    All dashboard state (filters, sort, pagination) and data fetching
src/api/client.js               The three fetch calls the app makes
src/components/                 TopBar, FilterToolbar, LogsTable, Pagination,
                                 UploadDialog, LogDetailPanel, Badge, EmptyState
src/styles/                     tokens.css (design tokens), base.css, components.css
```

---

## 3. API reference

### `POST /api/logs/bulk`
`multipart/form-data`, field name `file`, a JSON file containing an array of records.

Response:
```json
{ "receivedCount": 10000, "insertedCount": 9994, "rejectedCount": 6, "sampleErrors": [ { "index": 42, "reason": "Missing field(s): ipAddress" } ] }
```
Records are validated in memory before anything is written — a record missing a required
field or with an unparseable `timestamp` is skipped and reported, not silently dropped and
not allowed to fail the whole batch.

### `GET /api/logs`
Query params (all optional):

| Param | Meaning |
|---|---|
| `search` | Free-text match against actor, action, resource, ipAddress, resourceType |
| `severity`, `status`, `region`, `role`, `resourceType`, `action` | Exact match; comma-separate for multi-select, e.g. `severity=HIGH,CRITICAL` |
| `ipAddress` | Partial match |
| `dateFrom`, `dateTo` | ISO date bounds on `timestamp` |
| `sortBy` | One of `timestamp`, `severity`, `status`, `actor`, `action`, `region` (default `timestamp`) |
| `order` | `asc` \| `desc` (default `desc`) |
| `page`, `limit` | Default `page=1`, `limit=25`, `limit` capped at 100 |

Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`

### `GET /api/logs/facets`
Returns the distinct values currently in the database for every closed-vocabulary field
(`severity`, `status`, `region`, `role`, `resourceType`, `action`), so the filter dropdowns
always reflect real data instead of a hardcoded guess.

---

## 4. Technical decisions

**File upload instead of a raw JSON body for bulk insert.**
The spec asks for 10,000 records in one request but doesn't say how they arrive. Pasting
10,000 records into a JSON body from a UI isn't a real workflow; a security engineer
exporting audit logs from another system will have a file. `POST /api/logs/bulk` accepts
that file directly (multipart, in-memory, parsed once, never written to disk) rather than
requiring the client to read and re-serialize it as a request body first.

**Validate before touching the database, not after.**
Every record is checked for required fields and a parseable timestamp in a plain JS loop
before `insertMany` runs. This means a file with a few bad rows still inserts everything
valid and reports exactly which rows were skipped and why, instead of the whole batch
failing on one bad record, or bad data silently reaching MongoDB.

**Mongoose over the raw MongoDB driver.**
Mongoose is the standard pairing with Express + MongoDB, not an extra abstraction layered
on top of one. It buys schema-level validation and a required-field guarantee on every
write, for free, which matters for an audit trail — this is a case where skipping
validation for brevity would compromise data integrity, which the brief for this exercise
explicitly rules out.

**Regex search, not a MongoDB text index.**
Text indexes are built for relevance-ranked, word-based search. Security engineers
searching logs usually want substring matches — part of an IP, part of an email, part of
a resource path — which a text index does not do well (it tokenizes on word boundaries).
A whitelisted `$or` of case-insensitive regex clauses gives predictable substring matching
at the scale this exercise targets. The honest trade-off: a leading-wildcard regex can't
use an index, so this does not scale to a search-engine-sized dataset. At that point the
right fix is a dedicated search index (Atlas Search / Elasticsearch) — not something this
exercise's data volume justifies building now.

**One index per filterable/sortable field, not compound indexes.**
Each of `timestamp`, `severity`, `status`, `region`, `role`, `resourceType`, `action` has
its own index. This covers every single-field filter and sort in the app. Compound
indexes would help specific multi-field query patterns at much larger scale, but they
also cost extra write overhead and disk space on every insert — not worth it until a real
access pattern proves it's needed.

**Skip/limit pagination, not cursor-based.**
The UI requirement is page numbers the user can click, which needs a total count and
random access to any page — exactly what `skip`/`limit` gives you. Cursor pagination is
the better choice for infinite-scroll feeds at very large scale, but it can't jump to
"page 7" and isn't what was asked for here.

**No dedicated `/api/logs/:id` endpoint.**
The list endpoint already returns full records, so clicking a row to see its full details
(the slide-over panel) reuses data already in memory. Adding a second endpoint that
returns the same fields would be duplicated code serving no new need.

**Plain CSS with a small custom-property token system, not Tailwind or a component library.**
The whole UI is nine components. A hand-written token system (`tokens.css`) is easier to
read and change than a utility-class build step for something this size, and it's what
makes the interface look like a deliberate design instead of default component-library
styling.

**No Redux / React Query / global state library.**
There is exactly one screen and one data-fetching concern (the logs list, driven by
filters/sort/page). `useState` + `useEffect` in `App.jsx` covers that completely. Adding a
state or data-fetching library would be solving a scaling problem this app doesn't have.

**No authentication.**
Not in the spec, and out of scope for what's being evaluated here. In a real deployment
this dashboard would sit behind whatever auth the rest of the security tooling uses
(SSO/JWT), which is why it isn't stubbed out with something disposable instead.

---

## 5. Known limitations / what I'd do next

- **Search doesn't scale past index-friendly limits.** Fine at the data volumes this
  exercise targets; a text/search index would be the next step at real production scale.
- **No authentication or role-based access control**, as noted above.
- **No audit trail for the dashboard's own actions** (e.g. who uploaded a given batch)
  — the uploaded records themselves are the audit data, but the upload action isn't
  logged. Worth adding if this became a real internal tool.
- **No automated test suite shipped.** Backend controller logic (filtering, sorting,
  pagination math, upload validation) was verified against the real code with a
  lightweight mocked-model test during development; a proper `jest`/`supertest` suite
  would be the next addition for a longer-lived project.
