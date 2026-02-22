export async function apiFetch(url: string, options: RequestInit = {}) {
  return fetch(`http://localhost:8080${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}