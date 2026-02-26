export async function apiFetch(url: string, options: RequestInit = {}) {
  return fetch(`http://13.223.68.160:8080${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
