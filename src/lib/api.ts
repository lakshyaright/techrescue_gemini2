import type { User, Ticket, EngineerProfile, TicketMessage, SystemMetrics, AIDiagnosticResult } from "../types.ts";

const API_BASE = "/api";

export async function fetchApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  getCurrentUser: () => fetchApi<User & { engineer_profiles?: EngineerProfile[] }>("/me"),
  switchDemoUser: (userId: string) =>
    fetchApi<{ success: boolean; user: User & { engineer_profiles?: EngineerProfile[] } }>("/auth/switch-demo-user", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),
  login: (email: string) =>
    fetchApi<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  register: (payload: Partial<User>) =>
    fetchApi<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStatus: (online: boolean) =>
    fetchApi<{ success: boolean; online: boolean }>("/update-status", {
      method: "POST",
      body: JSON.stringify({ online }),
    }),
  getClientDashboard: () =>
    fetchApi<{
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      recent: Ticket[];
    }>("/client-dashboard"),
  raiseQuery: (ticketData: Partial<Ticket>) =>
    fetchApi<{ success: boolean; ticket_number: string; ticket: Ticket }>("/raise-query", {
      method: "POST",
      body: JSON.stringify(ticketData),
    }),
  getQueryHistory: () => fetchApi<Ticket[]>("/query-history"),
  getTicket: (ticketNumber: string) => fetchApi<Ticket>(`/queries/${encodeURIComponent(ticketNumber)}`),
  getExperts: (params?: { search?: string; category?: string; location?: string; online?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.location) searchParams.set("location", params.location);
    if (params?.online !== undefined) searchParams.set("online", String(params.online));
    return fetchApi<(User & { engineer_profiles: EngineerProfile[] })[]>(`/experts?${searchParams.toString()}`);
  },
  getFieldEngineers: (params?: { search?: string; location?: string; online?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.location) searchParams.set("location", params.location);
    if (params?.online !== undefined) searchParams.set("online", String(params.online));
    return fetchApi<(User & { engineer_profiles: EngineerProfile[] })[]>(`/field-engineers?${searchParams.toString()}`);
  },
  getExpertAlerts: () => fetchApi<Ticket[]>("/expert-alerts"),
  getEngineerAlerts: () => fetchApi<Ticket[]>("/engineer-alerts"),
  acceptTicket: (ticketNumber: string) =>
    fetchApi<{ success: boolean; ticket: Ticket }>("/accept-ticket", {
      method: "POST",
      body: JSON.stringify({ ticket_number: ticketNumber }),
    }),
  resolveTicket: (ticketNumber: string, resolutionNote: string, resolutionCategory?: string) =>
    fetchApi<{ success: boolean; ticket: Ticket }>("/resolve-ticket", {
      method: "POST",
      body: JSON.stringify({
        ticket_number: ticketNumber,
        resolution_note: resolutionNote,
        resolution_category: resolutionCategory,
      }),
    }),
  updateQueryStatus: (ticketNumber: string, status: string) =>
    fetchApi<{ success: boolean; ticket: Ticket }>("/update-query-status", {
      method: "POST",
      body: JSON.stringify({ ticket_number: ticketNumber, status }),
    }),
  getMessages: (ticketNumber: string) => fetchApi<TicketMessage[]>(`/messages/${encodeURIComponent(ticketNumber)}`),
  sendMessage: (ticketNumber: string, message: string, receiverId?: string) =>
    fetchApi<{ success: boolean; message: TicketMessage }>("/send-message", {
      method: "POST",
      body: JSON.stringify({ ticket_number: ticketNumber, message, receiver_id: receiverId }),
    }),
  getProfile: () => fetchApi<EngineerProfile>("/profile"),
  saveProfile: (profile: Partial<EngineerProfile>) =>
    fetchApi<{ success: boolean; profile: EngineerProfile }>("/save-profile", {
      method: "POST",
      body: JSON.stringify(profile),
    }),
  diagnoseWithAI: (query: string, category?: string, subcategory?: string) =>
    fetchApi<{ success: boolean; diagnostics: AIDiagnosticResult }>("/ai/diagnose", {
      method: "POST",
      body: JSON.stringify({ query, category, subcategory }),
    }),
  getHAMetrics: () => fetchApi<SystemMetrics>("/system/ha-metrics"),
  simulateFailover: () =>
    fetchApi<{ success: boolean; message: string; cluster_nodes: any[] }>("/system/simulate-failover", {
      method: "POST",
    }),
};
