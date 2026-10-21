import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, ArrowRight, ArrowLeft, Lock, ShieldCheck,
  CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound, RefreshCw, UserPlus, Info
} from "lucide-react";
import { api } from "../services/api.js";

const STEP_EMAIL = "email";
const STEP_OTP   = "otp";
const STEP_RESET = "reset";
const STEP_DONE  = "done";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep]           = useState(STEP_EMAIL);
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPass] = useState("");
  const [confirmPass, setConfirm] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [isNotRegistered, setIsNotRegistered] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resetToken, setResetToken]   = useState("");
  const [devOtpHint, setDevOtpHint]   = useState(null);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  /* ─── Step 1: Send OTP (Registered account only) ─── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) return;

    try {
      setLoading(true);
      setError(null);
      setIsNotRegistered(false);

      const res = await api.forgotPassword({ email: targetEmail });
      
      // Successfully validated registered user
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep(STEP_OTP);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.message || "Failed to process request.";
      setError(msg);
      if (msg.toLowerCase().includes("not registered") || msg.toLowerCase().includes("not found")) {
        setIsNotRegistered(true);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ─── OTP box key handling ─── */
  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  /* ─── Step 2: Verify OTP ─── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyOtp({ email: email.trim(), otp: code });
      setResetToken(res.resetToken);
      setStep(STEP_RESET);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Resend OTP ─── */
  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.forgotPassword({ email: email.trim() });
      if (res.devOtp) setDevOtpHint(res.devOtp);
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Step 3: Reset Password ─── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.resetPassword({ resetToken, newPassword });
      setStep(STEP_DONE);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Header = ({ title, subtitle }) => (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center justify-center hover:opacity-90 transition-opacity">
        <img src="/redes-logo.png" alt="Redes Creation" className="h-12 w-auto object-contain" />
      </Link>
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">{title}</h1>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
  );

  const stepProgress = { [STEP_EMAIL]: 1, [STEP_OTP]: 2, [STEP_RESET]: 3, [STEP_DONE]: 3 };
  const currentStep = stepProgress[step];

  const getStrength = (pw) => pw.length >= 12 ? 4 : pw.length >= 10 ? 3 : pw.length >= 8 ? 2 : 1;
  const strengthColors = ["bg-rose-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 text-slate-800">
      <div className="max-w-md w-full">

        {/* ── STEP 1: EMAIL (Only registered accounts allowed) ── */}
        {step === STEP_EMAIL && (
          <>
            <Header
              title="Reset your password"
              subtitle="Enter your registered account email to receive a verification OTP"
            />
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{error}</span>
                  </div>
                  {isNotRegistered && (
                    <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                      <span className="text-slate-600">Don't have an account yet?</span>
                      <Link
                        to="/register"
                        className="inline-flex items-center gap-1 font-bold text-[#034bc0] hover:underline"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Sign Up Here
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Registered Work Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) { setError(null); setIsNotRegistered(false); }
                      }}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    * Password reset is only available for accounts that have already been created.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify Account & Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <Link to="/login" className="hover:text-[#034bc0] flex items-center gap-1 transition">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
                <Link to="/register" className="font-semibold text-[#034bc0] hover:underline">
                  Create New Account
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: OTP VERIFICATION ── */}
        {step === STEP_OTP && (
          <>
            <Header
              title="Enter verification code"
              subtitle={`We verified your account and sent a 6-digit OTP to ${email}`}
            />
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Dev mode helper hint */}
              {devOtpHint && (
                <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Demo/Dev OTP: <strong>{devOtpHint}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(devOtpHint.split(""));
                      otpRefs.current[5]?.focus();
                    }}
                    className="text-[11px] font-bold text-[#034bc0] hover:underline cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3 text-center">
                    6-Digit OTP Code
                  </label>
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-lg font-bold border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="w-full py-3 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-5 space-y-3">
                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleResend}
                  className="text-xs flex items-center justify-center gap-1.5 mx-auto text-slate-500 hover:text-[#034bc0] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(STEP_EMAIL);
                    setError(null);
                    setOtp(["", "", "", "", "", ""]);
                    setDevOtpHint(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Use different email
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: CREATE NEW PASSWORD ── */}
        {step === STEP_RESET && (
          <>
            <Header
              title="Create new password"
              subtitle="Choose a secure new password for your account"
            />
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2 flex gap-1">
                      {[...Array(4)].map((_, i) => {
                        const s = getStrength(newPassword);
                        return (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i < s ? strengthColors[s - 1] : "bg-slate-200"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPass}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                        confirmPass && newPassword !== confirmPass
                          ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/20"
                          : confirmPass && newPassword === confirmPass
                          ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20"
                          : "border-slate-300 focus:border-[#034bc0] focus:ring-[#034bc0]/20"
                      }`}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPass && newPassword !== confirmPass && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Passwords do not match
                    </p>
                  )}
                  {confirmPass && newPassword === confirmPass && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPass}
                  className="w-full py-3 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── STEP 4: SUCCESS / DONE ── */}
        {step === STEP_DONE && (
          <>
            <Header title="Password reset!" subtitle="Your password has been successfully updated" />
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm text-slate-600">
                You can now sign in to your workspace using your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Step indicator */}
        {step !== STEP_DONE && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s < currentStep
                      ? "bg-emerald-500 text-white"
                      : s === currentStep
                      ? "bg-[#034bc0] text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {s < currentStep ? "✓" : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-8 h-0.5 rounded-full ${
                      s < currentStep ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Verification Protected
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#034bc0]" /> Google Verified Partner
          </span>
        </div>
      </div>
    </div>
  );
}
