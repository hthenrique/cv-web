const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getResumeData, updateResumeData, resetToDefault, savePhotoToDb, getPhotoFromDb } = require('./db');
const { translateResumeData } = require('./translator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory (fallback)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Memory storage for Multer: photos are saved directly into SQLite database
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Somente arquivos de imagem são permitidos!'), false);
    }
  }
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get current resume
app.get('/api/resume', (req, res) => {
  try {
    const resume = getResumeData('default');
    if (!resume) {
      return res.status(404).json({ error: 'Currículo não encontrado' });
    }
    res.json(resume);
  } catch (err) {
    console.error('Erro ao buscar currículo:', err);
    res.status(500).json({ error: 'Erro ao buscar currículo no SQLite' });
  }
});

// Update resume
app.put('/api/resume', (req, res) => {
  try {
    const data = req.body;
    const updated = updateResumeData('default', data);
    res.json({ success: true, resume: updated });
  } catch (err) {
    console.error('Erro ao atualizar currículo:', err);
    res.status(500).json({ error: 'Erro ao atualizar currículo no SQLite' });
  }
});

// Translate resume content
app.post('/api/translate-resume', async (req, res) => {
  try {
    const { sourceData, from = 'pt', to = 'en' } = req.body;
    if (!sourceData) {
      return res.status(400).json({ error: 'Dados do currículo não fornecidos' });
    }
    const translatedData = await translateResumeData(sourceData, from, to);
    res.json({ success: true, translatedData });
  } catch (err) {
    console.error('Erro na tradução do currículo:', err);
    res.status(500).json({ error: 'Falha ao traduzir currículo', fallbackData: req.body?.sourceData });
  }
});

// Upload profile photo directly to SQLite database
app.post('/api/upload-photo', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const mimeType = req.file.mimetype || 'image/png';
    const dataUrl = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;

    // Store in SQLite database
    const photoId = savePhotoToDb(req.file.originalname || 'avatar.png', mimeType, dataUrl);

    res.json({
      success: true,
      photoUrl: dataUrl,
      photoId
    });
  } catch (err) {
    console.error('Erro ao salvar foto no SQLite:', err);
    res.status(500).json({ error: 'Falha ao salvar foto no banco de dados SQLite' });
  }
});

// Retrieve photo from SQLite database
app.get('/api/photo/:id', (req, res) => {
  try {
    const photo = getPhotoFromDb(req.params.id);
    if (!photo) {
      return res.status(404).send('Foto não encontrada no banco de dados');
    }
    const base64Data = photo.data_base64.replace(/^data:image\/\w+;base64,/, '');
    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', photo.mime_type || 'image/png');
    res.send(imgBuffer);
  } catch (err) {
    console.error('Erro ao buscar foto do SQLite:', err);
    res.status(500).send('Erro ao recuperar foto do banco de dados');
  }
});

// Reset to default
app.post('/api/reset', (req, res) => {
  try {
    const defaultData = resetToDefault('default');
    res.json({ success: true, resume: defaultData });
  } catch (err) {
    console.error('Erro ao restaurar padrão:', err);
    res.status(500).json({ error: 'Falha ao restaurar dados padrão' });
  }
});

// Serve frontend build if exists
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});


