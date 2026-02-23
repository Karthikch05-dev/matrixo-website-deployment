// ============================================================
// SkillDNA™ Test Utilities
// Sample test user data and mock functions
// ============================================================

import { OnboardingData, SkillDNAProfile } from './types';
import { generateMockProfile } from './ai-engine';
import { calculateDynamicSkillScore } from './scoring';

/**
 * Sample test user onboarding data for development/testing
 */
export const SAMPLE_ONBOARDING_DATA: OnboardingData = {
  academic: {
    degree: 'B.Tech',
    field: 'Computer Science',
    institution: 'Indian Institute of Technology',
    year: '3rd Year',
    gpa: '8.5',
    achievements: ['Dean\'s List', 'Hackathon Winner', 'Open Source Contributor'],
  },
  skills: [
    { name: 'Python', level: 'advanced', yearsOfExperience: 3, category: 'Programming' },
    { name: 'JavaScript', level: 'intermediate', yearsOfExperience: 2, category: 'Web Development' },
    { name: 'React', level: 'intermediate', yearsOfExperience: 1.5, category: 'Web Development' },
    { name: 'Node.js', level: 'intermediate', yearsOfExperience: 1, category: 'Web Development' },
    { name: 'SQL', level: 'intermediate', yearsOfExperience: 2, category: 'Database' },
    { name: 'Git', level: 'advanced', yearsOfExperience: 3, category: 'DevOps' },
    { name: 'Machine Learning', level: 'beginner', yearsOfExperience: 0.5, category: 'Data Science' },
  ],
  interests: [
    'Artificial Intelligence',
    'Web Development',
    'Cloud Computing',
    'Open Source',
    'Startups',
    'Data Science',
  ],
  careerGoals: {
    shortTerm: 'Land a software engineering internship at a top tech company',
    midTerm: 'Become a full-stack developer with ML expertise',
    longTerm: 'Lead an AI-focused engineering team or start a tech company',
    dreamRole: 'Senior Software Engineer at Google',
    targetIndustries: ['Technology', 'Finance/Fintech', 'Education/EdTech'],
  },
  selfRating: {
    problemSolving: 8,
    communication: 6,
    leadership: 5,
    creativity: 7,
    teamwork: 7,
    adaptability: 8,
    technicalDepth: 7,
    learningSpeed: 9,
  },
  personality: {
    workStyle: 'hybrid',
    stressResponse: 'thrive',
    decisionMaking: 'analytical',
    motivationDriver: 'mastery',
    learningPreference: 'hands-on',
    challengeApproach: 'systematic',
  },
  pastExperience: 'Built several web applications using React and Node.js. Participated in 3 hackathons, won one. Contributed to open source projects on GitHub. Completed online courses on ML and AI.',
  currentSituation: '3rd year Computer Science student. Currently doing a web development internship. Learning ML/AI on the side. Active member of college coding club.',
  futureAspiration: 'Want to become a senior software engineer at a top tech company, with deep expertise in AI/ML. Eventually want to build and lead a startup solving real-world problems with AI.',
};

/**
 * Generate a complete sample profile for testing
 */
export function generateSampleProfile(): SkillDNAProfile {
  const analysisResult = generateMockProfile(SAMPLE_ONBOARDING_DATA);
  
  return {
    ...analysisResult,
    learningVelocity: analysisResult.learningVelocityEstimate,
    lastUpdated: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Validate that scoring utilities produce expected ranges
 */
export function runScoringTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  const profile = generateSampleProfile();

  // Test 1: Dynamic score should be 0-1000
  const dynamicScore = calculateDynamicSkillScore(profile);
  if (dynamicScore >= 0 && dynamicScore <= 1000) {
    passed++;
    results.push(`✓ Dynamic score in range: ${dynamicScore}`);
  } else {
    failed++;
    results.push(`✗ Dynamic score out of range: ${dynamicScore}`);
  }

  // Test 2: Technical skills should have scores 0-100
  const allValid = profile.technicalSkills.every(s => s.score >= 0 && s.score <= 100);
  if (allValid) {
    passed++;
    results.push('✓ All technical skills in valid range');
  } else {
    failed++;
    results.push('✗ Some technical skills out of range');
  }

  // Test 3: Cognitive score should be 0-100
  if (profile.cognitiveScore >= 0 && profile.cognitiveScore <= 100) {
    passed++;
    results.push(`✓ Cognitive score in range: ${profile.cognitiveScore}`);
  } else {
    failed++;
    results.push(`✗ Cognitive score out of range: ${profile.cognitiveScore}`);
  }

  // Test 4: Should have at least one skill cluster
  if (profile.skillClusters.length > 0) {
    passed++;
    results.push(`✓ Skill clusters exist: ${profile.skillClusters.length}`);
  } else {
    failed++;
    results.push('✗ No skill clusters generated');
  }

  // Test 5: Should have learning paths
  if (profile.learningPaths.length > 0) {
    passed++;
    results.push(`✓ Learning paths exist: ${profile.learningPaths.length}`);
  } else {
    failed++;
    results.push('✗ No learning paths generated');
  }

  // Test 6: Persona should have a headline
  if (profile.persona.headline.length > 0) {
    passed++;
    results.push('✓ Persona headline exists');
  } else {
    failed++;
    results.push('✗ Persona headline missing');
  }

  return { passed, failed, results };
}
