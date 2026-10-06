const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  createUser,
  authenticateUser,
  getUserByUuid,
  changeUserPassword,
  getResumeByUserUuid,
  updateResumeByUserUuid,
  resetResumeByUserUuid,
  savePhotoToDb,
  getPhotoFromDb
} = require('./db');
const { translateResumeData } = require('./translator');

// Load .env if present (server/.env or root .env)
const envPaths = [path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    try {
      const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[k]) process.env[k] = v;
        }
      }
    } catch (_) {}
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// CORS configuration supporting frontend domain from environment variable
const allowedOrigins = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. mobile apps, curl, same-origin)
    if (!origin || allowedOrigins === '*') return callback(null, true);
    const origins = allowedOrigins.split(',').map(o => o.trim());
    if (origins.includes(origin)) return callback(null, true);
    // Permissive fallback so user is never blocked by unexpected subdomains
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-UUID']
}));
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

// Middleware to authenticate user by user_uuid stored in browser header
function requireAuth(req, res, next) {
  const userUuid = req.headers['x-user-uuid'] || req.query.userUuid;
  if (!userUuid) {
    return res.status(401).json({ error: 'Não autorizado. Faça login para acessar o currículo.' });
  }

  const user = getUserByUuid(userUuid);
  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida ou usuário não encontrado.' });
  }

  req.user = user;
  next();
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------- AUTH ROUTES ----------------

// Register a new user with their isolated resume
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = createUser({ name, email, password });
    res.status(201).json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Erro no cadastro:', err.message);
    res.status(400).json({ error: err.message || 'Erro ao registrar usuário' });
  }
});

// Login user and return user info with UUID
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }
    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Falha interna durante autenticação' });
  }
});

// Validate session and get current user data by UUID
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Change password for current authenticated user
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    changeUserPassword(req.user.uuid, currentPassword, newPassword);
    res.json({
      success: true,
      message: 'Senha alterada com sucesso!'
    });
  } catch (err) {
    console.error('Erro ao alterar senha:', err.message);
    res.status(400).json({ error: err.message || 'Falha ao alterar senha' });
  }
});

// ---------------- RESUME ROUTES (ISOLATED BY USER) ----------------

// Get resume for current authenticated user
app.get('/api/resume', requireAuth, (req, res) => {
  try {
    const resume = getResumeByUserUuid(req.user.uuid);
    if (!resume) {
      return res.status(404).json({ error: 'Currículo não encontrado para este usuário' });
    }
    res.json(resume);
  } catch (err) {
    console.error('Erro ao buscar currículo:', err);
    res.status(500).json({ error: 'Erro ao buscar currículo no SQLite' });
  }
});

// Update resume for current authenticated user
app.put('/api/resume', requireAuth, (req, res) => {
  try {
    const data = req.body;
    const updated = updateResumeByUserUuid(req.user.uuid, data);
    res.json({ success: true, resume: updated });
  } catch (err) {
    console.error('Erro ao atualizar currículo:', err);
    res.status(500).json({ error: 'Erro ao atualizar currículo no SQLite' });
  }
});

// Reset resume to default template for current authenticated user
app.post('/api/reset', requireAuth, (req, res) => {
  try {
    const resetData = resetResumeByUserUuid(req.user.uuid);
    res.json({ success: true, resume: resetData });
  } catch (err) {
    console.error('Erro ao restaurar padrão:', err);
    res.status(500).json({ error: 'Falha ao restaurar dados padrão' });
  }
});

// Translate resume content
app.post('/api/translate-resume', requireAuth, async (req, res) => {
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

// Upload profile photo directly to SQLite database for current user
app.post('/api/upload-photo', requireAuth, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const mimeType = req.file.mimetype || 'image/png';
    const dataUrl = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;

    // Store in SQLite database with user reference
    const photoId = savePhotoToDb(req.file.originalname || 'avatar.png', mimeType, dataUrl, req.user.uuid);

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

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, HOST, () => {
    console.log(`Backend server running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
