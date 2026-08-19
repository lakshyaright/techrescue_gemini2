import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import type {
  User,
  EngineerProfile,
  Ticket,
  TicketMessage,
  SystemMetrics,
  ClusterNode,
  AIDiagnosticResult,
} from "./src/types.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Database for High Availability TechRescue
let users: User[] = [
  {
    id: "usr-client-1",
    email: "lakshyaright@gmail.com",
    first_name: "Lakshya",
    last_name: "Sharma",
    role: "client",
    phone: "+1 (555) 234-5678",
    company: "Apex Global Tech",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    online: true,
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "usr-expert-1",
    email: "alex.cloud@techrescue.io",
    first_name: "Alex",
    last_name: "Rivera",
    role: "expert",
    phone: "+1 (555) 987-6543",
    company: "CloudScale Systems",
    country: "USA",
    state: "California",
    city: "San Francisco",
    online: true,
    rating: 4.96,
    jobs_completed: 142,
    total_earnings: 18450,
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: "usr-expert-2",
    email: "rajesh.hardware@techrescue.io",
    first_name: "Rajesh",
    last_name: "Kumar",
    role: "field_engineer",
    phone: "+91 98200 12345",
    company: "Metro Hardware On-Site",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    online: true,
    rating: 4.92,
    jobs_completed: 89,
    total_earnings: 9800,
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "usr-expert-3",
    email: "sarah.net@techrescue.io",
    first_name: "Sarah",
    last_name: "Jenkins",
    role: "expert",
    phone: "+1 (555) 345-6789",
    company: "CyberShield Net",
    country: "USA",
    state: "Texas",
    city: "Austin",
    online: true,
    rating: 4.88,
    jobs_completed: 114,
    total_earnings: 14200,
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
  {
    id: "usr-expert-4",
    email: "ananya.field@techrescue.io",
    first_name: "Ananya",
    last_name: "Deshmukh",
    role: "field_engineer",
    phone: "+91 98450 67890",
    company: "Deccan Field Tech",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    online: true,
    rating: 4.95,
    jobs_completed: 76,
    total_earnings: 8400,
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "usr-expert-5",
    email: "vikram.server@techrescue.io",
    first_name: "Vikram",
    last_name: "Singh",
    role: "expert",
    phone: "+91 99100 45678",
    company: "Delhi Enterprise Datacenter",
    country: "India",
    state: "Delhi",
    city: "Delhi",
    online: false,
    rating: 4.91,
    jobs_completed: 105,
    total_earnings: 12900,
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 80 * 86400000).toISOString(),
  },
];

let engineerProfiles: EngineerProfile[] = [
  {
    id: "prof-1",
    user_id: "usr-expert-1",
    role: "Cloud Engineer",
    categories: ["Cloud", "Security", "Software", "Application"],
    subskills: ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "PostgreSQL", "Linux Kernel"],
    experience: "7+ years",
    education: "M.S. Computer Science, Stanford University",
    summary: "Senior Cloud Infrastructure & Site Reliability Engineer specializing in zero-downtime migrations, Kubernetes clusters, and mission-critical cloud outages.",
    certifications: ["AWS Certified Solutions Architect - Professional", "Google Cloud Certified Professional Cloud Architect", "CKA - Certified Kubernetes Administrator"],
    toolset_level: "Enterprise L3 Field Kit",
    hourly_rate: 120,
  },
  {
    id: "prof-2",
    user_id: "usr-expert-2",
    role: "Field Engineer",
    categories: ["Hardware", "Network", "Application"],
    subskills: ["Dell PowerEdge Servers", "Cisco Routers", "SAN/NAS Storage", "Fiber Splicing", "Thermal Triage", "RAM/Motherboard Diagnostics"],
    experience: "9 years",
    education: "B.Tech Electrical & Electronics, VJTI Mumbai",
    summary: "Dedicated on-site hardware field engineer equipped with complete mobile diagnostic test benches, oscilloscope, and emergency spare components.",
    certifications: ["CompTIA A+ & Network+", "Cisco CCNA", "Dell Certified System Expert (DCSE)"],
    dispatch_radius_km: 45,
    toolset_level: "Enterprise L3 Field Kit",
    hourly_rate: 85,
  },
  {
    id: "prof-3",
    user_id: "usr-expert-3",
    role: "Network Engineer",
    categories: ["Network", "Security", "Hardware"],
    subskills: ["Fortinet FortiGate", "Palo Alto", "SonicWall", "BGP Routing", "IPSec VPN", "Wireshark Packet Analysis"],
    experience: "6 years",
    education: "B.S. Information Security, UT Austin",
    summary: "Network Security Specialist with extensive background mitigating complex DDoS attacks, enterprise firewall misconfigurations, and multi-branch VPN breakdowns.",
    certifications: ["CISSP", "Palo Alto Networks Certified Network Security Engineer (PCNSE)", "CCNP Enterprise"],
    toolset_level: "Advanced L2",
    hourly_rate: 110,
  },
  {
    id: "prof-4",
    user_id: "usr-expert-4",
    role: "Field Engineer",
    categories: ["Hardware", "Network", "Cloud"],
    subskills: ["Office Cabling & Patch Panels", "Access Point Setup", "Ubiquiti UniFi", "MacBook Logic Board Diagnostics", "Windows Workstations"],
    experience: "5 years",
    education: "B.E. Computer Engineering, RV College Bengaluru",
    summary: "Rapid on-premise IT responder for corporate offices, branch hubs, and co-working spaces across Bengaluru with under 45-minute on-site response time.",
    certifications: ["CompTIA A+", "Ubiquiti Enterprise Wireless Admin (UEWA)"],
    dispatch_radius_km: 30,
    toolset_level: "Advanced L2",
    hourly_rate: 75,
  },
  {
    id: "prof-5",
    user_id: "usr-expert-5",
    role: "Server Engineer",
    categories: ["Hardware", "Software", "Cloud", "Security"],
    subskills: ["Active Directory", "Windows Server 2022", "VMware ESXi", "Exchange Online", "Hyper-V", "Disaster Recovery"],
    experience: "8 years",
    education: "B.Tech Computer Science, IIT Delhi",
    summary: "Enterprise Server Administrator specializing in Active Directory crash recovery, domain controller synchronization, and hypervisor failovers.",
    certifications: ["Microsoft Certified: Windows Server Hybrid Administrator", "VMware Certified Professional (VCP)"],
    toolset_level: "Enterprise L3 Field Kit",
    hourly_rate: 105,
  },
];

let tickets: Ticket[] = [
  {
    id: "t-101",
    ticket_number: "TR-8942",
    client_id: "usr-client-1",
    client_name: "Lakshya Sharma",
    client_email: "lakshyaright@gmail.com",
    client_company: "Apex Global Tech",
    client_phone: "+1 (555) 234-5678",
    short_description: "Branch Office Core Router Kernel Panic & High Packet Loss",
    detailed_description: "Core Cisco 4451 gateway experiencing intermittent memory leaks and dropping 45% of outbound BGP traffic. 120 staff members unable to access ERP and VoIP calls dropped.",
    category: "Network",
    subcategory: "Router",
    impact: "Organization",
    urgency: "High",
    priority: "P1",
    assignment_group: "Network Support",
    support_type: "remote",
    location: "Mumbai Hub - BKC Branch",
    status: "in_progress",
    assigned_engineer_id: "usr-expert-3",
    assigned_engineer_name: "Sarah Jenkins",
    assigned_engineer_role: "Network Security Specialist",
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
    sla_target_hours: 2,
    sla_deadline: new Date(Date.now() + 75 * 60000).toISOString(),
    messages_count: 4,
    ai_diagnostics: {
      root_cause: "Suspected Cisco IOS-XE buffer overflow in BGP routing table parsing module.",
      recommended_actions: [
        "Isolate redundant WAN interface 2 to prevent routing loop.",
        "Flush corrupted BGP prefix cache via console port.",
        "Apply stable hotfix firmware release v17.9.4.",
      ],
      suggested_category: "Network",
      suggested_subcategory: "Router",
      suggested_urgency: "High",
      suggested_impact: "Organization",
      estimated_resolution_mins: 35,
      suggested_tools: ["Cisco CLI Console", "Wireshark Packet Capture", "BGP Route Inspector"],
    },
  },
  {
    id: "t-102",
    ticket_number: "TR-8941",
    client_id: "usr-client-1",
    client_name: "Lakshya Sharma",
    client_email: "lakshyaright@gmail.com",
    client_company: "Apex Global Tech",
    short_description: "Executive Laptop Thermal Throttling & Battery Swell",
    detailed_description: "Dell Precision 5570 chassis separating due to lithium-ion cell swelling. Fan running at maximum RPM with CPU frequency stuck at 0.79 GHz.",
    category: "Hardware",
    subcategory: "Dell PowerEdge",
    impact: "Single User",
    urgency: "Medium",
    priority: "P2",
    assignment_group: "Hardware Support",
    support_type: "field_onsite",
    location: "Andheri East, Mumbai",
    status: "open",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    sla_target_hours: 4,
    sla_deadline: new Date(Date.now() + 2 * 3600000).toISOString(),
    messages_count: 1,
  },
  {
    id: "t-103",
    ticket_number: "TR-8930",
    client_id: "usr-client-1",
    client_name: "Lakshya Sharma",
    client_email: "lakshyaright@gmail.com",
    client_company: "Apex Global Tech",
    short_description: "Outlook MAPI Profile Corruption, Error 0x80040154",
    detailed_description: "User cannot authenticate to Microsoft 365 Exchange Online. Outlook freezes on profile loading splash screen.",
    category: "Application",
    subcategory: "Outlook",
    impact: "Single User",
    urgency: "Medium",
    priority: "P3",
    assignment_group: "Application Support",
    support_type: "remote",
    location: "Remote",
    status: "resolved",
    assigned_engineer_id: "usr-expert-1",
    assigned_engineer_name: "Alex Rivera",
    assigned_engineer_role: "Cloud Engineer",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 22 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 22 * 3600000).toISOString(),
    resolution_note: "Cleaned orphaned Credential Manager tokens, rebuilt corrupt OST catalog via SCANPST, and reset modern authentication OAuth2 cache in registry.",
    resolution_category: "Software Configuration Fix",
    sla_target_hours: 4,
    sla_deadline: new Date(Date.now() - 20 * 3600000).toISOString(),
    messages_count: 6,
  },
  {
    id: "t-104",
    ticket_number: "TR-8915",
    client_id: "usr-client-1",
    client_name: "Lakshya Sharma",
    client_email: "lakshyaright@gmail.com",
    client_company: "Apex Global Tech",
    short_description: "PostgreSQL Database Connection Pool Exhaustion",
    detailed_description: "Production API throwing 'remaining connection slots reserved for non-replication superuser connections'. Application unresponsive.",
    category: "Cloud",
    subcategory: "Database",
    impact: "Organization",
    urgency: "High",
    priority: "P1",
    assignment_group: "Cloud Support",
    support_type: "remote",
    location: "Cloud (AWS us-east-1)",
    status: "resolved",
    assigned_engineer_id: "usr-expert-1",
    assigned_engineer_name: "Alex Rivera",
    assigned_engineer_role: "Cloud Engineer",
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 70 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 70 * 3600000).toISOString(),
    resolution_note: "Identified runaway leak in unclosed async worker threads. Configured PgBouncer transaction-mode pool with max 300 backend connections and terminated idle-in-transaction sessions.",
    resolution_category: "Database & Architecture Fix",
    sla_target_hours: 2,
    sla_deadline: new Date(Date.now() - 70 * 3600000).toISOString(),
    messages_count: 5,
  },
];

let ticketMessages: TicketMessage[] = [
  {
    id: "msg-1",
    ticket_number: "TR-8942",
    sender_id: "usr-client-1",
    sender_name: "Lakshya Sharma",
    sender_role: "client",
    message: "Our entire BKC branch WAN gateway is flapping. Can someone inspect the BGP routes immediately?",
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: "msg-2",
    ticket_number: "TR-8942",
    sender_id: "usr-expert-3",
    sender_name: "Sarah Jenkins",
    sender_role: "expert",
    message: "I've accepted ticket TR-8942 and initiated SSH telemetry analysis on your gateway. Buffer queue sizes show heavy queuing on interface Gi0/0/1.",
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: "msg-3",
    ticket_number: "TR-8942",
    sender_id: "usr-client-1",
    sender_name: "Lakshya Sharma",
    sender_role: "client",
    message: "Got it Sarah, should we fail over to our secondary MPLS link in the meantime?",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "msg-4",
    ticket_number: "TR-8942",
    sender_id: "usr-expert-3",
    sender_name: "Sarah Jenkins",
    sender_role: "expert",
    message: "Yes, I am shifting BGP local-preference to the standby link now. Hold on for 60 seconds while route convergence completes.",
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

// Current active session state
let currentUserId: string | null = "usr-client-1";

// High Availability Cluster Telemetry Simulation
let clusterNodes: ClusterNode[] = [
  {
    id: "node-asia-east",
    region: "asia-east1 (Primary - Taiwan)",
    name: "Rescue-Edge-01-Asia",
    status: "healthy",
    latency_ms: 18,
    load_percentage: 34,
    connections: 1420,
    is_primary: true,
  },
  {
    id: "node-us-east",
    region: "us-east1 (Standby Active - Virginia)",
    name: "Rescue-Edge-02-USEast",
    status: "standby",
    latency_ms: 68,
    load_percentage: 12,
    connections: 680,
    is_primary: false,
  },
  {
    id: "node-europe-west",
    region: "europe-west1 (Standby Active - Belgium)",
    name: "Rescue-Edge-03-EUWest",
    status: "standby",
    latency_ms: 82,
    load_percentage: 15,
    connections: 520,
    is_primary: false,
  },
];

// Seed default password for demo accounts
users.forEach((u) => {
  if (!u.password) u.password = "password123";
});

// --- AUTH & USER ENDPOINTS ---

app.get("/api/me", (req, res) => {
  if (!currentUserId) {
    return res.json(null);
  }
  const user = users.find((u) => u.id === currentUserId);
  if (!user) {
    return res.json(null);
  }
  const profile = engineerProfiles.find((p) => p.user_id === user.id);
  res.json({ ...user, engineer_profiles: profile ? [profile] : [] });
});

app.post("/api/auth/switch-demo-user", (req, res) => {
  const { user_id } = req.body;
  const user = users.find((u) => u.id === user_id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  currentUserId = user.id;
  const profile = engineerProfiles.find((p) => p.user_id === user.id);
  res.json({ success: true, user: { ...user, engineer_profiles: profile ? [profile] : [] } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Please provide an email address." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(401).json({
      error: "No account found with this email. Please click 'Create Account' to register.",
    });
  }

  // Check password (allow 'password123' or exact match)
  if (password && user.password && user.password !== password.trim() && password !== "password123") {
    return res.status(401).json({ error: "Incorrect password. Please verify your credentials and try again." });
  }

  currentUserId = user.id;
  const profile = engineerProfiles.find((p) => p.user_id === user.id);
  res.json({
    token: `jwt-token-${user.id}-${Date.now()}`,
    user: { ...user, engineer_profiles: profile ? [profile] : [] },
    role: user.role,
  });
});

app.post("/api/auth/register", (req, res) => {
  const { first_name, last_name, email, password, role, phone, company, country, state, city } = req.body;

  if (!first_name || !first_name.trim()) {
    return res.status(400).json({ error: "First name is required." });
  }
  if (!last_name || !last_name.trim()) {
    return res.status(400).json({ error: "Last name is required." });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email address is required." });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(400).json({
      error: "An account with this email address already exists. Please log in with your password.",
    });
  }

  const selectedRole = role === "field_engineer" ? "field_engineer" : role === "expert" ? "expert" : "client";

  const newUser: User = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    password: password.trim(),
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    role: selectedRole,
    phone: phone?.trim() || "",
    company: company?.trim() || (selectedRole === "client" ? "Independent Client" : "TechRescue Specialist"),
    country: country?.trim() || "India",
    state: state?.trim() || "Maharashtra",
    city: city?.trim() || "Mumbai",
    online: true,
    created_at: new Date().toISOString(),
    jobs_completed: 0,
    total_earnings: 0,
    rating: 5.0,
    avatar_url:
      selectedRole === "client"
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        : selectedRole === "field_engineer"
        ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  };

  users.push(newUser);
  currentUserId = newUser.id;

  let newProfile: EngineerProfile | undefined;
  if (selectedRole === "expert" || selectedRole === "field_engineer") {
    newProfile = {
      id: `prof-${Date.now()}`,
      user_id: newUser.id,
      role: selectedRole === "field_engineer" ? "Field Engineer" : "Cloud Engineer",
      categories: selectedRole === "field_engineer" ? ["Hardware", "Server Rack", "Network"] : ["Cloud", "Security", "DevOps"],
      subskills: ["Diagnostics", "Fast Response", "Enterprise On-Site Support"],
      experience: "4+ years verified",
      education: "Certified IT Infrastructure Professional",
      summary: "Certified engineer available for immediate mission-critical rescue dispatch.",
      hourly_rate: selectedRole === "field_engineer" ? 60 : 75,
      dispatch_radius_km: selectedRole === "field_engineer" ? 35 : 0,
    };
    engineerProfiles.push(newProfile);
  }

  res.json({
    token: `jwt-token-${newUser.id}-${Date.now()}`,
    user: { ...newUser, engineer_profiles: newProfile ? [newProfile] : [] },
    role: newUser.role,
  });
});

app.post("/api/auth/logout", (req, res) => {
  currentUserId = null;
  res.json({ success: true, message: "Logged out successfully" });
});

app.post("/api/update-status", (req, res) => {
  const { online } = req.body;
  const user = users.find((u) => u.id === currentUserId);
  if (user) {
    user.online = Boolean(online);
    return res.json({ success: true, online: user.online });
  }
  res.json({ success: true, online: Boolean(online) });
});

// --- CLIENT DASHBOARD & TICKETS ---

app.get("/api/client-dashboard", (req, res) => {
  const user = users.find((u) => u.id === currentUserId) || users[0];
  const clientTickets = tickets.filter(
    (t) => t.client_id === user.id || user.role === "admin" || user.role === "expert"
  );

  const total = clientTickets.length;
  const open = clientTickets.filter((t) => t.status === "open").length;
  const inProgress = clientTickets.filter((t) => t.status === "in_progress").length;
  const resolved = clientTickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  res.json({
    total,
    open,
    inProgress,
    resolved,
    recent: clientTickets.slice(0, 10),
  });
});

app.post("/api/raise-query", async (req, res) => {
  const user = users.find((u) => u.id === currentUserId) || users[0];
  const {
    short_description,
    detailed_description,
    category,
    subcategory,
    impact,
    urgency,
    assignment_group,
    support_type,
    location,
  } = req.body;

  if (!short_description) {
    return res.status(400).json({ error: "Short description is required." });
  }

  const ticketNumber = `TR-${Math.floor(1000 + Math.random() * 9000)}`;
  const priority =
    urgency === "Critical" || impact === "Organization"
      ? "P1"
      : urgency === "High"
      ? "P2"
      : urgency === "Medium"
      ? "P3"
      : "P4";

  const slaHours = priority === "P1" ? 1 : priority === "P2" ? 3 : priority === "P3" ? 6 : 12;

  let aiDiag: AIDiagnosticResult | undefined;

  // Try Server-Side Gemini Smart Diagnostics if available
  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `Analyze this technical support ticket.
Ticket Summary: ${short_description}
Details: ${detailed_description || "N/A"}
Category: ${category || "General"}
Subcategory: ${subcategory || "General"}

Provide a structured diagnostic summary with:
- root_cause: Likely technical cause
- recommended_actions: Array of 3 specific technical remediation steps
- suggested_tools: Array of 3 tools/utilities to resolve
- estimated_resolution_mins: Realistic time in minutes
- safety_warnings: Array of warnings if any (e.g. data backup, electrical safety)`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              root_cause: { type: Type.STRING },
              recommended_actions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggested_tools: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              estimated_resolution_mins: { type: Type.NUMBER },
              safety_warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["root_cause", "recommended_actions", "suggested_tools", "estimated_resolution_mins"],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        aiDiag = {
          root_cause: parsed.root_cause,
          recommended_actions: parsed.recommended_actions || [],
          suggested_category: category || "General",
          suggested_subcategory: subcategory || "General",
          suggested_urgency: (urgency as any) || "Medium",
          suggested_impact: (impact as any) || "Single User",
          estimated_resolution_mins: parsed.estimated_resolution_mins || 30,
          suggested_tools: parsed.suggested_tools || [],
          safety_warnings: parsed.safety_warnings,
        };
      }
    } catch (err) {
      console.warn("Gemini diagnostics skipped or fallback:", err);
    }
  }

  // Fallback intelligent diagnostics heuristics if AI was unavailable
  if (!aiDiag) {
    aiDiag = {
      root_cause: `Heuristic inspection detected standard ${category || "IT"} anomaly requiring diagnostic telemetry verification.`,
      recommended_actions: [
        "Capture system error logs and verify active network/hardware socket connectivity.",
        "Check event logs for error code traces and restart dependent daemon services.",
        "Execute configuration verification benchmark and confirm client access.",
      ],
      suggested_category: category || "Software",
      suggested_subcategory: subcategory || "General",
      suggested_urgency: (urgency as any) || "Medium",
      suggested_impact: (impact as any) || "Single User",
      estimated_resolution_mins: priority === "P1" ? 25 : 45,
      suggested_tools: ["Diagnostic Terminal", "Event Viewer", "Ping / TraceRoute"],
    };
  }

  const newTicket: Ticket = {
    id: `t-${Date.now()}`,
    ticket_number: ticketNumber,
    client_id: user.id,
    client_name: `${user.first_name} ${user.last_name}`.trim(),
    client_email: user.email,
    client_company: user.company || "Client Org",
    client_phone: user.phone,
    short_description,
    detailed_description: detailed_description || "",
    category: category || "Software",
    subcategory: subcategory || "General",
    impact: (impact as any) || "Single User",
    urgency: (urgency as any) || "Medium",
    priority,
    assignment_group: assignment_group || "Application Support",
    support_type: (support_type as any) || "remote",
    location: location || user.city || "Remote Support",
    status: "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sla_target_hours: slaHours,
    sla_deadline: new Date(Date.now() + slaHours * 3600000).toISOString(),
    ai_diagnostics: aiDiag,
    messages_count: 0,
  };

  tickets.unshift(newTicket);

  // Auto create initial system message
  ticketMessages.push({
    id: `msg-${Date.now()}`,
    ticket_number: ticketNumber,
    sender_id: "system",
    sender_name: "TechRescue High-Availability Dispatch",
    sender_role: "admin",
    message: `Ticket ${ticketNumber} registered with Priority ${priority}. Routing to active ${newTicket.assignment_group} engineers across ${clusterNodes[0].region}.`,
    timestamp: new Date().toISOString(),
    is_automated: true,
  });

  res.json({
    success: true,
    ticket_number: ticketNumber,
    ticket: newTicket,
  });
});

app.get("/api/query-history", (req, res) => {
  res.json(tickets);
});

app.get("/api/queries/:ticket_number", (req, res) => {
  const ticket = tickets.find(
    (t) => t.ticket_number.toLowerCase() === req.params.ticket_number.toLowerCase()
  );
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  res.json(ticket);
});

// --- EXPERT & ENGINEER DIRECTORIES ---

app.get("/api/experts", (req, res) => {
  const { search, category, location, online } = req.query;
  let results = users.filter((u) => u.role === "expert" || u.role === "field_engineer");

  if (online === "true") {
    results = results.filter((u) => u.online);
  }

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(
      (u) =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company || "").toLowerCase().includes(q)
    );
  }

  if (location) {
    const loc = String(location).toLowerCase();
    results = results.filter(
      (u) =>
        (u.country || "").toLowerCase().includes(loc) ||
        (u.state || "").toLowerCase().includes(loc) ||
        (u.city || "").toLowerCase().includes(loc)
    );
  }

  const enriched = results.map((u) => {
    const profile = engineerProfiles.find((p) => p.user_id === u.id);
    return {
      ...u,
      engineer_profiles: profile ? [profile] : [],
    };
  });

  if (category) {
    const cat = String(category).toLowerCase();
    const filtered = enriched.filter((u) =>
      u.engineer_profiles.some((p) =>
        p.categories.some((c) => c.toLowerCase().includes(cat))
      )
    );
    return res.json(filtered);
  }

  res.json(enriched);
});

app.get("/api/field-engineers", (req, res) => {
  const { search, location, online } = req.query;
  let results = users.filter((u) => u.role === "field_engineer");

  if (online === "true") {
    results = results.filter((u) => u.online);
  }

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(
      (u) =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        (u.city || "").toLowerCase().includes(q) ||
        (u.state || "").toLowerCase().includes(q)
    );
  }

  if (location) {
    const loc = String(location).toLowerCase();
    results = results.filter(
      (u) =>
        (u.city || "").toLowerCase().includes(loc) ||
        (u.state || "").toLowerCase().includes(loc) ||
        (u.country || "").toLowerCase().includes(loc)
    );
  }

  const enriched = results.map((u) => {
    const profile = engineerProfiles.find((p) => p.user_id === u.id);
    return {
      ...u,
      engineer_profiles: profile ? [profile] : [],
    };
  });

  res.json(enriched);
});

// --- EXPERT ALERTS & WORKFLOWS ---

app.get("/api/expert-alerts", (req, res) => {
  // Returns open unassigned tickets as alerts
  const openTickets = tickets.filter((t) => t.status === "open");
  res.json(openTickets);
});

app.get("/api/engineer-alerts", (req, res) => {
  // Returns tickets assigned to current user or all in-progress / resolved for engineer console
  const user = users.find((u) => u.id === currentUserId) || users[1];
  const myTickets = tickets.filter(
    (t) => t.assigned_engineer_id === user.id || t.status === "in_progress" || t.status === "resolved"
  );
  res.json(myTickets);
});

app.post("/api/accept-ticket", (req, res) => {
  const { ticket_number } = req.body;
  const user = users.find((u) => u.id === currentUserId) || users[1];
  const ticket = tickets.find((t) => t.ticket_number === ticket_number);

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  ticket.status = "in_progress";
  ticket.assigned_engineer_id = user.id;
  ticket.assigned_engineer_name = `${user.first_name} ${user.last_name}`.trim();
  const profile = engineerProfiles.find((p) => p.user_id === user.id);
  ticket.assigned_engineer_role = profile?.role || "Support Engineer";
  ticket.updated_at = new Date().toISOString();

  // Add system message
  ticketMessages.push({
    id: `msg-${Date.now()}`,
    ticket_number: ticket.ticket_number,
    sender_id: user.id,
    sender_name: ticket.assigned_engineer_name,
    sender_role: user.role,
    message: `I have taken ownership of ticket ${ticket.ticket_number} and am actively investigating the issue.`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, ticket });
});

app.post("/api/resolve-ticket", (req, res) => {
  const { ticket_number, resolution_note, resolution_category } = req.body;
  const user = users.find((u) => u.id === currentUserId) || users[1];
  const ticket = tickets.find((t) => t.ticket_number === ticket_number);

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  if (!resolution_note) {
    return res.status(400).json({ error: "Resolution note is required." });
  }

  ticket.status = "resolved";
  ticket.resolution_note = resolution_note;
  ticket.resolution_category = resolution_category || "Remediated by Engineer";
  ticket.resolved_at = new Date().toISOString();
  ticket.updated_at = new Date().toISOString();

  // Increment engineer jobs count and earnings
  if (user) {
    user.jobs_completed = (user.jobs_completed || 0) + 1;
    user.total_earnings = (user.total_earnings || 0) + 95;
  }

  // Add closing message
  ticketMessages.push({
    id: `msg-${Date.now()}`,
    ticket_number: ticket.ticket_number,
    sender_id: user.id,
    sender_name: `${user.first_name} ${user.last_name}`.trim(),
    sender_role: user.role,
    message: `[Ticket Resolved]: ${resolution_note}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, ticket });
});

app.post("/api/update-query-status", (req, res) => {
  const { ticket_number, status } = req.body;
  const ticket = tickets.find((t) => t.ticket_number === ticket_number);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found." });
  }
  ticket.status = status;
  ticket.updated_at = new Date().toISOString();
  res.json({ success: true, ticket });
});

// --- REAL-TIME MESSAGING & NOTIFICATIONS ---

app.get("/api/messages/:ticket_number", (req, res) => {
  const msgs = ticketMessages.filter(
    (m) => m.ticket_number.toLowerCase() === req.params.ticket_number.toLowerCase()
  );
  res.json(msgs);
});

app.get("/api/all-messages", (req, res) => {
  // Returns all recent messages for real-time notification tracking
  res.json(ticketMessages.slice(-50));
});

app.post("/api/send-message", (req, res) => {
  const { ticket_number, message, receiver_id } = req.body;
  const user = users.find((u) => u.id === currentUserId) || users[0];

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  const targetTicket = ticket_number || "TR-8942";
  const newMsg: TicketMessage = {
    id: `msg-${Date.now()}`,
    ticket_number: targetTicket,
    sender_id: user.id,
    sender_name: `${user.first_name} ${user.last_name}`.trim() || user.email,
    sender_role: user.role,
    message: message.trim(),
    timestamp: new Date().toISOString(),
  };

  ticketMessages.push(newMsg);

  // Update ticket message count
  const ticket = tickets.find((t) => t.ticket_number === targetTicket);
  if (ticket) {
    ticket.messages_count = (ticket.messages_count || 0) + 1;
    ticket.updated_at = new Date().toISOString();
  }

  res.json({ success: true, message: newMsg });
});

// --- PROFILE ENDPOINTS ---

app.get("/api/profile", (req, res) => {
  const user = users.find((u) => u.id === currentUserId) || users[1];
  const profile = engineerProfiles.find((p) => p.user_id === user.id) || engineerProfiles[0];
  res.json(profile);
});

app.post("/api/save-profile", (req, res) => {
  const user = users.find((u) => u.id === currentUserId) || users[1];
  const { categories, subskills, role, experience, education, summary, hourly_rate, certifications } = req.body;

  let profile = engineerProfiles.find((p) => p.user_id === user.id);
  if (!profile) {
    profile = {
      id: `prof-${Date.now()}`,
      user_id: user.id,
      role: role || "Cloud Engineer",
      categories: categories || ["Hardware", "Software"],
      subskills: subskills || ["IT Support"],
      experience: experience || "3 years",
      education: education || "Bachelor's",
      summary: summary || "",
      hourly_rate: Number(hourly_rate) || 75,
      certifications: certifications || [],
    };
    engineerProfiles.push(profile);
  } else {
    profile.categories = categories || profile.categories;
    profile.subskills = subskills || profile.subskills;
    profile.role = role || profile.role;
    profile.experience = experience || profile.experience;
    profile.education = education || profile.education;
    profile.summary = summary || profile.summary;
    if (hourly_rate) profile.hourly_rate = Number(hourly_rate);
    if (certifications) profile.certifications = certifications;
  }

  res.json({ success: true, profile });
});

// --- AI DIAGNOSTICS ENDPOINT ---

app.post("/api/ai/diagnose", async (req, res) => {
  const { query, category, subcategory } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query description is required." });
  }

  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `You are the AI triage assistant for TechRescue, an enterprise on-demand IT support and field engineer rescue platform.
Analyze the following user problem:
"${query}"
Category context: ${category || "General"} / ${subcategory || "General"}

Classify and provide actionable technical triage recommendations:
- root_cause: Concise explanation of root cause
- recommended_actions: Array of 3-4 ordered step-by-step diagnostic actions
- suggested_category: Hardware, Software, Application, Network, Security, Cloud, VoIP, or Storage
- suggested_subcategory: Specific technology (e.g. Outlook, Cisco Router, Windows 11, Kubernetes, PostgreSQL, AWS IAM, Dell Server, etc.)
- suggested_urgency: Low, Medium, High, or Critical
- suggested_impact: Single User, Multiple Users, or Organization
- estimated_resolution_mins: Realistic time in minutes
- suggested_tools: Array of 3 utilities/command lines/tools
- safety_warnings: Array of critical safety or backup precautions`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              root_cause: { type: Type.STRING },
              recommended_actions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggested_category: { type: Type.STRING },
              suggested_subcategory: { type: Type.STRING },
              suggested_urgency: {
                type: Type.STRING,
                enum: ["Low", "Medium", "High", "Critical"],
              },
              suggested_impact: {
                type: Type.STRING,
                enum: ["Single User", "Multiple Users", "Organization"],
              },
              estimated_resolution_mins: { type: Type.NUMBER },
              suggested_tools: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              safety_warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "root_cause",
              "recommended_actions",
              "suggested_category",
              "suggested_subcategory",
              "suggested_urgency",
              "suggested_impact",
              "estimated_resolution_mins",
              "suggested_tools",
            ],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, diagnostics: parsed });
      }
    } catch (err) {
      console.warn("Gemini diagnostics error:", err);
    }
  }

  // Heuristic intelligent fallback
  const isNetwork = /network|wifi|router|dns|ping|vpn|firewall|slow/i.test(query);
  const isHardware = /screen|battery|fan|heat|keyboard|power|ram|disk|cable/i.test(query);
  const isCloud = /aws|gcp|azure|database|postgres|server|docker|k8s/i.test(query);

  const cat = isNetwork ? "Network" : isHardware ? "Hardware" : isCloud ? "Cloud" : "Application";
  const subcat = isNetwork ? "Router" : isHardware ? "Dell PowerEdge" : isCloud ? "Database" : "Outlook";

  res.json({
    success: true,
    diagnostics: {
      root_cause: `Potential ${cat} sublayer interruption identified from symptom pattern "${query.slice(0, 45)}...".`,
      recommended_actions: [
        "Isolate network interface or service socket to verify latency and packet drop rates.",
        "Inspect telemetry logs for recent credential or firmware mismatch events.",
        "Apply standard remediation script or dispatch verified on-site field specialist.",
      ],
      suggested_category: cat,
      suggested_subcategory: subcat,
      suggested_urgency: "High",
      suggested_impact: "Multiple Users",
      estimated_resolution_mins: 35,
      suggested_tools: ["Wireshark", "Terminal SSH", "Hardware Diagnostic Suite"],
      safety_warnings: ["Ensure full data snapshot or configuration backup prior to executing registry resets."],
    },
  });
});

// --- HIGH AVAILABILITY & TELEMETRY ---

app.get("/api/system/ha-metrics", (req, res) => {
  // Return realistic telemetry
  const metrics: SystemMetrics = {
    uptime_percentage: 99.994,
    p50_latency_ms: 14.2,
    p95_latency_ms: 38.6,
    requests_per_second: 342,
    active_incidents: tickets.filter((t) => t.status === "in_progress" && t.priority === "P1").length,
    failover_ready: true,
    last_failover_test: new Date(Date.now() - 14 * 86400000).toISOString(),
    cluster_nodes: clusterNodes,
  };
  res.json(metrics);
});

app.post("/api/system/simulate-failover", (req, res) => {
  // Rotate primary node for live failover test
  const primaryIdx = clusterNodes.findIndex((n) => n.is_primary);
  const nextIdx = (primaryIdx + 1) % clusterNodes.length;

  clusterNodes.forEach((node, i) => {
    if (i === nextIdx) {
      node.is_primary = true;
      node.status = "healthy";
    } else {
      node.is_primary = false;
      node.status = "standby";
    }
  });

  res.json({
    success: true,
    message: `Zero-downtime failover executed successfully. Traffic rerouted to ${clusterNodes[nextIdx].name} (${clusterNodes[nextIdx].region}).`,
    cluster_nodes: clusterNodes,
  });
});

// --- START SERVER & VITE INTEGRATION ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TechRescue HA Server running on http://localhost:${PORT}`);
  });
}

startServer();
