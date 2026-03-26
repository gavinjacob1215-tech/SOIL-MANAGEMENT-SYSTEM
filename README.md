<<<<<<< HEAD
# 🌱 Soil Review

A platform to upload, share, and review soil test data — find out what plants thrive and what each soil is best for.

---

## Features

- 📋 Submit soil samples with physical & chemical test values (pH, N, P, K, Ca, Mg, and more)
- ⭐ Leave star-rated reviews with plant recommendations
- 💬 Comment on reviews
- 🔍 Search by soil type, location, or title
- 📊 Visual pH bar indicator
- 🗄️ PostgreSQL backend (Neon.tech) with Vercel deployment support

---

## Tech Stack

| Layer     | Technology             |
|-----------|------------------------|
| Frontend  | HTML, CSS, Vanilla JS  |
| Backend   | Node.js + Express      |
| Database  | PostgreSQL via Neon.tech |
| Hosting   | Vercel                 |

---

## Local Setup

### 1. Clone / unzip the project

```bash
cd soil-review
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Neon.tech database

1. Go to [https://neon.tech](https://neon.tech) and create a free account
2. Create a new project (e.g. `soil-review`)
3. Copy the **Connection String** from the dashboard (looks like `postgresql://user:pass@host.neon.tech/neondb?sslmode=require`)

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and paste your Neon connection string:

```env
DATABASE_URL=postgresql://user:password@your-host.neon.tech/neondb?sslmode=require
PORT=3000
NODE_ENV=development
```

### 5. Start the server

```bash
npm run dev     # development (with auto-reload via nodemon)
# or
npm start       # production
```

Visit: **http://localhost:3000**

The database tables are auto-created on first run. ✅

---

## Deploy to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login & deploy

```bash
vercel login
vercel
```

### 3. Add environment variable in Vercel

Go to your project dashboard on Vercel → **Settings → Environment Variables**:

| Name           | Value                                      |
|----------------|--------------------------------------------|
| `DATABASE_URL` | Your full Neon.tech connection string       |

Or use the CLI:

```bash
vercel env add DATABASE_URL
```

### 4. Redeploy

```bash
vercel --prod
```

---

## Project Structure

```
soil-review/
├── public/
│   ├── index.html          ← Single-page frontend
│   ├── css/
│   │   └── style.css       ← All styles
│   └── js/
│       └── app.js          ← All frontend logic
├── lib/
│   └── db.js               ← Database connection + table init
├── server.js               ← Express API server
├── vercel.json             ← Vercel deployment config
├── package.json
├── .env.example            ← Copy to .env and fill in values
└── README.md
```

---

## API Endpoints

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/samples`                    | List all samples                |
| GET    | `/api/samples/:id`                | Get single sample               |
| POST   | `/api/samples`                    | Create new sample               |
| GET    | `/api/samples/:id/reviews`        | Get reviews for a sample        |
| POST   | `/api/samples/:id/reviews`        | Add review to a sample          |
| GET    | `/api/reviews/:reviewId/comments` | Get comments on a review        |
| POST   | `/api/reviews/:reviewId/comments` | Add comment to a review         |
| GET    | `/api/search?q=query`             | Search samples                  |

---

## Database Schema

### `soil_samples`
- Basic: title, location, soil_type, collection_date, submitted_by
- Physical: texture, color, moisture, drainage
- Chemical: ph, nitrogen_ppm, phosphorus_ppm, potassium_ppm, organic_matter_percent, calcium_ppm, magnesium_ppm, sulfur_ppm, iron_ppm, zinc_ppm, manganese_ppm
- Notes, timestamps

### `reviews`
- sample_id (FK), reviewer_name, rating (1–5), review_text
- suitable_plants, best_for, not_suitable_for
- timestamps

### `comments`
- review_id (FK), sample_id (FK), author_name, comment_text
- timestamps

---

## Notes

- Tables are automatically created on server start — no manual SQL needed
- All chemical values are optional — submit partial data is fine
- The frontend is fully static and served by Express (or Vercel CDN)
