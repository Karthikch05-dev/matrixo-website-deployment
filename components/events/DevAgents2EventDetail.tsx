import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaTrophy, FaChevronRight, FaTimes, FaSpinner, FaCheckCircle, FaExternalLinkAlt } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function DevAgents2EventDetail({ event }: { event: any }) {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState({
    teamName: "",
    email: "",
    teamLead: "",
    teamMember1: "",
    teamMember2: "",
    teamMember3: "",
    teamMember4: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const handleRegisterClick = () => {
    setIsModalOpen(true);
    setSubmitError("");
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.teamName.trim()) newErrors.teamName = "Team Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.teamLead.trim()) newErrors.teamLead = "Team Lead is required";
    if (!formData.teamMember1.trim()) newErrors.teamMember1 = "Team Member 1 is required";
    if (!formData.teamMember2.trim()) newErrors.teamMember2 = "Team Member 2 is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

      if (!scriptUrl) {
        throw new Error("Registration URL is not configured. Please contact support.");
      }

      const payload = {
        teamName: formData.teamName,
        registrationEmail: formData.email,
        teamLead: formData.teamLead,
        teamMember1: formData.teamMember1,
        teamMember2: formData.teamMember2,
        teamMember3: formData.teamMember3,
        teamMember4: formData.teamMember4
      };

      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error("Unable to submit registration. Please try again.");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to register team. Please try again.");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Unable to submit registration. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    // Reset form after closing if successful
    if (isSuccess) {
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          teamName: "",
          email: "",
          teamLead: "",
          teamMember1: "",
          teamMember2: "",
          teamMember3: "",
          teamMember4: "",
        });
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-8 backdrop-blur-md shadow-sm dark:shadow-none"
            >
              <HiSparkles className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium tracking-wide text-indigo-700 dark:text-indigo-300 uppercase">
                Hackathon
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-600 dark:from-white dark:via-indigo-100 dark:to-indigo-300">
                DEVAGENTIC 2.0
              </span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-xl md:text-2xl text-slate-600 dark:text-gray-300 font-light mb-8 max-w-2xl mx-auto"
            >
              24 Hours AI Agents Hackathon
            </motion.p>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-base md:text-lg text-slate-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              A 24-hour hackathon focused on building innovative AI agents and
              autonomous AI-powered solutions.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={handleRegisterClick}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-black font-semibold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 w-full sm:w-auto shadow-md dark:shadow-none"
              >
                <span className="relative z-10">Register Now</span>
                <FaChevronRight className="relative z-10 text-xs transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-slate-900 dark:from-indigo-100 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Devfolio Integration Point */}
              {event.devfolioUrl ? (
                <a
                  href={event.devfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#3770FF] hover:bg-[#205AFF] text-white font-semibold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 w-full sm:w-auto shadow-md"
                >
                  <span className="relative z-10">Apply with Devfolio</span>
                  <FaExternalLinkAlt className="relative z-10 text-xs" />
                </a>
              ) : (
                <button
                  disabled
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold rounded-full overflow-hidden w-full sm:w-auto cursor-not-allowed opacity-70"
                  title="Devfolio application link will be available soon"
                >
                  <span className="relative z-10">Apply with Devfolio (Soon)</span>
                </button>
              )}
            </motion.div>
          </div>
        </section>

        {/* ABOUT & EXPECTATIONS SECTION */}
        <section className="py-20 px-4 sm:px-6 relative border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">About the Hackathon</h2>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-gray-400 leading-relaxed">
                <p>
                  DevAgentic 2.0 is an upcoming 24-hour AI Agents hackathon by Matrixo.
                </p>
                <p className="mt-4">
                  Participants will have the opportunity to explore modern AI agent
                  technologies and build practical autonomous AI solutions.
                </p>
                <p className="mt-4 text-indigo-600 dark:text-indigo-300 font-medium">
                  More details about the event will be announced soon.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">What to Expect</h2>
              <ul className="space-y-4">
                {[
                  "24-hour AI development challenge",
                  "AI Agents and autonomous systems",
                  "Hands-on building",
                  "Team collaboration",
                  "Innovation-focused problem solving",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-gray-400">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-slate-500 dark:text-gray-500 italic">
                * Planned focus areas. Final rules and tracks will be announced soon.
              </p>
            </motion.div>
          </div>
        </section>

        {/* EVENT DETAILS / COMING SOON GRID */}
        <section className="py-20 px-4 sm:px-6 border-t border-black/5 dark:border-white/5">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Event Details</h2>
              <p className="text-slate-500 dark:text-gray-400">Mark your calendars. Full details dropping soon.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: FaCalendar, label: "Date", value: "Coming Soon" },
                { icon: FaMapMarkerAlt, label: "Venue", value: "Coming Soon" },
                { icon: FaUsers, label: "Team Size", value: "Coming Soon" },
                { icon: FaTrophy, label: "Prizes", value: "Coming Soon" },
              ].map((detail, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { delay: index * 0.1 } },
                  }}
                  className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-none rounded-2xl p-6 flex flex-col items-center text-center dark:backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500 dark:text-indigo-400 text-xl">
                    <detail.icon />
                  </div>
                  <h3 className="text-slate-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">{detail.label}</h3>
                  <p className="text-slate-900 dark:text-white font-semibold text-lg">{detail.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-24 px-4 sm:px-6 relative border-t border-black/5 dark:border-white/5 bg-gradient-to-b from-transparent to-indigo-50/50 dark:to-indigo-950/20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Ready to build?
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400 mb-10">
                More information and registrations will be announced soon.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* REGISTRATION MODAL */}
      {mounted && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed left-0 right-0 bottom-0 top-[68px] sm:top-[80px] z-[900] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
              />

              {/* Modal Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto"
              >
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-colors z-10"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>

                <div className="p-6 sm:p-8">
                  {isSuccess ? (
                    <div className="text-center py-10">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-20 h-20 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
                      >
                        <FaCheckCircle />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Successful</h3>
                      <p className="text-slate-600 dark:text-gray-400 mb-8">Your team has been registered for DevAgentic 2.0.</p>
                      <button
                        onClick={handleClose}
                        className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-black/5 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-medium rounded-full transition-colors dark:border-white/5"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">DEVAGENTIC 2.0</h2>
                        <h3 className="text-lg text-indigo-600 dark:text-indigo-300 font-medium mb-1">Registration Form</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400">Register your team for the 24 Hours AI Agents Hackathon.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {submitError && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 rounded-lg dark:text-red-400 text-sm">
                            {submitError}
                          </div>
                        )}

                        <div className="space-y-4">
                          {/* Team Name */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                              Team Name <span className="text-indigo-600 dark:text-indigo-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.teamName}
                              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                              className={`w-full bg-white dark:bg-white/5 border ${errors.teamName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500 dark:border-white/10 dark:focus:border-indigo-500'} rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:shadow-none`}
                              placeholder="Enter team name"
                            />
                            {errors.teamName && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.teamName}</p>}
                          </div>

                          {/* Gmail */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                              Gmail <span className="text-indigo-600 dark:text-indigo-400">*</span>
                            </label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className={`w-full bg-white dark:bg-white/5 border ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500 dark:border-white/10 dark:focus:border-indigo-500'} rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:shadow-none`}
                              placeholder="example@gmail.com"
                            />
                            {errors.email && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.email}</p>}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Team Lead */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                                Team Lead <span className="text-indigo-600 dark:text-indigo-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.teamLead}
                                onChange={(e) => setFormData({ ...formData, teamLead: e.target.value })}
                                className={`w-full bg-white dark:bg-white/5 border ${errors.teamLead ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500 dark:border-white/10 dark:focus:border-indigo-500'} rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:shadow-none`}
                                placeholder="Lead name"
                              />
                              {errors.teamLead && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.teamLead}</p>}
                            </div>

                            {/* Team Member 1 */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                                Team Member 1 <span className="text-indigo-600 dark:text-indigo-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.teamMember1}
                                onChange={(e) => setFormData({ ...formData, teamMember1: e.target.value })}
                                className={`w-full bg-white dark:bg-white/5 border ${errors.teamMember1 ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500 dark:border-white/10 dark:focus:border-indigo-500'} rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:shadow-none`}
                                placeholder="Member 1 name"
                              />
                              {errors.teamMember1 && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.teamMember1}</p>}
                            </div>

                            {/* Team Member 2 */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                                Team Member 2 <span className="text-indigo-600 dark:text-indigo-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.teamMember2}
                                onChange={(e) => setFormData({ ...formData, teamMember2: e.target.value })}
                                className={`w-full bg-white dark:bg-white/5 border ${errors.teamMember2 ? 'border-red-500/50 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500 dark:border-white/10 dark:focus:border-indigo-500'} rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:shadow-none`}
                                placeholder="Member 2 name"
                              />
                              {errors.teamMember2 && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.teamMember2}</p>}
                            </div>

                            {/* Team Member 3 */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                                Team Member 3
                              </label>
                              <input
                                type="text"
                                value={formData.teamMember3}
                                onChange={(e) => setFormData({ ...formData, teamMember3: e.target.value })}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:shadow-none"
                                placeholder="Member 3 name"
                              />
                            </div>

                            {/* Team Member 4 */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                                Team Member 4
                              </label>
                              <input
                                type="text"
                                value={formData.teamMember4}
                                onChange={(e) => setFormData({ ...formData, teamMember4: e.target.value })}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm dark:shadow-none"
                                placeholder="Member 4 name"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/10">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white font-medium rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden shadow-sm dark:shadow-none"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              {isSubmitting ? (
                                <>
                                  <FaSpinner className="animate-spin" />
                                  Registering...
                                </>
                              ) : (
                                "Register Team"
                              )}
                            </span>
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
