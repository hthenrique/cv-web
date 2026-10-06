const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'curriculo.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE DEFAULT 'default',
    title TEXT DEFAULT 'Meu Currículo',
    active_language TEXT DEFAULT 'pt',
    photo_url TEXT DEFAULT NULL,
    theme_config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    filename TEXT,
    mime_type TEXT,
    data_base64 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Default Henrique Teixeira data
const defaultTheme = {
  sidebarColor: '#162a45', // dark navy blue from the image
  sidebarTextColor: '#ffffff',
  accentColor: '#1e88e5',  // cyan/sky blue from the image
  nameColor: '#162a45',
  bodyTextColor: '#334155',
  fontFamily: 'Inter',
  showPhoto: true,
  photoShape: 'circle', // 'circle' | 'square' | 'rounded'
  photoBorder: true,
  fontSize: 'normal', // 'compact' | 'normal' | 'spacious'
};

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
  summary: 'Engenheiro de Software Java com sólida experiência na arquitetura e desenvolvimento de soluções de missão crítica e alta escala para o setor financeiro. Especialista em Gestão de Identidades e Acessos (IAM/CIAM), com profundo conhecimento no ecossistema Spring, Red Hat SSO e suíte Ping Identity. Fortes habilidades em Cloud (AWS), DevOps (GitOps) e modernização de microserviços, garantindo segurança e resiliência para milhões de usuários em jornadas B2B e B2C.',
  experiences: [
    {
      id: 'exp-1',
      role: 'Analista de Identidade',
      company: 'Netbr by SEK',
      period: '03/2026 - Presente',
      location: 'São Paulo',
      summary: 'Gestão de Acessos & Automação: Atuação especializada na arquitetura, implementação e sustentação de soluções de Gestão de Identidades e Acessos (IAM/CIAM) para clientes de grande porte corporativo. Foco em garantir a segurança, modernizar a infraestrutura e escalar processos críticos de autenticação.',
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
      summary: 'Soluções Bancárias & Alta Escala: Desenvolvimento e sustentação de sistemas críticos de login (Spring Boot e Red Hat SSO / OAuth 2.0). Engenharia de soluções bancárias focadas em segurança para o ecossistema Santander, suportando de forma robusta mais de 60 milhões de clientes e processando milhões de requisições diárias.',
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
      summary: 'Autenticação Backend & Mobile Nativo: Atuação alocada no ecossistema Santander, iniciando no desenvolvimento mobile e assumindo rapidamente a engenharia de backend e autenticação (Spring Boot e Red Hat SSO / OAuth 2.0). A alta aderência técnica e entrega de soluções críticas resultaram na posterior continuidade e internalização do trabalho diretamente pela F1rst.',
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
        'Java', 'Kotlin', 'SQL', 'NoSQL', 'Ldap', 'JUnit', 'Android', 'Spring Boot',
        'Spring Security', 'Apache CAMEL', 'API Rest', 'GIT Flow', 'SOLID', 'AWS',
        'Azure', 'Kubernetes', 'Openshift', 'OpenID', 'Elastic Search',
        'Gestão Ágil (SCRUM, Kanban)', 'OWASP', 'OAuth 2', 'JWT', 'MVP', 'MVVM',
        'MVC', 'Keycloak', 'Retrofit', 'HTML 5', 'CSS 3', 'Jenkins', 'Dynatrace'
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
  summary: 'Java Software Engineer with solid experience in the architecture and development of mission-critical, high-scale solutions for the financial sector. Specialist in Identity and Access Management (IAM/CIAM), with in-depth knowledge of the Spring ecosystem, Red Hat SSO, and Ping Identity suite. Strong skills in Cloud (AWS), DevOps (GitOps), and microservices modernization, ensuring security and resilience for millions of users across B2B and B2C journeys.',
  experiences: [
    {
      id: 'exp-1',
      role: 'Identity Analyst',
      company: 'Netbr by SEK',
      period: '03/2026 - Present',
      location: 'São Paulo, Brazil',
      summary: 'Access Management & Automation: Specialized in the architecture, implementation, and maintenance of Identity and Access Management (IAM/CIAM) solutions for large enterprise clients. Focused on ensuring security, modernizing infrastructure, and scaling critical authentication workflows.',
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
      summary: 'Banking Solutions & High Scale: Development and support of critical login systems (Spring Boot and Red Hat SSO / OAuth 2.0). Engineered security-focused banking solutions for the Santander ecosystem, robustly supporting over 60 million customers and processing millions of requests daily.',
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
      summary: 'Backend Authentication & Native Mobile: Positioned within the Santander ecosystem, beginning in mobile development and swiftly transitioning to backend and authentication engineering (Spring Boot and Red Hat SSO / OAuth 2.0). High technical delivery resulted in the continuation and direct internal hire by F1rst.',
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
        'Java', 'Kotlin', 'SQL', 'NoSQL', 'Ldap', 'JUnit', 'Android', 'Spring Boot',
        'Spring Security', 'Apache CAMEL', 'REST API', 'GIT Flow', 'SOLID', 'AWS',
        'Azure', 'Kubernetes', 'Openshift', 'OpenID', 'Elasticsearch',
        'Agile (SCRUM, Kanban)', 'OWASP', 'OAuth 2', 'JWT', 'MVP', 'MVVM',
        'MVC', 'Keycloak', 'Retrofit', 'HTML 5', 'CSS 3', 'Jenkins', 'Dynatrace'
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

// Seed function if DB is empty
function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) as count FROM resumes').get().count;
  if (count === 0) {
    console.log('Seeding initial Henrique Teixeira resume into SQLite...');
    const insertResume = db.prepare(`
      INSERT INTO resumes (slug, title, active_language, photo_url, theme_config)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertResume.run(
      'default',
      'Henrique Teixeira - Engenheiro de Software Java',
      'pt',
      null, // Empty by default until user uploads one
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

    console.log('Database seeded successfully with ID:', resumeId);
  }
}

seedDatabase();

function getResumeData(slug = 'default') {
  const resume = db.prepare('SELECT * FROM resumes WHERE slug = ?').get(slug);
  if (!resume) return null;

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

  return {
    id: resume.id,
    slug: resume.slug,
    title: resume.title,
    activeLanguage: resume.active_language,
    photoUrl: resume.photo_url,
    theme: JSON.parse(resume.theme_config || '{}'),
    translations: transMap,
    updatedAt: resume.updated_at
  };
}

function updateResumeData(slug = 'default', data) {
  const resume = db.prepare('SELECT id FROM resumes WHERE slug = ?').get(slug);
  if (!resume) return null;

  const updateResume = db.prepare(`
    UPDATE resumes 
    SET title = ?, active_language = ?, photo_url = ?, theme_config = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  updateResume.run(
    data.title || 'Meu Currículo',
    data.activeLanguage || 'pt',
    data.photoUrl !== undefined ? data.photoUrl : null,
    JSON.stringify(data.theme || defaultTheme),
    resume.id
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
        resume.id,
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

  return getResumeData(slug);
}

function resetToDefault(slug = 'default') {
  db.prepare('DELETE FROM resumes WHERE slug = ?').run(slug);
  seedDatabase();
  return getResumeData(slug);
}

function savePhotoToDb(filename, mimeType, dataBase64) {
  const stmt = db.prepare(`
    INSERT INTO photos (filename, mime_type, data_base64)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(filename, mimeType, dataBase64);
  return result.lastInsertRowid;
}

function getPhotoFromDb(id) {
  return db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
}

module.exports = {
  db,
  getResumeData,
  updateResumeData,
  resetToDefault,
  savePhotoToDb,
  getPhotoFromDb,
  defaultTheme,
  defaultPortuguese,
  defaultEnglish
};

