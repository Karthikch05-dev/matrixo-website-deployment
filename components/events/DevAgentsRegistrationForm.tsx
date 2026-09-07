"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaLock,
} from "react-icons/fa";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { getPaymentBreakdown } from "@/lib/payments";

interface DevAgentsRegistrationFormProps {
  event: any;
  onClose: () => void;
}

const EVENT_ID = "devagents-1-0";
const TICKET_ID = "devagents-pass";
const PRICE = 199;
const BREAKDOWN = getPaymentBreakdown(PRICE);

type Step = "form" | "payment" | "success";

export default function DevAgentsRegistrationForm({
  event,
  onClose,
}: DevAgentsRegistrationFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);
  const { startCheckout, isProcessing } = useRazorpayCheckout();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    college: "",
    year: "",
    branch: "",
    city: "",
    github: "",
    linkedIn: "",
    experienceLevel: "",
    whyAttend: "",
    agreeTerms: false,
  });

  // Auto-fill from auth user
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.displayName || prev.fullName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const requestClose = useCallback(() => {
    if (isSubmittingRef.current) return;

    setIsOpen(false);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 220);
  }, [onClose]);

  // Lock background scroll while the modal is mounted
  useEffect(() => {
    setMounted(true);
    setIsOpen(true);

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      overscrollBehavior: document.body.style.overscrollBehavior,
    };
    const previousDocumentStyles = {
      overflow: document.documentElement.style.overflow,
      overscrollBehavior: document.documentElement.style.overscrollBehavior,
    };

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.paddingRight = previousBodyStyles.paddingRight;
      document.body.style.overscrollBehavior =
        previousBodyStyles.overscrollBehavior;
      document.documentElement.style.overflow = previousDocumentStyles.overflow;
      document.documentElement.style.overscrollBehavior =
        previousDocumentStyles.overscrollBehavior;
    };
  }, []);

  // Close on Escape (but not while a submission is in flight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  

  /* ── Validation ──────────────────────────────────────────────────── */
  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Valid email is required");
      return false;
    }
    if (
      !formData.phone.trim() ||
      formData.phone.replace(/\D/g, "").length < 10
    ) {
      toast.error("Valid 10-digit phone number is required");
      return false;
    }
    if (!formData.college.trim()) {
      toast.error("College / Institution is required");
      return false;
    }
    if (!formData.year) {
      toast.error("Year of study is required");
      return false;
    }
    if (!formData.branch.trim()) {
      toast.error("Branch / Specialization is required");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!formData.experienceLevel) {
      toast.error("Experience level is required");
      return false;
    }
    if (!formData.agreeTerms) {
      toast.error("Please agree to the terms & conditions");
      return false;
    }
    return true;
  };

  /* ── Submit to Google Sheet ──────────────────────────────────────── */
  const sendToGoogleSheet = async (data: Record<string, unknown>) => {
    try {
      console.log("[DevAgents] Sending registration to /api/devagents/register...");
      const response = await fetch("/api/devagents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log("[DevAgents] Response status:", response.status, response.statusText);

      // Handle 413 Payload Too Large specifically
      if (response.status === 413) {
        throw new Error(
          "Image too large for server. Please try a smaller screenshot."
        );
      }

      const result = await response.json().catch(() => ({}));
      console.log("[DevAgents] Response body:", result);
      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.error ||
          result?.details ||
          `Registration failed (HTTP ${response.status})`
        );
      }
    } catch (err) {
      // Re-throw with the real message so the UI can show it
      console.error("[DevAgents] sendToGoogleSheet error:", err);
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new Error(
          "Network error: Could not reach the server. Please check your connection."
        );
      }
      const msg =
        err instanceof Error ? err.message : "Failed to forward registration";
      throw new Error(msg);
    }
  };

  /* ── Pay with Razorpay, then submit ──────────────────────────────── */
  const handlePayAndSubmit = async () => {
    await startCheckout({
      eventId: EVENT_ID,
      ticketId: TICKET_ID,
      description: "DevAgentic 1.0 — Workshop Pass",
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
      },
      onSuccess: async (result) => {
        toast.success("Payment successful! Saving your registration…");
        setPaymentRef(result.paymentId);
        await submitRegistration(result);
      },
      onFailure: (message) => toast.error(message),
      onDismiss: () =>
        toast.info("Payment cancelled — you have not been charged."),
    });
  };

  const submitRegistration = async (payment: {
    paymentId: string;
    orderId: string;
    signature: string;
    total: number;
    platformFee: number;
  }) => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        action: "register",
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        college: formData.college.trim(),
        year: formData.year,
        branch: formData.branch.trim(),
        city: formData.city.trim(),
        github: formData.github.trim(),
        linkedIn: formData.linkedIn.trim(),
        experienceLevel: formData.experienceLevel,
        whyAttend: formData.whyAttend.trim(),
        razorpayPaymentId: payment.paymentId,
        razorpayOrderId: payment.orderId,
        razorpaySignature: payment.signature,
        platformFee: payment.platformFee,
        amountPaid: payment.total,
      };

      await sendToGoogleSheet(payload);

      // Store in localStorage to prevent duplicate submissions
      const stored: string[] = JSON.parse(
        localStorage.getItem("devagents_registrations") || "[]",
      );
      if (!stored.includes(formData.email)) {
        stored.push(formData.email);
        localStorage.setItem("devagents_registrations", JSON.stringify(stored));
      }

      setStep("success");
    } catch (err) {
      console.error("[DevAgents] Registration error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Shared styles ───────────────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: "#09090b",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px rgba(34,197,94,0.05)",
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 " +
    "focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm";

  const labelClass = "block text-sm font-medium text-white/60 mb-1.5";

  /* ── Step indicator ──────────────────────────────────────────────── */
  const StepDots = () => {
    const steps: { key: Step; label: string }[] = [
      { key: "form", label: "Details" },
      { key: "payment", label: "Pay" },
      { key: "success", label: "Done" },
    ];
    const currentIdx = steps.findIndex((s) => s.key === step);

    return (
      <div className="flex items-center justify-center gap-0 mb-5">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[3rem]">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  background:
                    i <= currentIdx
                      ? "linear-gradient(135deg,#3b82f6,#8b5cf6)"
                      : "rgba(255,255,255,0.08)",
                  color: "white",
                  boxShadow:
                    i === currentIdx
                      ? "0 0 12px rgba(124,58,237,0.5)"
                      : "none",
                }}
              >
                {i < currentIdx ? (
                  <FaCheckCircle className="text-xs" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-300 ${
                  i <= currentIdx ? "text-white/70" : "text-white/30"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div
                className="w-8 h-px -mt-4"
                style={{
                  background:
                    i < currentIdx
                      ? "linear-gradient(90deg,#3b82f6,#8b5cf6)"
                      : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  /* ── Backdrop ────────────────────────────────────────────────────── */
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) requestClose();
  };

  if (!mounted) {
    return null;
  }

  /* ══════════════════════════════════════════════════════════════════
     SUCCESS SCREEN
  ══════════════════════════════════════════════════════════════════ */
  if (step === "success") {
    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(8px)" }}
        onClick={handleBackdrop}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: isOpen ? 1 : 0.95, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden w-full max-w-md"
          style={cardStyle}
        >
          <div
            className="h-1 w-full"
            style={{
              background: "linear-gradient(90deg,#2563eb,#7c3aed,#ec4899)",
            }}
          />
          <div className="p-8 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: 0.1,
              }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: "rgba(34,197,94,0.15)",
                boxShadow: "0 0 30px rgba(34,197,94,0.25)",
              }}
            >
              <FaCheckCircle className="text-green-400 text-4xl" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Registration Received!
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                We&apos;ve received your registration and payment screenshot.
                We&apos;ll review it and send a QR approval email to{" "}
                <span className="text-blue-400 font-medium">
                  {formData.email}
                </span>
                . Approval may take up to 24 hours.
              </p>
            </div>
            <div
              className="p-3 rounded-xl text-xs text-white/40"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Payment ref:{" "}
              <span className="text-white/60 font-mono">{paymentRef}</span>
            </div>
            <button
              onClick={requestClose}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg,#2563eb,#7c3aed,#ec4899)",
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>,
      document.body,
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     PAYMENT SCREEN
  ══════════════════════════════════════════════════════════════════ */
  if (step === "payment") {
    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:px-4"
        style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(8px)" }}
        onClick={handleBackdrop}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: isOpen ? 0 : 60, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="rounded-t-3xl sm:rounded-2xl overflow-hidden w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          style={cardStyle}
        >
          <div
            className="h-1 w-full"
            style={{
              background: "linear-gradient(90deg,#2563eb,#7c3aed,#ec4899)",
            }}
          />
          {/* Drag handle for mobile bottom sheet */}
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Complete Payment
                </h3>
                <p className="text-xs text-white/40">
                  Step 2 of 3 — Pay ₹{BREAKDOWN.total} securely
                </p>
              </div>
              <button
                onClick={requestClose}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            <StepDots />

            {/* Premium Amount Hero */}
            <div
              className="p-5 rounded-2xl text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #18181b 0%, #09090b 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-2 opacity-60">
                <FaLock className="text-[10px] text-green-400" />
                <span className="text-[10px] uppercase tracking-widest font-semibold text-green-400">
                  100% Secure Payment
                </span>
              </div>
              <p
                className="text-5xl font-extrabold tracking-tighter"
                style={{
                  color: "#ffffff",
                  textShadow: "0 0 20px rgba(255,255,255,0.2)",
                }}
              >
                ₹{BREAKDOWN.total}
              </p>
              <p className="text-sm text-zinc-400 mt-2 font-medium">
                DevAgentic 1.0 — Workshop Pass
              </p>
            </div>

            {/* Price breakdown */}
            <div
              className="p-4 rounded-2xl space-y-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex justify-between text-sm text-white/60">
                <span>Workshop pass</span>
                <span>₹{BREAKDOWN.basePrice}</span>
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>Platform fee</span>
                <span>₹{BREAKDOWN.platformFee}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-base font-bold text-white">
                <span>Total payable</span>
                <span>₹{BREAKDOWN.total}</span>
              </div>
            </div>

            {/* Pay with Razorpay */}
            <button
              onClick={handlePayAndSubmit}
              disabled={isSubmitting || isProcessing}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                boxShadow:
                  "0 4px 24px rgba(124,58,237,0.4), 0 0 0 1px rgba(124,58,237,0.2)",
              }}
            >
              {isSubmitting || isProcessing ? (
                <>
                  <FaSpinner className="animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <FaLock className="text-sm" />
                  <span>Pay ₹{BREAKDOWN.total} securely</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-white/30 text-center">
              UPI, cards, net banking &amp; wallets — powered by Razorpay
            </p>

            <button
              onClick={() => !isSubmitting && setStep("form")}
              disabled={isSubmitting}
              className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              ← Back to form
            </button>

            {/* Trust footer */}
            <div className="flex items-center justify-center gap-3 pt-1 pb-1">
              <div className="flex items-center gap-1.5 text-[10px] text-white/25">
                <FaLock className="text-[8px]" />
                <span>Secure payment</span>
              </div>
              <span className="text-white/10">·</span>
              <span className="text-[10px] text-white/25">1,000+ registrations</span>
            </div>
          </div>
        </motion.div>
      </motion.div>,
      document.body,
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     REGISTRATION FORM
  ══════════════════════════════════════════════════════════════════ */
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(8px)" }}
      onClick={handleBackdrop}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: isOpen ? 1 : 0.95, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="rounded-2xl overflow-hidden w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={cardStyle}
      >
        <div
          className="h-1 w-full"
          style={{
            background: "linear-gradient(90deg,#2563eb,#7c3aed,#ec4899)",
          }}
        />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold text-white">
                Register for DevAgentic 1.0
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Step 1 of 3 — Fill in your details
              </p>
            </div>
            <button
              onClick={requestClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <FaTimes className="text-xs" />
            </button>
          </div>

          <StepDots />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validateForm()) setStep("payment");
            }}
            className="space-y-4"
          >
            {/* Row: Name */}
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className={inputClass}
              />
            </div>

            {/* Row: Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row: College */}
            <div>
              <label className={labelClass}>College / Institution *</label>
              <input
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="Name of your college or organisation"
                className={inputClass}
              />
            </div>

            {/* Row: Year + Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Year of Study *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select year
                  </option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>Working Professional</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Branch / Specialization *</label>
                <input
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="e.g. CSE, ECE, MBA…"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row: City */}
            <div>
              <label className={labelClass}>City *</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Your current city"
                className={inputClass}
              />
            </div>

            {/* Row: GitHub + LinkedIn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  GitHub Profile{" "}
                  <span className="text-white/30">(optional)</span>
                </label>
                <input
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  placeholder="github.com/username"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  LinkedIn Profile{" "}
                  <span className="text-white/30">(optional)</span>
                </label>
                <input
                  name="linkedIn"
                  value={formData.linkedIn}
                  onChange={handleChange}
                  placeholder="linkedin.com/in/username"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className={labelClass}>Experience Level *</label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="" disabled>
                  Select your level
                </option>
                <option>Complete Beginner</option>
                <option>Some Programming Experience</option>
                <option>Intermediate Developer</option>
                <option>Advanced Developer</option>
              </select>
            </div>

            {/* Why Attend */}
            <div>
              <label className={labelClass}>
                Why do you want to attend?{" "}
                <span className="text-white/30">(optional)</span>
              </label>
              <textarea
                name="whyAttend"
                value={formData.whyAttend}
                onChange={handleChange}
                placeholder="Tell us briefly what you hope to learn or build…"
                rows={3}
                className={inputClass}
                style={{ resize: "none" }}
              />
            </div>

            {/* Agree to terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-white/20 accent-blue-500 cursor-pointer"
              />
              <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors leading-relaxed">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-400 underline"
                >
                  terms & conditions
                </a>{" "}
                and understand the{" "}
                <a
                  href="/refund"
                  target="_blank"
                  className="text-blue-400 underline"
                >
                  refund policy
                </a>
                .
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
              style={{
                background: "linear-gradient(135deg,#2563eb,#7c3aed,#ec4899)",
                boxShadow: "0 0 24px rgba(124,58,237,0.35)",
              }}
            >
              Continue to Payment →
            </button>

            <div className="flex items-center justify-center gap-2 pb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-white/30">
                <span className="text-white/50 font-semibold">₹{BREAKDOWN.total}</span> · Limited to 120 seats · Instant confirmation
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
