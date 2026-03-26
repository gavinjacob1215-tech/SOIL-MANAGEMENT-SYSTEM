/* ── CONFIG ── */
const API = '';  // empty = relative URLs (same host)

/* ── STATE ── */
let currentSampleId = null;
let currentRating = 0;

/* ── UTILS ── */
function $(id) { return document.getElementById(id); }

function showToast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => { t.className = 'toast'; }, 3200);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function stars(n) {
  if (!n) return '<span style="color:#ccc">No ratings</span>';
  const full = Math.round(n);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

/* ── NAVIGATION ── */
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(`page-${page}`).classList.add('active');
  const nb = $(`nav-${page}`);
  if (nb) nb.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'home') loadSamples();
}

/* ── LOAD SAMPLES ── */
async function loadSamples(samples = null) {
  const grid = $('samples-grid');
  if (!samples) {
    grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading soil samples…</p></div>`;
    try {
      const r = await fetch(`${API}/api/samples`);
      samples = await r.json();
    } catch (e) {
      grid.innerHTML = `<div class="empty-state">⚠️ Could not connect to server. Is it running?</div>`;
      return;
    }
  }
  if (!samples.length) {
    grid.innerHTML = `<div class="empty-state">🌱 No samples yet. <a href="#" onclick="showPage('submit')">Be the first to submit!</a></div>`;
    return;
  }
  grid.innerHTML = samples.map((s, i) => renderSampleCard(s, i)).join('');
}

function renderSampleCard(s, i = 0) {
  const chips = [];
  if (s.ph) chips.push(`<span class="chip ph">pH ${s.ph}</span>`);
  if (s.nitrogen_ppm) chips.push(`<span class="chip n">N: ${s.nitrogen_ppm}</span>`);
  if (s.phosphorus_ppm) chips.push(`<span class="chip p">P: ${s.phosphorus_ppm}</span>`);
  if (s.potassium_ppm) chips.push(`<span class="chip k">K: ${s.potassium_ppm}</span>`);
  return `
    <div class="sample-card" style="animation-delay:${i * 0.05}s" onclick="openSample(${s.id})">
      <div class="card-header">
        ${s.soil_type ? `<div class="card-soil-type">${s.soil_type}</div>` : ''}
        <div class="card-title">${s.title}</div>
        ${s.location ? `<div class="card-location">📍 ${s.location}</div>` : ''}
        ${s.avg_rating ? `<div class="card-rating">★ ${s.avg_rating}</div>` : ''}
      </div>
      <div class="card-body">
        ${chips.length ? `<div class="card-chips">${chips.join('')}</div>` : ''}
        <div class="card-meta">
          <span>${s.review_count || 0} review${s.review_count == 1 ? '' : 's'}</span>
          <span>${formatDate(s.created_at)}</span>
        </div>
      </div>
    </div>
  `;
}

/* ── OPEN SAMPLE DETAIL ── */
async function openSample(id) {
  currentSampleId = id;
  showPage('detail');
  $('detail-content').innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading sample…</p></div>`;
  try {
    const [sRes, rRes] = await Promise.all([
      fetch(`${API}/api/samples/${id}`),
      fetch(`${API}/api/samples/${id}/reviews`)
    ]);
    const sample = await sRes.json();
    const reviews = await rRes.json();
    renderDetail(sample, reviews);
  } catch (e) {
    $('detail-content').innerHTML = `<div class="empty-state">⚠️ Error loading sample.</div>`;
  }
}

function phLabel(ph) {
  if (!ph) return '';
  if (ph < 5.5) return 'Strongly Acidic';
  if (ph < 6.5) return 'Acidic';
  if (ph < 7.5) return 'Neutral';
  if (ph < 8.5) return 'Alkaline';
  return 'Strongly Alkaline';
}

function renderDetail(s, reviews) {
  const phPct = s.ph ? Math.min(100, (s.ph / 14) * 100) : null;

  const chem = [
    ['Nitrogen', s.nitrogen_ppm, 'ppm'],
    ['Phosphorus', s.phosphorus_ppm, 'ppm'],
    ['Potassium', s.potassium_ppm, 'ppm'],
    ['Organic Matter', s.organic_matter_percent, '%'],
    ['Calcium', s.calcium_ppm, 'ppm'],
    ['Magnesium', s.magnesium_ppm, 'ppm'],
    ['Sulfur', s.sulfur_ppm, 'ppm'],
    ['Iron', s.iron_ppm, 'ppm'],
    ['Zinc', s.zinc_ppm, 'ppm'],
    ['Manganese', s.manganese_ppm, 'ppm'],
  ].filter(([, v]) => v != null);

  const phHTML = s.ph ? `
    <div class="data-row">
      <span class="data-label">pH</span>
      <span class="data-value">${s.ph} — ${phLabel(s.ph)}</span>
    </div>
    <div class="ph-bar-wrap">
      <div class="ph-bar">
        <div class="ph-indicator" style="left:${phPct}%"></div>
      </div>
    </div>
  ` : '';

  $('detail-content').innerHTML = `
    <div class="detail-header">
      ${s.soil_type ? `<div class="detail-badge">${s.soil_type}</div>` : ''}
      <h1 class="detail-title">${s.title}</h1>
      ${s.submitted_by ? `<div class="submitted-by">Submitted by ${s.submitted_by}</div>` : ''}
      <div class="detail-meta">
        ${s.location ? `<span>📍 ${s.location}</span>` : ''}
        ${s.collection_date ? `<span>📅 Collected ${formatDate(s.collection_date)}</span>` : ''}
        <span>🗓 Posted ${formatDate(s.created_at)}</span>
      </div>
      ${s.avg_rating ? `
        <div style="margin-top:14px">
          <span class="detail-rating-badge">★ ${s.avg_rating} / 5 &nbsp;·&nbsp; ${s.review_count} review${s.review_count == 1 ? '' : 's'}</span>
        </div>` : ''}
    </div>

    <div class="detail-grid">
      <!-- Physical -->
      <div class="data-panel">
        <h3>🪨 Physical Properties</h3>
        <div class="data-rows">
          ${row('Texture', s.texture)}
          ${row('Color', s.color)}
          ${row('Moisture', s.moisture)}
          ${row('Drainage', s.drainage)}
        </div>
      </div>

      <!-- Chemical -->
      <div class="data-panel">
        <h3>⚗️ Chemical Values</h3>
        ${phHTML}
        <div class="data-rows" style="margin-top:${s.ph ? '12px' : '0'}">
          ${chem.map(([l, v, u]) => row(l, v != null ? `${v} ${u}` : null)).join('')}
        </div>
      </div>
    </div>

    ${s.notes ? `
      <div class="data-panel" style="margin-bottom:28px">
        <h3>📝 Notes</h3>
        <div class="notes-box">${s.notes}</div>
      </div>` : ''}

    <!-- Reviews -->
    <div class="reviews-section">
      <h2>Reviews (${reviews.length})</h2>

      <!-- Add review -->
      <div class="add-review-form">
        <h3>Write a Review</h3>
        <div class="star-select" id="star-row">
          ${[1,2,3,4,5].map(n => `<span class="star" data-val="${n}" onclick="setRating(${n})">★</span>`).join('')}
        </div>
        <div class="review-fields">
          <input type="text" id="rv-name" placeholder="Your name *" required />
          <textarea id="rv-text" rows="3" placeholder="Your review — what did you find? What worked? *"></textarea>
          <input type="text" id="rv-plants" placeholder="🌿 Suitable plants (e.g. Tomatoes, Wheat, Corn)" />
          <input type="text" id="rv-best" placeholder="✅ Best used for (e.g. Vegetable gardening, Rice paddies)" />
          <input type="text" id="rv-avoid" placeholder="❌ Not suitable for (e.g. Acid-loving plants)" />
          <button class="btn-primary" onclick="submitReview()">Post Review →</button>
        </div>
      </div>

      <!-- Review list -->
      <div id="reviews-list">
        ${reviews.length ? reviews.map(r => renderReview(r)).join('') : `<div class="empty-state" style="padding:30px">No reviews yet. Be the first!</div>`}
      </div>
    </div>
  `;
}

function row(label, val) {
  if (!val) return '';
  return `<div class="data-row"><span class="data-label">${label}</span><span class="data-value">${val}</span></div>`;
}

/* ── RATING ── */
function setRating(val) {
  currentRating = val;
  document.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
}

/* ── SUBMIT REVIEW ── */
async function submitReview() {
  const name = $('rv-name').value.trim();
  const text = $('rv-text').value.trim();
  if (!name || !text) { showToast('Name and review text are required.', 'error'); return; }
  if (!currentRating) { showToast('Please select a star rating.', 'error'); return; }
  try {
    const r = await fetch(`${API}/api/samples/${currentSampleId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer_name: name,
        rating: currentRating,
        review_text: text,
        suitable_plants: $('rv-plants').value.trim(),
        best_for: $('rv-best').value.trim(),
        not_suitable_for: $('rv-avoid').value.trim(),
      })
    });
    if (!r.ok) throw new Error('Failed');
    showToast('Review submitted! 🌱', 'success');
    openSample(currentSampleId);
  } catch (e) {
    showToast('Error submitting review.', 'error');
  }
}

/* ── RENDER REVIEW ── */
function renderReview(r) {
  return `
    <div class="review-card" id="review-${r.id}">
      <div class="review-top">
        <div class="reviewer-info">
          <div class="reviewer-avatar">${initials(r.reviewer_name)}</div>
          <div>
            <div class="reviewer-name">${r.reviewer_name}</div>
            <div class="review-date">${formatDate(r.created_at)}</div>
          </div>
        </div>
        <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      </div>
      <p class="review-text">${r.review_text}</p>
      ${renderReviewTags(r)}

      <!-- Comments -->
      <div class="comments-section">
        <button class="comments-toggle" onclick="toggleComments(${r.id})">
          💬 ${r.comment_count > 0 ? `${r.comment_count} comment${r.comment_count == 1 ? '' : 's'}` : 'Add a comment'}
        </button>
        <div id="comments-${r.id}" style="display:none">
          <div id="comments-list-${r.id}" class="comments-list"></div>
          <div class="add-comment-form">
            <input type="text" id="cm-name-${r.id}" placeholder="Your name *" />
            <textarea id="cm-text-${r.id}" rows="2" placeholder="Write a comment…"></textarea>
            <div class="comment-submit-row">
              <button class="btn-sm" onclick="submitComment(${r.id})">Post Comment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderReviewTags(r) {
  const tags = [];
  if (r.suitable_plants) tags.push(`<span class="review-tag tag-plants">🌿 ${r.suitable_plants}</span>`);
  if (r.best_for)        tags.push(`<span class="review-tag tag-best">✅ ${r.best_for}</span>`);
  if (r.not_suitable_for) tags.push(`<span class="review-tag tag-avoid">❌ ${r.not_suitable_for}</span>`);
  return tags.length ? `<div class="review-tags">${tags.join('')}</div>` : '';
}

/* ── COMMENTS ── */
async function toggleComments(reviewId) {
  const box = $(`comments-${reviewId}`);
  if (box.style.display === 'none') {
    box.style.display = 'block';
    await loadComments(reviewId);
  } else {
    box.style.display = 'none';
  }
}

async function loadComments(reviewId) {
  const list = $(`comments-list-${reviewId}`);
  list.innerHTML = `<div class="spinner" style="margin:10px auto;width:24px;height:24px;border-width:2px"></div>`;
  try {
    const r = await fetch(`${API}/api/reviews/${reviewId}/comments`);
    const comments = await r.json();
    list.innerHTML = comments.length
      ? comments.map(c => `
          <div class="comment-item">
            <div class="comment-author">${c.author_name} <span>${formatDate(c.created_at)}</span></div>
            <div class="comment-text">${c.comment_text}</div>
          </div>
        `).join('')
      : '<p style="font-size:13px;color:#8a7968;margin:4px 0 8px">No comments yet.</p>';
  } catch {
    list.innerHTML = '<p style="font-size:13px;color:red">Error loading comments.</p>';
  }
}

async function submitComment(reviewId) {
  const name = $(`cm-name-${reviewId}`).value.trim();
  const text = $(`cm-text-${reviewId}`).value.trim();
  if (!name || !text) { showToast('Name and comment are required.', 'error'); return; }
  try {
    const r = await fetch(`${API}/api/reviews/${reviewId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name: name, comment_text: text, sample_id: currentSampleId })
    });
    if (!r.ok) throw new Error('Failed');
    $(`cm-name-${reviewId}`).value = '';
    $(`cm-text-${reviewId}`).value = '';
    showToast('Comment posted!', 'success');
    await loadComments(reviewId);
  } catch {
    showToast('Error posting comment.', 'error');
  }
}

/* ── SUBMIT SAMPLE ── */
$('sample-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(fd.entries());
  // Remove empty strings
  Object.keys(body).forEach(k => { if (body[k] === '') delete body[k]; });
  try {
    const r = await fetch(`${API}/api/samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('Failed');
    const sample = await r.json();
    showToast('Sample submitted! 🌱', 'success');
    e.target.reset();
    openSample(sample.id);
  } catch (err) {
    showToast('Error submitting sample.', 'error');
  }
});

/* ── SEARCH ── */
async function doSearch() {
  const q = $('search-input').value.trim();
  if (!q) { loadSamples(); $('samples-heading').textContent = 'Latest Samples'; return; }
  showPage('home');
  $('samples-heading').textContent = `Results for "${q}"`;
  $('samples-grid').innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Searching…</p></div>`;
  try {
    const r = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
    const data = await r.json();
    loadSamples(data);
  } catch {
    showToast('Search failed.', 'error');
  }
}

$('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

/* ── INIT ── */
loadSamples();
