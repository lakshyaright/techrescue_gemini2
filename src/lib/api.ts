import type { User, Ticket, EngineerProfile, TicketMessage, SystemMetrics, AIDiagnosticResult } from "../types.ts";
import { db, handleFirestoreError, OperationType } from "./firebase.ts";
import { doc, setDoc, getDocs, collection, query, orderBy, limit } from "firebase/firestore";

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
  getCurrentUser: () => fetchApi<(User & { engineer_profiles?: EngineerProfile[] }) | null>("/me"),
  switchDemoUser: (userId: string) =>
    fetchApi<{ success: boolean; user: User & { engineer_profiles?: EngineerProfile[] } }>("/auth/switch-demo-user", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),
  login: (email: string, password?: string) =>
    fetchApi<{ token: string; user: User & { engineer_profiles?: EngineerProfile[] }; role: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: async (payload: Partial<User>) => {
    const res = await fetchApi<{ token: string; user: User & { engineer_profiles?: EngineerProfile[] }; role: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    try {
      if (res.user) {
        await setDoc(doc(db, "users", res.user.id), res.user, { merge: true });
      }
    } catch (e) {}
    return res;
  },
  logout: () => fetchApi<{ success: boolean; message: string }>("/auth/logout", { method: "POST" }),
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
  raiseQuery: async (ticketData: Partial<Ticket>) => {
    const res = await fetchApi<{ success: boolean; ticket_number: string; ticket: Ticket }>("/raise-query", {
      method: "POST",
      body: JSON.stringify(ticketData),
    });

    // Cloud Firestore synchronization
    try {
      if (res.ticket) {
        await setDoc(doc(db, "tickets", res.ticket.ticket_number), res.ticket, { merge: true });
      }
    } catch (err) {
      console.warn("Firestore sync warning on raiseQuery:", err);
    }

    return res;
  },
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
  acceptTicket: async (ticketNumber: string) => {
    const res = await fetchApi<{ success: boolean; ticket: Ticket }>("/accept-ticket", {
      method: "POST",
      body: JSON.stringify({ ticket_number: ticketNumber }),
    });
    try {
      if (res.ticket) {
        await setDoc(doc(db, "tickets", ticketNumber), res.ticket, { merge: true });
      }
    } catch (e) {}
    return res;
  },
  resolveTicket: async (ticketNumber: string, resolutionNote: string, resolutionCategory?: string) => {
    const res = await fetchApi<{ success: boolean; ticket: Ticket }>("/resolve-ticket", {
      method: "POST",
      body: JSON.stringify({
        ticket_number: ticketNumber,
        resolution_note: resolutionNote,
        resolution_category: resolutionCategory,
      }),
    });
    try {
      if (res.ticket) {
        await setDoc(doc(db, "tickets", ticketNumber), res.ticket, { merge: true });
      }
    } catch (e) {}
    return res;
  },
  updateQueryStatus: (ticketNumber: string, status: string) =>
    fetchApi<{ success: boolean; ticket: Ticket }>("/update-query-status", {
      method: "POST",
      body: JSON.stringify({ ticket_number: ticketNumber, status }),
    }),
  getMessages: (ticketNumber: string) => fetchApi<TicketMessage[]>(`/messages/${encodeURIComponent(ticketNumber)}`),
  getAllMessages: () => fetchApi<TicketMessage[]>("/all-messages"),
  sendMessage: async (ticketNumber: string, message: string, receiverId?: string) => {
    const res = await fetchApi<{ success: boolean; message: TicketMessage }>("/send-message", {
      method: "POST",
      body: JSON.stringify({ ticket_number: ticketNumber, message, receiver_id: receiverId }),
    });
    try {
      if (res.message) {
        await setDoc(doc(db, "tickets", ticketNumber, "messages", res.message.id), res.message, { merge: true });
      }
    } catch (e) {}
    return res;
  },
  getProfile: () => fetchApi<EngineerProfile>("/profile"),
  saveProfile: (profile: Partial<EngineerProfile>) =>
    fetchApi<{ success: boolean; profile: EngineerProfile }>("/save-profile", {
      method: "POST",
      body: JSON.stringify(profile),
    }),
  diagnoseWithAI: (queryText: string, category?: string, subcategory?: string) =>
    fetchApi<{ success: boolean; diagnostics: AIDiagnosticResult }>("/ai/diagnose", {
      method: "POST",
      body: JSON.stringify({ query: queryText, category, subcategory }),
    }),
  getHAMetrics: () => fetchApi<SystemMetrics>("/system/ha-metrics"),
  simulateFailover: () =>
    fetchApi<{ success: boolean; message: string; cluster_nodes: any[] }>("/system/simulate-failover", {
      method: "POST",
    }),
};
