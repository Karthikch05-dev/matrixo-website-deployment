// ============================================================
// SkillDNA™ Score Calculation Engine
// Produces realistic, dynamic scores based on actual data:
// - Verification results
// - Skill count & depth
// - Goal mapping coverage
// - Self-rating consistency
// Pure functions — deterministic, no side effects.
// ============================================================

import {
  SkillDNAProfile,
  TechnicalSkill,
  CareerGoal,
  BehavioralTrait,
} from '../types';
import {
  analyzeGoalIntelligence,
  GoalIntelligenceResult,
} from './goal-intelligence-engine';
import { getVerificationMultiplier } from '../verification/scoring-engine';

// ---- Types ----

export interface RealisticScores {
  cognitiveScore: number;          // 0-100
  learningVelocity: number;       // 0-100
  careerAlignmentScore: number;   // 0-100
  hiringReadiness: number;        // 0-100
  confidenceIndex: number;        // 0-100
  dynamicSkillScore: number;      // 0-1000
}

export interface ScoreExplanation {
  title: string;
  definition: string;
  howCalculated: string;
  whyItMatters: string;
}

// ---- Score Explanations (for tooltips) ----

export const SCORE_EXPLANATIONS: Record<string, ScoreExplanation> = {
  'Cognitive Score': {
    title: 'Cognitive Score',
    definition: 'Measures analytical and problem-solving capacity based on self-rated cognitive abilities.',
    howCalculated: 'Weighted from: Problem Solving (30%), Adaptability (25%), Learning Speed (25%), Creativity (20%). Adjusted down if self-ratings are unusually high without verified evidence.',
    whyItMatters: 'Employers value cognitive ability as a predictor of job performance and ability to handle novel challenges.',
  },
  'Learning Velocity': {
    title: 'Learning Velocity',
    definition: 'Estimates how quickly you acquire and demonstrate new skills.',
    howCalculated: 'Based on: skill acquisition count, verification test performance over time, diversity of skill categories, and improvement trends.',
    whyItMatters: 'A high learning velocity signals adaptability — essential in fast-moving industries. Companies value candidates who upskill quickly.',
  },
  'Career Alignment': {
    title: 'Career Alignment',
    definition: 'How well your current skills map to your stated career goals.',
    howCalculated: 'Compares your skill portfolio against the domains required for your short-term, mid-term, and long-term goals. Weighted: short-term (45%), mid-term (30%), long-term (25%).',
    whyItMatters: 'A high alignment score means you\'re building the right skills for your goals. Low alignment suggests a strategic skill gap.',
  },
  'Hiring Readiness': {
    title: 'Hiring Readiness',
    definition: 'An estimate of interview/job readiness based on verified skills, goal relevance, and depth of expertise.',
    howCalculated: 'Weighted from: verified skill ratio (35%), average proficiency of verified skills (25%), career alignment (20%), skill diversity (10%), cognitive score contribution (10%).',
    whyItMatters: 'Directly reflects whether a recruiter or hiring manager would consider you ready for your target roles.',
  },
  'Confidence Index': {
    title: 'Confidence Index',
    definition: 'How reliable the analysis is, based on the amount of verified data available.',
    howCalculated: 'Ratio of verified skills to total skills (60%), number of skills tracked (20%), and profile completeness (20%). More verified skills = higher confidence.',
    whyItMatters: 'A low confidence index means the scores are mostly based on self-reported data. Verify more skills to increase reliability.',
  },
  'Skill Clusters': {
    title: 'Skill Clusters',
    definition: 'Number of related skill groups detected in your profile.',
    howCalculated: 'AI groups your skills into clusters (e.g., "Web Frontend", "Data Analysis") based on category and skill relationships.',
    whyItMatters: 'More clusters indicate a broader skill set. Deep clusters indicate specialization. Both are valued differently by employers.',
  },
};

// ---- Constants ----

// Penalty for inflated self-ratings: if average self-rating > 7.5
// and no verification data, apply this multiplier
var INFLATION_PENALTY = 0.75;

// Max bonus for verified skills
var VERIFICATION_BONUS_CAP = 15;

// ---- Helpers ----

/**
 * Get the verified skill ratio: verified / total
 */
function getVerifiedRatio(skills: TechnicalSkill[]): number {
  if (skills.length === 0) return 0;
  var verified = 0;
  for (var i = 0; i < skills.length; i++) {
    if (skills[i].verification && skills[i].verification!.status === 'verified') {
      verified++;
    }
  }
  return verified / skills.length;
}

/**
 * Get average verification score of verified skills
 */
function getAvgVerificationScore(skills: TechnicalSkill[]): number {
  var total = 0;
  var count = 0;
  for (var i = 0; i < skills.length; i++) {
    var v = skills[i].verification;
    if (v && v.status === 'verified' && v.bestScore > 0) {
      total += v.bestScore;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

/**
 * Get skill category diversity (number of unique categories)
 */
function getCategoryDiversity(skills: TechnicalSkill[]): number {
  var categories: string[] = [];
  for (var i = 0; i < skills.length; i++) {
    var cat = skills[i].category.toLowerCase();
    if (categories.indexOf(cat) === -1) categories.push(cat);
  }
  return categories.length;
}

/**
 * Check if self-ratings seem inflated (all above 7)
 */
function isSelfRatingInflated(profile: SkillDNAProfile): boolean {
  // Use behavioral traits as a proxy for self-rating inflation
  if (!profile.behavioralTraits || profile.behavioralTraits.length === 0) return false;
  var total = 0;
  for (var i = 0; i < profile.behavioralTraits.length; i++) {
    total += profile.behavioralTraits[i].score;
  }
  var avg = total / profile.behavioralTraits.length;
  // If average behavioral score is above 85 with no verified skills, likely inflated
  return avg > 85 && getVerifiedRatio(profile.technicalSkills) === 0;
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ---- Core Calculation Functions ----

/**
 * Calculate realistic Cognitive Score.
 * Base from profile, adjusted by verification evidence and inflation check.
 */
function calcCognitiveScore(profile: SkillDNAProfile): number {
  var base = profile.cognitiveScore || 50;

  // If inflated self-rating and no verification, penalize
  if (isSelfRatingInflated(profile)) {
    base = Math.round(base * INFLATION_PENALTY);
  }

  // Verification bonus: if verified skills scored high, boost cognitive
  var avgVerScore = getAvgVerificationScore(profile.technicalSkills);
  if (avgVerScore > 70) {
    var bonus = Math.min(VERIFICATION_BONUS_CAP, Math.round((avgVerScore - 70) * 0.5));
    base = base + bonus;
  }

  // Scale down extreme values — most people shouldn't be 90+
  if (base > 88 && getVerifiedRatio(profile.technicalSkills) < 0.5) {
    base = 75 + Math.round((base - 75) * 0.4);
  }

  return clamp(Math.round(base), 5, 98);
}

/**
 * Calculate realistic Learning Velocity.
 * Based on: skill count, category diversity, verification performance.
 */
function calcLearningVelocity(profile: SkillDNAProfile): number {
  var skillCount = profile.technicalSkills.length;
  var diversity = getCategoryDiversity(profile.technicalSkills);
  var verifiedRatio = getVerifiedRatio(profile.technicalSkills);

  // Base: start from profile's existing value, but constrain
  var base = profile.learningVelocity || 40;

  // Skill count factor: more skills = higher velocity, capped
  var countFactor = Math.min(30, skillCount * 3);

  // Diversity factor: more categories = higher velocity
  var diversityFactor = Math.min(20, diversity * 5);

  // Verification factor: verified skills show actual learning
  var verFactor = Math.round(verifiedRatio * 25);

  // Blended score: 40% base, 25% count, 15% diversity, 20% verification
  var blended = Math.round(base * 0.4 + countFactor * 0.25 + diversityFactor * 0.15 + verFactor * 0.20);

  // Inflation penalty
  if (base > 85 && verifiedRatio < 0.3) {
    blended = Math.round(blended * 0.7);
  }

  // Normalize into realistic range
  var normalized = 25 + Math.round(blended * 0.6);

  return clamp(normalized, 10, 95);
}

/**
 * Calculate Career Alignment Score.
 * Uses the Goal Intelligence Engine for actual skill-to-goal mapping.
 */
function calcCareerAlignment(
  profile: SkillDNAProfile,
  goals: CareerGoal | undefined,
  goalIntelligence: GoalIntelligenceResult | null
): number {
  if (!goals || !goalIntelligence) {
    // Fallback to existing score but constrained
    return clamp(Math.round((profile.careerAlignmentScore || 40) * 0.7), 15, 70);
  }

  // Use the actual goal intelligence match percent
  return clamp(goalIntelligence.overallMatchPercent, 5, 98);
}

/**
 * Calculate Hiring Readiness.
 * Composite: verified skills, proficiency, alignment, diversity, cognitive.
 */
function calcHiringReadiness(
  profile: SkillDNAProfile,
  careerAlignmentScore: number,
  cognitiveScore: number
): number {
  var skills = profile.technicalSkills;
  var verifiedRatio = getVerifiedRatio(skills);
  var avgVerScore = getAvgVerificationScore(skills);
  var diversity = getCategoryDiversity(skills);

  // Component scores
  var verifiedComponent = verifiedRatio * 100;                      // 0-100
  var proficiencyComponent = avgVerScore > 0 ? avgVerScore : 30;    // fallback 30
  var alignmentComponent = careerAlignmentScore;                     // 0-100
  var diversityComponent = Math.min(100, diversity * 15);            // 0-100
  var cognitiveComponent = cognitiveScore;                           // 0-100

  // Weighted blend
  var raw = Math.round(
    verifiedComponent * 0.35 +
    proficiencyComponent * 0.25 +
    alignmentComponent * 0.20 +
    diversityComponent * 0.10 +
    cognitiveComponent * 0.10
  );

  // If no verified skills at all, cap at 45
  if (verifiedRatio === 0) {
    raw = Math.min(raw, 45);
  }

  return clamp(raw, 5, 98);
}

/**
 * Calculate Confidence Index.
 * How reliable is this analysis? Based on verified data availability.
 */
function calcConfidenceIndex(profile: SkillDNAProfile): number {
  var skills = profile.technicalSkills;
  var verifiedRatio = getVerifiedRatio(skills);
  var skillCount = skills.length;

  // Verified ratio contributes 60%
  var verifiedComponent = verifiedRatio * 100;

  // Skill count contributes 20% (more skills = more data)
  var countComponent = Math.min(100, skillCount * 8);

  // Profile completeness contributes 20%
  var hasPersona = profile.persona && profile.persona.headline ? 1 : 0;
  var hasTraits = profile.behavioralTraits.length > 0 ? 1 : 0;
  var hasClusters = profile.skillClusters.length > 0 ? 1 : 0;
  var completeness = ((hasPersona + hasTraits + hasClusters) / 3) * 100;

  var raw = Math.round(
    verifiedComponent * 0.60 +
    countComponent * 0.20 +
    completeness * 0.20
  );

  return clamp(raw, 8, 98);
}

/**
 * Calculate Dynamic Skill Score (0-1000).
 * Based on the realistic component scores.
 */
function calcDynamicScore(
  cognitiveScore: number,
  learningVelocity: number,
  careerAlignment: number,
  hiringReadiness: number,
  confidenceIndex: number,
  profile: SkillDNAProfile
): number {
  // Technical skill average — weighted by verification status
  // Verified = 100%, Unverified = 40%, Failed = 20%
  var techAvg = 0;
  if (profile.technicalSkills.length > 0) {
    var weightedSum = 0;
    var weightSum = 0;
    for (var i = 0; i < profile.technicalSkills.length; i++) {
      var sk = profile.technicalSkills[i];
      var mult = getVerificationMultiplier(sk.verification as any);
      weightedSum += sk.score * mult;
      weightSum += mult;
    }
    techAvg = weightSum > 0 ? weightedSum / profile.technicalSkills.length : 0;
  }

  // Behavioral average
  var behavioralAvg = 0;
  if (profile.behavioralTraits.length > 0) {
    var bSum = 0;
    for (var j = 0; j < profile.behavioralTraits.length; j++) {
      bSum += profile.behavioralTraits[j].score;
    }
    behavioralAvg = bSum / profile.behavioralTraits.length;
  }

  // Weighted composite (0-100)
  var composite = Math.round(
    techAvg * 0.25 +
    cognitiveScore * 0.15 +
    behavioralAvg * 0.10 +
    learningVelocity * 0.15 +
    careerAlignment * 0.15 +
    hiringReadiness * 0.10 +
    confidenceIndex * 0.10
  );

  // Scale to 0-1000
  return clamp(Math.round(composite * 10), 50, 980);
}

// ---- Public API ----

/**
 * Recalculate all scores realistically based on current profile data
 * and career goals. This is the main entry point.
 */
export function calculateRealisticScores(
  profile: SkillDNAProfile,
  goals?: CareerGoal
): RealisticScores {
  // Run goal intelligence if goals available
  var goalIntelligence: GoalIntelligenceResult | null = null;
  if (goals && goals.shortTerm) {
    goalIntelligence = analyzeGoalIntelligence(profile.technicalSkills, goals);
  }

  var cognitive = calcCognitiveScore(profile);
  var velocity = calcLearningVelocity(profile);
  var alignment = calcCareerAlignment(profile, goals, goalIntelligence);
  var hiring = calcHiringReadiness(profile, alignment, cognitive);
  var confidence = calcConfidenceIndex(profile);
  var dynamic = calcDynamicScore(cognitive, velocity, alignment, hiring, confidence, profile);

  return {
    cognitiveScore: cognitive,
    learningVelocity: velocity,
    careerAlignmentScore: alignment,
    hiringReadiness: hiring,
    confidenceIndex: confidence,
    dynamicSkillScore: dynamic,
  };
}

/**
 * Get the explanation for a specific score card.
 * Returns null if no explanation is registered for that label.
 */
export function getScoreExplanation(label: string): ScoreExplanation | null {
  return SCORE_EXPLANATIONS[label] || null;
}
