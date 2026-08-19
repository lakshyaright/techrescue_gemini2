import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  Phone,
  MapPin,
  Briefcase,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "../lib/api.ts";
import type { User, UserRole } from "../types.ts";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  defaultRole?: UserRole;
  onAuthSuccess: (user: User, redirectPortal: "client" | "expert") => void;
  reasonMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
  defaultRole = "client",
  onAuthSuccess,
  reasonMessage,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);

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

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
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
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter your full name.");
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
        city: city.trim() || "Global",
        country: "India",
        state: "Maharashtra",
      };

      const res = await api.register(payload);
      if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 border-b border-slate-800 relative">
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-lg shadow-teal-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === "login" ? "Sign In to TechRescue" : "Create Your TechRescue Account"}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === "login"
                  ? "Access your dashboard, active tickets, and high-availability operations"
                  : "Join as a client requesting IT rescue or a certified rescue engineer"}
              </p>
            </div>
          </div>

          {reasonMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-teal-950/80 border border-teal-700/80 text-xs text-teal-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{reasonMessage}</span>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 mt-4 text-xs font-semibold">
            <button
              id="auth-tab-login-btn"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                mode === "login"
                  ? "bg-teal-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-register-btn"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                mode === "register"
                  ? "bg-emerald-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* --- REGISTER VIEW --- */}
          {mode === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  I am registering as:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("client")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedRole === "client"
                        ? "bg-teal-950/80 border-teal-500 text-white shadow-md shadow-teal-950"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className={`w-4 h-4 ${selectedRole === "client" ? "text-teal-400" : "text-slate-400"}`} />
                      <span className="font-bold text-xs text-white">Client / Organization</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Request on-demand field engineers, AI diagnostics, and SLA IT dispatch.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("field_engineer")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedRole === "field_engineer" || selectedRole === "expert"
                        ? "bg-amber-950/80 border-amber-500 text-white shadow-md shadow-amber-950"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className={`w-4 h-4 ${selectedRole !== "client" ? "text-amber-400" : "text-slate-400"}`} />
                      <span className="font-bold text-xs text-white">Rescue Engineer</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Claim emergency tickets, perform on-site visits, and provide remote cloud fixes.
                    </p>
                  </button>
                </div>
              </div>

              {/* Name Fields */}
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

              {/* Email & Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
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
                    placeholder="Create secure password (min. 4 chars)"
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

              {/* Company / City / Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {selectedRole === "client" ? "Company / Org" : "Specialty / Service"}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder={selectedRole === "client" ? "e.g. Acme Corp" : "e.g. Network & Server"}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City / Region</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Mumbai / San Francisco"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                id="create-account-submit-btn"
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm active:scale-98"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create {selectedRole === "client" ? "Client" : "Engineer"} Account & Enter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* --- LOGIN VIEW --- */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <span className="text-[11px] text-slate-400">Default for demo: password123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
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

              <button
                type="submit"
                disabled={isLoading}
                id="login-submit-btn"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm active:scale-98"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Log In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Quick Demo Switcher */}
              <div className="pt-3 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 mb-2">
                  Or sign in instantly with a test account:
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("lakshyaright@gmail.com", "client")}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition cursor-pointer"
                  >
                    <p className="font-semibold text-teal-300">Lakshya S.</p>
                    <p className="text-[10px] text-slate-400">Client</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount("rajesh.hardware@techrescue.io", "field_engineer")}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition cursor-pointer"
                  >
                    <p className="font-semibold text-amber-300">Rajesh K.</p>
                    <p className="text-[10px] text-slate-400">Field Eng</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoAccount("alex.cloud@techrescue.io", "expert")}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition cursor-pointer"
                  >
                    <p className="font-semibold text-indigo-300">Alex R.</p>
                    <p className="text-[10px] text-slate-400">Cloud Eng</p>
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-slate-400">
            {mode === "login" ? (
              <span>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMessage(null);
                  }}
                  className="text-teal-400 hover:underline font-semibold cursor-pointer"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage(null);
                  }}
                  className="text-teal-400 hover:underline font-semibold cursor-pointer"
                >
                  Sign in here
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
