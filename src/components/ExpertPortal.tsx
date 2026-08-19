import React, { useState, useEffect } from "react";
import {
  Briefcase,
  BellRing,
  CheckCircle2,
  Clock,
  Radio,
  User,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  AlertCircle,
  FileCheck,
  Award,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { Ticket, User as UserType, EngineerProfile } from "../types.ts";
import { api } from "../lib/api.ts";
import { generateServiceSlipPDF } from "../lib/pdfGenerator.ts";

interface ExpertPortalProps {
  currentUser: UserType | null;
  onToggleOnline: () => void;
  onInspectTicket: (ticket: Ticket) => void;
  onOpenChat: (ticketNumber: string) => void;
}

export const ExpertPortal: React.FC<ExpertPortalProps> = ({
  currentUser,
  onToggleOnline,
  onInspectTicket,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "alerts" | "jobs" | "profile">("dashboard");
  const [inboundAlerts, setInboundAlerts] = useState<Ticket[]>([]);
  const [activeJobs, setActiveJobs] = useState<Ticket[]>([]);
  const [profile, setProfile] = useState<EngineerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolution Form state
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionCategory, setResolutionCategory] = useState("Hardware Replacement");
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [resolutionSuccess, setResolutionSuccess] = useState("");

  // Profile Edit State
  const [editRole, setEditRole] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState(90);
  const [editSummary, setEditSummary] = useState("");
  const [editDispatchRadius, setEditDispatchRadius] = useState(40);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [alerts, allTickets, prof] = await Promise.all([
        api.getExpertAlerts(),
        api.getQueryHistory(),
        api.getProfile().catch(() => null),
      ]);

      setInboundAlerts(alerts);
      // Active jobs assigned to this user or in_progress
      const myJobs = allTickets.filter(
        (t) => t.assigned_engineer_id === currentUser?.id || (t.status === "in_progress" && !t.assigned_engineer_id)
      );
      setActiveJobs(myJobs);

      if (prof) {
        setProfile(prof);
        setEditRole(prof.role || "");
        setEditHourlyRate(prof.hourly_rate || 90);
        setEditSummary(prof.summary || "");
        setEditDispatchRadius(prof.dispatch_radius_km || 40);
      }
    } catch (err) {
      console.error("Error loading expert portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleAcceptTicket = async (ticketNumber: string) => {
    try {
      await api.acceptTicket(ticketNumber);
      await loadData();
      setActiveTab("jobs");
    } catch (err: any) {
      alert(err.message || "Failed to accept ticket");
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket || !resolutionNote.trim()) return;

    setIsSubmittingResolution(true);
    try {
      await api.resolveTicket(resolvingTicket.ticket_number, resolutionNote, resolutionCategory);

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      setResolutionSuccess(`Ticket ${resolvingTicket.ticket_number} resolved and marked closed.`);
      setResolutionNote("");
      setResolvingTicket(null);
      await loadData();

      setTimeout(() => {
        setResolutionSuccess("");
      }, 4000);
    } catch (err: any) {
      alert(err.message || "Failed to resolve ticket");
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.saveProfile({
        role: editRole,
        hourly_rate: Number(editHourlyRate),
        summary: editSummary,
        dispatch_radius_km: Number(editDispatchRadius),
      });
      setProfile(res.profile);
      setProfileSaveSuccess("Profile credentials successfully updated.");
      setTimeout(() => setProfileSaveSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Availability Status Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser?.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"}
              alt={currentUser?.first_name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                currentUser?.online ? "bg-emerald-400" : "bg-slate-500"
              }`}
            ></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {currentUser?.first_name} {currentUser?.last_name}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                {currentUser?.role === "field_engineer" ? "Field On-Site Specialist" : "Remote Cloud Architect"}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Rating: <strong className="text-amber-400">★ 4.95/5.0</strong> • Certified Dispatch Pool • SLA Tier 1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleOnline}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-sm ${
              currentUser?.online
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${currentUser?.online ? "animate-pulse" : ""}`} />
            <span>{currentUser?.online ? "Status: Receiving Inbound Alerts" : "Status: Currently Offline"}</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "dashboard" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Overview & Stats</span>
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "alerts" ? "bg-amber-700 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>Inbound Alerts Queue</span>
            {inboundAlerts.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
                {inboundAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "jobs" ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Active Claimed Jobs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {activeJobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "profile" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Credentials</span>
          </button>
        </div>

        <button
          onClick={loadData}
          title="Refresh alerts"
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition mr-1"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {resolutionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{resolutionSuccess}</span>
        </div>
      )}

      {/* TAB 1: DASHBOARD & STATS */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Month Earnings</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">$4,280</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +18% from last month
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
                <span>Inbound Broadcasts</span>
                <BellRing className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-3xl font-extrabold text-amber-900 mt-2">{inboundAlerts.length}</p>
              <p className="text-[11px] text-amber-700 mt-1">Available for lock</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-xs">
              <div className="flex items-center justify-between text-teal-700 text-xs font-semibold">
                <span>Active Triage Jobs</span>
                <Briefcase className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-3xl font-extrabold text-teal-900 mt-2">{activeJobs.length}</p>
              <p className="text-[11px] text-teal-700 mt-1">Live SLA tracking</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Solved (All Time)</span>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">142</p>
              <p className="text-[11px] text-slate-500 mt-1">100% SLA compliance</p>
            </div>
          </div>

          {/* Quick Active Triage Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Current Assigned Work & SLA Status</h3>
                <p className="text-xs text-slate-500">Tickets you are actively remediating or inspecting</p>
              </div>
              <button
                onClick={() => setActiveTab("jobs")}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900"
              >
                Go to Resolution Console →
              </button>
            </div>

            {activeJobs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="font-semibold text-slate-700">No active claimed tickets in queue.</p>
                <p className="mt-1">Check "Inbound Alerts Queue" to claim and resolve new tickets.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{job.ticket_number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          {job.priority} Priority
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {job.category} → {job.subcategory}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-xs mt-1">{job.short_description}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Client: {job.client_name} ({job.location})</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenChat(job.ticket_number)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={() => {
                          setResolvingTicket(job);
                          setActiveTab("jobs");
                        }}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        Resolve & Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INBOUND ALERTS QUEUE */}
      {activeTab === "alerts" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900">Broadcasted Emergency & Routine IT Requests</h3>
            <p className="text-xs text-slate-500">
              Unassigned tickets matching your technical specialization. Click "Accept Ticket" to lock SLA.
            </p>
          </div>

          {inboundAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-teal-600" />
              <p className="font-bold text-slate-800 text-sm">All Inbound Broadcasts Claimed</p>
              <p className="mt-1">The edge dispatcher will stream new tickets directly to this console.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {inboundAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                          {alert.ticket_number}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          alert.priority === "P1" ? "bg-rose-600 text-white" : alert.priority === "P2" ? "bg-orange-500 text-white" : "bg-amber-500 text-white"
                        }`}>
                          {alert.priority}
                        </span>
                      </div>
                      <span className="text-xs text-teal-700 font-mono font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.sla_target_hours}h SLA
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mt-3 leading-snug">
                      {alert.short_description}
                    </h4>

                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 text-slate-600">
                      <p><strong>Category:</strong> {alert.category} → {alert.subcategory}</p>
                      <p><strong>Support Mode:</strong> {alert.support_type === "field_onsite" ? "🚗 Field On-Site" : "💻 Remote Rescue"}</p>
                      <p><strong>Location:</strong> {alert.location}</p>
                      <p><strong>Client:</strong> {alert.client_name} ({alert.client_company || "Direct"})</p>
                    </div>

                    {alert.ai_diagnostics && (
                      <div className="mt-3 p-2.5 rounded-lg bg-teal-950 text-teal-100 text-[11px] space-y-1">
                        <p className="font-bold flex items-center gap-1 text-emerald-400">
                          <Sparkles className="w-3 h-3" /> AI Root Cause:
                        </p>
                        <p className="text-slate-200">{alert.ai_diagnostics.root_cause}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptTicket(alert.ticket_number)}
                      className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl font-bold text-xs transition active:scale-95 shadow-xs"
                    >
                      Accept Ticket & Lock SLA
                    </button>
                    <button
                      onClick={() => onInspectTicket(alert)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE RESOLUTION CONSOLE */}
      {activeTab === "jobs" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: List of Claimed Tickets */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Your Claimed Tickets</h3>
              {activeJobs.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  No active claimed jobs.
                </div>
              ) : (
                activeJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setResolvingTicket(job)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      resolvingTicket?.id === job.id
                        ? "bg-teal-900 text-white border-teal-700 shadow-md"
                        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs">{job.ticket_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        resolvingTicket?.id === job.id ? "bg-teal-700 text-teal-100" : "bg-slate-100 text-slate-700"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="font-bold text-xs line-clamp-1">{job.short_description}</p>
                    <p className={`text-[11px] mt-1 ${resolvingTicket?.id === job.id ? "text-teal-200" : "text-slate-500"}`}>
                      {job.category} • {job.client_name}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Right Column: Resolution Workbench */}
            <div className="lg:col-span-2">
              {resolvingTicket ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {resolvingTicket.ticket_number}
                        </span>
                        <span className="text-xs font-bold text-teal-700">{resolvingTicket.priority} Urgency</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 mt-1">{resolvingTicket.short_description}</h3>
                    </div>
                    <button
                      onClick={() => onOpenChat(resolvingTicket.ticket_number)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Live Chat</span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                    <p><strong>Diagnostic Details:</strong> {resolvingTicket.detailed_description || resolvingTicket.short_description}</p>
                    <p><strong>Site / Location:</strong> {resolvingTicket.location}</p>
                    <p><strong>Support Mode:</strong> {resolvingTicket.support_type === "field_onsite" ? "Field On-Site Dispatch" : "Remote Live Rescue"}</p>
                  </div>

                  {/* Resolution Form */}
                  <form onSubmit={handleResolveSubmit} className="space-y-4 pt-2">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-teal-700" />
                      <span>Official Resolution & Sign-off Notes</span>
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Category</label>
                      <select
                        value={resolutionCategory}
                        onChange={(e) => setResolutionCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option>Hardware Replacement</option>
                        <option>Configuration & Firmware Patch</option>
                        <option>Network Routing / DNS Fix</option>
                        <option>OS & Software Driver Reinstall</option>
                        <option>Security Policy Whitelist</option>
                        <option>Cloud Infrastructure Rollback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Remediation Actions & Verification Details *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Detail the exact steps taken, components swapped, test ping results, and customer verification..."
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => generateServiceSlipPDF(resolvingTicket)}
                        className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                      >
                        Preview Draft Service Slip
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingResolution || !resolutionNote.trim()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-teal-900 transition active:scale-95 disabled:opacity-50"
                      >
                        {isSubmittingResolution ? "Submitting..." : "Submit Resolution & Certify Slip"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">Select a ticket from the left column to begin resolution.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROFILE & CREDENTIALS */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="font-bold text-base text-slate-900">Engineer Profile & Dispatch Credentials</h3>
            <p className="text-xs text-slate-500">Manage your skills, certifications, hourly rates, and on-site dispatch radius</p>
          </div>

          {profileSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileSaveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Role Title</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  placeholder="e.g. Senior Cloud & Network Engineer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hourly Consultation Rate ($/hr)</label>
                <input
                  type="number"
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">On-Site Dispatch Radius (km)</label>
                <input
                  type="number"
                  value={editDispatchRadius}
                  onChange={(e) => setEditDispatchRadius(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Certifications Verified</label>
                <input
                  type="text"
                  readOnly
                  value="AWS Solutions Architect Pro • CCIE Security • CompTIA L3"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Professional Bio & Diagnostic Toolkit</label>
              <textarea
                rows={3}
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                {isSavingProfile ? "Saving..." : "Update Profile Credentials"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
