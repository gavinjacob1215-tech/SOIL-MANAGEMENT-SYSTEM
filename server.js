const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, initDB } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── SOIL SAMPLES ────────────────────────────────────────────────────────────

// GET all samples (with review count & avg rating)
app.get('/api/samples', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        COUNT(r.id) AS review_count,
        ROUND(AVG(r.rating), 1) AS avg_rating
      FROM soil_samples s
      LEFT JOIN reviews r ON r.sample_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single sample
app.get('/api/samples/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        s.*,
        COUNT(r.id) AS review_count,
        ROUND(AVG(r.rating), 1) AS avg_rating
      FROM soil_samples s
      LEFT JOIN reviews r ON r.sample_id = s.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sample not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create sample
app.post('/api/samples', async (req, res) => {
  try {
    const {
      title, location, soil_type, collection_date,
      texture, color, moisture, drainage,
      ph, nitrogen_ppm, phosphorus_ppm, potassium_ppm,
      organic_matter_percent, calcium_ppm, magnesium_ppm,
      sulfur_ppm, iron_ppm, zinc_ppm, manganese_ppm,
      notes, submitted_by
    } = req.body;

    const result = await pool.query(`
      INSERT INTO soil_samples (
        title, location, soil_type, collection_date,
        texture, color, moisture, drainage,
        ph, nitrogen_ppm, phosphorus_ppm, potassium_ppm,
        organic_matter_percent, calcium_ppm, magnesium_ppm,
        sulfur_ppm, iron_ppm, zinc_ppm, manganese_ppm,
        notes, submitted_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      ) RETURNING *
    `, [
      title, location, soil_type, collection_date || null,
      texture, color, moisture, drainage,
      ph || null, nitrogen_ppm || null, phosphorus_ppm || null, potassium_ppm || null,
      organic_matter_percent || null, calcium_ppm || null, magnesium_ppm || null,
      sulfur_ppm || null, iron_ppm || null, zinc_ppm || null, manganese_ppm || null,
      notes, submitted_by
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

// GET reviews for a sample
app.get('/api/samples/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*,
        (SELECT COUNT(*) FROM comments c WHERE c.review_id = r.id) AS comment_count
      FROM reviews r
      WHERE r.sample_id = $1
      ORDER BY r.created_at DESC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create review
app.post('/api/samples/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer_name, rating, review_text, suitable_plants, best_for, not_suitable_for } = req.body;
    const result = await pool.query(`
      INSERT INTO reviews (sample_id, reviewer_name, rating, review_text, suitable_plants, best_for, not_suitable_for)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, reviewer_name, rating, review_text, suitable_plants, best_for, not_suitable_for]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COMMENTS ────────────────────────────────────────────────────────────────

// GET comments for a review
app.get('/api/reviews/:reviewId/comments', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const result = await pool.query(`
      SELECT * FROM comments WHERE review_id = $1 ORDER BY created_at ASC
    `, [reviewId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add comment
app.post('/api/reviews/:reviewId/comments', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { author_name, comment_text, sample_id } = req.body;
    const result = await pool.query(`
      INSERT INTO comments (review_id, sample_id, author_name, comment_text)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [reviewId, sample_id, author_name, comment_text]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEARCH ───────────────────────────────────────────────────────────────────

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const result = await pool.query(`
      SELECT s.*, COUNT(r.id) AS review_count, ROUND(AVG(r.rating), 1) AS avg_rating
      FROM soil_samples s
      LEFT JOIN reviews r ON r.sample_id = s.id
      WHERE s.title ILIKE $1 OR s.location ILIKE $1 OR s.soil_type ILIKE $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [`%${q}%`]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Init DB then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🌱 Soil Review running at http://localhost:${PORT}`);
  });
});

module.exports = app;
