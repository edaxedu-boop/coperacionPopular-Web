import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';
import fsPromises from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;
const db = new Database('database.db');
const SECRET_KEY = 'alianza-cooperacion-verdad-honradez-2025';

// Middlewares
app.use(cors()); // Allow all origins for easier debugging
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug Middleware to see incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Ensure directories exist
const uploadDirs = ['uploads', 'uploads/images', 'uploads/documents'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Database Init
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    desc TEXT,
    content TEXT,
    tag TEXT,
    date TEXT,
    img TEXT
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT,
    desc TEXT,
    version TEXT,
    pdfUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    desc TEXT,
    img TEXT
  );
`);

// Create initial admin user if not exists
const adminCount = db.prepare('SELECT count(*) as count FROM users').get();
if (adminCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
}

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPDF = file.mimetype === 'application/pdf';
    cb(null, isPDF ? 'uploads/documents' : 'uploads/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Middlewares
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// Auth Routes
app.post('/api/login', (req, res) => {
  const { user, password } = req.body;
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get(user);

  if (admin && bcrypt.compareSync(password, admin.password)) {
    const token = jwt.sign({ id: admin.id }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token, success: true });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

app.post('/api/change-password', authenticate, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.userId);
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// File Upload Route with Compression
app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const isPDF = req.file.mimetype === 'application/pdf';
  const originalPath = req.file.path;
  let finalFilename = req.file.filename;
  let finalPath = originalPath;

  try {
    if (!isPDF) {
      // Compress Image with Sharp (and convert to WebP for maximum quality/size ratio)
      const compressedFilename = req.file.filename.split('.')[0] + '.webp';
      const compressedPath = path.join('uploads/images', compressedFilename);

      await sharp(originalPath)
        .resize(1920, null, { withoutEnlargement: true }) // Limit width to 1920px (Full HD)
        .webp({ quality: 85 }) // High quality WebP compression
        .toFile(compressedPath);

      // Remove original non-compressed file
      await fsPromises.unlink(originalPath);
      
      finalFilename = compressedFilename;
      finalPath = compressedPath;
    }

    const url = `/uploads/${isPDF ? 'documents' : 'images'}/${finalFilename}`;
    res.json({ url });
  } catch (err) {
    console.error('Upload processing error:', err);
    res.status(500).json({ error: 'Fallo al procesar archivo' });
  }
});

// News API
app.get('/api/news', (req, res) => {
  const news = db.prepare('SELECT * FROM news ORDER BY id DESC').all();
  res.json(news);
});

app.post('/api/news', authenticate, (req, res) => {
  const { title, desc, content, tag, date, img } = req.body;
  const result = db.prepare('INSERT INTO news (title, desc, content, tag, date, img) VALUES (?, ?, ?, ?, ?, ?)')
    .run(title, desc, content, tag, date, img);
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/news/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.put('/api/news/:id', authenticate, (req, res) => {
  try {
    const { title, desc, content, tag, date, img } = req.body;
    console.log('Updating news id:', req.params.id, 'with data:', { title, tag });
    const result = db.prepare('UPDATE news SET title = ?, desc = ?, content = ?, tag = ?, date = ?, img = ? WHERE id = ?')
      .run(title, desc, content, tag, date, img, req.params.id);
    
    if (result.changes === 0) {
      console.warn('No news found with id:', req.params.id);
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update news error:', err);
    res.status(500).json({ error: 'Error interno al actualizar la noticia' });
  }
});

// Documents API
app.get('/api/documents', (req, res) => {
  const docs = db.prepare('SELECT * FROM documents').all();
  res.json(docs);
});

app.post('/api/documents', authenticate, (req, res) => {
  const { id, title, desc, version, pdfUrl } = req.body;
  db.prepare('INSERT INTO documents (id, title, desc, version, pdfUrl) VALUES (?, ?, ?, ?, ?)')
    .run(id, title, desc, version, pdfUrl);
  res.json({ success: true });
});

app.delete('/api/documents/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.put('/api/documents/:id', authenticate, (req, res) => {
  const { title, desc, version, pdfUrl } = req.body;
  db.prepare('UPDATE documents SET title = ?, desc = ?, version = ?, pdfUrl = ? WHERE id = ?')
    .run(title, desc, version, pdfUrl, req.params.id);
  res.json({ success: true });
});

// Gallery API
app.get('/api/gallery', (req, res) => {
  const gallery = db.prepare('SELECT * FROM gallery').all();
  res.json(gallery);
});

app.post('/api/gallery', authenticate, (req, res) => {
  const { title, desc, img } = req.body;
  db.prepare('INSERT INTO gallery (title, desc, img) VALUES (?, ?, ?)')
    .run(title, desc, img);
  res.json({ success: true });
});

app.delete('/api/gallery/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.put('/api/gallery/:id', authenticate, (req, res) => {
  const { title, desc, img } = req.body;
  db.prepare('UPDATE gallery SET title = ?, desc = ?, img = ? WHERE id = ?')
    .run(title, desc, img, req.params.id);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
