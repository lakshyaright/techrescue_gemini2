import React, { useState } from "react";
import {
  ShieldAlert,
  Server,
  UserCheck,
  Briefcase,
  Layers,
  Globe,
  Radio,
  PlusCircle,
  ChevronDown,
  Sparkles,
  Bell,
  MessageSquare,
  X,
  ExternalLink,
} from "lucide-react";
import type { User, TicketMessage } from "../types.ts";

interface NavbarProps {
  activePortal: "landing" | "client" | "expert" | "ops";
  setActivePortal: (portal: "landing" | "client" | "expert" | "ops") => void;
  currentUser: User | null;
  onSwitchUser: (userId: string) => void;
  onToggleOnline: () => void;
  onOpenRaiseModal: () => void;
  chatNotifications?: TicketMessage[];
  onOpenChat?: (ticketNumber: string) => void;
  onClearNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePortal,
  setActivePortal,
  currentUser,
  onSwitchUser,
  onToggleOnline,
  onOpenRaiseModal,
  chatNotifications = [],
  onOpenChat,
  onClearNotifications,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const demoUsers = [
    { id: "usr-client-1", name: "Lakshya Sharma", role: "Client (Director of IT)", company: "Apex Global Tech" },
    { id: "usr-expert-1", name: "Alex Rivera", role: "Remote Cloud Expert", company: "CloudScale Systems" },
    { id: "usr-expert-2", name: "Rajesh Kumar", role: "On-Site Field Engineer", company: "Metro Hardware" },
    { id: "usr-expert-3", name: "Sarah Jenkins", role: "Network Security Specialist", company: "CyberShield Net" },
  ];

  const unreadCount = chatNotifications.length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              id="brand-home-btn"
              onClick={() => setActivePortal("landing")}
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

          {/* Center Navigation: Workspaces */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-sm">
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
              <span>Platform</span>
            </button>

            <button
              id="nav-client-btn"
              onClick={() => setActivePortal("client")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activePortal === "client"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Client Portal</span>
            </button>

            <button
              id="nav-expert-btn"
              onClick={() => setActivePortal("expert")}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activePortal === "expert"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Engineer Console</span>
              {currentUser?.online && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

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
            {/* Real-Time Chat Notification Bell */}
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

            {/* Quick Raise Ticket Button */}
            <button
              id="header-raise-query-btn"
              onClick={onOpenRaiseModal}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 sm:px-3.5 py-1.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-emerald-950 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Raise Ticket</span>
            </button>

            {/* Engineer Online Toggle */}
            {currentUser && (currentUser.role === "expert" || currentUser.role === "field_engineer") && (
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

            {/* User Profile Switcher */}
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
                  src={currentUser?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                  alt={currentUser?.first_name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-600"
                />
                <div className="hidden sm:block text-xs">
                  <div className="font-semibold text-slate-100 flex items-center gap-1">
                    <span>{currentUser?.first_name} {currentUser?.last_name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                    <span>{currentUser?.role?.replace("_", " ")}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div
                  id="user-profile-dropdown"
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-medium text-slate-400">Switch Demo Perspective</p>
                    <p className="text-[11px] text-slate-500">Test client or engineer experiences in 1-click</p>
                  </div>
                  <div className="py-1 space-y-1">
                    {demoUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                          currentUser?.id === u.id
                            ? "bg-emerald-950/70 text-emerald-300 font-semibold border border-emerald-800/60"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-slate-100">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.role}</p>
                        </div>
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 mt-1 border-t border-slate-800">
                    <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Status</span>
                      <span className="text-emerald-400 font-mono">99.994% HA Online</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Portal Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActivePortal("landing")}
            className={`px-2 py-1 rounded cursor-pointer ${activePortal === "landing" ? "text-emerald-400 font-semibold" : "text-slate-400"}`}
          >
            Showcase
          </button>
          <button
            onClick={() => setActivePortal("client")}
            className={`px-2 py-1 rounded cursor-pointer ${activePortal === "client" ? "text-teal-400 font-semibold" : "text-slate-400"}`}
          >
            Client Hub
          </button>
          <button
            onClick={() => setActivePortal("expert")}
            className={`px-2 py-1 rounded cursor-pointer ${activePortal === "expert" ? "text-amber-400 font-semibold" : "text-slate-400"}`}
          >
            Engineer Console
          </button>
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
