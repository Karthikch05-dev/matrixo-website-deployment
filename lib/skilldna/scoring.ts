// ============================================================
// SkillDNA™ Scoring Utilities
// Pure functions for score calculations and transformations
// ============================================================

import { SkillDNAProfile, SelfRating, SkillLevel, TechnicalSkill, Assessment } from './types';

/**
 * Skill level to numeric score mapping
 */
export const SKILL_LEVEL_SCORES: Record<SkillLevel, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 95,
};

/**
 * Calculate Dynamic Skill Score (0-1000) from profile components
 * Weighted formula considering multiple dimensions
 */
export function calculateDynamicSkillScore(profile: Partial<SkillDNAProfile>): number {
  const weights = {
    technical: 0.35,      // Technical competency
    cognitive: 0.20,      // Cognitive ability
    behavioral: 0.15,     // Behavioral alignment
    velocity: 0.15,       // Learning speed
    alignment: 0.15,      // Career alignment
  };

  const technicalAvg = profile.technicalSkills?.length
    ? profile.technicalSkills.reduce((sum, s) => sum + s.score, 0) / profile.technicalSkills.length
    : 0;

  const behavioralAvg = profile.behavioralTraits?.length
    ? profile.behavioralTraits.reduce((sum, t) => sum + t.score, 0) / profile.behavioralTraits.length
    : 0;

  const rawScore = (
    technicalAvg * weights.technical +
    (profile.cognitiveScore || 0) * weights.cognitive +
    behavioralAvg * weights.behavioral +
    (profile.learningVelocity || 0) * weights.velocity +
    (profile.careerAlignmentScore || 0) * weights.alignment
  );

  // Scale from 0-100 to 0-1000
  return Math.round(Math.min(1000, Math.max(0, rawScore * 10)));
}

/**
 * Calculate cognitive score from self-rating
 */
export function calculateCognitiveScore(rating: SelfRating): number {
  const weights = {
    problemSolving: 0.30,
    creativity: 0.20,
    adaptability: 0.25,
    learningSpeed: 0.25,
  };

  const raw = (
    rating.problemSolving * weights.problemSolving +
    rating.creativity * weights.creativity +
    rating.adaptability * weights.adaptability +
    rating.learningSpeed * weights.learningSpeed
  );

  return Math.round(raw * 10); // Scale 1-10 to 0-100
}

/**
 * Recalculate profile after assessment completion
 */
export function recalculateAfterAssessment(
  profile: SkillDNAProfile,
  assessment: Assessment
): Partial<SkillDNAProfile> {
  const updates: Partial<SkillDNAProfile> = {};

  // Update relevant technical skill score
  if (assessment.category === 'technical') {
    const scorePercent = (assessment.score / assessment.maxScore) * 100;
    updates.technicalSkills = profile.technicalSkills.map(skill => {
      if (skill.category.toLowerCase() === (assessment.metadata?.skillArea || '').toLowerCase()) {
        const newScore = Math.round((skill.score * 0.7) + (scorePercent * 0.3)); // Weighted blend
        return {
          ...skill,
          score: Math.min(100, Math.max(0, newScore)),
          trend: newScore > skill.score ? 'rising' as const : newScore < skill.score ? 'declining' as const : 'stable' as const,
          lastAssessed: new Date().toISOString(),
        };
      }
      return skill;
    });
  }

  // Update cognitive score for cognitive assessments
  if (assessment.category === 'cognitive') {
    const scorePercent = (assessment.score / assessment.maxScore) * 100;
    updates.cognitiveScore = Math.round((profile.cognitiveScore * 0.6) + (scorePercent * 0.4));
  }

  // Update learning velocity based on completion time
  if (assessment.duration > 0 && assessment.score > 0) {
    const efficiency = (assessment.score / assessment.maxScore) / (assessment.duration / 3600); // score per hour
    const velocityAdjust = Math.min(5, Math.max(-5, (efficiency - 0.5) * 10));
    updates.learningVelocity = Math.min(100, Math.max(0, 
      Math.round(profile.learningVelocity + velocityAdjust)
    ));
  }

  // Recalculate dynamic score
  const merged = { ...profile, ...updates };
  updates.dynamicSkillScore = calculateDynamicSkillScore(merged);

  return updates;
}

/**
 * Calculate skill gap severity
 */
export function calculateGapSeverity(currentLevel: number, requiredLevel: number): 'high' | 'medium' | 'low' {
  const gap = requiredLevel - currentLevel;
  if (gap >= 40) return 'high';
  if (gap >= 20) return 'medium';
  return 'low';
}

/**
 * Generate score trend description
 */
export function getScoreTrend(current: number, previous: number): { direction: string; percentage: number } {
  const diff = current - previous;
  const percentage = previous > 0 ? Math.round((diff / previous) * 100) : 0;
  
  if (diff > 0) return { direction: 'up', percentage: Math.abs(percentage) };
  if (diff < 0) return { direction: 'down', percentage: Math.abs(percentage) };
  return { direction: 'stable', percentage: 0 };
}

/**
 * Get score grade label
 */
export function getScoreGrade(score: number, maxScore: number = 1000): string {
  const percent = (score / maxScore) * 100;
  if (percent >= 90) return 'Exceptional';
  if (percent >= 75) return 'Advanced';
  if (percent >= 60) return 'Proficient';
  if (percent >= 40) return 'Developing';
  if (percent >= 20) return 'Emerging';
  return 'Novice';
}

/**
 * Get color class for score level
 */
export function getScoreColor(score: number, maxScore: number = 100): string {
  const percent = (score / maxScore) * 100;
  if (percent >= 80) return 'text-green-500';
  if (percent >= 60) return 'text-blue-500';
  if (percent >= 40) return 'text-yellow-500';
  if (percent >= 20) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get gradient color for score level
 */
export function getScoreGradient(score: number, maxScore: number = 100): string {
  const percent = (score / maxScore) * 100;
  if (percent >= 80) return 'from-green-500 to-emerald-500';
  if (percent >= 60) return 'from-blue-500 to-cyan-500';
  if (percent >= 40) return 'from-yellow-500 to-amber-500';
  if (percent >= 20) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-rose-500';
}
