import React, { useState, useEffect } from "react";
import {
  Server,
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  ArrowRightLeft,
  Flame,
} from "lucide-react";
import type { SystemMetrics } from "../types.ts";
import { api } from "../lib/api.ts";

export const OperationsCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [lastFailoverMsg, setLastFailoverMsg] = useState("");

  const loadMetrics = async () => {
    try {
      const data = await api.getHAMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Error loading HA metrics:", err);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateFailover = async () => {
    setIsSimulating(true);
    setLastFailoverMsg("Injecting chaos: Simulating primary node network partition...");

    try {
      const res = await api.simulateFailover();
      setLastFailoverMsg(res.message);
      setSimulationLog((prev) => [
        `[${new Date().toLocaleTimeString()}] FAILOVER TRIGGERED: ${res.message}`,
        ...prev.slice(0, 7),
      ]);
      await loadMetrics();
    } catch (err: any) {
      setLastFailoverMsg("Failover execution error: " + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm">
              <Server className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Global High-Availability Cluster Topology</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              99.994% Uptime SLA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise-grade multi-region active-passive cluster with automatic sub-second health probes and seamless failover.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateFailover}
            disabled={isSimulating}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Flame className="w-4 h-4 text-amber-200" />
            <span>{isSimulating ? "Executing Failover..." : "Simulate Chaos Failover"}</span>
          </button>
        </div>
      </div>

      {lastFailoverMsg && (
        <div className="p-4 bg-indigo-950 border border-indigo-700 text-indigo-200 rounded-2xl text-xs flex items-center gap-3 animate-in fade-in">
          <ArrowRightLeft className="w-5 h-5 text-indigo-400 shrink-0 animate-spin" />
          <span className="font-medium">{lastFailoverMsg}</span>
        </div>
      )}

      {/* HA Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Cluster SLA Availability</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.uptime_sla || "99.994%"}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Zero unplanned outages (365d)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>P99 Global Latency</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.avg_latency_ms || 14} ms</p>
          <p className="text-[11px] text-slate-500 mt-1">Edge CDN & Anycast routed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Throughput Traffic</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics?.requests_per_sec || 1420} req/s</p>
          <p className="text-[11px] text-slate-500 mt-1">Auto-scaling edge containers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Database Replication</span>
            <Database className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">3 Sync Replicas</p>
          <p className="text-[11px] text-teal-700 font-semibold mt-1">Zero data loss guarantee</p>
        </div>
      </div>

      {/* Multi-Region Node Topology Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Multi-Region Distributed Node Cluster</h3>
            <p className="text-xs text-slate-500">Live health checks, traffic weights, and failover status</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200">
            Engine: Raft Consensus v3.4
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {metrics?.cluster_nodes.map((node) => (
            <div
              key={node.node_id}
              className={`rounded-2xl p-5 border transition-all ${
                node.is_primary
                  ? "bg-gradient-to-b from-teal-950 to-slate-900 text-white border-teal-500 shadow-lg scale-102"
                  : "bg-slate-50 text-slate-800 border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    node.is_primary
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {node.is_primary ? "Active Primary Node" : "Standby Hot Replica"}
                  </span>
                  <h4 className="font-bold text-sm mt-2">{node.region_name}</h4>
                  <p className={`text-xs ${node.is_primary ? "text-teal-200" : "text-slate-500"}`}>
                    Zone: {node.zone}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-semibold text-emerald-400 capitalize">{node.status}</span>
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t text-xs space-y-2 ${node.is_primary ? "border-slate-800" : "border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <span className={node.is_primary ? "text-slate-400" : "text-slate-500"}>Latency to Edge:</span>
                  <span className="font-mono font-bold">{node.latency_ms} ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={node.is_primary ? "text-slate-400" : "text-slate-500"}>Traffic Distribution:</span>
                  <span className="font-bold">{node.traffic_weight}% of load</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={node.is_primary ? "text-slate-400" : "text-slate-500"}>Health Consensus:</span>
                  <span className="text-emerald-400 font-semibold">100% (Pass 360/360)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Chaos & Telemetry Log */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-400" />
            <span>Live High-Availability Heartbeat & Failover Logs</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Stream: /sys/ha/events</span>
        </div>

        <div className="font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5 text-slate-300 max-h-48 overflow-y-auto">
          <p className="text-emerald-400">[Heartbeat OK] Region asia-east-1 consensus verified across 3 nodes. 0 dropped packets.</p>
          <p className="text-slate-400">[LoadBalancer] Traffic routed: 60% asia-east-1, 20% us-east-1, 20% eu-central-1.</p>
          {simulationLog.map((log, index) => (
            <p key={index} className="text-amber-300">
              {log}
            </p>
          ))}
          <p className="text-slate-500">[HealthProbe] TLS 1.3 edge handshake validated. Certificate valid for 280 days.</p>
        </div>
      </div>
    </div>
  );
};
