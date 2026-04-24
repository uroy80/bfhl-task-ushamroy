<p align="center">
  <img src="https://img.shields.io/badge/Stack-Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js Badge"/>
  <img src="https://img.shields.io/badge/Challenge-SRM%20Full%20Stack%20Round%201-0A2849?style=for-the-badge&logo=hackthebox&logoColor=white" alt="Challenge Badge"/>
  <img src="https://img.shields.io/badge/Company-Bajaj%20Finserv%20Health-1573FE?style=for-the-badge&logo=target&logoColor=white" alt="Company Badge"/>
  <img src="https://img.shields.io/badge/API-POST%20%2Fbfhl-0F9D6B?style=for-the-badge&logo=json&logoColor=white" alt="API Badge"/>
  <img src="https://img.shields.io/badge/Hosting-Hostinger%20VPS-673DE6?style=for-the-badge&logo=docker&logoColor=white" alt="Hosting Badge"/>
  <img src="https://img.shields.io/badge/SSL-Cloudflare%20Origin-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="SSL Badge"/>
</p>

<p align="center">
  <img src="docs/logo.svg" alt="Hierarchia" width="120" height="120"/>
</p>

<h1 align="center">Hierarchia</h1>
<h3 align="center">Hierarchy Analysis Service for the Bajaj Finserv Health Challenge</h3>

<p align="center">
  <sub>Challenge organized by</sub><br/>
  <img src="bfhl-logo.png" alt="Bajaj Finserv Health" width="160"/>
</p>

<p align="center">
  <i>Accepts parent → child edges, validates every entry, builds trees with a first-parent-wins rule, detects cycles, and returns an evaluator-ready structured summary — in single-digit milliseconds.</i>
</p>

<p align="center">
  <a href="#submission">Submission</a> &middot;
  <a href="#live-endpoints">Live</a> &middot;
  <a href="#the-challenge">Challenge</a> &middot;
  <a href="#api-reference">API</a> &middot;
  <a href="#processing-rules">Rules</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#robustness">Robustness</a> &middot;
  <a href="#deployment">Deployment</a> &middot;
  <a href="#local-development">Local Dev</a>
</p>

<p align="center">
  <a href="https://bfhl.ushamroy.com">
    <img src="https://img.shields.io/badge/Live%20Product-bfhl.ushamroy.com-4CAF50?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Product"/>
  </a>
  <a href="https://bfhl.ushamroy.com/bfhl">
    <img src="https://img.shields.io/badge/API%20Endpoint-POST%20%2Fbfhl-0A2849?style=for-the-badge&logo=swagger&logoColor=white" alt="API Endpoint"/>
  </a>
  <a href="https://github.com/uroy80/bfhl-task-ushamroy">
    <img src="https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Source"/>
  </a>
</p>

---

## Submission

| Field | Value |
|---|---|
| **Name** | Usham Roy |
| **Roll Number** | RA2311003011574 |
| **Email** | ur3349@srmist.edu.in |
| **Date of Birth** | 04 / 08 / 2005 |
| **College** | SRM Institute of Science and Technology |
| **Branch** | CSE / Computing Technologies |
| **Frontend URL** | https://bfhl.ushamroy.com |
| **Backend API Base** | https://bfhl.ushamroy.com |
| **API Endpoint** | `POST https://bfhl.ushamroy.com/bfhl` |
| **GitHub Repo** | https://github.com/uroy80/bfhl-task-ushamroy |

## Live Endpoints

| Resource | URL | Notes |
|---|---|---|
| Frontend | https://bfhl.ushamroy.com | Glassmorphism UI with tree visualization |
| API Health | `GET https://bfhl.ushamroy.com/bfhl` | Returns operational metadata |
| API | `POST https://bfhl.ushamroy.com/bfhl` | `Content-Type: application/json` — body `{ "data": [...] }` |

## The Challenge

Bajaj Finserv Health, via SRM's Full Stack Round 1, asked candidates to build and host a REST API (`POST /bfhl`) that accepts an array of node strings, processes hierarchical relationships, and returns structured insights — plus a frontend that lets users interact with it.

Key evaluator expectations:
- Valid JSON response matching the spec schema
- CORS enabled for cross-origin calls
- Response in under 3 seconds for up to 50 nodes
- No hardcoded responses — tested against hidden inputs
- Original code (plagiarism check)

## API Reference

### `POST /bfhl`

**Request**

```http
POST /bfhl HTTP/1.1
Host: bfhl.ushamroy.com
Content-Type: application/json

{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X"]
}
```

**Response**

```json
{
  "user_id": "ushamroy_04082005",
  "email_id": "ur3349@srmist.edu.in",
  "college_roll_number": "RA2311003011574",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": { "D": {} }, "C": {} } }, "depth": 3 },
    { "root": "X", "tree": {}, "has_cycle": true }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": { "total_trees": 1, "total_cycles": 1, "largest_tree_root": "A" }
}
```

### Supporting routes

| Method | Path | Purpose |
|---|---|---|
| `OPTIONS` | `/bfhl` | CORS preflight — 204 with access-control-* headers |
| `GET` | `/bfhl` | Health probe — returns identity + operational status |

### Error codes

| Code | When | Body |
|---|---|---|
| `400` | Malformed JSON, missing `data`, or non-array `data` | `{ "error": "…" }` |
| `413` | `data` array exceeds 10,000 entries | `{ "error": "data exceeds maximum of 10000 entries" }` |
| `415` | Missing or wrong `Content-Type` | `{ "error": "Content-Type must be application/json" }` |
| `500` | Unhandled processing error | `{ "error": "…" }` |

## Processing Rules

1. **Validation** — each entry is trimmed, then matched against `^[A-Z]->[A-Z]$`. Self-loops (`A->A`) are treated as invalid per the spec.
2. **Duplicates** — the first occurrence of a `Parent->Child` pair is used for tree construction; subsequent occurrences are recorded once in `duplicate_edges` regardless of repeat count.
3. **First parent wins** — if a child already has a parent, later parent edges for that child are silently discarded (diamond case).
4. **Cycles** — a component whose nodes all have parents is treated as cyclic: `tree: {}`, `has_cycle: true`, depth omitted, root is the lexicographically smallest node in the component.
5. **Depth** — number of nodes on the longest root-to-leaf path (`A->B->C` ⇒ 3).
6. **Summary tiebreaker** — `largest_tree_root` picks the tree of max depth; ties broken by the lexicographically smaller root.
7. **Ordering** — `hierarchies` are returned in the order each component was first touched in the input (deterministic, matches the spec example).

## Architecture

```
                   ┌───────────────────────┐
                   │  Cloudflare (Proxy)   │
                   │  Universal SSL + WAF  │
                   └───────────┬───────────┘
                        HTTPS  │
                   ┌───────────▼───────────┐
                   │  shared-nginx (Docker)│
                   │  Origin cert for      │
                   │  *.ushamroy.com       │
                   └───────────┬───────────┘
                               │ proxy_pass
                   ┌───────────▼───────────┐
                   │  bfhl-app (Docker)    │
                   │  Next.js 14 standalone│
                   │  Node 20 · port 3000  │
                   └───────────────────────┘
                               │
                   ┌───────────┴───────────┐
                   │                       │
            app/page.js           app/bfhl/route.js
         (React + glassmorph)     (POST / GET / OPTIONS)
                   │                       │
                   └──────┬────────────────┘
                          │
                   lib/processor.js
             (validate → dedupe → first-parent-wins →
              components → trees + cycles → summary)
```

### Project layout

```
app/
  bfhl/route.js     POST / GET / OPTIONS handlers + CORS + timing header
  page.js           Frontend page (React) with SVG logo + glassmorphism
  layout.js         Root layout
  globals.css       Glass + gradient-orb styling
lib/
  processor.js      Iterative BFS tree build + cycle detection + summary
scripts/
  smoke.mjs         Processor tests (spec example + edge cases, 9 pass)
docs/
  logo.svg          Brand mark
Dockerfile          Multi-stage build, Next.js standalone output
next.config.mjs     `output: 'standalone'` for small runtime image
```

## Robustness

### API (`app/bfhl/route.js`)
- Validates `Content-Type: application/json` → 415 on mismatch
- Caps `data.length` at 10,000 entries → 413 on overflow
- Consistent `{ "error": "…" }` shape across all 4xx/5xx responses
- `x-response-time-ms` header on every successful request
- `runtime: 'nodejs'` + `dynamic: 'force-dynamic'` to avoid stale cache
- CORS allows any origin, `GET, POST, OPTIONS`, `Content-Type` header

### Algorithm (`lib/processor.js`)
- **Iterative** tree construction and depth calculation (BFS with level tracking) — no recursion, safe for deep chains
- Single pass through input for validation + dedupe
- Undirected BFS for connected-component discovery in first-seen order
- `Object.create(null)` for parent/children maps to avoid prototype pollution

### Frontend (`app/page.js`)
- `AbortController` with 15 s request timeout
- Distinct error copy for `AbortError`, network failure (`Failed to fetch`), and non-2xx
- Submit disabled while loading or when input is empty
- Cmd / Ctrl + Enter keyboard shortcut
- Copy-JSON-to-clipboard with transient toast
- `prefers-reduced-motion` support — animations disabled for users who opt out

### Tests — `node scripts/smoke.mjs`

| Case | Result |
|---|---|
| Spec example (large input, trees + cycles + invalid + duplicate) | ✅ |
| Self-loop classified invalid | ✅ |
| Whitespace trimming preserves validity | ✅ |
| All bad formats pushed to `invalid_entries` | ✅ |
| Diamond — first-parent-wins | ✅ |
| Duplicate repeated many times — surfaces once | ✅ |
| Equal-depth tiebreaker picks lex smaller root | ✅ |
| Pure 2-node cycle | ✅ |
| Empty input | ✅ |

## Deployment

**Stack:** Hostinger VPS · Docker · nginx reverse proxy (shared across multiple apps) · Cloudflare proxy with Cloudflare Origin CA wildcard cert for `*.ushamroy.com`.

### Build & run

```bash
# On the VPS, inside /root/bfhl-app
docker build -t bfhl-app:latest .
docker network create bfhl_default 2>/dev/null || true
docker run -d --name bfhl-app --restart unless-stopped \
  --network bfhl_default \
  -e USER_FULL_NAME=ushamroy \
  -e USER_DOB_DDMMYYYY=04082005 \
  -e USER_EMAIL=ur3349@srmist.edu.in \
  -e USER_ROLL_NUMBER=RA2311003011574 \
  bfhl-app:latest
docker network connect bfhl_default shared-nginx 2>/dev/null || true
```

### nginx vhost (appended to `/root/shared-nginx/nginx.conf`)

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name bfhl.ushamroy.com;
    ssl_certificate     /etc/ssl/certs/ushamroy.com.crt;
    ssl_certificate_key /etc/ssl/private/ushamroy.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://bfhl-app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 120s;
    }
}
```

### Cloudflare DNS

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `bfhl` | `187.127.150.202` | Proxied |

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in your identity fields
npm run dev                  # http://localhost:3000
node scripts/smoke.mjs       # run processor tests
```

### Environment variables

| Variable | Example | Maps to |
|---|---|---|
| `USER_FULL_NAME` | `ushamroy` | `user_id` prefix |
| `USER_DOB_DDMMYYYY` | `04082005` | `user_id` suffix |
| `USER_EMAIL` | `ur3349@srmist.edu.in` | `email_id` |
| `USER_ROLL_NUMBER` | `RA2311003011574` | `college_roll_number` |

`user_id` is produced as `${USER_FULL_NAME}_${USER_DOB_DDMMYYYY}`.

## Example — curl

```bash
curl -sX POST https://bfhl.ushamroy.com/bfhl \
  -H 'Content-Type: application/json' \
  -d '{
    "data": [
      "A->B", "A->C", "B->D", "C->E", "E->F",
      "X->Y", "Y->Z", "Z->X",
      "P->Q", "Q->R",
      "G->H", "G->H", "G->I",
      "hello", "1->2", "A->"
    ]
  }' | jq
```

---

<p align="center">
  <sub>Built by <a href="https://github.com/uroy80">Usham Roy</a> · SRM Full Stack · Round 1 · April 2026</sub>
</p>
