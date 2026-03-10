const KEY = "mess_auth";

export function saveAuth(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
export function getAuth() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
  catch { return null; }
}
export function getToken() {
  return getAuth()?.access_token || null;
}
export function getUser() {
  return getAuth()?.user || null;
}
export function logout() {
  localStorage.removeItem(KEY);
}
export function isLoggedIn() {
  return !!getToken();
}