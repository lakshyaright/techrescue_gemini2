import React, { useState } from "react";
import {
  Server,
  UserCheck,
  Briefcase,
  Globe,
  Radio,
  PlusCircle,
  ChevronDown,
  Bell,
  MessageSquare,
  ExternalLink,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { User, TicketMessage } from "../types.ts";

interface NavbarProps {
  activePortal: "landing" | "client" | "expert" | "ops" | "auth";
  setActivePortal: (portal: "landing" | "client" | "expert" | "ops" | "auth") => void;
  currentUser: User | null;
  onToggleOnline: () => void;
  onOpenRaiseModal: () => void;
  onOpenAuthModal: (mode?: "login" | "register", role?: "client" | "expert" | "field_engineer", reason?: string) => void;
  onLogout: () => void;
  chatNotifications?: TicketMessage[];
  onOpenChat?: (ticketNumber: string) => void;
  onClearNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePortal,
  setActivePortal,
  currentUser,
  onToggleOnline,
  onOpenRaiseModal,
  onOpenAuthModal,
  onLogout,
  chatNotifications = [],
  onOpenChat,
  onClearNotifications,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const unreadCount = chatNotifications.length;

  const isClient = currentUser?.role === "client";
  const isEngineer = currentUser?.role === "expert" || currentUser?.role === "field_engineer";

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              id="brand-home-btn"
              onClick={() => {
                if (currentUser) {
                  setActivePortal(isClient ? "client" : "expert");
                } else {
                  setActivePortal("landing");
                }
              }}
              className="flex items-center gap-2.5 text-left group transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-extrabold text-white text-lg tracking-wider shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                TR
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    TechRescue
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    HA Edge
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  High-Availability On-Demand IT & Field Rescue
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation: Strictly Adapts to Role */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-sm">
            {/* If NOT logged in */}
            {!currentUser && (
              <>
                <button
                  id="nav-landing-btn"
                  onClick={() => setActivePortal("landing")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    activePortal === "landing"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Platform Overview</span>
                </button>
                <button
                  id="nav-login-gateway-btn"
                  onClick={() => setActivePortal("auth")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    activePortal === "auth"
                      ? "bg-teal-600 text-white shadow-sm font-bold"
                      : "text-teal-400 hover:text-teal-300 hover:bg-slate-700/50"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login Gateway</span>
                </button>
              </>
            )}

            {/* If Logged in as CLIENT */}
            {currentUser && isClient && (
              <>
                <button
                  id="nav-client-btn"
                  onClick={() => setActivePortal("client")}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activePortal === "client"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Client Dashboard</span>
                  <span className="text-[10px] bg-teal-950 text-teal-300 px-1 rounded border border-teal-800 font-mono">
                    My Hub
                  </span>
                </button>
              </>
            )}

            {/* If Logged in as ENGINEER */}
            {currentUser && isEngineer && (
              <>
                <button
                  id="nav-expert-btn"
                  onClick={() => setActivePortal("expert")}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activePortal === "expert"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Engineer Console</span>
                  {currentUser.online && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </button>
              </>
            )}

            {/* Cluster Ops (Available to all for transparency) */}
            <button
              id="nav-ops-btn"
              onClick={() => setActivePortal("ops")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activePortal === "ops"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Server className="w-4 h-4" />
              <span>HA Cluster Ops</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          </nav>

          {/* Right Action & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Raise Ticket Button (Only for Client or logged-out prompts) */}
            {(!currentUser || isClient) && (
              <button
                id="header-raise-query-btn"
                onClick={onOpenRaiseModal}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 sm:px-3.5 py-1.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-emerald-950 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Raise Ticket</span>
              </button>
            )}

            {/* Real-Time Chat Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  id="chat-notifications-btn"
                  onClick={() => {
                    setShowNotificationsMenu(!showNotificationsMenu);
                    setShowUserMenu(false);
                  }}
                  className={`relative p-2 rounded-xl border transition cursor-pointer ${
                    unreadCount > 0
                      ? "bg-teal-950/80 border-teal-600 text-teal-300 shadow-lg shadow-teal-500/20"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                  title="Chat Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotificationsMenu && (
                  <div
                    id="chat-notifications-dropdown"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-bold text-white">Live Chat Alerts</span>
                        {unreadCount > 0 && (
                          <span className="bg-teal-900 text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-teal-700">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && onClearNotifications && (
                        <button
                          onClick={onClearNotifications}
                          className="text-[10px] text-slate-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {chatNotifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          <Bell className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                          <p>No new unread messages.</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            When a client or engineer chats on a ticket, you will be notified instantly here.
                          </p>
                        </div>
                      ) : (
                        chatNotifications.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => {
                              if (onOpenChat) onOpenChat(msg.ticket_number);
                              setShowNotificationsMenu(false);
                            }}
                            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 transition cursor-pointer group"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-teal-300 group-hover:text-teal-200">
                                  {msg.sender_name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                  {msg.ticket_number}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2 leading-snug">{msg.message}</p>
                            <div className="mt-1.5 flex items-center justify-end text-[10px] text-teal-400 font-medium gap-1">
                              <span>Open Ticket Chat</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Engineer Online Toggle */}
            {currentUser && isEngineer && (
              <button
                id="expert-availability-toggle-btn"
                onClick={onToggleOnline}
                title={currentUser.online ? "You are Online and receiving tickets" : "You are Offline"}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                  currentUser.online
                    ? "bg-emerald-950/80 border-emerald-700 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${currentUser.online ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                <span className="hidden lg:inline">{currentUser.online ? "Available" : "Offline"}</span>
              </button>
            )}

            {/* Auth Gateway Buttons vs User Profile Dropdown */}
            {!currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-signin-btn"
                  onClick={() => setActivePortal("auth")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-teal-400" />
                  <span>Sign In</span>
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuthModal("register", "client")}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Create Account</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotificationsMenu(false);
                  }}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-2 sm:px-2.5 py-1.5 rounded-xl text-left transition cursor-pointer"
                >
                  <img
                    src={currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                    alt={currentUser.first_name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-600"
                  />
                  <div className="hidden sm:block text-xs">
                    <div className="font-semibold text-slate-100 flex items-center gap-1">
                      <span>{currentUser.first_name} {currentUser.last_name}</span>
                    </div>
                    <div className="text-[10px] text-teal-400 capitalize flex items-center gap-1 font-mono">
                      <span>{isClient ? "Client" : "Rescue Engineer"}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div
                    id="user-profile-dropdown"
                    className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="pb-3 border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authenticated Account</span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
                          {isClient ? "Client Role" : "Engineer Role"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mt-1">{currentUser.first_name} {currentUser.last_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      {currentUser.company && (
                        <p className="text-[10px] text-teal-400 mt-0.5">{currentUser.company}</p>
                      )}
                    </div>

                    <div className="py-2 space-y-1">
                      <div className="px-2 py-1 text-[11px] text-slate-400">
                        <span>Role: </span>
                        <strong className="text-slate-200 capitalize">{currentUser.role.replace("_", " ")}</strong>
                      </div>
                      <div className="px-2 py-1 text-[11px] text-slate-400">
                        <span>Cluster HA: </span>
                        <span className="text-emerald-400 font-mono">99.994% Active</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        id="user-signout-btn"
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 font-semibold flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Exit session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Portal Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          {!currentUser ? (
            <>
              <button
                onClick={() => setActivePortal("landing")}
                className={`px-2 py-1 rounded cursor-pointer ${activePortal === "landing" ? "text-emerald-400 font-semibold" : "text-slate-400"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActivePortal("auth")}
                className={`px-2 py-1 rounded cursor-pointer ${activePortal === "auth" ? "text-teal-400 font-semibold" : "text-slate-400"}`}
              >
                Login Gateway
              </button>
            </>
          ) : isClient ? (
            <button
              onClick={() => setActivePortal("client")}
              className={`px-2 py-1 rounded cursor-pointer ${activePortal === "client" ? "text-teal-400 font-semibold" : "text-slate-400"}`}
            >
              Client Hub
            </button>
          ) : (
            <button
              onClick={() => setActivePortal("expert")}
              className={`px-2 py-1 rounded cursor-pointer ${activePortal === "expert" ? "text-amber-400 font-semibold" : "text-slate-400"}`}
            >
              Engineer Console
            </button>
          )}

          <button
            onClick={() => setActivePortal("ops")}
            className={`px-2 py-1 rounded cursor-pointer ${activePortal === "ops" ? "text-indigo-400 font-semibold" : "text-slate-400"}`}
          >
            HA Ops
          </button>
        </div>
      </div>
    </header>
  );
};
