const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

// Detect serverless environment (Vercel / AWS Lambda) where only tmp is writable
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dbDir = isServerless ? (process.platform === 'win32' ? os.tmpdir() : '/tmp') : __dirname;
if (isServerless && !fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (_) {}
}
const dbPath = path.join(dbDir, 'curriculo.db');

// If running in serverless and curriculo.db does not exist, copy existing db if available
if (isServerless && !fs.existsSync(dbPath)) {
  const seedFile = path.join(__dirname, 'curriculo.db');
  if (fs.existsSync(seedFile)) {
    try {
      fs.copyFileSync(seedFile, dbPath);
    } catch (_) {}
  }
}

const db = new Database(dbPath);

// Enable WAL mode only locally (WAL mode requires -shm and -wal locks that can fail in serverless)
if (!isServerless) {
  try {
    db.pragma('journal_mode = WAL');
  } catch (_) {}
} else {
  try {
    db.pragma('journal_mode = DELETE');
  } catch (_) {}
}

// Initialize base tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_uuid TEXT,
    slug TEXT UNIQUE DEFAULT 'default',
    title TEXT DEFAULT 'Meu Currículo',
    active_language TEXT DEFAULT 'pt',
    photo_url TEXT DEFAULT NULL,
    theme_config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resume_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    language TEXT NOT NULL,
    personal_info TEXT,
    summary TEXT,
    experiences TEXT,
    education TEXT,
    skills TEXT,
    languages TEXT,
    custom_sections TEXT,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    UNIQUE(resume_id, language)
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT,
    filename TEXT,
    mime_type TEXT,
    data_base64 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Run migrations on existing SQLite database if columns are missing
try {
  const resumeCols = db.prepare('PRAGMA table_info(resumes)').all().map((c) => c.name);
  if (!resumeCols.includes('user_id')) {
    db.exec('ALTER TABLE resumes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;');
  }
  if (!resumeCols.includes('user_uuid')) {
    db.exec('ALTER TABLE resumes ADD COLUMN user_uuid TEXT;');
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_resumes_user_uuid ON resumes(user_uuid);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);');

  const photoCols = db.prepare('PRAGMA table_info(photos)').all().map((c) => c.name);
  if (!photoCols.includes('user_uuid')) {
    db.exec('ALTER TABLE photos ADD COLUMN user_uuid TEXT;');
  }
} catch (e) {
  console.warn('Nota de migração do banco SQLite:', e.message);
}

// Password hashing functions
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch (e) {
    return false;
  }
}

// Default Henrique Teixeira data
// Default themes per language
const defaultThemePT = {
  sidebarColor: '#162a45', // dark navy blue from the image
  sidebarTextColor: '#ffffff',
  accentColor: '#1e88e5', // cyan/sky blue from the image
  nameColor: '#162a45',
  bodyTextColor: '#334155',
  fontFamily: 'Inter',
  showPhoto: true,
  photoShape: 'circle', // 'circle' | 'square' | 'rounded'
  photoBorder: true,
  fontSize: 'normal', // 'compact' | 'normal' | 'spacious'
  density: 'normal'
};

const defaultThemeEN = {
  sidebarColor: '#1e293b', // executive slate
  sidebarTextColor: '#ffffff',
  accentColor: '#0284c7', // bright blue
  nameColor: '#1e293b',
  bodyTextColor: '#334155',
  fontFamily: 'Inter',
  showPhoto: true,
  photoShape: 'circle',
  photoBorder: true,
  fontSize: 'normal',
  density: 'normal'
};

const defaultThemes = {
  pt: defaultThemePT,
  en: defaultThemeEN
};

const defaultTheme = defaultThemePT;

const defaultPortuguese = {
  personalInfo: {
    fullName: 'HENRIQUE TEIXEIRA',
    headline: 'Engenheiro de Software Java',
    phone: '+55 (11) 952883043',
    email: 'ht.henrique@live.com',
    location: 'Rua dos Piauienses, Itapevi – SP, Brasil',
    linkedin: '',
    github: '',
    website: ''
  },
  summary:
    'Engenheiro de Software Java com sólida experiência na arquitetura e desenvolvimento de soluções de missão crítica e alta escala para o setor financeiro. Especialista em Gestão de Identidades e Acessos (IAM/CIAM), com profundo conhecimento no ecossistema Spring, Red Hat SSO e suíte Ping Identity. Fortes habilidades em Cloud (AWS), DevOps (GitOps) e modernização de microserviços, garantindo segurança e resiliência para milhões de usuários em jornadas B2B e B2C.',
  experiences: [
    {
      id: 'exp-1',
      role: 'Analista de Identidade',
      company: 'Netbr by SEK',
      period: '03/2026 - Presente',
      location: 'São Paulo',
      summary:
        'Gestão de Acessos & Automação: Atuação especializada na arquitetura, implementação e sustentação de soluções de Gestão de Identidades e Acessos (IAM/CIAM) para clientes de grande porte corporativo. Foco em garantir a segurança, modernizar a infraestrutura e escalar processos críticos de autenticação.',
      bullets: [
        'Vivo (Telecom): Implementação pioneira do Ping Authorize no Brasil, incluindo sua federação com o Ping Federate. Atuação em IAMOps focada na criação de scripts de automação para deploy e backup da aplicação, além da otimização de rotinas de provisionamento (JML) em alta escala corporativa.',
        'BTG Colômbia (Financeiro): (Personas Naturales e Personas Jurídicas) Implementação de CIAM bancário com Ping AIC (ForgeRock) para a autenticação de pessoas físicas e jurídicas. Desenvolvimento de jornadas de SSO, scripts para geração de criptogramas de biometria e integração segura com AWS Cognito para eliminar a dependência de credenciais fixas.'
      ]
    },
    {
      id: 'exp-2',
      role: 'Engenheiro de Software Java',
      company: 'F1rst – Tecnologia e Inovação (Hub Santander)',
      period: '07/2023 - 03/2026',
      location: 'São Paulo',
      summary:
        'Soluções Bancárias & Alta Escala: Desenvolvimento e sustentação de sistemas críticos de login (Spring Boot e Red Hat SSO / OAuth 2.0). Engenharia de soluções bancárias focadas em segurança para o ecossistema Santander, suportando de forma robusta mais de 60 milhões de clientes e processando milhões de requisições diárias.',
      bullets: [
        'Modernização & Microsserviços: Liderou a extração do core de autenticação legado, transformando-o em uma arquitetura de microsserviços que se tornou a base estrutural de login para o Select Global e para o aplicativo Way.',
        'SSO de Clientes Santander: Implementação e expansão do Single Sign-On (SSO) padrão para clientes da instituição, unificando e centralizando de forma segura a jornada de acesso a canais digitais estratégicos, como Esfera, Auto Compara, GOV.br e diversos outros serviços do banco.',
        'SSO Dedicado B2B: Desenvolvimento e implementação de um ecossistema completo de SSO direcionado a empresas parceiras, replicando o padrão e a robustez de segurança do banco para operações externas de alto impacto (Hyundai e Santander Financiamentos).',
        'Autenticação Dinâmica (PF/PJ): Criação do mecanismo de roteamento e escolha de autenticação para o Portal de Renegociação do Santander, adaptando de forma fluida e segura a jornada de login para os perfis de pessoas físicas e jurídicas.',
        'Reconhecimento: Premiado pela área de Segurança em 2024 por resposta ágil a incidentes e superação das metas anuais (FlexLearning).'
      ]
    },
    {
      id: 'exp-3',
      role: 'Engenheiro de Software Java',
      company: 'Avanade',
      period: '06/2021 - 07/2023',
      location: 'São Paulo',
      summary:
        'Autenticação Backend & Mobile Nativo: Atuação alocada no ecossistema Santander, iniciando no desenvolvimento mobile e assumindo rapidamente a engenharia de backend e autenticação (Spring Boot e Red Hat SSO / OAuth 2.0). A alta aderência técnica e entrega de soluções críticas resultaram na posterior continuidade e internalização do trabalho diretamente pela F1rst.',
      bullets: [
        'Arquitetura & Microsserviços: Construção de microsserviços de segurança e estruturação de jornadas de acesso de alta complexidade.',
        'Autenticação Avançada: Implementação de fluxos inovadores de login passwordless (OTP sem senha) voltados para a plataforma de microcrédito do banco.',
        'Identidade para Não Correntistas: Desenvolvimento da solução de login e gestão de acessos dedicada exclusivamente a clientes não correntistas no portal Santander Financiamentos.',
        'Desenvolvimento Android (Open Finance): Criação de novas funcionalidades nativas (Java/Kotlin) e integração com Firebase Analytics no aplicativo Open Finance PJ.'
      ]
    }
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Gestão da TI - Tecnólogo',
      institution: 'Estácio',
      period: '08/2017 - 12/2019',
      location: 'Carapicuíba'
    }
  ],
  skills: [
    {
      id: 'skill-group-1',
      title: '',
      items: [
        'Java',
        'Kotlin',
        'SQL',
        'NoSQL',
        'Ldap',
        'JUnit',
        'Android',
        'Spring Boot',
        'Spring Security',
        'Apache CAMEL',
        'API Rest',
        'GIT Flow',
        'SOLID',
        'AWS',
        'Azure',
        'Kubernetes',
        'Openshift',
        'OpenID',
        'Elastic Search',
        'Gestão Ágil (SCRUM, Kanban)',
        'OWASP',
        'OAuth 2',
        'JWT',
        'MVP',
        'MVVM',
        'MVC',
        'Keycloak',
        'Retrofit',
        'HTML 5',
        'CSS 3',
        'Jenkins',
        'Dynatrace'
      ]
    }
  ],
  languages: [
    {
      id: 'lang-1',
      name: 'Inglês',
      level: 'Intermediário',
      score: 3
    },
    {
      id: 'lang-2',
      name: 'Espanhol',
      level: 'Intermediário',
      score: 3
    },
    {
      id: 'lang-3',
      name: 'Português',
      level: 'Nativo',
      score: 5
    }
  ],
  customSections: []
};

const defaultEnglish = {
  personalInfo: {
    fullName: 'HENRIQUE TEIXEIRA',
    headline: 'Java Software Engineer',
    phone: '+55 (11) 952883043',
    email: 'ht.henrique@live.com',
    location: 'Rua dos Piauienses, Itapevi – SP, Brazil',
    linkedin: '',
    github: '',
    website: ''
  },
  summary:
    'Java Software Engineer with solid experience in the architecture and development of mission-critical, high-scale solutions for the financial sector. Specialist in Identity and Access Management (IAM/CIAM), with in-depth knowledge of the Spring ecosystem, Red Hat SSO, and Ping Identity suite. Strong skills in Cloud (AWS), DevOps (GitOps), and microservices modernization, ensuring security and resilience for millions of users across B2B and B2C journeys.',
  experiences: [
    {
      id: 'exp-1',
      role: 'Identity Analyst',
      company: 'Netbr by SEK',
      period: '03/2026 - Present',
      location: 'São Paulo, Brazil',
      summary:
        'Access Management & Automation: Specialized in the architecture, implementation, and maintenance of Identity and Access Management (IAM/CIAM) solutions for large enterprise clients. Focused on ensuring security, modernizing infrastructure, and scaling critical authentication workflows.',
      bullets: [
        'Vivo (Telecom): Pioneering implementation of Ping Authorize in Brazil, including its federation with Ping Federate. Active in IAMOps focusing on automation scripts for application deployment and backup, as well as optimizing enterprise-scale Joiner-Mover-Leaver (JML) provisioning routines.',
        'BTG Colombia (Financial): (Natural Persons and Legal Entities) Implementation of banking CIAM with Ping AIC (ForgeRock) for individual and corporate authentication. Development of SSO journeys, biometric cryptogram generation scripts, and secure AWS Cognito integration to eliminate reliance on static credentials.'
      ]
    },
    {
      id: 'exp-2',
      role: 'Java Software Engineer',
      company: 'F1rst – Technology & Innovation (Santander Hub)',
      period: '07/2023 - 03/2026',
      location: 'São Paulo, Brazil',
      summary:
        'Banking Solutions & High Scale: Development and support of critical login systems (Spring Boot and Red Hat SSO / OAuth 2.0). Engineered security-focused banking solutions for the Santander ecosystem, robustly supporting over 60 million customers and processing millions of requests daily.',
      bullets: [
        'Modernization & Microservices: Led the extraction of the legacy authentication core into a modern microservices architecture, establishing the foundational login framework for Select Global and the Way app.',
        'Santander Customer SSO: Implemented and expanded standardized Single Sign-On (SSO), securely centralizing digital access journeys across strategic channels such as Esfera, Auto Compara, GOV.br, and various bank services.',
        'Dedicated B2B SSO: Developed and deployed a comprehensive B2B SSO ecosystem for partner corporations, replicating bank-level security robustness for high-impact external operations (Hyundai and Santander Consumer Finance).',
        'Dynamic Authentication (PF/PJ): Built dynamic routing and authentication mechanisms for Santander\'s Debt Renegotiation Portal, seamlessly adapting login workflows for both individual and corporate profiles.',
        'Recognition: Awarded by the Security Department in 2024 for agile incident response and exceeding annual goals (FlexLearning).'
      ]
    },
    {
      id: 'exp-3',
      role: 'Java Software Engineer',
      company: 'Avanade',
      period: '06/2021 - 07/2023',
      location: 'São Paulo, Brazil',
      summary:
        'Backend Authentication & Native Mobile: Positioned within the Santander ecosystem, beginning in mobile development and swiftly transitioning to backend and authentication engineering (Spring Boot and Red Hat SSO / OAuth 2.0). High technical delivery resulted in the continuation and direct internal hire by F1rst.',
      bullets: [
        'Architecture & Microservices: Designed and implemented security microservices and complex user access journeys.',
        'Advanced Authentication: Deployed passwordless authentication workflows (passwordless OTP) for the bank\'s microcredit platform.',
        'Identity for Non-Account Holders: Engineered a dedicated login and access management solution exclusively for non-account holding customers on the Santander Consumer Finance portal.',
        'Android Development (Open Finance): Built native features (Java/Kotlin) and integrated Firebase Analytics into the Open Finance PJ mobile app.'
      ]
    }
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'IT Management - Associate Degree (Tecnólogo)',
      institution: 'Estácio',
      period: '08/2017 - 12/2019',
      location: 'Carapicuíba, Brazil'
    }
  ],
  skills: [
    {
      id: 'skill-group-1',
      title: '',
      items: [
        'Java',
        'Kotlin',
        'SQL',
        'NoSQL',
        'Ldap',
        'JUnit',
        'Android',
        'Spring Boot',
        'Spring Security',
        'Apache CAMEL',
        'REST API',
        'GIT Flow',
        'SOLID',
        'AWS',
        'Azure',
        'Kubernetes',
        'Openshift',
        'OpenID',
        'Elasticsearch',
        'Agile (SCRUM, Kanban)',
        'OWASP',
        'OAuth 2',
        'JWT',
        'MVP',
        'MVVM',
        'MVC',
        'Keycloak',
        'Retrofit',
        'HTML 5',
        'CSS 3',
        'Jenkins',
        'Dynatrace'
      ]
    }
  ],
  languages: [
    {
      id: 'lang-1',
      name: 'English',
      level: 'Intermediate',
      score: 3
    },
    {
      id: 'lang-2',
      name: 'Spanish',
      level: 'Intermediate',
      score: 3
    },
    {
      id: 'lang-3',
      name: 'Portuguese',
      level: 'Native',
      score: 5
    }
  ],
  customSections: []
};

// Generates starter template for new registered users
function getStarterDataForUser(name, email, lang = 'pt') {
  if (lang === 'en') {
    return {
      personalInfo: {
        fullName: name || 'Your Name',
        headline: 'Professional Title / Area of Expertise',
        phone: '',
        email: email || '',
        location: 'City, Country',
        linkedin: '',
        github: '',
        website: ''
      },
      summary:
        'Professional dedicated to continuous improvement, driving business value, and delivering high quality results.',
      experiences: [
        {
          id: 'exp-1',
          role: 'Position Title',
          company: 'Company Name',
          period: '2023 - Present',
          location: 'City, Country',
          summary: 'Summary of primary responsibilities, projects, and impact.',
          bullets: [
            'Led key strategic initiatives and delivered projects on schedule.',
            'Collaborated with cross-functional teams to streamline workflows and boost productivity.'
          ]
        }
      ],
      education: [
        {
          id: 'edu-1',
          degree: 'Degree / Academic Field',
          institution: 'University / Institute Name',
          period: '2019 - 2023',
          location: 'City, Country'
        }
      ],
      skills: [
        {
          id: 'skill-group-1',
          title: 'Core Competencies',
          items: ['Communication', 'Problem Solving', 'Strategic Planning', 'Team Leadership']
        }
      ],
      languages: [
        {
          id: 'lang-1',
          name: 'English',
          level: 'Fluent',
          score: 5
        }
      ],
      customSections: []
    };
  }

  return {
    personalInfo: {
      fullName: name || 'Seu Nome',
      headline: 'Título Profissional / Especialidade',
      phone: '',
      email: email || '',
      location: 'Sua Cidade – UF, Brasil',
      linkedin: '',
      github: '',
      website: ''
    },
    summary:
      'Profissional focado em resultados, desenvolvimento contínuo e criação de soluções de alto impacto para o negócio.',
    experiences: [
      {
        id: 'exp-1',
        role: 'Cargo / Função',
        company: 'Nome da Empresa',
        period: '2023 - Presente',
        location: 'Cidade, UF',
        summary: 'Descrição das principais responsabilidades, liderança de iniciativas e entregas.',
        bullets: [
          'Desenvolvimento e liderança de entregas estratégicas com foco em excelência e prazos.',
          'Colaboração com equipes multidisciplinares e otimização de fluxos operacionais.'
        ]
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Formação / Graduação',
        institution: 'Nome da Instituição',
        period: '2019 - 2023',
        location: 'Cidade, UF'
      }
    ],
    skills: [
      {
        id: 'skill-group-1',
        title: 'Habilidades Principais',
        items: ['Comunicação', 'Resolução de Problemas', 'Gestão de Projetos', 'Trabalho em Equipe']
      }
    ],
    languages: [
      {
        id: 'lang-1',
        name: 'Português',
        level: 'Nativo',
        score: 5
      }
    ],
    customSections: []
  };
}

// Seed function for Henrique Teixeira demo user and database setup
function seedDatabase() {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultHenriqueEmail = 'ht.henrique@live.com';
  let henrique = db.prepare('SELECT * FROM users WHERE email = ?').get(defaultHenriqueEmail);

  if (!henrique) {
    if (isProduction) {
      console.log('Ambiente de produção: nenhum usuário de teste criado automaticamente.');
      return;
    }
    console.log('Criando usuário padrão Henrique Teixeira no SQLite...');
    const henriqueUuid = crypto.randomUUID();
    const { hash, salt } = hashPassword('123456');

    const insertUser = db.prepare(`
      INSERT INTO users (uuid, name, email, password_hash, salt)
      VALUES (?, ?, ?, ?, ?)
    `);

    const userResult = insertUser.run(
      henriqueUuid,
      'Henrique Teixeira',
      defaultHenriqueEmail,
      hash,
      salt
    );

    henrique = {
      id: userResult.lastInsertRowid,
      uuid: henriqueUuid,
      name: 'Henrique Teixeira',
      email: defaultHenriqueEmail
    };
    console.log('Usuário padrão criado com UUID:', henriqueUuid);
  }

  // Check if Henrique has a resume linked
  let resume = db.prepare('SELECT * FROM resumes WHERE user_uuid = ? OR user_id = ?').get(henrique.uuid, henrique.id);

  if (!resume) {
    // Check if an existing unassigned resume exists
    const legacyResume = db.prepare('SELECT * FROM resumes WHERE user_uuid IS NULL LIMIT 1').get();

    if (legacyResume) {
      console.log('Vinculando currículo existente ao usuário Henrique...');
      db.prepare('UPDATE resumes SET user_id = ?, user_uuid = ? WHERE id = ?').run(
        henrique.id,
        henrique.uuid,
        legacyResume.id
      );
      resume = legacyResume;
    } else {
      console.log('Criando currículo inicial para Henrique...');
      const insertResume = db.prepare(`
        INSERT INTO resumes (user_id, user_uuid, slug, title, active_language, photo_url, theme_config)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertResume.run(
        henrique.id,
        henrique.uuid,
        'default',
        'Henrique Teixeira - Engenheiro de Software Java',
        'pt',
        null,
        JSON.stringify(defaultTheme)
      );

      const resumeId = result.lastInsertRowid;

      const insertTrans = db.prepare(`
        INSERT INTO resume_translations 
        (resume_id, language, personal_info, summary, experiences, education, skills, languages, custom_sections)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // PT
      insertTrans.run(
        resumeId,
        'pt',
        JSON.stringify(defaultPortuguese.personalInfo),
        defaultPortuguese.summary,
        JSON.stringify(defaultPortuguese.experiences),
        JSON.stringify(defaultPortuguese.education),
        JSON.stringify(defaultPortuguese.skills),
        JSON.stringify(defaultPortuguese.languages),
        JSON.stringify(defaultPortuguese.customSections)
      );

      // EN
      insertTrans.run(
        resumeId,
        'en',
        JSON.stringify(defaultEnglish.personalInfo),
        defaultEnglish.summary,
        JSON.stringify(defaultEnglish.experiences),
        JSON.stringify(defaultEnglish.education),
        JSON.stringify(defaultEnglish.skills),
        JSON.stringify(defaultEnglish.languages),
        JSON.stringify(defaultEnglish.customSections)
      );

      console.log('Currículo inicial criado com sucesso para Henrique, ID:', resumeId);
    }
  }
}

seedDatabase();

// ----------------- USER AUTHENTICATION & MANAGEMENT -----------------

function createUser({ name, email, password }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Nome é obrigatório.');
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('E-mail inválido.');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('A senha deve ter no mínimo 6 caracteres.');
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    throw new Error('Este e-mail já está cadastrado no sistema.');
  }

  const userUuid = crypto.randomUUID();
  const { hash, salt } = hashPassword(password);

  const insertUser = db.prepare(`
    INSERT INTO users (uuid, name, email, password_hash, salt)
    VALUES (?, ?, ?, ?, ?)
  `);

  const userRes = insertUser.run(userUuid, cleanName, cleanEmail, hash, salt);
  const userId = userRes.lastInsertRowid;

  // Automatically create resume for the new user
  const insertResume = db.prepare(`
    INSERT INTO resumes (user_id, user_uuid, slug, title, active_language, photo_url, theme_config)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const resumeRes = insertResume.run(
    userId,
    userUuid,
    userUuid,
    `Currículo de ${cleanName}`,
    'pt',
    null,
    JSON.stringify(defaultTheme)
  );

  const resumeId = resumeRes.lastInsertRowid;

  const insertTrans = db.prepare(`
    INSERT INTO resume_translations 
    (resume_id, language, personal_info, summary, experiences, education, skills, languages, custom_sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const starterPt = getStarterDataForUser(cleanName, cleanEmail, 'pt');
  const starterEn = getStarterDataForUser(cleanName, cleanEmail, 'en');

  insertTrans.run(
    resumeId,
    'pt',
    JSON.stringify(starterPt.personalInfo),
    starterPt.summary,
    JSON.stringify(starterPt.experiences),
    JSON.stringify(starterPt.education),
    JSON.stringify(starterPt.skills),
    JSON.stringify(starterPt.languages),
    JSON.stringify(starterPt.customSections)
  );

  insertTrans.run(
    resumeId,
    'en',
    JSON.stringify(starterEn.personalInfo),
    starterEn.summary,
    JSON.stringify(starterEn.experiences),
    JSON.stringify(starterEn.education),
    JSON.stringify(starterEn.skills),
    JSON.stringify(starterEn.languages),
    JSON.stringify(starterEn.customSections)
  );

  return {
    id: userId,
    uuid: userUuid,
    name: cleanName,
    email: cleanEmail
  };
}

function authenticateUser(email, password) {
  if (!email || !password) return null;
  const cleanEmail = email.trim().toLowerCase();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) return null;

  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) return null;

  return {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    createdAt: user.created_at
  };
}

function getUserByUuid(uuid) {
  if (!uuid) return null;
  const user = db.prepare('SELECT id, uuid, name, email, created_at FROM users WHERE uuid = ?').get(uuid);
  return user || null;
}

function changeUserPassword(uuid, currentPassword, newPassword) {
  if (!uuid) throw new Error('Usuário não autenticado.');
  if (!currentPassword) throw new Error('Informe a senha atual.');
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  }
  if (currentPassword === newPassword) {
    throw new Error('A nova senha deve ser diferente da senha atual.');
  }

  const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
  if (!user) throw new Error('Usuário não encontrado.');

  const isCurrentValid = verifyPassword(currentPassword, user.password_hash, user.salt);
  if (!isCurrentValid) {
    throw new Error('A senha atual informada está incorreta.');
  }

  const { hash, salt } = hashPassword(newPassword);

  db.prepare(`
    UPDATE users 
    SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP
    WHERE uuid = ?
  `).run(hash, salt, uuid);

  return true;
}

// ----------------- RESUME MANAGEMENT ISOLATED BY USER UUID -----------------

function getResumeByUserUuid(userUuid) {
  if (!userUuid) return null;

  let resume = db.prepare('SELECT * FROM resumes WHERE user_uuid = ?').get(userUuid);

  // If user exists but resume does not yet exist, create it
  if (!resume) {
    const user = getUserByUuid(userUuid);
    if (!user) return null;

    const insertResume = db.prepare(`
      INSERT INTO resumes (user_id, user_uuid, slug, title, active_language, photo_url, theme_config)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const res = insertResume.run(
      user.id,
      user.uuid,
      user.uuid,
      `Currículo de ${user.name}`,
      'pt',
      null,
      JSON.stringify(defaultTheme)
    );

    const resumeId = res.lastInsertRowid;
    const starterPt = getStarterDataForUser(user.name, user.email, 'pt');
    const starterEn = getStarterDataForUser(user.name, user.email, 'en');

    const insertTrans = db.prepare(`
      INSERT INTO resume_translations 
      (resume_id, language, personal_info, summary, experiences, education, skills, languages, custom_sections)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTrans.run(
      resumeId,
      'pt',
      JSON.stringify(starterPt.personalInfo),
      starterPt.summary,
      JSON.stringify(starterPt.experiences),
      JSON.stringify(starterPt.education),
      JSON.stringify(starterPt.skills),
      JSON.stringify(starterPt.languages),
      JSON.stringify(starterPt.customSections)
    );

    insertTrans.run(
      resumeId,
      'en',
      JSON.stringify(starterEn.personalInfo),
      starterEn.summary,
      JSON.stringify(starterEn.experiences),
      JSON.stringify(starterEn.education),
      JSON.stringify(starterEn.skills),
      JSON.stringify(starterEn.languages),
      JSON.stringify(starterEn.customSections)
    );

    resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(resumeId);
  }

  const translations = db.prepare('SELECT * FROM resume_translations WHERE resume_id = ?').all(resume.id);

  const transMap = {};
  for (const t of translations) {
    transMap[t.language] = {
      personalInfo: JSON.parse(t.personal_info || '{}'),
      summary: t.summary || '',
      experiences: JSON.parse(t.experiences || '[]'),
      education: JSON.parse(t.education || '[]'),
      skills: JSON.parse(t.skills || '[]'),
      languages: JSON.parse(t.languages || '[]'),
      customSections: JSON.parse(t.custom_sections || '[]')
    };
  }

  const rawThemeConfig = JSON.parse(resume.theme_config || '{}');
  let themesMap = {};
  if (rawThemeConfig.pt || rawThemeConfig.en) {
    themesMap = {
      pt: rawThemeConfig.pt || defaultThemePT,
      en: rawThemeConfig.en || defaultThemeEN
    };
  } else if (rawThemeConfig.sidebarColor) {
    themesMap = {
      pt: rawThemeConfig,
      en: { ...rawThemeConfig, sidebarColor: '#1e293b', accentColor: '#0284c7', nameColor: '#1e293b' }
    };
  } else {
    themesMap = {
      pt: defaultThemePT,
      en: defaultThemeEN
    };
  }

  const activeLang = resume.active_language || 'pt';
  const activeTheme = themesMap[activeLang] || themesMap.pt;

  return {
    id: resume.id,
    userUuid: resume.user_uuid,
    slug: resume.slug,
    title: resume.title,
    activeLanguage: activeLang,
    photoUrl: resume.photo_url,
    theme: activeTheme,
    themes: themesMap,
    translations: transMap,
    updatedAt: resume.updated_at
  };
}

function updateResumeByUserUuid(userUuid, data) {
  if (!userUuid || !data) return null;

  const resume = db.prepare('SELECT id FROM resumes WHERE user_uuid = ?').get(userUuid);
  if (!resume) {
    // Auto-create then update
    getResumeByUserUuid(userUuid);
  }

  const currentResume = db.prepare('SELECT id FROM resumes WHERE user_uuid = ?').get(userUuid);
  if (!currentResume) return null;

  // Prepare per-language themes map
  let themesToSave = data.themes;
  if (!themesToSave) {
    themesToSave = {
      pt: defaultThemePT,
      en: defaultThemeEN
    };
    if (data.theme) {
      const targetLang = data.activeLanguage || 'pt';
      themesToSave[targetLang] = data.theme;
    }
  }

  const updateResume = db.prepare(`
    UPDATE resumes 
    SET title = ?, active_language = ?, photo_url = ?, theme_config = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_uuid = ?
  `);

  updateResume.run(
    data.title || 'Meu Currículo',
    data.activeLanguage || 'pt',
    data.photoUrl !== undefined ? data.photoUrl : null,
    JSON.stringify(themesToSave),
    currentResume.id,
    userUuid
  );

  const upsertTrans = db.prepare(`
    INSERT INTO resume_translations 
    (resume_id, language, personal_info, summary, experiences, education, skills, languages, custom_sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(resume_id, language) DO UPDATE SET
      personal_info = excluded.personal_info,
      summary = excluded.summary,
      experiences = excluded.experiences,
      education = excluded.education,
      skills = excluded.skills,
      languages = excluded.languages,
      custom_sections = excluded.custom_sections
  `);

  if (data.translations) {
    for (const [lang, content] of Object.entries(data.translations)) {
      upsertTrans.run(
        currentResume.id,
        lang,
        JSON.stringify(content.personalInfo || {}),
        content.summary || '',
        JSON.stringify(content.experiences || []),
        JSON.stringify(content.education || []),
        JSON.stringify(content.skills || []),
        JSON.stringify(content.languages || []),
        JSON.stringify(content.customSections || [])
      );
    }
  }

  return getResumeByUserUuid(userUuid);
}

function resetResumeByUserUuid(userUuid) {
  const user = getUserByUuid(userUuid);
  if (!user) return null;

  const resume = db.prepare('SELECT id FROM resumes WHERE user_uuid = ?').get(userUuid);
  if (!resume) return null;

  // Determine reset data: Henrique gets original Henrique data; others get starter data with their own name & email
  const isHenrique = user.email.toLowerCase() === 'ht.henrique@live.com';
  const ptData = isHenrique ? defaultPortuguese : getStarterDataForUser(user.name, user.email, 'pt');
  const enData = isHenrique ? defaultEnglish : getStarterDataForUser(user.name, user.email, 'en');

  const updateResume = db.prepare(`
    UPDATE resumes 
    SET title = ?, active_language = 'pt', photo_url = ?, theme_config = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_uuid = ?
  `);

  updateResume.run(
    isHenrique ? 'Henrique Teixeira - Engenheiro de Software Java' : `Currículo de ${user.name}`,
    isHenrique ? '/henrique_avatar.png' : null,
    JSON.stringify(defaultThemes),
    resume.id,
    userUuid
  );

  const upsertTrans = db.prepare(`
    INSERT INTO resume_translations 
    (resume_id, language, personal_info, summary, experiences, education, skills, languages, custom_sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(resume_id, language) DO UPDATE SET
      personal_info = excluded.personal_info,
      summary = excluded.summary,
      experiences = excluded.experiences,
      education = excluded.education,
      skills = excluded.skills,
      languages = excluded.languages,
      custom_sections = excluded.custom_sections
  `);

  upsertTrans.run(
    resume.id,
    'pt',
    JSON.stringify(ptData.personalInfo),
    ptData.summary,
    JSON.stringify(ptData.experiences),
    JSON.stringify(ptData.education),
    JSON.stringify(ptData.skills),
    JSON.stringify(ptData.languages),
    JSON.stringify(ptData.customSections)
  );

  upsertTrans.run(
    resume.id,
    'en',
    JSON.stringify(enData.personalInfo),
    enData.summary,
    JSON.stringify(enData.experiences),
    JSON.stringify(enData.education),
    JSON.stringify(enData.skills),
    JSON.stringify(enData.languages),
    JSON.stringify(enData.customSections)
  );

  return getResumeByUserUuid(userUuid);
}

// Photo storage
function savePhotoToDb(filename, mimeType, dataBase64, userUuid = null) {
  const stmt = db.prepare(`
    INSERT INTO photos (filename, mime_type, data_base64, user_uuid)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(filename, mimeType, dataBase64, userUuid);
  return result.lastInsertRowid;
}

function getPhotoFromDb(id) {
  return db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
}

module.exports = {
  db,
  createUser,
  authenticateUser,
  getUserByUuid,
  changeUserPassword,
  getResumeByUserUuid,
  updateResumeByUserUuid,
  resetResumeByUserUuid,
  savePhotoToDb,
  getPhotoFromDb,
  defaultTheme,
  defaultPortuguese,
  defaultEnglish
};
