import type { User, Ticket, EngineerProfile, TicketMessage, SystemMetrics, AIDiagnosticResult, UserRole } from "../types.ts";
import { auth, db, handleFirestoreError, OperationType } from "./firebase.ts";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection, query, orderBy, limit } from "firebase/firestore";

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

  /**
   * Sync active Firebase User profile to backend server
   */
  syncFirebaseSession: async (user: User, profile?: EngineerProfile | null) => {
    return fetchApi<{ success: boolean; user: User & { engineer_profiles?: EngineerProfile[] }; role: string }>(
      "/auth/firebase-sync",
      {
        method: "POST",
        body: JSON.stringify({ user, profile }),
      }
    );
  },

  /**
   * Real Email/Password Authentication & Registration in Firebase Auth + Firestore
   */
  firebaseRegister: async (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    company?: string;
    phone?: string;
    city?: string;
  }) => {
    // 1. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    const fbUser = userCredential.user;

    // 2. Update display name
    await updateProfile(fbUser, {
      displayName: `${payload.first_name} ${payload.last_name}`,
    }).catch(() => {});

    // 3. Construct user model
    const newUser: User = {
      id: fbUser.uid,
      email: fbUser.email || payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      role: payload.role,
      company: payload.company || (payload.role === "client" ? "Independent Client" : "TechRescue Specialist"),
      phone: payload.phone || "",
      city: payload.city || "Mumbai",
      country: "India",
      state: "Maharashtra",
      online: true,
      created_at: new Date().toISOString(),
      jobs_completed: 0,
      total_earnings: 0,
      rating: 5.0,
      avatar_url:
        payload.role === "client"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    };

    // 4. Save to Firestore
    try {
      await setDoc(doc(db, "users", newUser.id), newUser, { merge: true });
    } catch (err) {
      console.warn("Firestore user sync:", err);
    }

    let engineerProf: EngineerProfile | undefined;
    if (payload.role === "expert" || payload.role === "field_engineer") {
      engineerProf = {
        id: `prof-${newUser.id}`,
        user_id: newUser.id,
        role: payload.role === "field_engineer" ? "Field Engineer" : "Cloud Engineer",
        categories: ["Hardware", "Networking", "Cloud Infrastructure"],
        subskills: ["Emergency Dispatch", "Field Triage", "Diagnostic Analysis"],
        hourly_rate: 95,
        dispatch_radius_km: 40,
        experience: "5+ years enterprise support",
        education: "B.Tech Computer Science / Certified Field Specialist",
        toolset_level: "Enterprise L3 Field Kit",
        summary: "Certified engineer equipped for rapid on-site and remote IT triage.",
      };
      try {
        await setDoc(doc(db, "engineer_profiles", newUser.id), engineerProf, { merge: true });
      } catch (err) {
        console.warn("Firestore engineer profile sync:", err);
      }
    }

    // 5. Sync to server session
    const syncRes = await api.syncFirebaseSession(newUser, engineerProf);
    return syncRes;
  },

  /**
   * Real Email/Password Login
   */
  firebaseLogin: async (email: string, password?: string) => {
    if (!password) {
      throw new Error("Password is required for email login.");
    }
    // 1. Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. Fetch document from Firestore
    let userData: User | null = null;
    let engineerProf: EngineerProfile | null = null;

    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        userData = userSnap.data() as User;
      }
      const profSnap = await getDoc(doc(db, "engineer_profiles", uid));
      if (profSnap.exists()) {
        engineerProf = profSnap.data() as EngineerProfile;
      }
    } catch (err) {
      console.warn("Firestore profile fetch:", err);
    }

    if (!userData) {
      // Fallback build if doc was not present
      userData = {
        id: uid,
        email: userCredential.user.email || email,
        first_name: userCredential.user.displayName?.split(" ")[0] || "User",
        last_name: userCredential.user.displayName?.split(" ")[1] || "",
        role: "client",
        online: true,
        created_at: new Date().toISOString(),
      };
    }

    // 3. Sync to server
    const syncRes = await api.syncFirebaseSession(userData, engineerProf);
    return syncRes;
  },

  /**
   * Real Google Sign-In / Gmail ID Authentication
   */
  firebaseGoogleSignIn: async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    // Check if user already has a role profile in Firestore
    try {
      const userSnap = await getDoc(doc(db, "users", fbUser.uid));
      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        let prof: EngineerProfile | null = null;
        const profSnap = await getDoc(doc(db, "engineer_profiles", fbUser.uid));
        if (profSnap.exists()) {
          prof = profSnap.data() as EngineerProfile;
        }
        const syncRes = await api.syncFirebaseSession(userData, prof);
        return { isNewUser: false, user: syncRes.user, role: syncRes.role };
      }
    } catch (err) {
      console.warn("Google Sign-In Firestore check:", err);
    }

    // If new user, return for role selection setup
    return {
      isNewUser: true,
      firebaseUser: {
        uid: fbUser.uid,
        email: fbUser.email || "",
        displayName: fbUser.displayName || "",
        photoURL: fbUser.photoURL || "",
      },
    };
  },

  /**
   * Complete Google Profile for new account
   */
  firebaseCompleteGoogleProfile: async (payload: {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    company?: string;
    phone?: string;
    city?: string;
    avatarUrl?: string;
  }) => {
    const nameParts = payload.displayName.split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    const newUser: User = {
      id: payload.uid,
      email: payload.email,
      first_name: firstName,
      last_name: lastName,
      role: payload.role,
      company: payload.company || (payload.role === "client" ? "Independent Client" : "TechRescue Specialist"),
      phone: payload.phone || "",
      city: payload.city || "Mumbai",
      country: "India",
      state: "Maharashtra",
      online: true,
      created_at: new Date().toISOString(),
      jobs_completed: 0,
      total_earnings: 0,
      rating: 5.0,
      avatar_url:
        payload.avatarUrl ||
        (payload.role === "client"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"),
    };

    try {
      await setDoc(doc(db, "users", newUser.id), newUser, { merge: true });
    } catch (err) {
      console.warn("Firestore Google profile sync:", err);
    }

    let engineerProf: EngineerProfile | undefined;
    if (payload.role === "expert" || payload.role === "field_engineer") {
      engineerProf = {
        id: `prof-${newUser.id}`,
        user_id: newUser.id,
        role: payload.role === "field_engineer" ? "Field Engineer" : "Cloud Engineer",
        categories: ["Hardware", "Networking", "Cloud Infrastructure"],
        subskills: ["Emergency Dispatch", "Field Triage", "Diagnostic Analysis"],
        hourly_rate: 95,
        dispatch_radius_km: 40,
        experience: "5+ years enterprise support",
        education: "B.Tech Computer Science / Certified Field Specialist",
        toolset_level: "Enterprise L3 Field Kit",
        summary: "Certified engineer equipped for rapid on-site and remote IT triage.",
      };
      try {
        await setDoc(doc(db, "engineer_profiles", newUser.id), engineerProf, { merge: true });
      } catch (err) {
        console.warn("Firestore Google engineer profile sync:", err);
      }
    }

    const syncRes = await api.syncFirebaseSession(newUser, engineerProf);
    return syncRes;
  },

  /**
   * Real Logout
   */
  firebaseLogout: async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    return fetchApi<{ success: boolean; message: string }>("/auth/logout", { method: "POST" });
  },

  updateStatus: async (online: boolean) => {
    const res = await fetchApi<{ success: boolean; online: boolean }>("/update-status", {
      method: "POST",
      body: JSON.stringify({ online }),
    });
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), { online }, { merge: true });
      } catch (e) {}
    }
    return res;
  },

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
