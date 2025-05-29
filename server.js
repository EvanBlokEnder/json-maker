const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 3000;

// Rate limiting to prevent bot spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Basic bot detection via user-agent
const botUserAgents = ['bot', 'spider', 'crawl', 'slurp', 'scrape'];
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  if (botUserAgents.some(bot => userAgent.toLowerCase().includes(bot))) {
    return res.status(403).send('Bot detected. Access denied.');
  }
  next();
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: './files',
  filename: (req, file, cb) => {
    const fileName = req.body.fileName.replace(/[^a-zA-Z0-9]/g, '_');
    const authorName = req.body.authorName.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${fileName}_${authorName}.json`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.json')) {
      return cb(new Error('Only JSON files are allowed'));
    }
    cb(null, true);
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(path.join(__dirname, 'files')));

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const content = await fs.readFile(req.file.path, 'utf8');
    JSON.parse(content); // Validate JSON
    res.status(200).send('File uploaded successfully');
  } catch (e) {
    await fs.unlink(req.file.path).catch(() => {});
    res.status(400).send('Invalid JSON file');
  }
});

// List files endpoint
app.get('/files', async (req, res) => {
  try {
    const files = await fs.readdir(path.join(__dirname, 'files'));
    res.json(files.filter(file => file.endsWith('.json')));
  } catch (e) {
    res.status(500).send('Error listing files');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
