import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  MapPin,
  Briefcase,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
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

  const [googlePendingUser, setGooglePendingUser] = useState<{
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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
        onClose();
      }
    } catch (err: any) {
      let msg = err.message || "Failed to sign in. Please check your credentials.";
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/user-not-found")) {
        msg = "Invalid email or password. Please verify your credentials or register.";
      }
      setErrorMessage(msg);
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
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.firebaseRegister({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: selectedRole,
        company: company.trim() || (selectedRole === "client" ? "Independent Client" : "TechRescue Specialist"),
        phone: phone.trim(),
        city: city.trim() || "Mumbai",
      });

      if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
        onClose();
      }
    } catch (err: any) {
      let msg = err.message || "Registration failed. Please try again.";
      if (msg.includes("auth/email-already-in-use")) {
        msg = "This email is already registered. Each person can only create one account. Please sign in.";
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
        setGooglePendingUser(res.firebaseUser);
      } else if (res.user) {
        const portal = res.user.role === "client" ? "client" : "expert";
        onAuthSuccess(res.user, portal);
        onClose();
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMessage(err.message || "Google authentication failed.");
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
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete account setup.");
    } finally {
      setIsLoading(false);
    }
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
                {mode === "login" ? "Sign In to TechRescue" : "Create Your Single Account"}
              </h2>
              <p className="text-xs text-slate-400">
                Real database authentication for Clients and Certified Rescue Engineers
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
          {!googlePendingUser && (
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
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {googlePendingUser ? (
            <form onSubmit={handleCompleteGoogleRegistration} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-950/80 border border-teal-800 text-xs">
                <span className="font-bold text-white">Google ID:</span>
                <span className="text-teal-300 truncate">{googlePendingUser.email}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Your Account Role (Permanent):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("client")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedRole === "client"
                        ? "bg-teal-950/80 border-teal-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className="font-bold text-xs text-white block">Client Account</span>
                    <span className="text-[10px] text-slate-400">Request field & remote IT help</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("field_engineer")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      selectedRole !== "client"
                        ? "bg-amber-950/80 border-amber-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className="font-bold text-xs text-white block">Rescue Engineer</span>
                    <span className="text-[10px] text-slate-400">Field & cloud IT specialist</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Org</label>
                  <input
                    type="text"
                    placeholder={selectedRole === "client" ? "e.g. Acme Corp" : "e.g. Hardware & Network"}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Complete & Enter Dashboard</span>}
              </button>
            </form>
          ) : (
            <>
              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer text-xs active:scale-98 disabled:opacity-50"
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

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[10px] uppercase font-semibold">Or with Email</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* REGISTER VIEW */}
              {mode === "register" ? (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Select Account Type:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("client")}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          selectedRole === "client"
                            ? "bg-teal-950/80 border-teal-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        <span className="font-bold text-xs text-white block">Client Account</span>
                        <span className="text-[10px] text-slate-400">Request support & SLA rescue</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole("field_engineer")}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          selectedRole !== "client"
                            ? "bg-amber-950/80 border-amber-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        <span className="font-bold text-xs text-white block">Rescue Engineer</span>
                        <span className="text-[10px] text-slate-400">Field & cloud IT specialist</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email ID *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com or user@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password (min. 6 chars) *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Set account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs active:scale-98"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create {selectedRole === "client" ? "Client" : "Engineer"} Account</span>}
                  </button>
                </form>
              ) : (
                /* LOGIN VIEW */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Email ID</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com or user@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs active:scale-98"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In to Dashboard</span>}
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
