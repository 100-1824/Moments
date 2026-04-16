/**
 * Moments API client.
 *
 * All requests are sent to /api (proxied to the Laravel backend by Vite in
 * dev, and to the Vercel serverless function in production).
 *
 * Token is read from / written to localStorage on every call — no module-
 * level singleton that would break SSR or tests.
 */

const BASE = "/api";

// ─── Storage helpers ────────────────────────────────────────────────────────

// noinspection JSUnusedGlobalSymbols
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// SNYK-JS-IGNORE-NEXT-LINE: HardcodedNonCryptoSecret - localStorage key names, not secrets
export const TOKEN_KEY = "moments_token";
export const QUEUE_KEY = "moments_offline_queue";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  invite_code: string;
  couple_id: string | null;
  timezone: string;
  last_seen_at: string | null;
  created_at: string;
  is_admin: boolean;
}

export interface ApiCouple {
  id: string;
  status: string;
  linked_at: string;
}

export interface ApiMoment {
  id: string;
  user_id: string;
  couple_id: string;
  type: "image" | "audio";
  media_url: string;
  caption_payload: string | null;
  is_encrypted: boolean;
  captured_at: string | null;
  slot: "morning" | "evening" | "night";
  created_at: string;
}

export interface QueuedMoment {
  client_id: string;
  type: "image" | "audio";
  fileDataUrl: string;    // base64 data URL stored offline
  fileName: string;
  mimeType: string;
  caption_payload: string | null;
  is_encrypted: boolean;
  captured_at: string;
  slot: "morning" | "evening" | "night" | null;
}

// ─── Core fetch wrapper ─────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData — the browser sets the boundary.
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    // For validation errors (422), extract field-specific error messages
    let errorMessage = body.message ?? `HTTP ${res.status}`;
    if (res.status === 422 && body.errors && typeof body.errors === 'object') {
      // Get the first validation error message
      const firstField = Object.keys(body.errors)[0];
      if (firstField && Array.isArray(body.errors[firstField])) {
        errorMessage = body.errors[firstField][0];
      }
    }

    throw new ApiError(
      res.status,
      errorMessage,
      body.errors,
    );
  }

  return res.json() as Promise<T>;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function sendOtp(
  email: string,
  adminPortal: boolean = false,
): Promise<{ message: string; otp?: string }> {
  const res = await request<{
    status: string;
    data: { message: string; otp?: string };
  }>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email, admin_portal: adminPortal }),
  });
  return res.data;
}

export async function verifyOtp(
  params: {
    email: string;
    code: string;
    name?: string;
    timezone?: string;
  }
): Promise<{ user: ApiUser; token: string }> {
  const res = await request<{
    status: string;
    data: { user: ApiUser; token: string };
  }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.data;
}

export async function verifyAdminOtp(
  email: string,
  code: string,
): Promise<{ user: ApiUser; token: string }> {
  const res = await request<{
    status: string;
    data: { user: ApiUser; token: string };
  }>("/auth/verify-admin-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  return res.data;
}

export async function register(
  name: string,
  email: string,
  timezone: string,
): Promise<{ user: ApiUser; token: string }> {
  const res = await request<{ status: string; data: { user: ApiUser; token: string } }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ name, email, timezone }),
    },
  );
  return res.data;
}

export async function connect(
  partnerInviteCode: string,
): Promise<{ couple: ApiCouple; user: ApiUser; partner: ApiUser }> {
  const res = await request<{
    status: string;
    data: { couple: ApiCouple; user: ApiUser; partner: ApiUser };
  }>("/auth/connect", {
    method: "POST",
    body: JSON.stringify({ partner_invite_code: partnerInviteCode }),
  });
  return res.data;
}

export async function me(): Promise<{ user: ApiUser; partner: ApiUser | null }> {
  const res = await request<{
    status: string;
    data: { user: ApiUser; partner: ApiUser | null };
  }>("/auth/me");
  return res.data;
}

export async function logout(): Promise<void> {
  await request("/auth/logout", { method: "POST" }).catch(() => {});
  clearToken();
}

// ─── Moments ────────────────────────────────────────────────────────────────

export async function uploadMoment(
  file: File,
  type: "image" | "audio",
  captionPayload: string | null,
  isEncrypted: boolean,
  slot: "morning" | "evening" | "night",
): Promise<{ moment: ApiMoment; remaining_today: number }> {
  const form = new FormData();
  form.append("media", file);
  form.append("type", type);
  form.append("is_encrypted", isEncrypted ? "true" : "false");
  form.append("captured_at", new Date().toISOString());
  form.append("slot", slot);
  if (captionPayload !== null) {
    form.append("caption_payload", captionPayload);
  }

  const res = await request<{
    status: string;
    data: { moment: ApiMoment; remaining_today: number };
  }>("/moments", { method: "POST", body: form });
  return res.data;
}

export async function deleteMoment(id: string): Promise<void> {
  await request(`/moments/${id}`, { method: "DELETE" });
}

export async function fetchTodayMoments(): Promise<{
  moments: ApiMoment[];
  window: { start_utc: string; end_utc: string; timezone: string };
}> {
  const res = await request<{
    status: string;
    data: {
      moments: ApiMoment[];
      window: { start_utc: string; end_utc: string; timezone: string };
    };
  }>("/moments");
  return res.data;
}

export async function syncOfflineQueue(
  queued: QueuedMoment[],
): Promise<{
  accepted: Array<{ client_id: string; moment: ApiMoment }>;
  rejected: Array<{ client_id: string; reason: string }>;
  remaining_today: number;
}> {
  // Sync endpoint expects multipart, one file per queued item
  const form = new FormData();

  const blobs = await Promise.all(
    queued.map(async (item, i) => {
      const res = await fetch(item.fileDataUrl);
      const blob = await res.blob();
      return { blob, item, i };
    }),
  );

  blobs.forEach(({ blob, item, i }) => {
    form.append(`moments[${i}][media]`, blob, item.fileName);
    form.append(`moments[${i}][type]`, item.type);
    form.append(`moments[${i}][client_id]`, item.client_id);
    form.append(`moments[${i}][is_encrypted]`, item.is_encrypted ? "true" : "false");
  });

  const res = await request<{
    status: string;
    data: {
      accepted: Array<{ client_id: string; moment: ApiMoment }>;
      rejected: Array<{ client_id: string; reason: string }>;
      remaining_today: number;
    };
  }>("/moments/sync", { method: "POST", body: form });
  return res.data;
}

// ─── Interactions ────────────────────────────────────────────────────────────

export async function sendPing(): Promise<void> {
  await request("/pings", { method: "POST" });
}

// ─── Export ──────────────────────────────────────────────────────────────────

export async function fetchArchive(): Promise<{
  generated_at: string;
  user: ApiUser;
  partner: ApiUser | null;
  moments: ApiMoment[];
  media: string[];
}> {
  const res = await request<{
    status: string;
    data: {
      generated_at: string;
      user: ApiUser;
      partner: ApiUser | null;
      moments: ApiMoment[];
      media: string[];
    };
  }>("/export/archive");
  return res.data;
}

// ─── Offline queue helpers ────────────────────────────────────────────────────

export function getOfflineQueue(): QueuedMoment[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToOfflineQueue(item: Omit<QueuedMoment, "client_id">): QueuedMoment {
  const queued: QueuedMoment = {
    ...item,
    client_id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const q = getOfflineQueue();
  q.push(queued);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  return queued;
}

export function removeFromOfflineQueue(clientIds: string[]): void {
  const q = getOfflineQueue().filter((item) => !clientIds.includes(item.client_id));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminAnalytics {
  users_total: number;
  couples_total: number;
  moments_total: number;
  moments_by_type: { image: number; audio: number };
  moments_encrypted: number;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const res = await request<{ status: string; data: AdminAnalytics }>("/admin/analytics");
  return res.data;
}

export async function adminDeleteMoment(id: string): Promise<void> {
  await request(`/admin/moments/${id}`, { method: "DELETE" });
}

export { ApiError };

// ─── Notes (Foggy Mirror Notepad) ────────────────────────────────────────────

export interface ApiNote {
  id: string;
  /** null when receiver has not yet revealed */
  content: string | null;
  is_author: boolean;
  is_revealed: boolean;
  revealed_at: string | null;
  created_at: string;
}

export async function getLatestNote(): Promise<ApiNote | null> {
  const res = await request<{ status: string; data: { note: ApiNote | null } }>("/notes/latest");
  return res.data.note;
}

export async function writeNote(content: string): Promise<ApiNote> {
  const res = await request<{ status: string; data: { note: ApiNote } }>("/notes", {
    method: "POST",
    body: JSON.stringify({ content }),
    headers: { "Content-Type": "application/json" },
  });
  return res.data.note;
}

export async function revealNote(noteId: string): Promise<ApiNote> {
  const res = await request<{ status: string; data: { note: ApiNote } }>(`/notes/${noteId}/reveal`, {
    method: "POST",
  });
  return res.data.note;
}
