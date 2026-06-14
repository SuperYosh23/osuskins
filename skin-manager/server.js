const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3000;
const JSON_FILE = path.join(__dirname, '../docs/items.json');
const DOCS_DIR = path.join(__dirname, '../docs');
const ROOT_DIR = path.join(__dirname, '..');

// Configure multer for file uploads to docs
const docsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, DOCS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// Configure multer for file uploads to root
const rootStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ROOT_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const uploadToDocs = multer({ storage: docsStorage });
const uploadToRoot = multer({ storage: rootStorage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Read JSON file
app.get('/api/skins', async (req, res) => {
  try {
    const data = await fs.readFile(JSON_FILE, 'utf8');
    const parsed = JSON.parse(data);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read skins data' });
  }
});

// Write JSON file
app.post('/api/skins', async (req, res) => {
  try {
    // Preserve subtitle and socials from existing file
    const existingData = JSON.parse(await fs.readFile(JSON_FILE, 'utf8'));
    const newData = {
      subtitle: existingData.subtitle || '',
      socials: existingData.socials || [],
      items: req.body.items || []
    };
    await fs.writeFile(JSON_FILE, JSON.stringify(newData, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save skins data' });
  }
});

// Upload image file to docs
app.post('/api/upload/image', uploadToDocs.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filename: req.file.filename });
});

// Upload skin file (.osk) to root
app.post('/api/upload/skin', uploadToRoot.single('skin'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filename: req.file.filename });
});

// Upload multiple images to docs
app.post('/api/upload/images', uploadToDocs.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  res.json({ filenames: req.files.map(f => f.filename) });
});

app.listen(PORT, () => {
  console.log(`Skin manager running at http://localhost:${PORT}`);
});
