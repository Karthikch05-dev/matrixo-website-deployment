"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import Image from "next/image";
import {
  FaCalendar,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaCheckCircle,
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaChevronDown,
  FaRupeeSign,
  FaBolt,
  FaLock,
  FaSubway,
  FaBus,
  FaMotorcycle,
  FaTaxi,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { BiCodeAlt } from "react-icons/bi";
import { Zap, Lock, CheckCircle2 } from "lucide-react";
import DevAgentsRegistrationForm from "./DevAgentsRegistrationForm";
import {
  DEVAGENTS_SPEAKER_IMAGE_URL,
  SHOW_DEVAGENTS_LEAD_SPEAKER,
  MATRIXO_LOGO_DARK_URL,
  MATRIXO_LOGO_LIGHT_URL,
  THE_STUDENT_SPOT_LOGO_DARK_URL,
  THE_STUDENT_SPOT_LOGO_LIGHT_URL,
  ANY_EVENTS_AHEAD_LOGO_DARK_URL,
  ANY_EVENTS_AHEAD_LOGO_LIGHT_URL,
} from "@/lib/eventBranding";

/* ─────────────────────────────────────────────────────────────────────────
   Animation variant (used everywhere)
───────────────────────────────────────────────────────────────────────── */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

/* ─────────────────────────────────────────────────────────────────────────
   Deterministic particles — avoids SSR / client hydration mismatch
───────────────────────────────────────────────────────────────────────── */
const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  top: `${((i * 137.508) % 100).toFixed(2)}%`,
  left: `${((i * 97.3) % 100).toFixed(2)}%`,
  size: `${2 + (i % 3)}px`,
  delay: `${((i * 0.4) % 5).toFixed(1)}s`,
  duration: `${5 + (i % 5)}s`,
  color: (["#60a5fa", "#a78bfa", "#f472b6"] as const)[i % 3],
}));

/* ─────────────────────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────────────────────── */
const LEARNING_OUTCOMES = [
  {
    icon: "🤖",
    title: "What is Agentic AI",
    desc: "Understand the fundamentals of AI agents",
  },
  {
    icon: "🧠",
    title: "LLMs vs AI Agents",
    desc: "Key differences and when to use each",
  },
  {
    icon: "✍️",
    title: "Prompt Engineering",
    desc: "Craft effective prompts for AI systems",
  },
  {
    icon: "🏗️",
    title: "Agent Architecture",
    desc: "Design and structure AI agent systems",
  },
  {
    icon: "🌐",
    title: "Multi-Agent Systems",
    desc: "Build collaborative AI agent networks",
  },
  {
    icon: "💾",
    title: "AI Memory",
    desc: "Implement persistent memory in agents",
  },
  {
    icon: "🔧",
    title: "Tool Calling",
    desc: "Enable agents to use external tools",
  },
  {
    icon: "📚",
    title: "RAG Concepts",
    desc: "Retrieval-Augmented Generation basics",
  },
  {
    icon: "⚙️",
    title: "Building AI Agents",
    desc: "Hands-on agent development experience",
  },
  {
    icon: "🔄",
    title: "Workflow Automation",
    desc: "Automate complex tasks with agents",
  },
  {
    icon: "💼",
    title: "Real-world Use Cases",
    desc: "Apply agents to practical problems",
  },
  {
    icon: "✅",
    title: "Best Practices",
    desc: "Production-ready agent development tips",
  },
];

const EVENT_HIGHLIGHTS = [
  {
    icon: "🚀",
    title: "Build AI Agents",
    desc: "Create your first autonomous AI agent",
  },
  {
    icon: "🧠",
    title: "Hands-on Labs",
    desc: "Learn by doing with guided labs",
  },
  {
    icon: "💻",
    title: "Live Coding",
    desc: "Code along with expert instructors",
  },
  { icon: "🤝", title: "Networking", desc: "Connect with AI enthusiasts" },
  { icon: "🎁", title: "Gifts & Swags", desc: "Exclusive event merchandise" },
  {
    icon: "🏆",
    title: "Top 3 Recognition",
    desc: "Win recognition for best agents",
  },
  {
    icon: "📜",
    title: "Digital Certificate",
    desc: "Official certification from Microsoft Learn & matriXO",
  },
  {
    icon: "⚡",
    title: "Real Projects",
    desc: "Build production-ready projects",
  },
];

interface AgendaItem {
  time: string;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

const AGENDA: AgendaItem[] = [
  {
    time: "3:00 PM",
    icon: "👋",
    title: "Registration & Networking",
    desc: "Check-in, meet fellow participants, and settle in",
  },
  {
    time: "4:00 PM",
    icon: "🚀",
    title: "Opening Session",
    desc: "Introduction, the Future of AI, and why AI Agents matter today",
  },
  {
    time: "4:30 PM",
    icon: "🧠",
    title: "Session 1: LLMs & Prompt Engineering",
    desc: "Deep dive into large language models and crafting effective prompts",
  },
  {
    time: "5:00 PM",
    icon: "🤖",
    title: "Session 2: Agentic AI Deep Dive",
    desc: "Autonomous AI, Planning, Reasoning, Tool Calling, Memory & Multi-Agent Systems",
  },
  {
    time: "5:45 PM",
    icon: "💻",
    title: "Session 3: Hands-on Workshop",
    desc: "Live Coding — Build your own AI agents and work on real projects",
  },
  {
    time: "6:30 PM",
    icon: "🔥",
    title: "Fireside Chat (Planned)",
    desc: "AI Careers, Future Jobs, and Startups",
    badge: "Subject to confirmation",
  },
  {
    time: "6:45 PM",
    icon: "🏆",
    title: "Hands-on Challenge + Recognition",
    desc: "Top 3 participants get special recognition and prizes",
  },
  {
    time: "7:00 PM",
    icon: "🎓",
    title: "Closing Ceremony",
    desc: "Certificates, Networking, and Group Photo",
  },
];

const WHATS_INCLUDED = [
  "3-hour live workshop",
  "Practical coding session",
  "Workshop resources & materials",
  "AI prompts & templates",
  "Source code access",
  "Community access",
  "Event stickers",
  "Networking opportunity",
  "Digital participation certificate from matriXO",
  "Partner certificates (subject to confirmation)",
];

const PARTNERS = [
  {
    name: "The Student Spot",
    role: "Community Partner",
    logoLight: THE_STUDENT_SPOT_LOGO_LIGHT_URL,
    logoDark: THE_STUDENT_SPOT_LOGO_DARK_URL,
  },
  {
    name: "Legion Community",
    role: "Community Partner",
    logoLight: "",
    logoDark: "",
  },
  {
    name: "Any Events Ahead",
    role: "Event Partner",
    logoLight: ANY_EVENTS_AHEAD_LOGO_LIGHT_URL,
    logoDark: ANY_EVENTS_AHEAD_LOGO_DARK_URL,
  },
];

const WHO_SHOULD_ATTEND = [
  { icon: "🎓", label: "Students" },
  { icon: "👨‍💻", label: "Developers" },
  { icon: "🚀", label: "Founders" },
  { icon: "🤖", label: "AI Enthusiasts" },
  { icon: "⚙️", label: "Software Engineers" },
  { icon: "💼", label: "Freelancers" },
  { icon: "✍️", label: "Content Creators" },
  { icon: "🌟", label: "Anyone Interested in AI" },
];

const FAQS = [
  {
    q: "Is it beginner-friendly?",
    a: "Yes! DevAgentic 1.0 is designed for beginners. No prior AI experience is required to attend and benefit from this workshop.",
  },
  {
    q: "Do I need coding knowledge?",
    a: "Basic programming knowledge is recommended for the hands-on session, but not mandatory. You can still attend for learning and networking.",
  },
  {
    q: "Should I bring a laptop?",
    a: "A laptop is mandatory for the hands-on coding session. If you are attending only to listen, it is optional.",
  },
  {
    q: "Will I get a certificate?",
    a: "All attendees will receive a digital participation certificate from matriXO. Partner certificates are subject to confirmation.",
  },
  {
    q: "Is food included?",
    a: "Food and refreshments are to be announced. Stay tuned to our official channels for updates.",
  },
  {
    q: "Can working professionals attend?",
    a: "Yes, absolutely! DevAgentic 1.0 is open to students, developers, founders, and working professionals alike.",
  },
  {
    q: "Will recordings be available?",
    a: "Availability of recordings will be based on organizer policy, to be announced closer to the event.",
  },
  {
    q: "What is the refund policy?",
    a: "Refund policy is to be announced. Please check our official website and channels for the latest updates.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────── */
interface CountdownType {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/* ─────────────────────────────────────────────────────────────────────────
   Partner logo — theme-aware with graceful fallback if an asset is missing
───────────────────────────────────────────────────────────────────────── */
function PartnerLogo({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style={{
          background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
        }}
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <div className="w-6 h-6 relative flex-shrink-0">
      <Image
        src={src}
        alt={name}
        fill
        sizes="24px"
        className="object-contain"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   Component
═════════════════════════════════════════════════════════════════════════ */
export default function DevAgentsEventDetail({ event }: { event: any }) {
  const [showRegistration, setShowRegistration] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<CountdownType>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [countdownExpired, setCountdownExpired] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  /**
   * THEMING
   * -------
   * Every colour on this page resolves through the `--da-*` custom properties
   * declared in the <style> block below. They are declared once for light and
   * re-declared under `.dark` -- the same class next-themes puts on <html>,
   * which layout.tsx sets in a blocking script before first paint.
   *
   * Driving the inline styles AND the utility classes off that one source is
   * what makes the whole page follow the navbar toggle. The previous version
   * picked colours in JS from `resolvedTheme`, which covered only part of the
   * page (the rest was hard-coded dark) and painted the wrong palette on the
   * first render, because `resolvedTheme` is undefined until after hydration.
   */
  const pageBgClass = "da-page-bg";
  const surfaceClass = "da-surface";
  const textPrimaryClass = "da-text-1";
  const textSecondaryClass = "da-text-2";
  const accentButtonClass =
    "da-cta bg-gradient-to-r from-blue-600 via-violet-500 to-pink-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-violet-500/25 hover:scale-[1.03] active:scale-[.98]";

  /* Countdown ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    // Hardcoded to the postponed date: July 11, 2026 at 3:00 PM IST
    const targetDate = new Date("2026-07-11T15:00:00+05:30");
    if (!targetDate || isNaN(targetDate.getTime())) return;

    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setCountdownExpired(true);
        return;
      }
      setCountdown({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [event?.date]);

  /* Sticky CTA scroll listener ─────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setShowStickyCTA(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Helpers ────────────────────────────────────────────────────────────── */
  const formatEventDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return "TBA";
    }
  };

  const formatEventTime = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "h:mm aa");
    } catch {
      return "TBA";
    }
  };

  const eventTimeRange = (): string => {
    const start = event?.date ? formatEventTime(event.date) : "TBA";
    const end = event?.endDate ? formatEventTime(event.endDate) : null;
    return end ? `${start} – ${end}` : start;
  };

  const scrollToAgenda = () =>
    document
      .getElementById("agenda")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  const scrollToHowToReach = () =>
    document
      .getElementById("how-to-reach")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* ───────────────────────────────────────────────────────────────────── */
  return (
    <div
      className={`devagents-shell min-h-screen font-sans overflow-x-hidden ${pageBgClass} -mt-24`}
    >
      {/* ── Injected CSS keyframes ────────────────────────────────────────── */}
      <style>{`
        @keyframes gridMove {
          0%   { background-position: 0 0;    }
          100% { background-position: 0 60px; }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px);   opacity: .4; }
          50%       { transform: translateY(-20px); opacity: .8; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,.3); }
          50%       { box-shadow: 0 0 40px rgba(124,58,237,.6); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1;  transform: scale(1);   }
          50%       { opacity: .5; transform: scale(1.8); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(59,130,246,.25); }
          50%       { border-color: rgba(139,92,246,.5);  }
        }
        .da-pulse-glow  { animation: pulse-glow  2s  ease-in-out infinite; }
        .da-pulse-dot   { animation: pulseDot    1.5s ease-in-out infinite; }
        .da-border-glow { animation: borderGlow  3s  ease-in-out infinite; }
        .da-card-hover  { transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease; }
        .da-card-hover:hover {
          transform:  translateY(-4px) scale(1.02);
          border-color: #7C3AED !important;
          box-shadow: 0 20px 40px rgba(124,58,237,.25), 0 0 0 1px rgba(124,58,237,.35);
        }


        /* THEME TOKENS ===================================================
           Light is the base declaration; .dark on the html element wins.
           Everything below -- inline styles included -- reads these, so one
           class flip repaints the entire page.                            */
        .devagents-shell {
          --da-page:           linear-gradient(to bottom, #F8FAFC 0%, #FFFFFF 45%, #F1F5F9 100%);
          --da-hero:           linear-gradient(135deg, #F8FAFC 0%, #EEF3F8 50%, #F8FAFC 100%);
          --da-surface:        rgba(255,255,255,.85);
          --da-surface-raised: rgba(255,255,255,.95);
          --da-soft:           rgba(15,23,42,.04);
          --da-subtle:         rgba(15,23,42,.03);
          --da-border:         rgba(148,163,184,.30);
          --da-border-soft:    rgba(148,163,184,.20);
          --da-border-strong:  rgba(148,163,184,.42);
          --da-accent-tint:    rgba(124,58,237,.08);
          --da-accent-border:  rgba(124,58,237,.22);
          --da-accent-border-2:rgba(124,58,237,.30);
          --da-chip:           linear-gradient(135deg, rgba(59,130,246,.14), rgba(139,92,246,.14));
          --da-glass:          rgba(255,255,255,.80);
          /* A shade deeper than the page gradient's last stop (#F1F5F9), or
             the footer would be invisible against it.                      */
          --da-footer:         #E6EDF5;
          --da-text:           #0F172A;
          --da-text-2:         #334155;
          --da-text-3:         #475569;
          --da-text-4:         #64748B;
          /* Dimmest step. On dark it can sink to slate-600; on a light
             surface that would be unreadable, so it only goes this far.   */
          --da-text-5:         #7C8A9C;
          --da-accent:         #2563EB;
          --da-violet:         #6D28D9;
          --da-grid:           rgba(124,58,237,.08);
          --da-orb:            .10;
          --da-particle:       .35;
          --da-card-shadow:    0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06);
          --da-sticky-fade:    linear-gradient(to top, rgba(248,250,252,.97) 60%, transparent);
          --da-gallery-s:      45%;
          --da-gallery-l1:     93%;
          --da-gallery-l2:     88%;
          --da-gallery-veil:   rgba(255,255,255,.35);
          --da-sticky-bg:      rgba(255,255,255,.95);
        }

        .dark .devagents-shell {
          --da-page:           radial-gradient(circle at top, rgba(15,23,42,.95), rgba(9,9,15,1) 55%);
          --da-hero:           linear-gradient(135deg, #09090F 0%, #0F172A 50%, #09090F 100%);
          --da-surface:        rgba(22,22,35,.85);
          --da-surface-raised: rgba(22,22,35,.60);
          --da-soft:           rgba(255,255,255,.05);
          --da-subtle:         rgba(255,255,255,.03);
          --da-border:         rgba(255,255,255,.08);
          --da-border-soft:    rgba(255,255,255,.05);
          --da-border-strong:  rgba(255,255,255,.12);
          --da-accent-tint:    rgba(124,58,237,.12);
          --da-accent-border:  rgba(124,58,237,.25);
          --da-accent-border-2:rgba(124,58,237,.30);
          --da-chip:           linear-gradient(135deg, rgba(59,130,246,.20), rgba(139,92,246,.20));
          --da-glass:          rgba(9,9,15,.60);
          --da-footer:         rgba(9,9,15,.60);
          --da-text:           #FFFFFF;
          --da-text-2:         #CBD5E1;
          --da-text-3:         #94A3B8;
          --da-text-4:         #64748B;
          --da-text-5:         #475569;
          --da-accent:         #60A5FA;
          --da-violet:         #C4B5FD;
          --da-grid:           rgba(124,58,237,.07);
          --da-orb:            .20;
          --da-particle:       1;
          --da-card-shadow:    none;
          --da-sticky-fade:    linear-gradient(to top, rgba(9,9,15,.97) 60%, transparent);
          --da-gallery-s:      60%;
          --da-gallery-l1:     9%;
          --da-gallery-l2:     12%;
          --da-gallery-veil:   rgba(9,9,15,.35);
          --da-sticky-bg:      rgba(22,22,35,.90);
        }

        /* SEMANTIC CLASSES =============================================== */
        .devagents-shell.da-page-bg    { background: var(--da-page); }
        .devagents-shell .da-hero-bg   { background: var(--da-hero); }
        .devagents-shell .da-surface   {
          background: var(--da-surface);
          border: 1px solid var(--da-border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: var(--da-card-shadow);
        }
        .devagents-shell .da-text-1    { color: var(--da-text);   }
        .devagents-shell .da-text-2    { color: var(--da-text-2); }
        .devagents-shell .da-text-3    { color: var(--da-text-3); }
        .devagents-shell .da-text-4    { color: var(--da-text-4); }
        .devagents-shell .da-text-5    { color: var(--da-text-5); }
        .devagents-shell .da-accent    { color: var(--da-accent); }
        .devagents-shell .da-violet    { color: var(--da-violet); }
        .devagents-shell .da-hover-1:hover { color: var(--da-text);   }
        .devagents-shell .da-hover-3:hover { color: var(--da-text-3); }
        .devagents-shell .da-orb-1     { opacity: calc(var(--da-orb) * 1);   }
        .devagents-shell .da-orb-2     { opacity: calc(var(--da-orb) * .75); }
        .devagents-shell .da-orb-3     { opacity: calc(var(--da-orb) * .5);  }
        .devagents-shell .da-particles { opacity: var(--da-particle); }

        /* The CTA keeps its brand gradient in both themes, so its label stays
           white -- it is never page text and must not pick up --da-text.    */
        .devagents-shell .da-cta,
        .devagents-shell .da-cta:hover { color: #FFFFFF; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 md:pt-36 pb-16">
        {/* Background stack */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {/* Base gradient */}
          <div className="absolute inset-0 da-hero-bg" />

          {/* Animated grid */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(var(--da-grid) 1px, transparent 1px)," +
                "linear-gradient(90deg, var(--da-grid) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              animation: "gridMove 20s linear infinite",
            }}
          />

          {/* Gradient orbs */}
          <div
            className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl da-orb-1"
            style={{
              background: "radial-gradient(circle, #3b82f6, transparent)",
            }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-[620px] h-[620px] rounded-full blur-3xl da-orb-2"
            style={{
              background: "radial-gradient(circle, #8b5cf6, transparent)",
            }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl da-orb-3"
            style={{
              background: "radial-gradient(circle, #ec4899, transparent)",
            }}
          />

          {/* Floating particles */}
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full da-particles"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                background: p.color,
                animation: `floatUp ${p.duration} ease-in-out ${p.delay} infinite`,
              }}
            />
          ))}
        </div>

        {/* Removed absolute LIVE OFFLINE badge to be placed below */}

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* LIVE · OFFLINE badge */}
          <div className="flex justify-center mb-6 mt-2 md:mt-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "var(--da-glass)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(34,197,94,.3)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 da-pulse-dot" />
              <span className="text-xs font-bold tracking-widest text-green-600 dark:text-green-400">
                LIVE · OFFLINE
              </span>
            </div>
          </div>

          {/* Badge pill */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="inline-flex mb-8"
          >
            <div
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium"
              style={{
                background: "var(--da-accent-tint)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--da-accent-border-2)",
              }}
            >
              <span className="da-accent">✦</span>
              <span
                className={`bg-gradient-to-r from-[#4F8BFF] via-violet-500 to-pink-500 bg-clip-text text-transparent font-semibold`}
              >
                Agentic AI Workshop · matriXO
              </span>
              <span className="da-violet">✦</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className={`text-5xl md:text-7xl font-bold font-display leading-tight mb-6 ${textPrimaryClass}`}
          >
            <span className="bg-gradient-to-r from-[#4F8BFF] via-violet-500 to-pink-500 bg-clip-text text-transparent">
              Build Your First
            </span>
            <br />
            <span className={textPrimaryClass}>AI Agent.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className={`text-lg md:text-xl max-w-3xl mx-auto mb-4 leading-relaxed ${textSecondaryClass}`}
          >
            Learn to build autonomous AI agents using modern Agentic AI
            frameworks through an immersive, hands-on workshop.
          </motion.p>

          {/* Social Proof Sub-heading */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-2 mb-10"
          >
            <p className="text-sm font-medium da-text-3">Join <strong className="da-text-1">100+ developers</strong> from top tech companies & universities.</p>
          </motion.div>

          {/* CTA row */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-4 justify-center mb-10"
          >
            {event?.status === 'sold-out' ? (
              <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-[22px] border border-line bg-surface px-6 py-5 text-center shadow-card">
                <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-canvas">
                  Sold out
                </span>
                <p className="mt-3 text-[15px] text-muted">
                  Every ticket was claimed. Thank you for the response — turn on notifications to hear about the next one first.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg">
                  <button
                    onClick={() => setShowRegistration(true)}
                    className={`flex-1 px-8 py-4 rounded-2xl font-extrabold text-white text-lg transition-all duration-300 relative overflow-hidden group ${accentButtonClass}`}
                    style={{
                      boxShadow: "0 8px 26px rgba(124,58,237,.38)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Secure Your Seat - ₹199 <span className="animate-bounce">👉</span>
                    </span>
                  </button>
                </div>

                {/* Scarcity Trigger */}
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 tracking-wide uppercase">Selling Fast: Only 14 Seats Left</span>
                </div>
              </>
            )}
          </motion.div>

          {/* Trust Anchors */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto mb-12 opacity-80"
          >
            <div className="flex items-center gap-2">
              <FaLock className="da-text-3" />
              <span className="text-xs font-medium da-text-3">100% Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="da-text-3" />
              <span className="text-xs font-medium da-text-3">Microsoft Learn Curriculum</span>
            </div>
            <div className="flex items-center gap-2">
              <HiSparkles className="da-text-3" />
              <span className="text-xs font-medium da-text-3">Digital Certificate Included</span>
            </div>
          </motion.div>

          {/* Stat chips */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12"
          >
            {[
              { label: "₹199 Only", emoji: "💰" },
              { label: "Limited Seats", emoji: "🔥" },
              { label: "120 Participants", emoji: "👥" },
              { label: "Hands-on Learning", emoji: "💻" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium justify-center"
                style={{
                  background: "var(--da-soft)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--da-border-strong)",
                }}
              >
                <span>{s.emoji}</span>
                <span className={textSecondaryClass}>{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Countdown timer */}
          {!countdownExpired && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-8 mb-4 w-full"
            >
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 px-8 py-6 rounded-3xl"
                style={{
                  background: "var(--da-surface-raised)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid var(--da-accent-border)"
                }}>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <Image src={MATRIXO_LOGO_DARK_URL} alt="matriXO" width={120} height={40} className="hidden dark:block" />
                  <Image src={MATRIXO_LOGO_LIGHT_URL} alt="matriXO" width={120} height={40} className="block dark:hidden" />
                  <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 hidden md:block"></div>
                  <p className="text-xs font-semibold tracking-widest uppercase da-text-3 mt-2 md:mt-0">
                    Event Starts In
                  </p>
                </div>
                <div className="flex gap-3">
                  {(
                    [
                      { v: countdown.days, l: "Days" },
                      { v: countdown.hours, l: "Hours" },
                      { v: countdown.minutes, l: "Minutes" },
                      { v: countdown.seconds, l: "Seconds" },
                    ] as { v: number; l: string }[]
                  ).map(({ v, l }) => (
                    <div key={l} className="flex flex-col items-center gap-1">
                      <div
                        className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center"
                        style={{
                          background: "var(--da-surface)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid var(--da-accent-border-2)",
                        }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={v}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="text-xl md:text-2xl font-bold font-display da-text-1 tabular-nums"
                          >
                            {String(v).padStart(2, "0")}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <span className="text-[10px] da-text-4 font-medium">
                        {l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. EVENT DETAILS BAR
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={`rounded-3xl p-6 ${surfaceClass}`}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: "📅",
                  label: "Date",
                  value: "Sat, 11th July 2026",
                },
                {
                  icon: "📍",
                  label: "Venue",
                  value:
                    event?.venue ||
                    "DraperU India(Formerly Draper Startup House Hyderabad), Rajiv gandhi Nagar, Gachibowli, Hyderabad, Telangana 500032",
                },
                { icon: "⏰", label: "Time", value: "3:30 PM – 7:00 PM" },
                {
                  icon: "👥",
                  label: "Capacity",
                  value: "120 Participants",
                },
              ].map((item) => {
                const isVenue = item.label === "Venue";
                const cardContent = (
                  <>
                    <span className="text-2xl leading-none mt-0.5 flex-shrink-0">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs da-text-4 uppercase tracking-wider font-medium">
                        {item.label}
                      </p>
                      <p
                        className={`text-sm font-semibold mt-0.5 ${textPrimaryClass}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  </>
                );

                if (isVenue) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={scrollToHowToReach}
                      aria-label="View directions to DraperU India"
                      className="flex items-start gap-3 p-3 rounded-xl w-full text-left cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(124,58,237,.4),0_8px_28px_rgba(124,58,237,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                      style={{
                        background: "var(--da-subtle)",
                      }}
                    >
                      {cardContent}
                    </button>
                  );
                }

                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{
                      background: "var(--da-subtle)",
                    }}
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. ABOUT SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              <span className="bg-gradient-to-r from-[#4F8BFF] via-violet-500 to-pink-500 bg-clip-text text-transparent">
                About DevAgentic 1.0
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left — description */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              <p className={`${textSecondaryClass} leading-relaxed`}>
                {event?.description ||
                  "DevAgentic 1.0 is a premier Agentic AI workshop organised by matriXO, designed to introduce participants to the world of autonomous AI agents. This is not just another tech talk — it is an immersive, hands-on experience."}
              </p>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Whether you are a student exploring AI, a developer looking to
                upskill, or a founder wanting to integrate AI into your product
                — DevAgentic 1.0 is the perfect launchpad for your AI agent
                journey.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Beginner-friendly — no prior AI experience needed",
                  "Hands-on practical learning approach",
                  "Live coding with real AI frameworks",
                  "Build real projects you can showcase",
                ].map((point) => (
                  <li
                    key={point}
                    className={`flex items-start gap-3 text-sm ${textSecondaryClass}`}
                  >
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FaCheckCircle className="da-accent text-[10px]" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right — callout stats */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className={`rounded-3xl p-8 space-y-5 ${surfaceClass}`}>
                {[
                  { stat: "3 Hours", label: "Intensive Workshop", emoji: "⏱️" },
                  { stat: "₹199", label: "All-inclusive Price", emoji: "💰" },
                  {
                    stat: "120 Seats",
                    label: "Limited Availability",
                    emoji: "🎟️",
                  },
                ].map(({ stat, label, emoji }) => (
                  <div
                    key={stat}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{
                      background: "var(--da-soft)",
                    }}
                  >
                    <span className="text-3xl leading-none flex-shrink-0">
                      {emoji}
                    </span>
                    <div>
                      <p className="text-2xl font-bold font-display bg-gradient-to-r from-[#4F8BFF] via-violet-500 to-pink-500 bg-clip-text text-transparent">
                        {stat}
                      </p>
                      <p className={textSecondaryClass}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4. LEARNING OUTCOMES + 5. WORKSHOP AGENDA
      ══════════════════════════════════════════════════════════════════ */}
      <section id="outcomes" className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[6fr_5fr] gap-8 lg:gap-10 items-start">
          {/* What You'll Learn */}
          <div>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2
                className={`text-3xl md:text-4xl font-bold font-display mb-4 ${textPrimaryClass}`}
              >
                What You&apos;ll Learn
              </h2>
              <p className={textSecondaryClass}>
                12 core modules packed into an intensive 3-hour session
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {LEARNING_OUTCOMES.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`da-card-hover da-border-glow p-4 rounded-2xl cursor-default flex flex-col items-center text-center aspect-square ${surfaceClass}`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 text-base"
                    style={{
                      background:
                        "var(--da-chip)",
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3 className={`font-bold text-sm mb-1 ${textPrimaryClass}`}>
                    {item.title}
                  </h3>
                  <p
                    className={`text-xs leading-relaxed ${textSecondaryClass}`}
                  >
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Workshop Agenda */}
          <div id="agenda">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
                Workshop Agenda
              </h2>
              <p className="da-text-3">
                A packed 3.5-hour journey into Agentic AI
              </p>
            </motion.div>

            <div className="relative">
              {/* Glowing vertical timeline line */}
              <div
                className="absolute left-[44px] top-0 bottom-0 w-px"
                style={{
                  background: "linear-gradient(to bottom, #3b82f6, #8b5cf6)",
                }}
              />

              <div className="space-y-4">
                {AGENDA.map((item, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="relative flex gap-6 items-start"
                  >
                    {/* Icon + time */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1 w-[88px]">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-base z-10 relative"
                        style={{
                          background: "linear-gradient(135deg,#1e40af,#5b21b6)",
                          border: "2px solid rgba(124,58,237,.5)",
                        }}
                      >
                        {item.icon}
                      </div>
                      <span className="text-[11px] da-accent font-semibold tabular-nums font-display">
                        {item.time}
                      </span>
                    </div>

                    {/* Content card */}
                    <div
                      className="flex-1 p-3 rounded-xl mb-1"
                      style={{
                        background: "var(--da-surface)",
                        border: "1px solid var(--da-border)",
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-bold da-text-1 text-sm">
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-yellow-700 dark:text-yellow-400 font-medium flex-shrink-0"
                            style={{
                              background: "rgba(234,179,8,.1)",
                              border: "1px solid rgba(234,179,8,.25)",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs da-text-4 mt-1.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          6. EVENT HIGHLIGHTS + 7. WHAT'S INCLUDED
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Event Highlights */}
          <div>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
                Event Highlights
              </h2>
              <p className="da-text-3">
                Everything you get at DevAgentic 1.0
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4">
              {EVENT_HIGHLIGHTS.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="da-card-hover da-border-glow p-5 rounded-2xl text-center cursor-default"
                  style={{
                    background: "var(--da-surface)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid var(--da-border)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
                    style={{
                      background:
                        "var(--da-chip)",
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="font-bold da-text-1 text-sm mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs da-text-4">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* What's Included */}
          <div>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
                What&apos;s Included
              </h2>
              <p className="da-text-3">
                Everything bundled in your ₹199 pass
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl p-8"
              style={{
                background: "var(--da-surface)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--da-border)",
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                {WHATS_INCLUDED.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <FaCheckCircle className="text-green-600 dark:text-green-400 text-[10px]" />
                    </div>
                    <span className="da-text-2 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          7.5 HOW TO REACH
      ══════════════════════════════════════════════════════════════════ */}
      <section id="how-to-reach" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className={`text-3xl md:text-4xl font-bold font-display mb-4 ${textPrimaryClass}`}
            >
              📍 How to Reach?
            </h2>
            <p className={textSecondaryClass}>
              Getting to DraperU India is quick and easy
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 lg:gap-8 items-stretch">
            {/* Map Card */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`da-card-hover rounded-[20px] overflow-hidden flex flex-col ${surfaceClass}`}
            >
              <div className="p-6 pb-4 flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "var(--da-chip)",
                  }}
                >
                  <FaMapMarkerAlt className="da-accent text-lg" />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-bold text-lg ${textPrimaryClass}`}>
                    DraperU India
                  </h3>
                  <p className="text-xs da-text-4">
                    (Formerly Draper Startup House Hyderabad)
                  </p>
                  <p className={`text-sm mt-1 ${textSecondaryClass}`}>
                    Rajiv Gandhi Nagar, Gachibowli, Hyderabad - 500032
                  </p>
                </div>
              </div>

              <div className="w-full h-[320px] lg:h-[380px] px-6">
                <iframe
                  src="https://www.google.com/maps?q=DraperU%20India%20Rajiv%20Gandhi%20Nagar%20Gachibowli%20Hyderabad%20500032&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="DraperU India location map"
                  className="w-full h-full rounded-2xl"
                />
              </div>

              <div className="p-6 pt-4 mt-auto">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=DraperU+India+Rajiv+Gandhi+Nagar+Gachibowli+Hyderabad+500032"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[.98] ${accentButtonClass}`}
                >
                  <FaMapMarkerAlt />
                  Open in Google Maps
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              </div>
            </motion.div>

            {/* Transport Cards */}
            <div className="flex flex-col gap-5">
              {/* Metro */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className={`da-card-hover rounded-[20px] p-6 ${surfaceClass}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "var(--da-chip)",
                    }}
                  >
                    <FaSubway className="da-accent" />
                  </div>
                  <h3 className={`font-bold ${textPrimaryClass}`}>By Metro</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="da-text-4">Nearest Metro</span>
                    <span
                      className={`font-semibold text-right ${textPrimaryClass}`}
                    >
                      Raidurg Metro Station
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="da-text-4">Distance</span>
                    <span className={`font-semibold ${textPrimaryClass}`}>
                      ~2 km
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="da-text-4">Travel Time</span>
                    <span
                      className={`font-semibold text-right ${textPrimaryClass}`}
                    >
                      5–8 min by cab/auto
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Bus */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`da-card-hover rounded-[20px] p-6 ${surfaceClass}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "var(--da-chip)",
                    }}
                  >
                    <FaBus className="da-violet" />
                  </div>
                  <h3 className={`font-bold ${textPrimaryClass}`}>By Bus</h3>
                </div>

                <p className="text-xs uppercase tracking-wider da-text-4 font-medium mb-2">
                  Nearby Bus Stops
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Indra Nagar", "Gachibowli X Road", "IIIT Bus Stop"].map(
                    (stop) => (
                      <span
                        key={stop}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${textSecondaryClass}`}
                        style={{
                          background: "var(--da-soft)",
                          borderColor: "var(--da-border)",
                        }}
                      >
                        {stop}
                      </span>
                    ),
                  )}
                </div>

                <p className="text-xs uppercase tracking-wider da-text-4 font-medium mb-2">
                  Bus Routes
                </p>
                <div className="flex flex-wrap gap-2">
                  {["113M/W", "198", "216M", "217D/A", "17H/47W"].map(
                    (route) => (
                      <span
                        key={route}
                        className="px-3 py-1 rounded-full text-xs font-bold da-violet"
                        style={{
                          background: "var(--da-chip)",
                          border: "1px solid var(--da-accent-border-2)",
                        }}
                      >
                        {route}
                      </span>
                    ),
                  )}
                </div>
              </motion.div>

              {/* Rapido / Uber */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className={`da-card-hover rounded-[20px] p-6 ${surfaceClass}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "var(--da-chip)",
                    }}
                  >
                    <FaTaxi className="text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className={`font-bold ${textPrimaryClass}`}>
                    Rapido / Uber
                  </h3>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      icon: <FaMotorcycle className="da-accent" />,
                      label: "Rapido Bike",
                      time: "5–8 min",
                      price: "₹35–70",
                    },
                    {
                      icon: <FaTaxi className="da-violet" />,
                      label: "Uber/Ola Auto",
                      time: "5–10 min",
                      price: "₹60–120",
                    },
                    {
                      icon: <FaTaxi className="text-pink-600 dark:text-pink-400" />,
                      label: "Uber Cab",
                      time: "5–8 min",
                      price: "₹120–220",
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl"
                      style={{
                        background: "var(--da-subtle)",
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {r.icon}
                        <span
                          className={`text-sm font-semibold truncate ${textPrimaryClass}`}
                        >
                          {r.label}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${textPrimaryClass}`}>
                          {r.price}
                        </p>
                        <p className="text-xs da-text-4">{r.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          8. TICKET SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section id="tickets" className="py-20 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
              Get Your Pass
            </h2>
            <p className="da-text-3">Secure your spot at DevAgentic 1.0</p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden da-pulse-glow"
            style={{
              background: "var(--da-surface)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--da-accent-border-2)",
            }}
          >
            {/* Rainbow top bar */}
            <div
              className="h-1 w-full"
              style={{
                background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)",
              }}
            />

            <div className="p-8">
              {/* Pass badge */}
              <div className="flex justify-center mb-6">
                <span
                  className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase da-violet"
                  style={{
                    background: "var(--da-chip)",
                    border: "1px solid var(--da-accent-border-2)",
                  }}
                >
                  DevAgentic 1.0 Pass
                </span>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <p className="text-6xl font-bold font-display bg-gradient-to-r from-[#4F8BFF] via-violet-500 to-pink-500 bg-clip-text text-transparent">
                  ₹199
                </p>
                <p className="da-text-4 text-sm mt-1">
                  One-time · No hidden fees
                </p>
              </div>

              {/* Includes list */}
              <div className="space-y-3 mb-8">
                {[
                  "3-hour live workshop",
                  "Workshop resources & materials",
                  "Digital participation certificate",
                  "Hands-on coding labs",
                  "Community access",
                  "Event stickers & swags",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-green-600 dark:text-green-400 text-[10px]" />
                    </div>
                    <span className="da-text-2 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {event?.status !== 'sold-out' && (
                <button
                  onClick={() => setShowRegistration(true)}
                  className="da-cta w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[.98]"
                  style={{
                    background:
                      "linear-gradient(135deg, #2563EB, #8B5CF6, #EC4899)",
                    boxShadow: "0 8px 30px rgba(124,58,237,.35)",
                  }}
                >
                  Register Now — ₹199
                </button>
              )}

              {/* Trust badges */}
              <div
                className="flex flex-wrap justify-center gap-4 mt-5 pt-5 border-t"
                style={{ borderColor: "var(--da-border)" }}
              >
                {[
                  "🔒 Secure Payments",
                  "⚡ Instant Verification",
                  "🎟️ Limited to 150 seats",
                ].map((b) => (
                  <span key={b} className="text-xs da-text-4">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          9. SPEAKERS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
              Speakers
            </h2>
          </motion.div>

          <div
            className={`grid gap-6 ${
              SHOW_DEVAGENTS_LEAD_SPEAKER
                ? "md:grid-cols-3"
                : "md:grid-cols-2 max-w-2xl mx-auto"
            }`}
          >
            {/* Main speaker */}
            {SHOW_DEVAGENTS_LEAD_SPEAKER && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl p-8 text-center"
              style={{
                background: "var(--da-surface)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--da-accent-border)",
              }}
            >
              {/* Gradient avatar */}
              <div className="w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/10 bg-white/5">
                {DEVAGENTS_SPEAKER_IMAGE_URL ? (
                  <Image
                    src={DEVAGENTS_SPEAKER_IMAGE_URL}
                    alt="Shiva Ganesh Talikota"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-3xl font-bold text-white font-display"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    }}
                  >
                    SG
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold da-text-1 mb-1">
                Shiva Ganesh Talikota
              </h3>
              <p className="text-sm da-accent font-medium mb-1">
                Founder — matriXO
              </p>
              <p className="text-xs da-text-4 mb-5">
                Agentic AI Speaker · AI Educator · Startup Founder
              </p>
              <a
                href="https://www.linkedin.com/in/shivaganesht/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs da-accent transition-colors da-hover-1"
                style={{
                  background: "rgba(59,130,246,.1)",
                  border: "1px solid rgba(59,130,246,.2)",
                }}
              >
                <FaLinkedin /> LinkedIn Profile
              </a>
            </motion.div>
            )}

            {/* Speaker 2 */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl p-8 text-center"
              style={{
                background: "var(--da-surface)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--da-accent-border)",
              }}
            >
              <div className="w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/10 bg-white/5">
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold text-white font-display"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  }}
                >
                  SR
                </div>
              </div>
              <h3 className="text-xl font-bold da-text-1 mb-1">
                Saideep Reddy
              </h3>
              <p className="text-sm da-accent font-medium mb-1">
                Guest Speaker
              </p>
              <p className="text-xs da-text-4 mb-5">
                AI & Development Enthusiast
              </p>
              <a
                href="https://www.linkedin.com/in/saideep-reddy7/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs da-accent transition-colors da-hover-1"
                style={{
                  background: "rgba(59,130,246,.1)",
                  border: "1px solid rgba(59,130,246,.2)",
                }}
              >
                <FaLinkedin /> LinkedIn Profile
              </a>
            </motion.div>

            {/* Speaker 3 */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl p-8 text-center"
              style={{
                background: "var(--da-surface)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--da-accent-border)",
              }}
            >
              <div className="w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/10 bg-white/5">
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold text-white font-display"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #3b82f6)",
                  }}
                >
                  BP
                </div>
              </div>
              <h3 className="text-xl font-bold da-text-1 mb-1">
                Bhargavi Papolu
              </h3>
              <p className="text-sm da-accent font-medium mb-1">
                Guest Speaker
              </p>
              <p className="text-xs da-text-4 mb-5">
                AI & Development Enthusiast
              </p>
              <a
                href="https://www.linkedin.com/in/bhargavi-papolu-311989210/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs da-accent transition-colors da-hover-1"
                style={{
                  background: "rgba(59,130,246,.1)",
                  border: "1px solid rgba(59,130,246,.2)",
                }}
              >
                <FaLinkedin /> LinkedIn Profile
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          10. WHO SHOULD ATTEND
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
              Who Should Attend
            </h2>
            <p className="da-text-3">
              DevAgentic 1.0 is for everyone curious about AI
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-3 justify-center">
            {WHO_SHOULD_ATTEND.map((item) => (
              <motion.div
                key={item.label}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium da-card-hover cursor-default"
                style={{
                  background: "var(--da-accent-tint)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--da-accent-border-2)",
                }}
              >
                <span>{item.icon}</span>
                <span className="da-text-2">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          11. FAQ
      ══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--da-surface)",
                  border: `1px solid ${expandedFaq === index ? "var(--da-accent-border-2)" : "var(--da-border)"}`,
                  transition: "border-color .3s",
                }}
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                >
                  <span className="da-text-1 font-medium text-sm">
                    {faq.q}
                  </span>
                  <FaChevronDown
                    className="da-text-3 flex-shrink-0 transition-transform duration-300"
                    style={{
                      transform:
                        expandedFaq === index
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {expandedFaq === index && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 pb-5 border-t da-text-3 text-sm leading-relaxed"
                        style={{ borderColor: "var(--da-border-soft)" }}
                      >
                        <div className="pt-4">{faq.a}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          12. GALLERY PLACEHOLDER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-3">
              Event Gallery
            </h2>
            <p className="da-text-4 text-sm">
              Photos will be added after the event
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="relative h-52 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, hsl(${220 + i * 20} var(--da-gallery-s) var(--da-gallery-l1)), hsl(${260 + i * 15} var(--da-gallery-s) var(--da-gallery-l2)))`,
                  border: "1px solid var(--da-border)",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backdropFilter: "blur(2px)",
                    background: "var(--da-gallery-veil)",
                  }}
                />
                <div className="relative flex flex-col items-center gap-2">
                  <span className="text-5xl">📷</span>
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-full da-text-3"
                    style={{
                      background: "var(--da-glass)",
                      border: "1px solid var(--da-border-strong)",
                    }}
                  >
                    Coming Soon
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          14. SPONSORS & PARTNERS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
              Sponsors &amp; Partners
            </h2>
          </motion.div>

          <div className="flex flex-col items-center gap-8">
            {/* Organizer badge */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div
                className="flex items-center gap-3 px-6 py-3 rounded-full"
                style={{
                  background: "var(--da-accent-tint)",
                  border: "1px solid var(--da-accent-border-2)",
                }}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 flex-shrink-0">
                  <Image
                    src={MATRIXO_LOGO_LIGHT_URL}
                    alt="matriXO"
                    width={32}
                    height={32}
                    className="object-contain w-full h-full block dark:hidden"
                    unoptimized
                  />
                  <Image
                    src={MATRIXO_LOGO_DARK_URL}
                    alt="matriXO"
                    width={32}
                    height={32}
                    className="object-contain w-full h-full hidden dark:block"
                    unoptimized
                  />
                </div>
                <span className="da-text-1 font-semibold">matriXO</span>
                <span className="text-xs da-text-4">— Main Organizer</span>
              </div>
            </motion.div>

            {/* Partner cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-lg mx-auto">
              {PARTNERS.map((partner) => (
                <motion.div
                  key={partner.name}
                  variants={fadeInUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="h-20 rounded-xl flex flex-col items-center justify-center gap-0.5 px-2"
                  style={{
                    border: "1px dashed var(--da-border-strong)",
                    background: "var(--da-subtle)",
                  }}
                >
                  {/* Both logos render; CSS picks one, so the correct
                      variant is present on the very first paint. */}
                  <span className="block dark:hidden">
                    <PartnerLogo name={partner.name} src={partner.logoLight} />
                  </span>
                  <span className="hidden dark:block">
                    <PartnerLogo name={partner.name} src={partner.logoDark} />
                  </span>
                  <p className="da-text-2 text-[11px] font-semibold leading-tight text-center">
                    {partner.name}
                  </p>
                  <p className="da-text-5 text-[10px] leading-tight text-center">
                    {partner.role}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          15. CONTACT SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display da-text-1 mb-4">
              Get in Touch
            </h2>
            <p className="da-text-3">
              Have questions? Reach us through any of these channels
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: "📧",
                label: "Email",
                value: "hello@matrixo.in",
                href: "mailto:hello@matrixo.in",
              },
              {
                icon: "📸",
                label: "Instagram",
                value: "@matrixo_in",
                href: "https://www.instagram.com/matrixo_in",
              },
              {
                icon: "💼",
                label: "LinkedIn",
                value: "matriXO",
                href: "https://linkedin.com/company/matrixo",
              },
              {
                icon: "🌐",
                label: "Website",
                value: "matrixo.in",
                href: "https://matrixo.in",
              },
              {
                icon: "💬",
                label: "Community",
                value: "Join our community",
                href: "https://chat.whatsapp.com/CW5HbObfsi7CcLkoATLJ91",
              },
            ].map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  item.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-center gap-4 p-5 rounded-xl da-card-hover"
                style={{
                  background: "var(--da-surface)",
                  border: "1px solid var(--da-border)",
                }}
              >
                <span className="text-2xl leading-none flex-shrink-0">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs da-text-4 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="da-text-1 text-sm font-medium truncate">
                    {item.value}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          15.5. POSTPONEMENT ALERT (MOVED TO BOTTOM)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex w-full max-w-2xl mx-auto"
        >
          <div
            className="flex items-start gap-4 px-6 py-4 rounded-2xl text-sm font-medium w-full text-left shadow-2xl shadow-red-500/10"
            style={{
              background: "rgba(220, 38, 38, 0.10)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
            }}
          >
            <span className="text-red-600 dark:text-red-400 text-2xl mt-0.5">⚠️</span>
            <div className="flex-1">
              <span className="text-red-700 dark:text-red-400 font-bold text-base block mb-1 tracking-wide">URGENT: EVENT POSTPONED</span>
              <span className="text-gray-900/90 dark:text-white/90 text-sm leading-relaxed">
                Due to extremely high demand, the event has been rescheduled to <strong className="da-text-1">Saturday, 11th July 2026 (3:00 PM - 6:00 PM)</strong>.
                All existing registrations remain completely valid.
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          16. DEVAGENTS FOOTER (special pre-footer)
      ══════════════════════════════════════════════════════════════════ */}
      <footer
        className="py-16 px-4"
        style={{
          background: "var(--da-footer)",
          borderTop: "1px solid var(--da-border)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold font-display bg-gradient-to-r from-[#4F8BFF] via-violet-500 to-pink-500 bg-clip-text text-transparent">
              DevAgentic 1.0
            </h3>
            <p className="da-text-5 text-sm mt-1">Built by matriXO</p>
          </motion.div>

          {/* Links */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-6 text-xs da-text-5"
          >
            <span>© 2026 matriXO</span>
            <a
              href="/privacy"
              className="da-hover-3 transition-colors"
            >
              Privacy Policy
            </a>
            <a href="/terms" className="da-hover-3 transition-colors">
              Terms
            </a>
            <a
              href="/refund"
              className="da-hover-3 transition-colors"
            >
              Refund Policy
            </a>
          </motion.div>

          {/* Social icons */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex justify-center gap-4"
          >
            {[
              {
                Icon: FaInstagram,
                href: "https://www.instagram.com/matrixo_in",
                label: "Instagram",
              },
              {
                Icon: FaLinkedin,
                href: "https://linkedin.com/company/matrixo",
                label: "LinkedIn",
              },
              {
                Icon: FaGithub,
                href: "https://github.com/matrixo",
                label: "GitHub",
              },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-full flex items-center justify-center da-text-4 da-hover-1 transition-all duration-200 hover:scale-110 hover:border-[#7C3AED]"
                style={{
                  background: "var(--da-soft)",
                  border: "1px solid var(--da-border-strong)",
                }}
              >
                <Icon />
              </a>
            ))}
          </motion.div>

          <p className="text-xs da-text-5">
            © 2026 matriXO. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════
          STICKY BOTTOM CTA  (appears after scrollY > 600)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showStickyCTA && event?.status !== 'sold-out' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4"
            style={{
              background: "var(--da-sticky-fade)",
            }}
          >
            <div
              className="max-w-md mx-auto flex items-center justify-between gap-4 px-5 py-4 rounded-2xl"
              style={{
                background: "var(--da-sticky-bg)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--da-accent-border-2)",
              }}
            >
              <div>
                <p className="da-text-1 font-bold text-sm">
                  DevAgentic 1.0
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">₹199 Only</p>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <p className="text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    14 Left
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRegistration(true)}
                className="da-cta flex-shrink-0 px-6 py-3 rounded-xl font-extrabold text-white text-sm transition-all duration-200 hover:scale-[1.03] active:scale-[.97] relative overflow-hidden group"
                style={{
                  background:
                    "linear-gradient(135deg, #2563EB, #8B5CF6, #EC4899)",
                  boxShadow: "0 4px 20px rgba(124,58,237,.45)",
                }}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <span className="relative z-10">Secure Seat →</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          REGISTRATION MODAL
          Note: DevAgentsRegistrationForm renders its own complete,
          self-contained fixed overlay (backdrop + centered card). It must
          NOT be wrapped in another fixed inset-0 overlay here, or the page
          ends up with two stacked full-screen backdrops that fight over
          pointer events (confirmed via automated click-through testing).
      ══════════════════════════════════════════════════════════════════ */}
      {showRegistration && (
        <DevAgentsRegistrationForm
          event={event}
          onClose={() => setShowRegistration(false)}
        />
      )}
    </div>
  );
}
