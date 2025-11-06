// Simple localStorage-based auth utilities using only allowed concepts.
// Data shape: users stored under key 'mf_users' as JSON array of {id, firstName, lastName, email, passwordHash}
// Current user email stored under key 'mf_current_user'.

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
  // Not secure; demonstration only.
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit int
  }
  return String(hash);
}

export function registerUser({ firstName, lastName, email, password }) {
  const users = loadUsers();
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { ok: false, error: 'Email already registered' };
  }
  const user = {
    id: Date.now().toString(),
    firstName,
    lastName,
    email,
    passwordHash: simpleHash(password)
  };
  users.push(user);
  saveUsers(users);
  localStorage.setItem(CURRENT_KEY, email);
  // notify same-window listeners
  try { window.dispatchEvent(new Event('mf_auth_change')); } catch (e) {}
  return { ok: true, user };
}

export function loginUser({ email, password }) {
  const users = loadUsers();
  const hash = simpleHash(password);
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
  try { window.dispatchEvent(new Event('mf_auth_change')); } catch (e) {}
}

export function getCurrentUser() {
  const email = localStorage.getItem(CURRENT_KEY);
  if (!email) return null;
  const users = loadUsers();
  return users.find(u => u.email === email) || null;
}

export function getDemoInvestments() {
  // return a small set of demo investments
  return [
    { id: 'd1', name: 'Large Cap Fund', amount: 15000, date: '2024-12-01' },
    { id: 'd2', name: 'SIP Growth', amount: 5000, date: '2025-01-15' },
    { id: 'd3', name: 'Debt Fund', amount: 8000, date: '2024-11-10' }
  ];
}

// Return all registered users (for demo/admin purposes)
export function getAllUsers() {
  return loadUsers();
}

// Per-user investments are stored under key mf_investments_<email>
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

// Return a demo full user data object for the first user if exists (for quick sample)
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

// Seed demo data if no users exist. Safe: only runs when there are no users.
export function seedDemoData() {
  const users = loadUsers();
  if (users.length) return { seeded: false };
  const demoUsers = [
    {
      id: 'u1',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      passwordHash: simpleHash('Password1')
    },
    {
      id: 'u2',
      firstName: 'Rita',
      lastName: 'Investor',
      email: 'rita@example.com',
      passwordHash: simpleHash('Secret2')
    }
  ];
  saveUsers(demoUsers);
  // seed investments for demo user
  const demoInvestments = [
    { id: 'i1', name: 'Index Fund - Nifty', amount: 12000, date: '2024-10-01' },
    { id: 'i2', name: 'Balanced Advantage', amount: 7000, date: '2024-08-05' }
  ];
  saveUserInvestments(demoUsers[0].email, demoInvestments);
  // do not auto-login; leave current user empty
  return { seeded: true, users: demoUsers };
}
