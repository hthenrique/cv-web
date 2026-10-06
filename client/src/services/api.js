// Resolves the backend API base URL supporting environment variables (e.g. Vercel deployment)
function resolveApiBase() {
  const envUrl = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BACKEND_URL ||
    ''
  ).trim();

  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // Fallback for local development when running Vite dev server on localhost
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocalhost && window.location.port !== '5000') {
      return 'http://localhost:5000/api';
    }
  }

  return '/api';
}

export const API_BASE = resolveApiBase();

export const USER_UUID_KEY = 'curriculo_user_uuid';
export const USER_DATA_KEY = 'curriculo_user_data';

export function getUserUuid() {
  return localStorage.getItem(USER_UUID_KEY) || '';
}

export function getUserData() {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setUserSession(user) {
  if (user && user.uuid) {
    localStorage.setItem(USER_UUID_KEY, user.uuid);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }
}

export function clearUserSession() {
  localStorage.removeItem(USER_UUID_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  // Clear any old caches
  localStorage.removeItem('curriculo_offline_cache');
}

function getAuthHeaders(additional = {}) {
  const uuid = getUserUuid();
  const headers = { ...additional };
  if (uuid) {
    headers['X-User-UUID'] = uuid;
  }
  return headers;
}

// ----------------- AUTH SERVICES -----------------

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao autenticar.');
  }
  setUserSession(data.user);
  return data.user;
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao realizar cadastro.');
  }
  setUserSession(data.user);
  return data.user;
}

export async function getMe() {
  const uuid = getUserUuid();
  if (!uuid) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (res.status === 401) {
      clearUserSession();
      return null;
    }
    if (!res.ok) {
      throw new Error('Falha ao validar sessão atual.');
    }
    const data = await res.json();
    setUserSession(data.user);
    return data.user;
  } catch (err) {
    console.warn('Erro ao checar sessão ativa:', err);
    return getUserData();
  }
}

export function logout() {
  clearUserSession();
}

export async function changePassword(currentPassword, newPassword) {
  const uuid = getUserUuid();
  if (!uuid) {
    throw new Error('Usuário não autenticado.');
  }

  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao alterar senha.');
  }
  return data;
}

// ----------------- RESUME SERVICES -----------------

export async function fetchResume() {
  const uuid = getUserUuid();
  if (!uuid) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    const res = await fetch(`${API_BASE}/resume`, {
      headers: getAuthHeaders()
    });
    if (res.status === 401) {
      clearUserSession();
      throw new Error('Sessão expirada. Por favor, realize o login novamente.');
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Falha ao obter currículo do servidor');
    }
    const data = await res.json();
    // Cache per user
    localStorage.setItem(`curriculo_cache_${uuid}`, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Tentando cache local do usuário:', err);
    const cached = localStorage.getItem(`curriculo_cache_${uuid}`);
    if (cached) {
      return JSON.parse(cached);
    }
    throw err;
  }
}

export async function saveResume(resumeData) {
  const uuid = getUserUuid();
  if (!uuid) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    localStorage.setItem(`curriculo_cache_${uuid}`, JSON.stringify(resumeData));

    const res = await fetch(`${API_BASE}/resume`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(resumeData)
    });

    if (res.status === 401) {
      clearUserSession();
      throw new Error('Sessão expirada ao salvar. Faça login novamente.');
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Falha ao salvar currículo no SQLite');
    }
    const data = await res.json();
    return data.resume;
  } catch (err) {
    console.error('Erro ao salvar currículo:', err);
    throw err;
  }
}

export async function uploadPhoto(file) {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE}/upload-photo`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
  const uuid = getUserUuid();
  if (!uuid) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    const res = await fetch(`${API_BASE}/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.status === 401) {
      clearUserSession();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (!res.ok) throw new Error('Falha ao restaurar dados padrão');
    const data = await res.json();
    localStorage.removeItem(`curriculo_cache_${uuid}`);
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
