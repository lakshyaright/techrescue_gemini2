import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  Phone,
  MapPin,
  Briefcase,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Globe,
  Server,
  Zap,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { api } from "../lib/api.ts";
import type { User, UserRole } from "../types.ts";

interface AuthPortalViewProps {
  onAuthSuccess: (user: User, redirectPortal: "client" | "expert") => void;
  onExploreShowcase: () => void;
}

export const AuthPortalView: React.FC<AuthPortalViewProps> = ({
  onAuthSuccess,
  onExploreShowcase,
}) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.login(email.trim(), password.trim());
      if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter both first and last name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload: Partial<User> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: selectedRole,
        company: company.trim() || (selectedRole === "client" ? "Independent Client" : "TechRescue Specialist"),
        phone: phone.trim() || "+1 (555) 000-0000",
        city: city.trim() || "Mumbai",
        country: "India",
        state: "Maharashtra",
      };

      const res = await api.register(payload);
      if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. One person can only create one account.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setPassword("password123");
    setSelectedRole(demoRole);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Platform Branding & Single-Account Policy */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Authentication Gateway • 99.994% HA Edge</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              TechRescue <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Login Gateway</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              High-Availability on-demand IT & certified field engineering rescue platform. Sign in to access your role-specific dashboard.
            </p>
          </div>

          {/* Single Account Policy Highlight Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Single-Account Policy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Each individual or organization can create <strong>only one account</strong>.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Clients:</strong> Log in directly to the Client Dashboard to dispatch on-site field engineers and raise emergency tickets.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Rescue Engineers:</strong> Log in directly to the Engineer Console to claim jobs, manage on-site visits, and generate PDF service slips.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={onExploreShowcase}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Explore Public Showcase & SLAs first</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Login / Register Form Card */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 mb-6 text-xs font-bold">
            <button
              id="auth-gateway-signin-tab"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                mode === "login"
                  ? "bg-teal-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In with Credentials
            </button>
            <button
              id="auth-gateway-register-tab"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
                mode === "register"
                  ? "bg-emerald-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create One Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <span className="text-[11px] text-slate-400">Default for demo: password123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                id="portal-login-btn"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm active:scale-98"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Log In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Credentials Switcher */}
              <div className="pt-4 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 mb-2.5">
                  Or instant test with verified credentials:
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("lakshyaright@gmail.com", "client")}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition cursor-pointer group"
                  >
                    <p className="font-semibold text-teal-300 group-hover:text-teal-200">Lakshya S.</p>
                    <p className="text-[10px] text-slate-400">Client Account</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount("rajesh.hardware@techrescue.io", "field_engineer")}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition cursor-pointer group"
                  >
                    <p className="font-semibold text-amber-300 group-hover:text-amber-200">Rajesh K.</p>
                    <p className="text-[10px] text-slate-400">Field Engineer</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount("alex.cloud@techrescue.io", "expert")}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition cursor-pointer group"
                  >
                    <p className="font-semibold text-indigo-300 group-hover:text-indigo-200">Alex R.</p>
                    <p className="text-[10px] text-slate-400">Cloud Expert</p>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* CREATE SINGLE ACCOUNT FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Your Account Role (Permanent):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("client")}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      selectedRole === "client"
                        ? "bg-teal-950/90 border-teal-500 text-white shadow-md shadow-teal-950"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className={`w-4 h-4 ${selectedRole === "client" ? "text-teal-400" : "text-slate-400"}`} />
                      <span className="font-bold text-xs text-white">Client Account</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      For IT departments requesting on-site & remote rescue.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("field_engineer")}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      selectedRole !== "client"
                        ? "bg-amber-950/90 border-amber-500 text-white shadow-md shadow-amber-950"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className={`w-4 h-4 ${selectedRole !== "client" ? "text-amber-400" : "text-slate-400"}`} />
                      <span className="font-bold text-xs text-white">Engineer Account</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      For certified field and cloud triage engineers.
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (One Account per Person) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Set secure password (min. 4 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {selectedRole === "client" ? "Company / Org" : "Specialty"}
                  </label>
                  <input
                    type="text"
                    placeholder={selectedRole === "client" ? "e.g. Apex Global" : "e.g. Server & Hardware"}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai / San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                id="portal-register-btn"
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm active:scale-98"
              >
                {isLoading ? (
                  <span>Creating Your Single Account...</span>
                ) : (
                  <>
                    <span>Create {selectedRole === "client" ? "Client" : "Engineer"} Account & Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
