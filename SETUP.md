# Setup & Deployment Guide

Step-by-step instructions to run Auditline locally, then push it to GitHub and deploy it
publicly. No prior knowledge of the project assumed.

## Prerequisites

- [Node.js](https://nodejs.org) 18 or later (`node -v` to check)
- A MongoDB database — either:
  - **Docker** (easiest for local dev — a `docker-compose.yml` is included), or
  - MongoDB installed locally, or
  - A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (needed either way if you plan to deploy)
- A [GitHub](https://github.com) account (for submission)
- Free accounts on [Render](https://render.com) and [Vercel](https://vercel.com) (for deployment — or any host you prefer)

---

## Part 1 — Run it locally

### 1. Get the code

If you received this as a zip, unzip it and open a terminal in the project folder.
If you've already pushed it to your own GitHub repo, clone that instead:

```
git clone <your-repo-url>
cd audit-log-dashboard
```

### 2. Start MongoDB

Pick one:

**Option A — Docker (recommended, one command):**
wsl --install --web-download

```
docker compose up -d
```
This starts MongoDB on `localhost:27017` with data persisted in a Docker volume.

**Option B — Local MongoDB install:**
Follow MongoDB's [install guide](https://www.mongodb.com/docs/manual/administration/install-community/)
for your OS, then make sure it's running on `localhost:27017`.

**Option C — MongoDB Atlas (cloud, free tier):**
1. Create a free cluster at [Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Under **Database Access**, add a database user with a username and password.
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) — fine for a
   demo/exercise project.
4. Click **Connect → Drivers** and copy the connection string
   (`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/audit-logs`).

### 3. Backend setup

```
cd backend
cp .env.example .env
```
Open `.env` and set `MONGO_URI`:
- Docker/local Mongo: leave the default `mongodb://127.0.0.1:27017/audit-logs`
- Atlas: paste the connection string from step 2 above, replacing `<password>` with the
  real password

```
npm install
npm run dev
```
You should see:
```
MongoDB connected -> audit-logs
API listening on port 5000
```
Leave this running. Verify it in a browser: [http://localhost:5000/api/health](http://localhost:5000/api/health)
should return `{"status":"ok"}`.

### 4. (Optional) Load sample data

A ready-made 10,000-record file is already included at
`backend/sample-data/sample-logs-10000.json`. You'll upload it from the dashboard UI in
step 6 — or, to test the API directly:

```
curl -F "file=@sample-data/sample-logs-10000.json" http://localhost:5000/api/logs/bulk
```

### 5. Frontend setup

Open a **new terminal tab** (keep the backend running):

```
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 6. Try it out

- Click **Upload logs**, drag in `backend/sample-data/sample-logs-10000.json`, click
  **Upload**. You should see `Inserted: 10000`.
- Filter by severity/status/region, type in the search box, click a column header to sort,
  click a row to see its full detail, change the page size.

---

## Part 2 — Push to GitHub

```
git init
git add .
git commit -m "Audit log investigation dashboard"
```
Create a new **public** repository on GitHub (github.com → New repository → don't
initialize with a README, since this project already has one), then:
```
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

---

## Part 3 — Deploy

This guide uses **MongoDB Atlas** (database) + **Render** (backend API) + **Vercel**
(frontend) — all have free tiers and together need no server maintenance. Any other host
works the same way; the environment variables are what matter.

### 3.1 Database — MongoDB Atlas
Already covered in Part 1, Option C, if you haven't done it yet. Keep the connection
string handy.

### 3.2 Backend — Render
1. Go to [render.com](https://render.com) → **New → Web Service** → connect your GitHub
   repo.
2. Set:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. Under **Environment**, add:
   - `MONGO_URI` = your Atlas connection string
   - `CORS_ORIGIN` = leave blank for now — you'll set this after step 3.3
4. Click **Create Web Service**. Wait for the deploy to finish, then copy the service URL
   (something like `https://auditline-api.onrender.com`).
5. Confirm it works: visit `https://<your-render-url>/api/health` — should return
   `{"status":"ok"}`.

### 3.3 Frontend — Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the same
   GitHub repo.
2. Set:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = the Render URL from step 3.2 (no trailing slash)
4. Click **Deploy**. Copy the resulting URL (something like `https://auditline.vercel.app`).

### 3.4 Connect them
Go back to Render → your backend service → **Environment** → set:
- `CORS_ORIGIN` = the Vercel URL from step 3.3 (no trailing slash)

Save — Render will redeploy automatically. Once it's back up, open your Vercel URL: the
dashboard should load and the upload/filter/search/sort/pagination should all work exactly
as they did locally.

### 3.5 Update your README
Put both links at the top of `SUBMISSION.md`:
```
- Repository: https://github.com/<your-username>/<your-repo>
- Live demo: https://auditline.vercel.app
```

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend loads but shows a red "Couldn't refresh logs" banner | `VITE_API_URL` is wrong, or the backend isn't running/deployed |
| Backend logs `Failed to start server: ...` | `MONGO_URI` is missing or wrong — check `.env` |
| Upload says "Only .json files are accepted" | The file's extension isn't `.json` |
| CORS error in the browser console | `CORS_ORIGIN` on the backend doesn't match the frontend's actual URL exactly (including `https://` and no trailing slash) |
| `docker compose up` fails | Docker Desktop isn't running, or port 27017 is already in use by a local MongoDB install |
