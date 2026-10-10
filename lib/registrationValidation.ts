// ─────────────────────────────────────────────────────────────────────────────
// Shared registration validation for DevAgents event registration.
// Used by BOTH the frontend form component AND the backend API route so that
// the same rules are enforced regardless of the caller.
// ─────────────────────────────────────────────────────────────────────────────

/** Allowed values for the "Year of Study" dropdown. */
export const ALLOWED_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Working Professional",
  "Other",
] as const;

/** Allowed values for the "Experience Level" dropdown. */
export const ALLOWED_EXPERIENCE_LEVELS = [
  "Complete Beginner",
  "Some Programming Experience",
  "Intermediate Developer",
  "Advanced Developer",
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HAS_LETTER_RE = /[a-zA-Z]/;
const PHONE_DIGITS_ONLY_RE = /^\d{10}$/;
const PHONE_HAS_LETTER_RE = /[a-zA-Z]/;
const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?\/?$/;
const LINKEDIN_RE = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9._%-]+\/?$/;

// ── Public types ─────────────────────────────────────────────────────────────

export interface RegistrationData {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  branch: string;
  city: string;
  github: string;
  linkedIn: string;
  experienceLevel: string;
  whyAttend: string;
  agreeTerms: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// ── Main validator ───────────────────────────────────────────────────────────

export function validateRegistration(data: RegistrationData): ValidationResult {
  const errors: Record<string, string> = {};

  // ── Full Name ──────────────────────────────────────────────────────────
  const fullName = (data.fullName ?? "").trim();
  if (!fullName) {
    errors.fullName = "Full name is required.";
  } else if (fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  } else if (fullName.length > 100) {
    errors.fullName = "Full name must be at most 100 characters.";
  } else if (!HAS_LETTER_RE.test(fullName)) {
    errors.fullName = "Full name must contain at least one letter.";
  }

  // ── Email ──────────────────────────────────────────────────────────────
  const email = (data.email ?? "").trim().toLowerCase();
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  // ── Phone ──────────────────────────────────────────────────────────────
  const phoneRaw = (data.phone ?? "").trim();
  if (!phoneRaw) {
    errors.phone = "Phone number is required.";
  } else if (PHONE_HAS_LETTER_RE.test(phoneRaw)) {
    errors.phone = "Phone number must not contain letters.";
  } else {
    const digits = phoneRaw.replace(/\D/g, "");
    if (!PHONE_DIGITS_ONLY_RE.test(digits)) {
      errors.phone = "Please enter a valid 10-digit phone number.";
    }
  }

  // ── College ────────────────────────────────────────────────────────────
  const college = (data.college ?? "").trim();
  if (!college) {
    errors.college = "College / Institution is required.";
  } else if (college.length < 2) {
    errors.college = "College name must be at least 2 characters.";
  } else if (college.length > 200) {
    errors.college = "College name must be at most 200 characters.";
  } else if (!HAS_LETTER_RE.test(college)) {
    errors.college = "College name must contain at least one letter.";
  }

  // ── Year of Study ──────────────────────────────────────────────────────
  const year = (data.year ?? "").trim();
  if (!year) {
    errors.year = "Year of study is required.";
  } else if (!(ALLOWED_YEARS as readonly string[]).includes(year)) {
    errors.year = "Please select a valid year of study.";
  }

  // ── Branch / Specialization ────────────────────────────────────────────
  const branch = (data.branch ?? "").trim();
  if (!branch) {
    errors.branch = "Branch / Specialization is required.";
  } else if (branch.length < 2) {
    errors.branch = "Branch must be at least 2 characters.";
  } else if (branch.length > 100) {
    errors.branch = "Branch must be at most 100 characters.";
  } else if (!HAS_LETTER_RE.test(branch)) {
    errors.branch = "Branch must contain at least one letter.";
  }

  // ── City ───────────────────────────────────────────────────────────────
  const city = (data.city ?? "").trim();
  if (!city) {
    errors.city = "City is required.";
  } else if (city.length < 2) {
    errors.city = "City must be at least 2 characters.";
  } else if (city.length > 100) {
    errors.city = "City must be at most 100 characters.";
  } else if (!HAS_LETTER_RE.test(city)) {
    errors.city = "City must contain at least one letter.";
  }

  // ── GitHub Profile (optional) ──────────────────────────────────────────
  const github = (data.github ?? "").trim();
  if (github && !GITHUB_RE.test(github)) {
    errors.github =
      "Please enter a valid GitHub profile URL (e.g. https://github.com/username).";
  }

  // ── LinkedIn Profile (optional) ────────────────────────────────────────
  const linkedIn = (data.linkedIn ?? "").trim();
  if (linkedIn && !LINKEDIN_RE.test(linkedIn)) {
    errors.linkedIn =
      "Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username).";
  }

  // ── Experience Level ───────────────────────────────────────────────────
  const experienceLevel = (data.experienceLevel ?? "").trim();
  if (!experienceLevel) {
    errors.experienceLevel = "Experience level is required.";
  } else if (
    !(ALLOWED_EXPERIENCE_LEVELS as readonly string[]).includes(experienceLevel)
  ) {
    errors.experienceLevel = "Please select a valid experience level.";
  }

  // ── Why Attend (optional) ──────────────────────────────────────────────
  const whyAttend = (data.whyAttend ?? "").trim();
  if (whyAttend && whyAttend.length > 2000) {
    errors.whyAttend =
      "Response must be at most 2000 characters.";
  }

  // ── Terms & Conditions ─────────────────────────────────────────────────
  if (!data.agreeTerms) {
    errors.agreeTerms = "You must agree to the terms & conditions.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
