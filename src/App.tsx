import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar.tsx";
import { PublicLanding } from "./components/PublicLanding.tsx";
import { ClientPortal } from "./components/ClientPortal.tsx";
import { ExpertPortal } from "./components/ExpertPortal.tsx";
import { OperationsCenter } from "./components/OperationsCenter.tsx";
import { TicketDetailModal } from "./components/TicketDetailModal.tsx";
import { TicketChatModal } from "./components/TicketChatModal.tsx";
import { RaiseQueryModal } from "./components/RaiseQueryModal.tsx";
import { ChatNotificationToast } from "./components/ChatNotificationToast.tsx";
import { api } from "./lib/api.ts";
import { playNotificationSound } from "./lib/notificationSound.ts";
import type { User, Ticket, TicketMessage } from "./types.ts";

export default function App() {
  const [activePortal, setActivePortal] = useState<"landing" | "client" | "expert" | "ops">("client");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [inspectedTicket, setInspectedTicket] = useState<Ticket | null>(null);
  const [activeChatTicketNumber, setActiveChatTicketNumber] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat notification state
  const [chatNotifications, setChatNotifications] = useState<TicketMessage[]>([]);
  const [activeChatAlert, setActiveChatAlert] = useState<TicketMessage | null>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const loadCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to load user:", err);
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

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchDemoUser(userId);
      setCurrentUser(res.user);
      showToast(`Switched perspective to ${res.user.first_name} (${res.user.role.replace("_", " ")})`);
      if (res.user.role === "client") {
        setActivePortal("client");
      } else {
        setActivePortal("expert");
      }
    } catch (err: any) {
      console.error(err);
    }
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
    // Dismiss alert for this ticket and open chat
    setActiveChatAlert(null);
    setChatNotifications((prev) => prev.filter((m) => m.ticket_number !== ticketNumber));
    setActiveChatTicketNumber(ticketNumber);
  };

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

      {/* Main Header & Workspace Switcher with Chat Notification Bell */}
      <Navbar
        activePortal={activePortal}
        setActivePortal={setActivePortal}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onToggleOnline={handleToggleOnline}
        onOpenRaiseModal={() => setIsRaiseModalOpen(true)}
        chatNotifications={chatNotifications}
        onOpenChat={handleOpenChat}
        onClearNotifications={() => setChatNotifications([])}
      />

      {/* Main Content View Container */}
      <main className="flex-1">
        {activePortal === "landing" && (
          <PublicLanding
            onOpenRaiseModal={() => setIsRaiseModalOpen(true)}
            onNavigateToClient={() => setActivePortal("client")}
            onNavigateToExpert={() => setActivePortal("expert")}
            onNavigateToOps={() => setActivePortal("ops")}
          />
        )}

        {activePortal === "client" && (
          <ClientPortal
            currentUser={currentUser}
            onOpenRaiseModal={() => setIsRaiseModalOpen(true)}
            onInspectTicket={(t) => setInspectedTicket(t)}
            onOpenChat={handleOpenChat}
          />
        )}

        {activePortal === "expert" && (
          <ExpertPortal
            currentUser={currentUser}
            onToggleOnline={handleToggleOnline}
            onInspectTicket={(t) => setInspectedTicket(t)}
            onOpenChat={handleOpenChat}
          />
        )}

        {activePortal === "ops" && <OperationsCenter />}
      </main>

      {/* Modals */}
      {isRaiseModalOpen && (
        <RaiseQueryModal
          onClose={() => setIsRaiseModalOpen(false)}
          onTicketCreated={handleTicketCreated}
        />
      )}

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
            <span>ISO 27001 & ITIL Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
