const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// ── Helper ─────────────────────────────────────────────
async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept":       "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ───────────────────────────────────────────────
export async function apiLogin(email: string, password: string) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("admin_token", data.token);
  localStorage.setItem("admin_user",  JSON.stringify(data.user));
  return data;
}

export async function apiLogout() {
  await request("/auth/logout", { method: "POST" });
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}

export function getStoredUser() {
  const u = localStorage.getItem("admin_user");
  return u ? JSON.parse(u) : null;
}

export function getStoredToken() {
  return localStorage.getItem("admin_token");
}

// ── Shipments ──────────────────────────────────────────
export async function apiGetShipments(country?: string) {
  const q = country ? `?country=${country}` : "";
  return request(`/shipments${q}`);
}

export async function apiTrackShipment(trackingId: string) {
  return request(`/shipments/track/${trackingId}`);
}

export async function apiCreateShipment(data: Record<string, any>) {
  return request("/shipments", { method: "POST", body: JSON.stringify(data) });
}

export async function apiUpdateShipment(id: string, data: Record<string, any>) {
  return request(`/shipments/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function apiDeleteShipment(id: string) {
  return request(`/shipments/${id}`, { method: "DELETE" });
}

// ── Riders ─────────────────────────────────────────────
export async function apiGetRiders(country?: string) {
  const q = country ? `?country=${country}` : "";
  return request(`/riders${q}`);
}

export async function apiGetRider(id: string) {
  return request(`/riders/${id}`);
}

export async function apiCreateRider(data: Record<string, any>) {
  return request("/riders", { method: "POST", body: JSON.stringify(data) });
}

export async function apiUpdateRider(id: string, data: Record<string, any>) {
  return request(`/riders/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function apiDeleteRider(id: string) {
  return request(`/riders/${id}`, { method: "DELETE" });
}

// ── Areas ──────────────────────────────────────────────
export async function apiGetAreas(country?: string) {
  const q = country ? `?country=${country}` : "";
  return request(`/areas${q}`);
}

export async function apiCreateArea(data: Record<string, any>) {
  return request("/areas", { method: "POST", body: JSON.stringify(data) });
}

export async function apiUpdateArea(id: string, data: Record<string, any>) {
  return request(`/areas/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function apiDeleteArea(id: string) {
  return request(`/areas/${id}`, { method: "DELETE" });
}

// ── Vehicles ───────────────────────────────────────────
export async function apiGetVehicles(country?: string) {
  const q = country ? `?country=${country}` : "";
  return request(`/vehicles${q}`);
}

export async function apiCreateVehicle(data: Record<string, any>) {
  return request("/vehicles", { method: "POST", body: JSON.stringify(data) });
}

export async function apiUpdateVehicle(id: string, data: Record<string, any>) {
  return request(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function apiDeleteVehicle(id: string) {
  return request(`/vehicles/${id}`, { method: "DELETE" });
}

// ── Pricing ────────────────────────────────────────────
export async function apiGetInlandPricing(country?: string, vehicleType?: string) {
  const params = new URLSearchParams();
  if (country)     params.append("country",      country);
  if (vehicleType) params.append("vehicle_type", vehicleType);
  const q = params.toString() ? `?${params}` : "";
  return request(`/pricing/inland${q}`);
}

export async function apiGetCrossBorderPricing(fromCountry?: string, toCountry?: string, vehicleType?: string) {
  const params = new URLSearchParams();
  if (fromCountry) params.append("from_country", fromCountry);
  if (toCountry)   params.append("to_country",   toCountry);
  if (vehicleType) params.append("vehicle_type", vehicleType);
  const q = params.toString() ? `?${params}` : "";
  return request(`/pricing/crossborder${q}`);
}

export async function apiUpdateInlandPricing(id: string, data: Record<string, any>) {
  return request(`/pricing/inland/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function apiUpdateCrossBorderPricing(id: string, data: Record<string, any>) {
  return request(`/pricing/crossborder/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

// ── Earnings ───────────────────────────────────────────
export async function apiGetEarningsConfig() {
  return request("/earnings");
}

export async function apiUpdateEarningsConfig(id: string, percentage: number) {
  return request(`/earnings/${id}`, { method: "PUT", body: JSON.stringify({ percentage }) });
}

// ── Search ─────────────────────────────────────────────
export async function apiSearchShipments(query: string) {
    return request(`/shipments?search=${encodeURIComponent(query)}`);
  }