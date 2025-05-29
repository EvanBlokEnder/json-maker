```javascript
const { create } = require('express-handlebars');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

// In-memory storage (temporary, resets on redeploy)
let files = [];

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit to 100 requests per window
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

// Bot detection middleware
const botDetection = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const botUserAgents = ['bot', 'spider', 'crawl', 'slurp', 'scrape'];
  if (botUserAgents.some(bot => userAgent.toLowerCase().includes(bot))) {
    return res.status(403).json({ error: 'Bot detected. Access denied.' });
  }
  next();
};

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.json')) {
      return cb(new Error('Only JSON files are allowed'));
    }
    cb(null, true);
  }
});

module.exports = async (req, res) => {
  const handler = async (req, res) => {
    try {
      // Apply bot detection and rate limiting
      await new Promise((resolve, reject) => {
        botDetection(req, res, () => resolve());
      });
      await new Promise((resolve, reject) => {
        limiter(req, res, () => resolve());
      });

      // Handle file upload
      await new Promise((resolve, reject) => {
        upload.single('file')(req, res, (err) => {
          if (err) {
            return res.status(400).json({ error: err.message });
          }
          resolve();
        });
      });

      const { fileName, authorName } = req.body;
      if (!req.file || !fileName || !authorName) {
        return res.status(400).json({ error: 'Missing file, fileName, or authorName' });
      }

      // Validate JSON
      const content = req.file.buffer.toString('utf8');
      try {
        JSON.parse(content);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON file' });
      }

      // Sanitize fileName and authorName
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedAuthorName = authorName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileNameWithAuthor = `${sanitizedFileName}_${sanitizedAuthorName}.json`;

      // Store file in memory
      files.push({ name: fileNameWithAuthor, content });
      res.status(200).json({ message: 'File uploaded successfully' });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  };

  // Wrap in Express-like middleware handling
  await handler(req, res);
};
```

<xaiArtifact artifact_id="121231be-7d4d-4c6b-9509-c0b5af3d126f" artifact_version_id="389f1a5e-b819-4f31-8d61-d01abffb7586" title="api/files.js" contentType="text/javascript">
```javascript
const rateLimit = require('express-rate-limit');

// In-memory storage (from upload.js)
externals let files = [];

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

const botDetection = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const botUserAgents = ['bot', 'spider', 'crawl', 'slurp', 'scrape'];
  if (botUserAgents.some(bot => userAgent.toLowerCase().includes(bot))) {
    return res.status(403).json({ error: 'Bot detected. Access denied.' });
  }
  next();
};

module.exports = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      botDetection(req, res, () => resolve());
    });
    await new Promise((resolve, reject) => {
      limiter(req, res, () => resolve());
    });
    res.json(files.map(file => file.name));
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
};
```

<xaiArtifact artifact_id="56a3f2c4-321c-4256-863f-28ea11c98a92" artifact_version_id="2f9af6bb-0d1f-47c9-a1bd-4205c937a041" title="api/download/[filename].js" contentType="text/javascript">
```javascript
const rateLimit = require('express-rate-limit');

// In-memory storage (from upload.js)
externals let files = [];

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

const botDetection = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const botUserAgents = ['bot', 'spider', 'crawl', 'slurp', 'scrape'];
  if (botUserAgents.some(bot => userAgent.toLowerCase().includes(bot))) {
    return res.status(403).json({ error: 'Bot detected. Access denied.' });
  }
  next();
};

module.exports = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      botDetection(req, res, () => resolve());
    });
    await new Promise((resolve, reject) => {
      limiter(req, res, () => resolve());
    });

    const filename = req.params.filename;
    const file = files.find(f => f.name === filename);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(file.content);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
};
```

#### 3. Package.json
Updated to include Vercel-compatible dependencies.

<xaiArtifact artifact_id="c168bb45-f932-4a45-8d49-1898d2373892" artifact_version_id="05e6ba4b-6c5e-42dd-bc1f-631c53c5af89" title="package.json" contentType="application/json">
```json
{
  "name": "444-maker",
  "version": "1.0.0",
  "description": "444 Maker JSON editor with file sharing",
  "main": "index.js",
  "scripts": {
    "start": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "express": "^4.17.1",
    "multer": "^1.4.5-lts.1",
    "express-rate-limit": "^6.7.0",
    "express-handlebars": "^6.0.6"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

#### 4. Vercel Configuration (`vercel.json`)
This configures Vercel to serve static files from `public` and route API requests to the `api` directory.

<xaiArtifact artifact_id="ef93c9c8-d4a8-4c6d-8b6f-43b494df8e3d" artifact_version_id="806a7ea9-2e1b-46fa-bff6-9c08e64ec07c" title="vercel.json" contentType="application/json">
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/",
      "dest": "/public/index.html"
    }
  ]
}
```

#### 5. Style.css (Placeholder)
Retained as a placeholder for any additional styling.

<xaiArtifact artifact_id="d09e97fd-97e8-48ee-aebb-fe3c03b3edcb" artifact_version_id="59922513-c876-45af-828d-d1595c65fbb2" title="style.css" contentType="text/css">
```css
/* Add custom styles here if needed */
```

### Deployment Steps on Vercel
1. **Prepare the Project**:
   - Create the directory structure as shown above.
   - Place `index.html`, `style.css`, `favicon.ico`, and `coin.png` in the `public` directory.
   - Create the `api` directory with `upload.js`, `files.js`, and `download/[filename].js`.
   - Add `package.json` and `vercel.json` to the root directory.

2. **Install Vercel CLI**:
   - Install the Vercel CLI globally: `npm install -g vercel`.
   - Log in to Vercel: `vercel login`.

3. **Test Locally**:
   - Run `vercel dev` to test the app locally. This simulates Vercel's serverless environment.
   - Access the app at `http://localhost:3000`.
   - Test the JSON editor and file upload/download functionality.

4. **Deploy to Vercel**:
   - Run `vercel` to deploy the project to a staging URL.
   - After verifying, run `vercel --prod` to deploy to production.
   - Vercel will provide a URL (e.g., `https://your-project.vercel.app`).

5. **Environment Variables** (Optional):
   - If you integrate external storage (e.g., AWS S3), add credentials as environment variables in Vercel’s dashboard.

### File Storage Caveat
- **In-Memory Storage**: The current `upload.js` uses an in-memory array (`files`), which resets on redeployment or serverless function scaling. This is fine for testing but not for production.
- **Production Storage Options**:
  - **Vercel Blob Store**: Use Vercel’s Blob Store for file storage. Modify `upload.js`, `files.js`, and `download/[filename].js` to interact with Vercel Blob (requires `@vercel/blob` package).
  - **AWS S3**: Integrate S3 for persistent storage. Install `aws-sdk`, configure credentials, and update the API routes to store/retrieve files from S3.
  - **Example for Vercel Blob** (add to `upload.js`):
    ```javascript
    const { put, list, get } = require('@vercel/blob');

    // In upload.js
    await put(fileNameWithAuthor, req.file.buffer, { access: 'public' });

    // In files.js
    const { blobs } = await list();
    res.json(blobs.map(blob => blob.pathname));

    // In download/[filename].js
    const blob = await get(filename);
    if (!blob) return res.status(404).json({ error: 'File not found' });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(blob);
    ```
    - Add `"@vercel/blob": "^0.9.0"` to `package.json` dependencies.
    - Configure Blob Store in Vercel’s dashboard.

### Notes
- **Bot Detection**: The API routes include rate limiting (100 requests per 15 minutes per IP) and user-agent filtering. For stronger protection, consider adding reCAPTCHA for uploads.
- **Assets**: Ensure `favicon.ico` and `coin.png` exist in `public`. If missing, remove their references in `index.html`:
  - Remove `<link rel="icon" href="favicon.ico" type="image/x-icon">`.
  - Remove `<img style="width:32px" src="coin.png">` (already removed since it was tied to tokens).
- **Backend Routes**: The frontend uses `/api/upload`, `/api/files`, and `/api/download/[filename]` instead of `/upload`, `/files`, and `/files/[filename]`. The `vercel.json` routes ensure compatibility.
- **Testing**: After deploying, test file uploads (ensure they save as `[name]_[author].json`) and downloads from the file list.
- **Production Storage**: For persistent file storage, integrate Vercel Blob or AWS S3. In-memory storage is only for testing.

### Troubleshooting
- **File Upload Fails**: Check the Vercel logs (`vercel logs <your-app>.vercel.app`) for errors. Ensure `multer` is handling files correctly.
- **File List Empty**: If using in-memory storage, redeployments reset the list. Switch to Vercel Blob or S3.
- **CORS Issues**: Vercel handles CORS automatically for API routes. Ensure frontend fetch calls use the correct Vercel URL.
- **Bot Detection**: If legitimate users are blocked, adjust `botUserAgents` in the API routes or disable user-agent filtering temporarily.

Let me know if you need help with Vercel Blob integration, AWS S3 setup, or debugging deployment issues!