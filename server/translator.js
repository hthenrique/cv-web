/**
 * Translation service for resume content (PT <-> EN)
 * Uses Google Chrome Translation endpoint with MyMemory fallback
 */

const QUICK_TERMS_PT_TO_EN = {
  'presente': 'Present',
  'atualmente': 'Present',
  'hoje': 'Present',
  'intermediário': 'Intermediate',
  'avançado': 'Advanced',
  'básico': 'Basic',
  'fluente': 'Fluent',
  'nativo': 'Native',
  'inglês': 'English',
  'espanhol': 'Spanish',
  'português': 'Portuguese',
  'francês': 'French',
  'alemão': 'German',
  'italiano': 'Italian',
  'japones': 'Japanese',
  'japonês': 'Japanese',
  'brasil': 'Brazil',
  'são paulo, brasil': 'São Paulo, Brazil',
  'título do grupo': 'Group Title'
};

const QUICK_TERMS_EN_TO_PT = {
  'present': 'Presente',
  'currently': 'Presente',
  'intermediate': 'Intermediário',
  'advanced': 'Avançado',
  'basic': 'Básico',
  'fluent': 'Fluente',
  'native': 'Nativo',
  'english': 'Inglês',
  'spanish': 'Espanhol',
  'portuguese': 'Português',
  'french': 'Francês',
  'german': 'Alemão',
  'italian': 'Italiano',
  'japanese': 'Japonês',
  'brazil': 'Brasil',
  'são paulo, brazil': 'São Paulo, Brasil',
  'group title': 'Título do Grupo'
};

/**
 * Translates a single text string from source to target language
 */
async function translateString(text, from = 'pt', to = 'en') {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  const lower = trimmed.toLowerCase();
  if (from === 'pt' && to === 'en' && QUICK_TERMS_PT_TO_EN[lower]) {
    return QUICK_TERMS_PT_TO_EN[lower];
  }
  if (from === 'en' && to === 'pt' && QUICK_TERMS_EN_TO_PT[lower]) {
    return QUICK_TERMS_EN_TO_PT[lower];
  }

  // 1. Try Google Chrome extension translation endpoint
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${from}&tl=${to}&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        return data[0];
      }
    }
  } catch (err) {
    // silently fallback
  }

  // 2. Fallback to MyMemory
  try {
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${from}|${to}`;
    const res = await fetch(mmUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (err) {
    // silently fallback
  }

  return text;
}

/**
 * Concurrency helper for running tasks with a pool limit
 */
async function mapConcurrent(items, fn, concurrency = 4) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

/**
 * Translates a full resume translation dataset (personalInfo, summary, experiences, education, skills, languages)
 */
async function translateResumeData(sourceData, from = 'pt', to = 'en') {
  if (!sourceData) return null;
  const translated = JSON.parse(JSON.stringify(sourceData));

  // Collect all translation tasks { text, apply(translatedText) }
  const tasks = [];

  // 1. Headline
  if (translated.personalInfo?.headline) {
    tasks.push({
      text: translated.personalInfo.headline,
      apply: (val) => { translated.personalInfo.headline = val; }
    });
  }

  // 2. Summary
  if (translated.summary) {
    tasks.push({
      text: translated.summary,
      apply: (val) => { translated.summary = val; }
    });
  }

  // 3. Experiences
  if (Array.isArray(translated.experiences)) {
    for (const exp of translated.experiences) {
      if (exp.role) {
        tasks.push({
          text: exp.role,
          apply: (val) => { exp.role = val; }
        });
      }
      if (exp.summary) {
        tasks.push({
          text: exp.summary,
          apply: (val) => { exp.summary = val; }
        });
      }
      if (exp.period) {
        exp.period = from === 'pt'
          ? exp.period.replace(/Presente/gi, 'Present')
          : exp.period.replace(/Present/gi, 'Presente');
      }
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((bullet, bIdx) => {
          if (bullet && typeof bullet === 'string') {
            tasks.push({
              text: bullet,
              apply: (val) => { exp.bullets[bIdx] = val; }
            });
          }
        });
      }
    }
  }

  // 4. Education
  if (Array.isArray(translated.education)) {
    for (const edu of translated.education) {
      if (edu.degree) {
        tasks.push({
          text: edu.degree,
          apply: (val) => { edu.degree = val; }
        });
      }
      if (edu.period) {
        edu.period = from === 'pt'
          ? edu.period.replace(/Presente/gi, 'Present')
          : edu.period.replace(/Present/gi, 'Presente');
      }
    }
  }

  // 5. Skills
  if (Array.isArray(translated.skills)) {
    for (const sk of translated.skills) {
      if (sk.title) {
        tasks.push({
          text: sk.title,
          apply: (val) => { sk.title = val; }
        });
      }
    }
  }

  // 6. Languages
  if (Array.isArray(translated.languages)) {
    for (const lang of translated.languages) {
      if (lang.name) {
        tasks.push({
          text: lang.name,
          apply: (val) => { lang.name = val; }
        });
      }
      if (lang.level) {
        tasks.push({
          text: lang.level,
          apply: (val) => { lang.level = val; }
        });
      }
    }
  }

  // 7. Custom Sections
  if (Array.isArray(translated.customSections)) {
    for (const cs of translated.customSections) {
      if (cs.title) {
        tasks.push({
          text: cs.title,
          apply: (val) => { cs.title = val; }
        });
      }
      if (cs.content) {
        tasks.push({
          text: cs.content,
          apply: (val) => { cs.content = val; }
        });
      }
    }
  }

  // Execute translations concurrently (4 at a time)
  await mapConcurrent(
    tasks,
    async (task) => {
      const res = await translateString(task.text, from, to);
      task.apply(res);
    },
    4
  );

  return translated;
}

module.exports = {
  translateString,
  translateResumeData
};

