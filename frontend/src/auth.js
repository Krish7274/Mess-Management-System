export function saveAuth(data) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("user_name", data.user.name);
  localStorage.setItem("role", data.user.role);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_name");
  localStorage.removeItem("role");
}