export type UserRole = 'client' | 'expert' | 'field_engineer' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  company?: string;
  country?: string;
  state?: string;
  city?: string;
  online: boolean;
  avatar_url?: string;
  hourly_rate?: number;
  rating?: number;
  jobs_completed?: number;
  total_earnings?: number;
  created_at?: string;
}

export interface EngineerProfile {
  id: string;
  user_id: string;
  role: 'Field Engineer' | 'Server Engineer' | 'Cloud Engineer' | 'Network Engineer' | 'Security Specialist';
  categories: string[];
  subskills: string[];
  manualSkills?: string;
  experience: string;
  education: string;
  summary: string;
  certifications?: string[];
  dispatch_radius_km?: number;
  toolset_level?: 'Standard L1' | 'Advanced L2' | 'Enterprise L3 Field Kit';
  hourly_rate: number;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'ignored';
export type TicketUrgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketImpact = 'Single User' | 'Multiple Users' | 'Organization';
export type SupportType = 'remote' | 'field_onsite';

export interface AIDiagnosticResult {
  root_cause: string;
  recommended_actions: string[];
  suggested_category: string;
  suggested_subcategory: string;
  suggested_urgency: TicketUrgency;
  suggested_impact: TicketImpact;
  estimated_resolution_mins: number;
  suggested_tools: string[];
  safety_warnings?: string[];
}

export interface Ticket {
  id: string;
  ticket_number: string;
  client_id: string;
  client_name: string;
  client_email: string;
  client_company?: string;
  client_phone?: string;
  short_description: string;
  detailed_description: string;
  category: string;
  subcategory: string;
  impact: TicketImpact;
  urgency: TicketUrgency;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  assignment_group: string;
  support_type: SupportType;
  location: string;
  status: TicketStatus;
  assigned_engineer_id?: string;
  assigned_engineer_name?: string;
  assigned_engineer_role?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_note?: string;
  resolution_category?: string;
  sla_target_hours: number;
  sla_deadline: string;
  ai_diagnostics?: AIDiagnosticResult;
  messages_count?: number;
}

export interface TicketMessage {
  id: string;
  ticket_number: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  message: string;
  timestamp: string;
  is_automated?: boolean;
}

export interface ClusterNode {
  id: string;
  region: string;
  name: string;
  status: 'healthy' | 'standby' | 'degraded' | 'failover_active';
  latency_ms: number;
  load_percentage: number;
  connections: number;
  is_primary: boolean;
}

export interface SystemMetrics {
  uptime_percentage: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  requests_per_second: number;
  active_incidents: number;
  failover_ready: boolean;
  last_failover_test: string;
  cluster_nodes: ClusterNode[];
}
