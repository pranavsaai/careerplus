import { apiFetch } from "./api";

export async function getUser() {
  try {
    const res = await apiFetch("/api/profile/summary", {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}