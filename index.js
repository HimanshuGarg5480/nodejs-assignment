import express from 'express';
import { openDb, setupDb } from './db/index.js';

const app = express();
const port = 3000;

app.use(express.json());

// Set up the database
setupDb();

// List cats with pagination
app.get('/cats', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const db = await openDb();
  const cats = await db.all('SELECT * FROM cats LIMIT ? OFFSET ?', [limit, offset]);
  const total = await db.get('SELECT COUNT(*) as count FROM cats');

  res.json({
    data: cats,
    meta: {
      total: total.count,
      page,
      limit
    }
  });
});

// Get cat by ID
app.get('/cats/:id', async (req, res) => {
  const db = await openDb();
  const cat = await db.get('SELECT * FROM cats WHERE id = ?', req.params.id);
  if (cat) {
    res.json(cat);
  } else {
    res.status(404).json({ error: 'Cat not found' });
  }
});

// Search cats by age range
app.get('/cats/search', async (req, res) => {
  const { age_lte, age_gte } = req.query;
  const db = await openDb();
  const cats = await db.all(
    'SELECT * FROM cats WHERE age >= ? AND age <= ?',
    [age_gte || 0, age_lte || 100]
  );
  res.json(cats);
});

// Create a new cat
app.post('/cats', async (req, res) => {
  const { name, age, breed } = req.body;
  if (!name || !age || !breed) {
    return res.status(400).json({ error: 'Name, age, and breed are required' });
  }

  const db = await openDb();
  const result = await db.run(
    'INSERT INTO cats (name, age, breed) VALUES (?, ?, ?)',
    [name, age, breed]
  );
  res.status(201).json({ id: result.lastID, name, age, breed });
});

// Update a cat
app.put('/cats/:id', async (req, res) => {
  const { name, age, breed } = req.body;
  if (!name && !age && !breed) {
    return res.status(400).json({ error: 'At least one field (name, age, or breed) is required' });
  }

  const db = await openDb();
  const cat = await db.get('SELECT * FROM cats WHERE id = ?', req.params.id);
  if (!cat) {
    return res.status(404).json({ error: 'Cat not found' });
  }

  const updates = [];
  const values = [];
  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (age) {
    updates.push('age = ?');
    values.push(age);
  }
  if (breed) {
    updates.push('breed = ?');
    values.push(breed);
  }
  values.push(req.params.id);

  await db.run(
    `UPDATE cats SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  res.json({ id: req.params.id, ...cat, ...req.body });
});

// Delete a cat
app.delete('/cats/:id', async (req, res) => {
  const db = await openDb();
  const result = await db.run('DELETE FROM cats WHERE id = ?', req.params.id);
  if (result.changes > 0) {
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Cat not found' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
