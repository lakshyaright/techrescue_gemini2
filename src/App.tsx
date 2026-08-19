import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar.tsx";
import { AuthPortalView } from "./components/AuthPortalView.tsx";
import { PublicLanding } from "./components/PublicLanding.tsx";
import { ClientPortal } from "./components/ClientPortal.tsx";
import { ExpertPortal } from "./components/ExpertPortal.tsx";
import { OperationsCenter } from "./components/OperationsCenter.tsx";
import { TicketDetailModal } from "./components/TicketDetailModal.tsx";
import { TicketChatModal } from "./components/TicketChatModal.tsx";
import { RaiseQueryModal } from "./components/RaiseQueryModal.tsx";
import { ChatNotificationToast } from "./components/ChatNotificationToast.tsx";
import { AuthModal } from "./components/AuthModal.tsx";
import { api } from "./lib/api.ts";
import { playNotificationSound } from "./lib/notificationSound.ts";
import type { User, Ticket, TicketMessage, UserRole } from "./types.ts";

export default function App() {
  const [activePortal, setActivePortal] = useState<"auth" | "landing" | "client" | "expert" | "ops">("auth");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [inspectedTicket, setInspectedTicket] = useState<Ticket | null>(null);
  const [activeChatTicketNumber, setActiveChatTicketNumber] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication Modal state (for quick in-page prompts)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [authModalRole, setAuthModalRole] = useState<UserRole>("client");
  const [authReasonMessage, setAuthReasonMessage] = useState<string | undefined>(undefined);

  // Chat notification state
  const [chatNotifications, setChatNotifications] = useState<TicketMessage[]>([]);
  const [activeChatAlert, setActiveChatAlert] = useState<TicketMessage | null>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const loadCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser();
      if (user && user.id) {
        setCurrentUser(user);
        if (user.role === "client") {
          setActivePortal("client");
        } else if (user.role === "expert" || user.role === "field_engineer") {
          setActivePortal("expert");
        }
      } else {
        setCurrentUser(null);
        setActivePortal("auth");
      }
    } catch (err) {
      console.debug("No active user session:", err);
      setCurrentUser(null);
      setActivePortal("auth");
    }
  };

  // Poll for live messages across all tickets and trigger instant notifications
  const pollNewMessages = async () => {
    try {
      const allMsgs = await api.getAllMessages();
      if (!allMsgs || !Array.isArray(allMsgs)) return;

      if (!initialLoadDoneRef.current) {
        // First run: populate known IDs without alert storm
        allMsgs.forEach((m) => knownMessageIdsRef.current.add(m.id));
        initialLoadDoneRef.current = true;
        return;
      }

      // Check for incoming messages
      for (const msg of allMsgs) {
        if (!knownMessageIdsRef.current.has(msg.id)) {
          knownMessageIdsRef.current.add(msg.id);

          // If message is from someone else, trigger notification
          if (currentUser && msg.sender_id !== currentUser.id) {
            playNotificationSound();
            setActiveChatAlert(msg);
            setChatNotifications((prev) => [msg, ...prev.filter((p) => p.id !== msg.id)]);
          }
        }
      }
    } catch (err) {
      // Silently ignore background polling glitches
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    pollNewMessages();
    const interval = setInterval(pollNewMessages, 2500);
    return () => clearInterval(interval);
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAuth = (
    mode: "login" | "register" = "login",
    role: UserRole = "client",
    reason?: string
  ) => {
    setAuthModalMode(mode);
    setAuthModalRole(role);
    setAuthReasonMessage(reason);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: User, redirectPortal: "client" | "expert") => {
    setCurrentUser(user);
    setActivePortal(redirectPortal);
    showToast(
      `Welcome, ${user.first_name}! Logged into ${
        redirectPortal === "client" ? "Client Dashboard" : "Engineer Console"
      }.`
    );
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setCurrentUser(null);
    setActivePortal("auth");
    showToast("You have been signed out. Please log in with your credentials.");
  };

  const handleToggleOnline = async () => {
    if (!currentUser) return;
    try {
      const res = await api.updateStatus(!currentUser.online);
      setCurrentUser((prev) => (prev ? { ...prev, online: res.online } : null));
      showToast(res.online ? "Status set to Available / Online" : "Status set to Offline");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    showToast(`Emergency Ticket ${newTicket.ticket_number} successfully dispatched!`);
    setInspectedTicket(newTicket);
  };

  const handleOpenChat = (ticketNumber: string) => {
    setActiveChatAlert(null);
    setChatNotifications((prev) => prev.filter((m) => m.ticket_number !== ticketNumber));
    setActiveChatTicketNumber(ticketNumber);
  };

  const handleRaiseTicketRequest = () => {
    if (!currentUser) {
      handleOpenAuth(
        "register",
        "client",
        "Please sign in or create your Client Account to dispatch on-demand IT & field rescue."
      );
      return;
    }
    if (currentUser.role !== "client") {
      showToast("Only Client accounts can dispatch tickets. You are logged in as an Engineer.");
      return;
    }
    setIsRaiseModalOpen(true);
  };

  const isClient = currentUser?.role === "client";
  const isEngineer = currentUser?.role === "expert" || currentUser?.role === "field_engineer";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Real-Time Chat Notification Toast */}
      {activeChatAlert && (
        <ChatNotificationToast
          message={activeChatAlert}
          onOpenChat={handleOpenChat}
          onDismiss={() => setActiveChatAlert(null)}
        />
      )}

      {/* Main Header & Workspace Switcher with Chat Notification Bell and Role Badges */}
      <Navbar
        activePortal={activePortal}
        setActivePortal={(portal) => {
          if (!currentUser && (portal === "client" || portal === "expert")) {
            handleOpenAuth(
              "login",
              portal === "client" ? "client" : "expert",
              `Please log in to access the ${portal === "client" ? "Client Portal" : "Engineer Console"}.`
            );
            return;
          }
          if (currentUser) {
            if (portal === "client" && !isClient) {
              showToast("Your account is registered as a Rescue Engineer.");
              return;
            }
            if (portal === "expert" && !isEngineer) {
              showToast("Your account is registered as a Client.");
              return;
            }
          }
          setActivePortal(portal);
        }}
        currentUser={currentUser}
        onToggleOnline={handleToggleOnline}
        onOpenRaiseModal={handleRaiseTicketRequest}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
        chatNotifications={chatNotifications}
        onOpenChat={handleOpenChat}
        onClearNotifications={() => setChatNotifications([])}
      />

      {/* Main Content View Container */}
      <main className="flex-1">
        {/* VIEW 1: AUTH GATEWAY (Default for unauthenticated users) */}
        {activePortal === "auth" && !currentUser && (
          <AuthPortalView
            onAuthSuccess={handleAuthSuccess}
            onExploreShowcase={() => setActivePortal("landing")}
          />
        )}

        {/* VIEW 2: PUBLIC PLATFORM SHOWCASE (Explore features, SLAs, AI diagnostics) */}
        {activePortal === "landing" && (
          <PublicLanding
            onOpenRaiseModal={handleRaiseTicketRequest}
            onNavigateToClient={() => {
              if (!currentUser) {
                handleOpenAuth("login", "client", "Sign in with your Client credentials to access the Client Hub.");
              } else {
                setActivePortal("client");
              }
            }}
            onNavigateToExpert={() => {
              if (!currentUser) {
                handleOpenAuth("login", "expert", "Sign in with your Engineer credentials to access the Engineer Console.");
              } else {
                setActivePortal("expert");
              }
            }}
            onNavigateToOps={() => setActivePortal("ops")}
          />
        )}

        {/* VIEW 3: CLIENT PORTAL (Protected for Clients) */}
        {activePortal === "client" && (
          currentUser && isClient ? (
            <ClientPortal
              currentUser={currentUser}
              onOpenRaiseModal={handleRaiseTicketRequest}
              onInspectTicket={(t) => setInspectedTicket(t)}
              onOpenChat={handleOpenChat}
            />
          ) : (
            <AuthPortalView
              onAuthSuccess={handleAuthSuccess}
              onExploreShowcase={() => setActivePortal("landing")}
            />
          )
        )}

        {/* VIEW 4: ENGINEER CONSOLE (Protected for Rescue Engineers) */}
        {activePortal === "expert" && (
          currentUser && isEngineer ? (
            <ExpertPortal
              currentUser={currentUser}
              onToggleOnline={handleToggleOnline}
              onInspectTicket={(t) => setInspectedTicket(t)}
              onOpenChat={handleOpenChat}
            />
          ) : (
            <AuthPortalView
              onAuthSuccess={handleAuthSuccess}
              onExploreShowcase={() => setActivePortal("landing")}
            />
          )
        )}

        {/* VIEW 5: HA CLUSTER OPERATIONS (Transparent to all users) */}
        {activePortal === "ops" && <OperationsCenter />}
      </main>

      {/* Authentication Modal (Pop-up when triggered from action buttons) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        defaultRole={authModalRole}
        reasonMessage={authReasonMessage}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Ticket Creation Modal */}
      {isRaiseModalOpen && (
        <RaiseQueryModal
          onClose={() => setIsRaiseModalOpen(false)}
          onTicketCreated={handleTicketCreated}
        />
      )}

      {/* Ticket Details Inspector Modal */}
      {inspectedTicket && (
        <TicketDetailModal
          ticket={inspectedTicket}
          onClose={() => setInspectedTicket(null)}
          onOpenChat={(ticketNum) => {
            setInspectedTicket(null);
            handleOpenChat(ticketNum);
          }}
        />
      )}

      {/* Ticket Live Chat Modal */}
      {activeChatTicketNumber && (
        <TicketChatModal
          ticketNumber={activeChatTicketNumber}
          currentUser={currentUser}
          onClose={() => setActiveChatTicketNumber(null)}
        />
      )}

      {/* Application Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white font-bold flex items-center justify-center text-sm">
              TR
            </div>
            <div>
              <p className="font-bold text-white">TechRescue High-Availability Platform</p>
              <p className="text-[11px] text-slate-500">Enterprise On-Demand IT & Field Engineer Network</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Multi-Region Cluster: Operational
            </span>
            <span>SLA Target: 99.994%</span>
            <span>Single Identity Access Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
