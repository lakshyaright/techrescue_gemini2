import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Wrench,
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Filter,
  MapPin,
  Star,
  RefreshCw,
} from "lucide-react";
import type { Ticket, User as UserType, EngineerProfile } from "../types.ts";
import { api } from "../lib/api.ts";
import { generateServiceSlipPDF } from "../lib/pdfGenerator.ts";

interface ClientPortalProps {
  currentUser: UserType | null;
  onOpenRaiseModal: () => void;
  onInspectTicket: (ticket: Ticket) => void;
  onOpenChat: (ticketNumber: string) => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  currentUser,
  onOpenRaiseModal,
  onInspectTicket,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "experts" | "field" | "history">("dashboard");
  const [dashboardData, setDashboardData] = useState<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    recent: Ticket[];
  }>({ total: 0, open: 0, inProgress: 0, resolved: 0, recent: [] });

  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [experts, setExperts] = useState<(UserType & { engineer_profiles: EngineerProfile[] })[]>([]);
  const [fieldEngineers, setFieldEngineers] = useState<(UserType & { engineer_profiles: EngineerProfile[] })[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters for Remote Experts
  const [expertSearch, setExpertSearch] = useState("");
  const [expertCategory, setExpertCategory] = useState("");
  const [expertLocation, setExpertLocation] = useState("");
  const [expertOnlineOnly, setExpertOnlineOnly] = useState(false);

  // Filters for Field Engineers
  const [fieldSearch, setFieldSearch] = useState("");
  const [fieldLocation, setFieldLocation] = useState("");
  const [fieldOnlineOnly, setFieldOnlineOnly] = useState(false);

  // Filters for Query History
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, hist, exp, field] = await Promise.all([
        api.getClientDashboard(),
        api.getQueryHistory(),
        api.getExperts(),
        api.getFieldEngineers(),
      ]);
      setDashboardData(dash);
      setAllTickets(hist);
      setExperts(exp);
      setFieldEngineers(field);
    } catch (err) {
      console.error("Error loading client data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleFilterExperts = async () => {
    try {
      const filtered = await api.getExperts({
        search: expertSearch,
        category: expertCategory,
        location: expertLocation,
        online: expertOnlineOnly ? true : undefined,
      });
      setExperts(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterFieldEngineers = async () => {
    try {
      const filtered = await api.getFieldEngineers({
        search: fieldSearch,
        location: fieldLocation,
        online: fieldOnlineOnly ? true : undefined,
      });
      setFieldEngineers(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredHistory = allTickets.filter((t) => {
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(historySearch.toLowerCase()) ||
      t.short_description.toLowerCase().includes(historySearch.toLowerCase()) ||
      t.category.toLowerCase().includes(historySearch.toLowerCase()) ||
      t.location.toLowerCase().includes(historySearch.toLowerCase());

    const matchesStatus = historyStatusFilter === "all" || t.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusStyles: Record<string, string> = {
    open: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-teal-50 text-teal-700 border-teal-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",
    ignored: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const priorityStyles: Record<string, string> = {
    P1: "bg-rose-600 text-white",
    P2: "bg-orange-500 text-white",
    P3: "bg-amber-500 text-white",
    P4: "bg-slate-500 text-white",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Workspace Sub-Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("experts")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "experts"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Align Remote Experts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {experts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("field")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "field"
                ? "bg-amber-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Field Engineers (On-Site)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {fieldEngineers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Query & Service History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {allTickets.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <button
            onClick={loadData}
            title="Refresh ticket state"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onOpenRaiseModal}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise Query</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Queries</span>
                <History className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{dashboardData.total}</p>
              <p className="text-[11px] text-slate-400 mt-1">Across all infrastructure</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
                <span>Open / Unassigned</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-3xl font-extrabold text-amber-900 mt-2">{dashboardData.open}</p>
              <p className="text-[11px] text-amber-700 mt-1">Dispatched to edge pool</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-xs">
              <div className="flex items-center justify-between text-teal-700 text-xs font-semibold">
                <span>Active In Progress</span>
                <Wrench className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-3xl font-extrabold text-teal-900 mt-2">{dashboardData.inProgress}</p>
              <p className="text-[11px] text-teal-700 mt-1">Engineer triage live</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                <span>Resolved & Certified</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 mt-2">{dashboardData.resolved}</p>
              <p className="text-[11px] text-emerald-700 mt-1">Service slips generated</p>
            </div>
          </div>

          {/* Active P1/P2 Alert Banner if any */}
          {allTickets.some((t) => (t.priority === "P1" || t.priority === "P2") && t.status !== "resolved") && (
            <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-rose-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-700/80 flex items-center justify-center text-white shrink-0 animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Critical SLA Ticket in Active Remediation</h4>
                  <p className="text-xs text-rose-200">
                    High-priority network or server incident is being tracked on the primary Taiwan Edge cluster.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const critical = allTickets.find((t) => t.priority === "P1" || t.priority === "P2");
                  if (critical) onInspectTicket(critical);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                Inspect Live SLA
              </button>
            </div>
          )}

          {/* Recent Queries Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Recent Service Queries & Dispatches</h3>
                <p className="text-xs text-slate-500">Live ticket telemetry across remote and field triage</p>
              </div>
              <button
                onClick={() => setActiveTab("history")}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <span>View Full History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Ticket ID</th>
                    <th className="px-5 py-3">Summary</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned Specialist</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.recent.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No recent queries found. Click "Raise Query" to create your first ticket.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.recent.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                          {q.ticket_number}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800 max-w-xs truncate">
                          {q.short_description}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {q.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityStyles[q.priority]}`}>
                            {q.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${statusStyles[q.status]}`}>
                            {q.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {q.assigned_engineer_name ? (
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                              {q.assigned_engineer_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned pool</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => onInspectTicket(q)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => onOpenChat(q.ticket_number)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-medium transition"
                          >
                            Chat
                          </button>
                          <button
                            onClick={() => generateServiceSlipPDF(q)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium transition"
                            title="Download Service Slip PDF"
                          >
                            <Download className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALIGN REMOTE EXPERTS */}
      {activeTab === "experts" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Search & Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Align Verified Remote IT & Cloud Engineers</h3>
              <p className="text-xs text-slate-500">Search top-tier certified architects for instant remote screen-share and triage</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by engineer name..."
                  value={expertSearch}
                  onChange={(e) => setExpertSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={expertCategory}
                  onChange={(e) => setExpertCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">All Tech Categories</option>
                  <option value="Cloud">Cloud & Infrastructure</option>
                  <option value="Network">Network & Security</option>
                  <option value="Hardware">Hardware & Datacenter</option>
                  <option value="Software">Software & SaaS</option>
                </select>
              </div>

              <div>
                <select
                  value={expertLocation}
                  onChange={(e) => setExpertLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">All Regions</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={expertOnlineOnly}
                    onChange={(e) => setExpertOnlineOnly(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Online Only</span>
                </label>
                <button
                  onClick={handleFilterExperts}
                  className="flex-1 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold transition"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>

          {/* Experts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {experts.map((expert) => {
              const profile = expert.engineer_profiles?.[0];
              return (
                <div
                  key={expert.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={expert.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                          alt={expert.first_name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {expert.first_name} {expert.last_name}
                          </h4>
                          <p className="text-xs text-teal-700 font-semibold">{profile?.role || "Support Architect"}</p>
                          <p className="text-[11px] text-slate-500">{expert.city}, {expert.country}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        expert.online
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {expert.online ? "● Available Now" : "Offline"}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Rating & Payout:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-600 flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {expert.rating || "4.9"}
                          </span>
                          <span className="font-mono text-slate-900 font-semibold">${profile?.hourly_rate || 90}/hr</span>
                        </div>
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                        {profile?.summary || "Specialized in cloud architecture, network triage, and incident resolution."}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {(profile?.subskills || ["Kubernetes", "Linux", "Firewall"]).slice(0, 4).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={onOpenRaiseModal}
                      className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold text-xs transition active:scale-95"
                    >
                      Assign to Ticket
                    </button>
                    <button
                      onClick={() => onOpenChat("TR-8942")}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FIELD ENGINEERS ON-SITE DISPATCH */}
      {activeTab === "field" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Certified On-Site Field Engineers</h3>
              <p className="text-xs text-slate-500">
                Direct branch and office on-premise hardware engineers with mobile diagnostic kits
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search field engineer..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={fieldLocation}
                  onChange={(e) => setFieldLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">All Metro Hubs</option>
                  <option value="Mumbai">Mumbai (BKC, Andheri, Navi Mumbai)</option>
                  <option value="Bengaluru">Bengaluru (Whitefield, Koramangala)</option>
                  <option value="Delhi">Delhi NCR (Gurugram, Noida)</option>
                  <option value="Pune">Pune (Hinjewadi, Magarpatta)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={fieldOnlineOnly}
                    onChange={(e) => setFieldOnlineOnly(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Available for Dispatch</span>
                </label>
                <button
                  onClick={handleFilterFieldEngineers}
                  className="flex-1 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-bold transition"
                >
                  Filter Hub
                </button>
              </div>
            </div>
          </div>

          {/* Field Engineers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {fieldEngineers.map((engineer) => {
              const profile = engineer.engineer_profiles?.[0];
              return (
                <div
                  key={engineer.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={engineer.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"}
                          alt={engineer.first_name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {engineer.first_name} {engineer.last_name}
                          </h4>
                          <p className="text-xs text-amber-700 font-semibold">{profile?.role || "On-Site Specialist"}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {engineer.city}, {engineer.state}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {profile?.toolset_level || "Enterprise L3"}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Dispatch Radius / ETA:</span>
                        <span className="font-semibold text-slate-900">
                          {profile?.dispatch_radius_km || 40} km (ETA: ~35 mins)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>Experience & Kit:</span>
                        <span className="font-medium text-slate-800">{profile?.experience || "7+ years"}</span>
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                        {profile?.summary || "Equipped with mobile oscilloscopes, cable splicers, and replacement modules."}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {(profile?.certifications || ["CompTIA A+", "Cisco CCNA"]).map((cert, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-900 rounded text-[10px] font-medium border border-amber-200/60">
                            🛡️ {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={onOpenRaiseModal}
                      className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition active:scale-95 shadow-xs"
                    >
                      Request On-Site Dispatch
                    </button>
                    <button
                      onClick={() => onOpenChat("TR-8941")}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: QUERY HISTORY & SERVICE SLIPS */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Query & Ticket Service History</h3>
              <p className="text-xs text-slate-500">Download cryptographically signed electronic service slips</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search queries..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Ticket ID</th>
                    <th className="px-5 py-3.5">Issue Summary</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Mode</th>
                    <th className="px-5 py-3.5">Created Date</th>
                    <th className="px-5 py-3.5 text-right">Electronic Service Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {ticket.ticket_number}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 max-w-sm truncate">
                        {ticket.short_description}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {ticket.category} → {ticket.subcategory}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${statusStyles[ticket.status]}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {ticket.support_type === "field_onsite" ? "🚗 On-Site" : "💻 Remote"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => onInspectTicket(ticket)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium transition"
                        >
                          View Log
                        </button>
                        <button
                          onClick={() => generateServiceSlipPDF(ticket)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold transition flex items-center gap-1.5 inline-flex shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
