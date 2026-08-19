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
  Eye,
  EyeOff,
  Globe,
  CheckCircle2,
  Loader2,
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

  // Google Login Role Selection State for first-time Google sign-ins
  const [googlePendingUser, setGooglePendingUser] = useState<{
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
      const res = await api.firebaseLogin(email.trim(), password.trim());
      if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
      }
    } catch (err: any) {
      let msg = err.message || "Failed to sign in. Please verify your email and password.";
      if (msg.includes("auth/user-not-found") || msg.includes("auth/invalid-credential")) {
        msg = "No account found with these credentials. Please check your email or click 'Create One Account'.";
      } else if (msg.includes("auth/wrong-password")) {
        msg = "Incorrect password. Please verify and try again.";
      } else if (msg.includes("auth/invalid-email")) {
        msg = "Please enter a valid email address.";
      }
      setErrorMessage(msg);
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
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters for security.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.firebaseRegister({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: selectedRole,
        company: company.trim() || (selectedRole === "client" ? "Independent Client" : "TechRescue Specialist"),
        phone: phone.trim() || "",
        city: city.trim() || "Mumbai",
      });

      if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
      }
    } catch (err: any) {
      let msg = err.message || "Registration failed. One person can only create one account.";
      if (msg.includes("auth/email-already-in-use")) {
        msg = "An account with this email address already exists. Each person can only create one account. Please sign in.";
      } else if (msg.includes("auth/weak-password")) {
        msg = "Password should be at least 6 characters.";
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.firebaseGoogleSignIn();
      if (res.isNewUser && res.firebaseUser) {
        // Prompt for single role selection for this Gmail account
        setGooglePendingUser(res.firebaseUser);
      } else if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMessage(err.message || "Google authentication failed. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCompleteGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googlePendingUser) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.firebaseCompleteGoogleProfile({
        uid: googlePendingUser.uid,
        email: googlePendingUser.email,
        displayName: googlePendingUser.displayName,
        role: selectedRole,
        company: company.trim() || (selectedRole === "client" ? "Independent Client" : "TechRescue Specialist"),
        phone: phone.trim(),
        city: city.trim() || "Mumbai",
        avatarUrl: googlePendingUser.photoURL,
      });

      if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete account setup.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Platform Branding & Single-Account Policy */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Real Database & Cloud Auth Gateway • 99.994% HA Edge</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              TechRescue <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Authentication</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              High-Availability on-demand IT & certified field engineering rescue platform. Authenticate with your email address or Google Gmail account.
            </p>
          </div>

          {/* Single Account Policy Highlight Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Single-Account Policy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every person or organization registers <strong>one unique account</strong> with an immutable role:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Client / Organization:</strong> Manage emergency tickets, dispatch certified on-site hardware engineers, and receive PDF audit service slips.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Rescue Engineer:</strong> Receive instant telemetry alerts, claim on-site dispatches, submit digital triage notes, and track earnings.
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
              <span>Explore Public Showcase & SLAs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Real Auth Card */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* If completing Google Sign-In registration */}
          {googlePendingUser ? (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-teal-950/80 border border-teal-800">
                <img
                  src={googlePendingUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                  alt={googlePendingUser.displayName}
                  className="w-10 h-10 rounded-full border border-teal-500"
                />
                <div>
                  <p className="text-xs font-bold text-white">Signed in with Google</p>
                  <p className="text-xs text-teal-300 truncate">{googlePendingUser.email}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-1">Select Your Account Type</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Each Google account is bound to one role (Client or Engineer).
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
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
                      <span className="font-bold text-xs text-white">Client</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">Request field & remote support.</p>
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
                      <span className="font-bold text-xs text-white">Rescue Engineer</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">Field & cloud IT specialist.</p>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCompleteGoogleRegistration} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {selectedRole === "client" ? "Company / Org" : "Specialty"}
                    </label>
                    <input
                      type="text"
                      placeholder={selectedRole === "client" ? "e.g. Acme Corp" : "e.g. Server & Hardware"}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">City / Hub</label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setGooglePendingUser(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Complete Setup & Enter</span>}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Google / Gmail Sign In Button */}
              <div className="mb-5">
                <button
                  type="button"
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-2xl shadow-md transition flex items-center justify-center gap-3 cursor-pointer text-xs sm:text-sm active:scale-98 disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google / Gmail ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-2 items-center mb-5">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  Or with Email ID
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 mb-5 text-xs font-bold">
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
                  Sign In with Email
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email ID</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com or user@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">Password</label>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your account password"
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
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Log In to Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* CREATE SINGLE ACCOUNT FORM */
                <form onSubmit={handleRegister} className="space-y-3.5">
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
                          <span className="font-bold text-xs text-white">Client</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          For IT teams requesting field and cloud rescue.
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
                          <span className="font-bold text-xs text-white">Rescue Engineer</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          For field and cloud certified engineers.
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com or user@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password (min. 6 characters) *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Set account password"
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
                        placeholder={selectedRole === "client" ? "e.g. Apex Global" : "e.g. Server & Network"}
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">City / Region</label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai"
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
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Register {selectedRole === "client" ? "Client" : "Engineer"} Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
