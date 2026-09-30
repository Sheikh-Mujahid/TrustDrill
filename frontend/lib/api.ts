export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nwis_token");
}

export function setSession(token: string, user: unknown) {
  localStorage.setItem("nwis_token", token);
  localStorage.setItem("nwis_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("nwis_token");
  localStorage.removeItem("nwis_user");
}

export function getUser(): { email: string; full_name: string; role: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("nwis_user");
  return raw ? JSON.parse(raw) : null;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("csv") || ct.includes("pdf") || ct.includes("octet-stream")) {
    return (await res.blob()) as T;
  }
  return res.json();
}

export function severityClass(sev: string) {
  if (sev === "critical") return "bg-red-700 text-white";
  if (sev === "high") return "bg-orange-600 text-white";
  if (sev === "medium") return "bg-amber-500 text-slate-900";
  return "bg-slate-500 text-white";
}

export function statusClass(s: string) {
  if (s === "healthy" || s === "drilling" || s === "open") return "text-emerald-400";
  if (s === "idle" || s === "acknowledged") return "text-amber-400";
  if (s === "not_connected" || s === "error") return "text-slate-400";
  return "text-slate-300";
}
