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
  MapPin,
  Phone,
  Building,
  Plus,
  Trash2,
  Wrench,
  Cpu,
  Layers,
  Check,
  Navigation,
  FileText,
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

const DOMAIN_OPTIONS = [
  "Hardware",
  "Networking",
  "Linux & Windows Servers",
  "Cloud Infrastructure",
  "Cybersecurity",
  "VoIP & Telecom",
  "Database Administration",
  "Disaster Recovery",
];

export const ExpertPortal: React.FC<ExpertPortalProps> = ({
  currentUser,
  onToggleOnline,
  onInspectTicket,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "alerts" | "jobs" | "profile">("dashboard");
  const [inboundAlerts, setInboundAlerts] = useState<Ticket[]>([]);
  const [activeJobs, setActiveJobs] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [profile, setProfile] = useState<EngineerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolution Form state
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionCategory, setResolutionCategory] = useState("Hardware Replacement");
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [resolutionSuccess, setResolutionSuccess] = useState("");

  // Profile Edit State (Fully connected to database)
  const [editFirstName, setEditFirstName] = useState(currentUser?.first_name || "");
  const [editLastName, setEditLastName] = useState(currentUser?.last_name || "");
  const [editPhone, setEditPhone] = useState(currentUser?.phone || "");
  const [editCity, setEditCity] = useState(currentUser?.city || "Mumbai");
  const [editCompany, setEditCompany] = useState(currentUser?.company || "TechRescue Specialist");
  const [editRole, setEditRole] = useState<
    "Field Engineer" | "Server Engineer" | "Cloud Engineer" | "Network Engineer" | "Security Specialist"
  >("Field Engineer");
  const [editHourlyRate, setEditHourlyRate] = useState(95);
  const [editDispatchRadius, setEditDispatchRadius] = useState(40);
  const [editToolset, setEditToolset] = useState<"Standard L1" | "Advanced L2" | "Enterprise L3 Field Kit">(
    "Enterprise L3 Field Kit"
  );
  const [editExperience, setEditExperience] = useState("5+ years");
  const [editEducation, setEditEducation] = useState("B.S. Information Technology / Certified Engineer");
  const [editSummary, setEditSummary] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    "Hardware",
    "Networking",
    "Cloud Infrastructure",
  ]);
  const [subskillsList, setSubskillsList] = useState<string[]>([
    "Emergency Dispatch",
    "Field Triage",
    "Diagnostics",
  ]);
  const [newSubskillInput, setNewSubskillInput] = useState("");
  const [certificationsList, setCertificationsList] = useState<string[]>([
    "CompTIA Network+",
    "AWS Certified Solutions Architect",
  ]);
  const [newCertInput, setNewCertInput] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState("");
  const [profileSaveError, setProfileSaveError] = useState("");

  // Load engineer data and setup real-time listeners
  const loadData = async () => {
    setLoading(true);
    try {
      const [alerts, history, profRes] = await Promise.all([
        api.getExpertAlerts().catch(() => []),
        api.getQueryHistory().catch(() => []),
        api.getProfile(currentUser?.id).catch(() => null),
      ]);

      setAllTickets(history);
      setInboundAlerts(alerts);

      const myJobs = history.filter(
        (t) => t.assigned_engineer_id === currentUser?.id || (t.status === "in_progress" && !t.assigned_engineer_id)
      );
      setActiveJobs(myJobs);

      if (profRes) {
        setProfile(profRes);
        if (profRes.role) setEditRole(profRes.role as any);
        if (profRes.hourly_rate) setEditHourlyRate(profRes.hourly_rate);
        if (profRes.dispatch_radius_km) setEditDispatchRadius(profRes.dispatch_radius_km);
        if (profRes.toolset_level) setEditToolset(profRes.toolset_level as any);
        if (profRes.experience) setEditExperience(profRes.experience);
        if (profRes.education) setEditEducation(profRes.education);
        if (profRes.summary) setEditSummary(profRes.summary);
        if (profRes.categories && profRes.categories.length > 0) setSelectedDomains(profRes.categories);
        if (profRes.subskills && profRes.subskills.length > 0) setSubskillsList(profRes.subskills);
        if (profRes.certifications && profRes.certifications.length > 0) setCertificationsList(profRes.certifications);

        if (profRes.user) {
          if (profRes.user.first_name) setEditFirstName(profRes.user.first_name);
          if (profRes.user.last_name) setEditLastName(profRes.user.last_name);
          if (profRes.user.phone) setEditPhone(profRes.user.phone);
          if (profRes.user.city) setEditCity(profRes.user.city);
          if (profRes.user.company) setEditCompany(profRes.user.company);
        }
      }
    } catch (err) {
      console.error("Error loading expert portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe in real-time to tickets from Firestore
    const unsub = api.subscribeToTickets((tickets) => {
      setAllTickets(tickets);
      const openAlerts = tickets.filter((t) => t.status === "open" || !t.assigned_engineer_id);
      setInboundAlerts(openAlerts);
      const myJobs = tickets.filter(
        (t) => t.assigned_engineer_id === currentUser?.id || (t.status === "in_progress" && !t.assigned_engineer_id)
      );
      setActiveJobs(myJobs);
    });

    return () => unsub();
  }, [currentUser?.id]);

  const handleAcceptTicket = async (ticketNumber: string) => {
    try {
      await api.acceptTicket(ticketNumber);
      await loadData();
      setActiveTab("jobs");
    } catch (err: any) {
      alert(err.message || "Failed to accept ticket");
    }
  };

  const handleAdvanceStatus = async (ticketNumber: string, nextStatus: string) => {
    try {
      await api.updateQueryStatus(ticketNumber, nextStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update ticket status");
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket || !resolutionNote.trim()) return;

    setIsSubmittingResolution(true);
    try {
      await api.resolveTicket(resolvingTicket.ticket_number, resolutionNote, resolutionCategory);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
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

  // Add Skill Tag
  const handleAddSubskill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (newSubskillInput.trim() && !subskillsList.includes(newSubskillInput.trim())) {
      setSubskillsList([...subskillsList, newSubskillInput.trim()]);
      setNewSubskillInput("");
    }
  };

  const handleRemoveSubskill = (skill: string) => {
    setSubskillsList(subskillsList.filter((s) => s !== skill));
  };

  // Add Cert Tag
  const handleAddCert = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (newCertInput.trim() && !certificationsList.includes(newCertInput.trim())) {
      setCertificationsList([...certificationsList, newCertInput.trim()]);
      setNewCertInput("");
    }
  };

  const handleRemoveCert = (cert: string) => {
    setCertificationsList(certificationsList.filter((c) => c !== cert));
  };

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  // Save full profile to Firestore & Backend
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess("");
    setProfileSaveError("");

    try {
      const res = await api.saveProfile({
        user_id: currentUser?.id,
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        company: editCompany.trim(),
        role: editRole,
        hourly_rate: Number(editHourlyRate),
        dispatch_radius_km: Number(editDispatchRadius),
        toolset_level: editToolset,
        experience: editExperience,
        education: editEducation,
        summary: editSummary,
        categories: selectedDomains,
        subskills: subskillsList,
        certifications: certificationsList,
      });

      if (res.profile) {
        setProfile(res.profile);
      }
      setProfileSaveSuccess("Profile & technical credentials successfully saved to live database!");
      setTimeout(() => setProfileSaveSuccess(""), 4000);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setProfileSaveError(err.message || "Failed to update profile in database.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const totalEarnings = currentUser?.total_earnings || (activeJobs.filter((j) => j.status === "resolved").length * 95);
  const completedJobsCount = currentUser?.jobs_completed || activeJobs.filter((j) => j.status === "resolved").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Availability & Identity Header Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={
                currentUser?.avatar_url ||
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
              }
              alt={currentUser?.first_name || "Engineer"}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                currentUser?.online ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
              }`}
            ></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-white">
                {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : "Rescue Specialist"}
              </h2>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800 font-semibold">
                {editRole || "Field Specialist"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {currentUser?.city || "Mumbai Hub"} ({editDispatchRadius} km radius)
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                ${editHourlyRate}/hr rate
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons & Online Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleOnline}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md active:scale-95 ${
              currentUser?.online
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            <Radio className={`w-4 h-4 ${currentUser?.online ? "animate-pulse text-white" : "text-slate-400"}`} />
            <span>{currentUser?.online ? "LIVE & READY TO DISPATCH" : "OFFLINE / STANDBY"}</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh database records"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
              activeTab === "alerts"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Dispatch Radar</span>
            {inboundAlerts.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-rose-600 text-white rounded-full font-extrabold animate-pulse">
                {inboundAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "jobs"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Active Missions ({activeJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Database Profile & Skills</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-500">Live Database Status:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Firestore Connected
          </span>
        </div>
      </div>

      {/* TAB 1: COMMAND CENTER (KPIs & High-Level Telemetry) */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Rescues</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{completedJobsCount}</h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% SLA Adherence</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Incoming Alerts</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{inboundAlerts.length}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Available for Claiming</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <BellRing className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">${totalEarnings}</h3>
                <p className="text-[11px] text-teal-600 font-semibold mt-0.5">${editHourlyRate}/hr rate</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Quality Score</p>
                <h3 className="text-2xl font-black text-amber-500 mt-1">4.95 / 5.0</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Verified Client Rating</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Dispatch Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Live Inbound Incidents</h3>
                <p className="text-xs text-slate-500">Emergency support requests needing immediate engineering triage</p>
              </div>
              <button
                onClick={() => setActiveTab("alerts")}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 transition"
              >
                View Full Radar ({inboundAlerts.length}) &rarr;
              </button>
            </div>

            {inboundAlerts.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No pending emergency alerts right now.</p>
                <p className="text-slate-400 mt-1">Standby active. New client tickets will appear instantly in real-time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inboundAlerts.slice(0, 4).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50/70 hover:bg-white transition space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {ticket.ticket_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ticket.priority === "P1"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {ticket.priority || "P2"} Priority
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {ticket.support_type === "field_onsite" ? "Field On-Site" : "Remote Support"}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{ticket.short_description}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                        {ticket.detailed_description || ticket.short_description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {ticket.location}
                      </span>

                      <button
                        onClick={() => handleAcceptTicket(ticket.ticket_number)}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-lg transition active:scale-95 shadow-xs"
                      >
                        Claim Incident
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCH RADAR (All Available Inbound Alerts) */}
      {activeTab === "alerts" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900">Incident Dispatch Radar</h3>
              <p className="text-xs text-slate-500">Live incoming client tickets streamed directly from cloud database</p>
            </div>
            <span className="font-mono text-xs px-3 py-1 bg-slate-900 text-white rounded-xl font-bold">
              {inboundAlerts.length} Queued
            </span>
          </div>

          {inboundAlerts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              <Radio className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse" />
              <p className="font-bold text-slate-700 text-sm">Radar Clear</p>
              <p className="text-slate-400 mt-1">All incoming client queries have been claimed and assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inboundAlerts.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-500 transition space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                        {ticket.ticket_number}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                          ticket.priority === "P1"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : ticket.priority === "P2"
                            ? "bg-orange-100 text-orange-700 border border-orange-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ticket.priority || "P2"} • {ticket.urgency || "High"}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                        {ticket.category}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      Target SLA: {ticket.sla_target_hours || 2}h
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{ticket.short_description}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {ticket.detailed_description || ticket.short_description}
                    </p>
                  </div>

                  {ticket.ai_diagnostics && (
                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>AI Diagnostic Triage:</span>
                      </div>
                      <p className="text-slate-700">{ticket.ai_diagnostics.root_cause}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Client: {ticket.client_name || "Enterprise Customer"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onInspectTicket(ticket)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition"
                      >
                        Inspect Details
                      </button>
                      <button
                        onClick={() => handleAcceptTicket(ticket.ticket_number)}
                        className="px-5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold transition active:scale-95 shadow-sm shadow-teal-900"
                      >
                        Claim & Dispatch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE MISSIONS & RESOLUTION WORKBENCH */}
      {activeTab === "jobs" && (
        <div className="space-y-6 animate-in fade-in">
          {resolutionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{resolutionSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Assigned Tickets List */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 px-1">My Active Assigned Missions</h3>

              {activeJobs.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No active assigned missions.</p>
                  <p className="mt-1">Claim a ticket from the Dispatch Radar to start.</p>
                </div>
              ) : (
                activeJobs.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setResolvingTicket(ticket)}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                      resolvingTicket?.id === ticket.id
                        ? "bg-teal-50/60 border-teal-500 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        {ticket.ticket_number}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          ticket.status === "resolved"
                            ? "bg-emerald-100 text-emerald-700"
                            : ticket.status === "in_progress"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{ticket.short_description}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {ticket.location}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Right Column: Resolution & Mission Execution Matrix */}
            <div className="lg:col-span-2">
              {resolvingTicket ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                          {resolvingTicket.ticket_number}
                        </span>
                        <span className="text-xs font-bold text-teal-700">{resolvingTicket.priority} Urgency</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 mt-1">{resolvingTicket.short_description}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenChat(resolvingTicket.ticket_number)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4 text-teal-400" />
                        <span>Live Chat</span>
                      </button>

                      <button
                        onClick={() => generateServiceSlipPDF(resolvingTicket)}
                        className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>PDF Service Slip</span>
                      </button>
                    </div>
                  </div>

                  {/* Dispatch Workflow Status Stepper */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mission Execution Progress</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleAdvanceStatus(resolvingTicket.ticket_number, "in_progress")}
                        className="p-2.5 rounded-lg bg-teal-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>1. Claimed</span>
                      </button>

                      <button
                        onClick={() => handleAdvanceStatus(resolvingTicket.ticket_number, "in_progress")}
                        className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                      >
                        <Navigation className="w-3.5 h-3.5 text-teal-400" />
                        <span>2. In Transit</span>
                      </button>

                      <button
                        onClick={() => handleAdvanceStatus(resolvingTicket.ticket_number, "in_progress")}
                        className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>3. On Site</span>
                      </button>

                      <button
                        onClick={() => handleAdvanceStatus(resolvingTicket.ticket_number, "resolved")}
                        className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>4. Remediated</span>
                      </button>
                    </div>
                  </div>

                  {/* Resolution Form */}
                  <form onSubmit={handleResolveSubmit} className="space-y-4 pt-1">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-teal-700" />
                      <span>Submit Resolution & Certify Service Slip</span>
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
                        Preview Draft Slip
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingResolution || !resolutionNote.trim()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-teal-900 transition active:scale-95 disabled:opacity-50"
                      >
                        {isSubmittingResolution ? "Certifying..." : "Submit Resolution & Mark Closed"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">Select a mission from the left column to view workbench.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROFILE & CREDENTIALS COMMAND CENTER (Full Database Connection) */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Engineer Profile & Technical Capabilities</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All changes synchronize directly with your Firestore database record and live dispatch index
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Database ID:</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
                {currentUser?.id || "fb-usr-active"}
              </span>
            </div>
          </div>

          {profileSaveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{profileSaveSuccess}</span>
            </div>
          )}

          {profileSaveError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>{profileSaveError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-8">
            {/* Section 1: Personal & Contact Information */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-700" />
                <span>1. Personal & Contact Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base City / Service Hub *</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Bengaluru"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    placeholder="e.g. TechRescue Specialist / Metro On-Site"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Technical Specialty & Pricing */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-700" />
                <span>2. Technical Specialization & Dispatch Rates</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Engineering Role Specialization</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Field Engineer">Field Engineer (On-Site Hardware/Network)</option>
                    <option value="Server Engineer">Server Engineer (Windows/Linux/Datacenter)</option>
                    <option value="Cloud Engineer">Cloud Engineer (AWS/GCP/Kubernetes)</option>
                    <option value="Network Engineer">Network Engineer (Cisco/Firewalls/BGP)</option>
                    <option value="Security Specialist">Security Specialist (SOC/IR/Hardening)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hourly Billing Rate ($/hr)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      min="20"
                      max="500"
                      value={editHourlyRate}
                      onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">On-Site Dispatch Radius (km)</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={editDispatchRadius}
                    onChange={(e) => setEditDispatchRadius(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Toolset Level</label>
                  <select
                    value={editToolset}
                    onChange={(e) => setEditToolset(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Standard L1">Standard L1 Toolkit</option>
                    <option value="Advanced L2">Advanced L2 Field Diagnostic Kit</option>
                    <option value="Enterprise L3 Field Kit">Enterprise L3 Field Kit (Oscilloscope, Console, Spares)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Experience</label>
                  <input
                    type="text"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                    placeholder="e.g. 7+ years"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Education & Degrees</label>
                  <input
                    type="text"
                    value={editEducation}
                    onChange={(e) => setEditEducation(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Technical Domain Badges */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>3. Primary Technical Domains</span>
              </h4>

              <div className="flex flex-wrap gap-2">
                {DOMAIN_OPTIONS.map((domain) => {
                  const isSelected = selectedDomains.includes(domain);
                  return (
                    <button
                      type="button"
                      key={domain}
                      onClick={() => toggleDomain(domain)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-teal-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{domain}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Skills & Certifications Tag Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Subskills */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Specific Skills & Technologies</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubskillInput}
                    onChange={(e) => setNewSubskillInput(e.target.value)}
                    onKeyDown={handleAddSubskill}
                    placeholder="e.g. Cisco CLI, Docker, Active Directory..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubskill}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {subskillsList.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubskill(skill)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Verified Certifications</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCertInput}
                    onChange={(e) => setNewCertInput(e.target.value)}
                    onKeyDown={handleAddCert}
                    placeholder="e.g. CCNA, CompTIA A+, CISSP, CKA..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {certificationsList.map((cert) => (
                    <span
                      key={cert}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      <Award className="w-3 h-3 text-teal-600" />
                      <span>{cert}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(cert)}
                        className="text-teal-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 5: Bio Summary */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Professional Bio & Technical Diagnostic Methodology
              </label>
              <textarea
                rows={3}
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="Describe your technical background, emergency diagnostic equipment, and triage approach..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-slate-950 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Syncing with Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save All Profile & Capability Updates</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
