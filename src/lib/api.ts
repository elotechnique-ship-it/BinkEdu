import { createClient } from '@metagptx/web-sdk';

// Point API calls at the Atoms/MGX backend instead of the current origin
// (Vercel only serves static files — it has no /api/v1/* backend of its own).
export const client = createClient({
  baseURL: 'https://1411579-8aaf7f2528804dbaa55303e63d1536c3-v1-dev.dev.atoms.dev',
});

// School context helper
export function getSchoolId(): number | null {
  const stored = localStorage.getItem('current_school_id');
  return stored ? parseInt(stored, 10) : null;
}

export function setSchoolId(id: number) {
  localStorage.setItem('current_school_id', String(id));
}

export function getUserRole(): string | null {
  return localStorage.getItem('user_role');
}

export function setUserRole(role: string) {
  localStorage.setItem('user_role', role);
}
