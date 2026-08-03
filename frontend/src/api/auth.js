import httpClient, { setAccessToken } from './httpClient';

export async function register({ email, password, username }) {
  const data = await httpClient.post('/auth/register', { email, password, username });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function login({ email, password }) {
  const data = await httpClient.post('/auth/login', { email, password });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function refresh() {
  const data = await httpClient.refreshAccessToken();
  return data;
}

export async function logout({ everywhere = false } = {}) {
  try {
    await httpClient.post('/auth/logout', { everywhere });
  } finally {
    setAccessToken(null);
  }
}

export async function me() {
  const data = await httpClient.get('/auth/me');
  return data.user;
}

export async function updateMe({ username }) {
  const data = await httpClient.patch('/auth/me', { username });
  return data.user;
}

export async function forgotPassword(email) {
  return httpClient.post('/auth/forgot-password', { email });
}

export async function resetPassword({ token, newPassword }) {
  return httpClient.post('/auth/reset-password', { token, newPassword });
}

export async function deleteAccount() {
  await httpClient.delete('/api/account');
  setAccessToken(null);
}
