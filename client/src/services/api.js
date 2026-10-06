const API_BASE = 'http://localhost:5000/api';

export async function fetchResume() {
  try {
    const res = await fetch(`${API_BASE}/resume`);
    if (!res.ok) throw new Error('Falha ao obter currículo do servidor');
    return await res.json();
  } catch (err) {
    console.warn('Backend indisponível, usando armazenamento local temporário:', err);
    const cached = localStorage.getItem('curriculo_offline_cache');
    if (cached) {
      return JSON.parse(cached);
    }
    throw err;
  }
}

export async function saveResume(resumeData) {
  try {
    // Save to local cache as backup
    localStorage.setItem('curriculo_offline_cache', JSON.stringify(resumeData));

    const res = await fetch(`${API_BASE}/resume`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resumeData)
    });
    if (!res.ok) throw new Error('Falha ao salvar currículo no SQLite');
    const data = await res.json();
    return data.resume;
  } catch (err) {
    console.error('Erro ao salvar no servidor:', err);
    throw err;
  }
}

export async function uploadPhoto(file) {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE}/upload-photo`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Falha no upload da foto');
    const data = await res.json();
    return data.photoUrl;
  } catch (err) {
    console.error('Erro no upload de foto:', err);
    // Fallback: convert to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export async function resetResume() {
  try {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Falha ao restaurar dados padrão');
    const data = await res.json();
    localStorage.removeItem('curriculo_offline_cache');
    return data.resume;
  } catch (err) {
    console.error('Erro ao restaurar:', err);
    throw err;
  }
}

export async function translateResume(sourceData, from = 'pt', to = 'en') {
  try {
    const res = await fetch(`${API_BASE}/translate-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceData, from, to })
    });
    if (!res.ok) throw new Error('Falha ao traduzir no servidor');
    const data = await res.json();
    return data.translatedData;
  } catch (err) {
    console.error('Erro ao traduzir currículo:', err);
    throw err;
  }
}


