const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  db,
  dbPath,
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
const isServerlessEnv = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isServerlessEnv ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
} catch (e) {
  console.warn('Could not initialize uploads directory:', e.message);
}

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

// Admin / Inspection routes to view and download SQLite database contents
app.get('/api/admin/db-download', (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).send('Arquivo SQLite curriculo.db não encontrado no servidor.');
    }
    res.download(dbPath, 'curriculo.db');
  } catch (err) {
    res.status(500).json({ error: 'Erro ao baixar arquivo do banco', message: err.message });
  }
});

app.get('/api/admin/db-inspect', (req, res) => {
  try {
    const users = db.prepare('SELECT id, uuid, name, email, created_at, updated_at FROM users').all();
    const resumes = db.prepare('SELECT id, user_id, user_uuid, slug, title, active_language, photo_url, created_at, updated_at FROM resumes').all();
    const translations = db.prepare('SELECT id, resume_id, language, length(personal_info) as personal_info_size, length(summary) as summary_size, length(experiences) as experiences_size, length(skills) as skills_size FROM resume_translations').all();
    const photos = db.prepare('SELECT id, user_uuid, filename, mime_type, length(data_base64) as data_size_bytes, created_at FROM photos').all();

    const dbStats = {
      dbPath,
      fileSizeBytes: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
      timestamp: new Date().toISOString(),
      counts: {
        users: users.length,
        resumes: resumes.length,
        translations: translations.length,
        photos: photos.length
      }
    };

    if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
      return res.json({
        stats: dbStats,
        users,
        resumes,
        translations,
        photos
      });
    }

    // Render HTML table view
    const renderTable = (title, columns, rows) => {
      if (!rows || rows.length === 0) {
        return `<div class="card"><h2>${title} (0)</h2><p class="empty">Nenhum registro encontrado nesta tabela.</p></div>`;
      }
      const headers = columns.map(c => `<th>${c}</th>`).join('');
      const bodyRows = rows.map(r => `<tr>${columns.map(c => `<td>${r[c] !== null && r[c] !== undefined ? String(r[c]) : '<span class="null">null</span>'}</td>`).join('')}</tr>`).join('');
      return `
        <div class="card">
          <h2>${title} (${rows.length})</h2>
          <div class="table-wrapper">
            <table>
              <thead><tr>${headers}</tr></thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>
        </div>
      `;
    };

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SQLite Inspector - Vercel Database</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --accent: #22c55e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 2rem 1rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; }
    h1 { font-size: 1.75rem; font-weight: 700; color: #fff; }
    .badge { background: #0369a1; color: #bae6fd; font-size: 0.8rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 9999px; margin-left: 0.5rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: #0f172a; text-decoration: none; font-weight: 600; font-size: 0.875rem; padding: 0.6rem 1.2rem; border-radius: 0.5rem; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; }
    .stat-card .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .stat-card .val { font-size: 1.5rem; font-weight: 700; color: #fff; margin-top: 0.25rem; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1.5rem; overflow: hidden; }
    .card h2 { font-size: 1.15rem; font-weight: 600; color: #e2e8f0; margin-bottom: 1rem; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; text-align: left; }
    th { background: #0f172a; color: var(--text-muted); font-weight: 600; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: #e2e8f0; word-break: break-all; }
    tr:last-child td { border-bottom: none; }
    .null { color: #64748b; font-style: italic; }
    .empty { color: var(--text-muted); font-style: italic; padding: 0.5rem 0; }
    .footer { text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Visualizador do SQLite <span class="badge">PRODUÇÃO</span></h1>
        <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;">Arquivo: <code>${dbPath}</code> (${(dbStats.fileSizeBytes / 1024).toFixed(1)} KB)</p>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <a href="/api/admin/db-inspect?format=json" class="btn" style="background: #334155; color: #f8fafc;" target="_blank">Ver JSON</a>
        <a href="/api/admin/db-download" class="btn">📥 Baixar curriculo.db</a>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total de Usuários</div>
        <div class="val">${dbStats.counts.users}</div>
      </div>
      <div class="stat-card">
        <div class="label">Currículos Criados</div>
        <div class="val">${dbStats.counts.resumes}</div>
      </div>
      <div class="stat-card">
        <div class="label">Traduções Gravadas</div>
        <div class="val">${dbStats.counts.translations}</div>
      </div>
      <div class="stat-card">
        <div class="label">Fotos de Perfil</div>
        <div class="val">${dbStats.counts.photos}</div>
      </div>
    </div>

    ${renderTable('Tabela: users (Usuários Cadastrados)', ['id', 'uuid', 'name', 'email', 'created_at'], users)}
    ${renderTable('Tabela: resumes (Currículos)', ['id', 'user_id', 'user_uuid', 'title', 'active_language', 'slug', 'created_at', 'updated_at'], resumes)}
    ${renderTable('Tabela: resume_translations (Traduções PT/EN)', ['id', 'resume_id', 'language', 'personal_info_size', 'summary_size', 'experiences_size', 'skills_size'], translations)}
    ${renderTable('Tabela: photos (Fotos no Banco)', ['id', 'user_uuid', 'filename', 'mime_type', 'data_size_bytes', 'created_at'], photos)}

    <div class="footer">
      Currículo Web App • Instância SQLite • ${new Date().toLocaleString('pt-BR')}
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Erro ao inspecionar banco SQLite:', err);
    res.status(500).json({ error: 'Erro ao inspecionar SQLite', message: err.message, stack: err.stack });
  }
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
