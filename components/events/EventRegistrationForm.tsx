"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaUniversity,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaBus,
  FaInfoCircle,
  FaTimes,
  FaLock,
} from "react-icons/fa";
import { toast } from "sonner";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { getPaymentBreakdown } from "@/lib/payments";

interface EventRegistrationFormProps {
  event: any;
  ticket: any;
  onClose: (success?: boolean) => void;
}

export default function EventRegistrationForm({
  event,
  ticket,
  onClose,
}: EventRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);
  const { startCheckout, isProcessing } = useRazorpayCheckout();
  const breakdown = getPaymentBreakdown(ticket.price);

  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
    studentId: "",
    collegeName: "",
    department: "",
    year: "",
    graduationYear: "",
    emergencyContact: "",
    city: "",
    state: "",
    wantCertificate: "no",
    wantTransport: "no",
    hearAboutEvent: "",
  });

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const requestClose = useCallback(
    (success: boolean = false) => {
      if (isSubmittingRef.current) return;

      setIsOpen(false);

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }

      closeTimerRef.current = window.setTimeout(() => {
        onClose(success);
      }, 220);
    },
    [onClose],
  );

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
  }, [requestClose]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const sendToGoogleSheet = async (data: any) => {
    try {
      const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

      console.log("🔍 DEBUG: Starting submission");
      console.log("🔍 Script URL:", GOOGLE_SCRIPT_URL);

      if (!GOOGLE_SCRIPT_URL) {
        console.error("❌ Google Script URL is missing!");
        throw new Error(
          "Google Script URL not configured. Please check .env.local file.",
        );
      }

      // First, check if event is sold out
      console.log("🔍 Checking ticket availability...");
      console.log("🔍 Event ID:", data.eventId);

      try {
        const checkResponse = await fetch(
          `${GOOGLE_SCRIPT_URL}?action=getTicketCount&eventId=${data.eventId}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );
        const checkData = await checkResponse.json();

        console.log("📊 Ticket check response:", checkData);

        if (checkData.success) {
          const eventIdLower = data.eventId.toLowerCase();
          const soldOutLimit = eventIdLower.includes("tedxkprit") ? 100 : 2000;
          console.log(
            `🎫 Event ID check: "${eventIdLower}" includes "tedxkprit"? ${eventIdLower.includes("tedxkprit")}`,
          );
          console.log(
            `🎫 Current tickets: ${checkData.ticketsSold}/${soldOutLimit}`,
          );

          if (checkData.ticketsSold >= soldOutLimit) {
            console.log("🚫 EVENT IS SOLD OUT!");
            throw new Error("Event is sold out");
          }
          console.log(
            `✅ Tickets available: ${checkData.ticketsSold}/${soldOutLimit}`,
          );
        }
      } catch (checkError: any) {
        console.error("❌ Ticket check error:", checkError);
        if (checkError.message && checkError.message.includes("sold out")) {
          throw checkError;
        }
        console.warn(
          "⚠️ Could not verify ticket count, proceeding with submission",
        );
      }

      console.log("📊 Data to send:", data);
      console.log("🚀 Sending request to Google Apps Script...");

      // Send to Google Apps Script
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("✅ Request sent successfully");
      console.log("⏳ Waiting for Google Script to process...");

      // Wait for Google Script to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("✅ Data sent to Google Sheet successfully");
      return true;
    } catch (error: any) {
      console.error("❌ ERROR in sendToGoogleSheet:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);

      // Re-throw the error as-is so we can handle it properly in handleSubmit
      throw error;
    }
  };

  const submitRegistration = async (payment?: {
    paymentId: string;
    orderId: string;
    total: number;
    platformFee: number;
  }) => {
    setIsSubmitting(true);

    try {
      // Prepare data to send to Google Sheet
      console.log("📝 Preparing registration data...");
      const registrationData = {
        timestamp: new Date().toISOString(),
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        ticketType: ticket.name,
        ticketPrice: ticket.price,
        fullName: formData.fullName,
        contactNumber: formData.contactNumber,
        email: formData.email,
        studentId: formData.studentId,
        collegeName: formData.collegeName,
        department: formData.department,
        year: formData.year,
        emergencyContact: formData.emergencyContact,
        city: formData.city,
        state: formData.state,
        platformFee: payment?.platformFee ?? 0,
        amountPaid: payment?.total ?? 0,
        razorpayPaymentId: payment?.paymentId || "",
        razorpayOrderId: payment?.orderId || "",
        // Existing sheet column for payment proof now carries the Razorpay
        // payment ID, which is the verifiable reference for the transaction.
        paymentScreenshot: payment?.paymentId || "",
        wantCertificate: formData.wantCertificate,
        wantTransport: formData.wantTransport,
        hearAboutEvent: formData.hearAboutEvent,
        status: "",
      };

      console.log("✅ Registration data prepared");

      // Send data to Google Apps Script
      console.log("📤 Sending to Google Apps Script...");
      toast.info("Submitting registration...");

      await sendToGoogleSheet(registrationData);

      console.log("🎉 Registration submitted successfully!");

      // Success message
      toast.success(
        "✅ Registration confirmed! Your confirmation email is on its way.",
      );

      // Reset form
      setFormData({
        fullName: "",
        contactNumber: "",
        email: "",
        studentId: "",
        collegeName: "",
        department: "",
        year: "",
        graduationYear: "",
        emergencyContact: "",
        city: "",
        state: "",
        wantCertificate: "no",
        wantTransport: "no",
        hearAboutEvent: "",
      });

      // Close the form after a short delay and signal success
      setTimeout(() => {
        console.log("✅ Closing form with success=true...");
        requestClose(true); // Pass true to indicate successful registration
      }, 2000);
    } catch (error: any) {
      console.error("❌❌❌ REGISTRATION ERROR:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Check if it's a sold out error
      if (error.message && error.message.includes("sold out")) {
        toast.error(
          "🎫 SOLD OUT! This event has reached its maximum capacity of 144 registrations per day.",
          {
            duration: 5000,
          },
        );
      } else {
        toast.error(`Failed to submit: ${error.message || "Please try again"}`);
      }
    } finally {
      setIsSubmitting(false);
      console.log("Form submission process completed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (breakdown.isFree) {
      await submitRegistration();
      return;
    }

    await startCheckout({
      eventId: event.id,
      ticketId: ticket.id,
      description: `${event.title} — ${ticket.name}`,
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.contactNumber,
      },
      onSuccess: async (result) => {
        toast.success("Payment successful! Saving your registration…");
        await submitRegistration(result);
      },
      onFailure: (message) => toast.error(message),
      onDismiss: () => toast.info("Payment cancelled — you have not been charged."),
    });
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose(false);
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.95 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <button
            onClick={() => requestClose(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="text-2xl" />
          </button>
          <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
          <p className="text-white/90">Complete your registration</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaUser className="text-blue-500" />
              Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email ID *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emergency Contact Number *
                </label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="Emergency contact number"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="Enter your city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="Enter your state"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaGraduationCap className="text-purple-500" />
              Academic Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student ID / Roll Number *
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="Your roll number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  College Name *
                </label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="Your college name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year *
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                >
                  {" "}
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              {/* Graduation Year - Only show if Graduate is selected */}
              {formData.year === "Graduate" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year of Graduation *
                  </label>
                  <input
                    type="text"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    placeholder="e.g. 2023"
                    maxLength={4}
                    required={formData.year === "Graduate"}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             [&>option]:bg-white dark:[&>option]:bg-gray-800
                             [&>option]:text-gray-900 dark:[&>option]:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaInfoCircle className="text-green-500" />
              Preferences
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Hide certificate option for TEDxKPRIT */}
              {event.id !== "tedxkprit-2025" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Do you prefer a certificate? *
                  </label>
                  <select
                    name="wantCertificate"
                    value={formData.wantCertificate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes (₹50)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Do you want transport? *
                </label>
                <select
                  name="wantTransport"
                  value={formData.wantTransport}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How did you know about this event? *
                </label>
                <select
                  name="hearAboutEvent"
                  value={formData.hearAboutEvent}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           [&>option]:bg-white dark:[&>option]:bg-gray-800
                           [&>option]:text-gray-900 dark:[&>option]:text-white"
                >
                  <option value="">Select an option</option>
                  <option value="Instagram">Instagram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Facebook">Facebook</option>
                  <option value="matriXO">matriXO</option>
                  <option value="Friend">Friend/Word of mouth</option>
                  <option value="College">College/Professor</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {!breakdown.isFree && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaInfoCircle className="text-orange-500" />
              Payment
            </h3>

            <div className="glass-card p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-700">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Ticket ({ticket.name})</span>
                  <span>₹{breakdown.basePrice}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Platform fee</span>
                  <span>₹{breakdown.platformFee}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-orange-300 dark:border-orange-700 text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total payable</span>
                  <span>₹{breakdown.total}</span>
                </div>
                <p className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-600 dark:text-gray-400">
                  <FaLock className="text-green-600 dark:text-green-400" />
                  Secure payment via Razorpay — UPI, cards, net banking &amp; wallets
                </p>
              </div>
            </div>
          </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => requestClose(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 rounded-lg font-semibold
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600
                       text-white rounded-lg font-semibold shadow-lg
                       hover:shadow-xl transform hover:scale-105 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting
                ? "Submitting..."
                : isProcessing
                  ? "Processing payment..."
                  : breakdown.isFree
                    ? "Complete Registration"
                    : `Pay ₹${breakdown.total} & Register`}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
