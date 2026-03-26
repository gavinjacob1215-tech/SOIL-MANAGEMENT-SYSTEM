const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS soil_samples (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        location VARCHAR(200),
        soil_type VARCHAR(100),
        collection_date DATE,

        -- Physical Properties
        texture VARCHAR(100),
        color VARCHAR(100),
        moisture VARCHAR(50),
        drainage VARCHAR(100),

        -- Chemical Values
        ph DECIMAL(4,2),
        nitrogen_ppm DECIMAL(10,2),
        phosphorus_ppm DECIMAL(10,2),
        potassium_ppm DECIMAL(10,2),
        organic_matter_percent DECIMAL(5,2),
        calcium_ppm DECIMAL(10,2),
        magnesium_ppm DECIMAL(10,2),
        sulfur_ppm DECIMAL(10,2),
        iron_ppm DECIMAL(10,2),
        zinc_ppm DECIMAL(10,2),
        manganese_ppm DECIMAL(10,2),

        -- Additional Info
        notes TEXT,
        submitted_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        sample_id INTEGER REFERENCES soil_samples(id) ON DELETE CASCADE,
        reviewer_name VARCHAR(100) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        suitable_plants TEXT,
        best_for TEXT,
        not_suitable_for TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        sample_id INTEGER REFERENCES soil_samples(id) ON DELETE CASCADE,
        review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
        author_name VARCHAR(100) NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
