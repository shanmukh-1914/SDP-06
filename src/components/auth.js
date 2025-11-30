const USERS_KEY = 'mf_users';
const CURRENT_KEY = 'mf_current_user';

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse users', e);
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

async function hashPassword(str) {
  // Use Web Crypto API when available for a SHA-256 hash, fallback to simpleHash
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const data = enc.encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // ignore and fallback
  }
  return simpleHash(str);
}

export async function registerUser({ firstName, lastName, email, password, isAdmin = false }) {
  const users = loadUsers();
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { ok: false, error: 'Email already registered' };
  }
  const passwordHash = await hashPassword(password || '');
  // Try to persist to backend; fall back to localStorage when unavailable
  const payload = { firstName, lastName, email, passwordHash, isAdmin: !!isAdmin };
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.ok) {
      // ensure local copy exists for offline
      const savedUser = { id: data.user.id || Date.now().toString(), firstName, lastName, email, passwordHash, isAdmin: !!isAdmin };
      users.push(savedUser);
      saveUsers(users);
      localStorage.setItem(CURRENT_KEY, email);
      try { window.dispatchEvent(new Event('mf_auth_change')); } catch (e) {}
      return { ok: true, user: savedUser };
    }
    // if server responded but with error, return that
    if (data && data.error) return { ok: false, error: data.error };
  } catch (e) {
    // network error - fall back to local-only
    console.warn('Register: backend unavailable, falling back to localStorage', e?.message || e);
  }

  // Local fallback
  const user = {
    id: Date.now().toString(),
    firstName,
    lastName,
    email,
    passwordHash,
    isAdmin: !!isAdmin
  };
  users.push(user);
  saveUsers(users);
  localStorage.setItem(CURRENT_KEY, email);
  try { window.dispatchEvent(new Event('mf_auth_change')); } catch (e) {}
  return { ok: true, user };
}

export async function loginUser({ email, password }) {
  const users = loadUsers();
  const hash = await hashPassword(password || '');
  // Try login against backend first
  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, passwordHash: hash })
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.ok && data.user) {
      // sync to localStorage for offline
      const exists = users.some(u => u.email.toLowerCase() === data.user.email.toLowerCase());
      if (!exists) {
        users.push({ id: data.user.id || Date.now().toString(), firstName: data.user.firstName, lastName: data.user.lastName, email: data.user.email, passwordHash: hash, isAdmin: data.user.isAdmin || false });
        saveUsers(users);
      }
      localStorage.setItem(CURRENT_KEY, data.user.email);
      try { window.dispatchEvent(new Event('mf_auth_change')); } catch (e) {}
      return { ok: true, user: data.user };
    }
    if (data && data.error) return { ok: false, error: data.error };
  } catch (e) {
    console.warn('Login: backend unavailable, falling back to localStorage', e?.message || e);
  }

  // Local fallback
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hash);
  if (!found) {
    return { ok: false, error: 'Invalid credentials' };
  }
  localStorage.setItem(CURRENT_KEY, found.email);
  try { window.dispatchEvent(new Event('mf_auth_change')); } catch (e) {}
  return { ok: true, user: found };
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_KEY);
  try { localStorage.removeItem('mf_is_admin'); } catch(e) {}
  try { window.dispatchEvent(new Event('mf_auth_change')); } catch (e) {}
}

export function getCurrentUser() {
  const email = localStorage.getItem(CURRENT_KEY);
  if (!email) return null;
  const users = loadUsers();
  return users.find(u => u.email === email) || null;
}

export function getDemoInvestments() {
  return [
    { id: 'd1', name: 'Large Cap Fund', amount: 15000, date: '2024-12-01' },
    { id: 'd2', name: 'SIP Growth', amount: 5000, date: '2025-01-15' },
    { id: 'd3', name: 'Debt Fund', amount: 8000, date: '2024-11-10' }
  ];
}

export function getAllUsers() {
  return loadUsers();
}

function investmentsKey(email) {
  return `mf_investments_${email}`;
}

export function loadUserInvestments(email) {
  if (!email) return [];
  try {
    const raw = localStorage.getItem(investmentsKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse user investments', e);
    return [];
  }
}

export function saveUserInvestments(email, list) {
  if (!email) return;
  localStorage.setItem(investmentsKey(email), JSON.stringify(list));
}

export function getSampleUserData() {
  const users = loadUsers();
  if (users.length === 0) return null;
  const u = users[0];
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    investments: loadUserInvestments(u.email).length ? loadUserInvestments(u.email) : getDemoInvestments()
  };
}

export async function seedDemoData() {
  const users = loadUsers();
  if (users.length) return { seeded: false };
  const demoUsers = [
    {
      id: 'u1',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      passwordHash: await hashPassword('Password1')
    },
    {
      id: 'u2',
      firstName: 'Rita',
      lastName: 'Investor',
      email: 'rita@example.com',
      passwordHash: await hashPassword('Secret2')
    }
  ];
  saveUsers(demoUsers);
  const demoInvestments = [
    { id: 'i1', name: 'Index Fund - Nifty', amount: 12000, date: '2024-10-01' },
    { id: 'i2', name: 'Balanced Advantage', amount: 7000, date: '2024-08-05' }
  ];
  saveUserInvestments(demoUsers[0].email, demoInvestments);
  return { seeded: true, users: demoUsers };
 
}
