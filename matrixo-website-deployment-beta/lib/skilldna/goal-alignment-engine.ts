// ============================================================
// SkillDNA™ Goal Alignment Engine
// Computes skill-to-goal relevance scores locally (no AI calls)
// Pure functions — deterministic, testable, fast
// ============================================================

import {
  TechnicalSkill,
  CareerGoal,
  SkillGoalAlignment,
  StrategicTag,
  GoalAlignmentStats,
  SkillGapSuggestion,
  SkillLevel,
} from './types';

// ---- Keyword → Domain Mapping ----

interface DomainKeywords {
  [domain: string]: string[];
}

const DOMAIN_KEYWORDS: DomainKeywords = {
  // Engineering / SDE roles
  'software-engineering': [
    'sde', 'software', 'engineer', 'developer', 'dev', 'coding', 'programming',
    'backend', 'frontend', 'fullstack', 'full-stack', 'full stack',
  ],
  'web-development': [
    'web', 'react', 'angular', 'vue', 'nextjs', 'next.js', 'html', 'css',
    'javascript', 'typescript', 'frontend', 'ui', 'ux',
  ],
  'mobile-development': [
    'mobile', 'android', 'ios', 'flutter', 'react native', 'swift', 'kotlin',
  ],
  'data-science': [
    'data', 'analytics', 'analysis', 'scientist', 'statistics', 'pandas',
    'numpy', 'jupyter', 'visualization', 'bi', 'tableau', 'power bi',
  ],
  'machine-learning': [
    'ml', 'machine learning', 'ai', 'artificial intelligence', 'deep learning',
    'neural', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'model',
  ],
  'cloud-devops': [
    'cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'k8s',
    'ci/cd', 'terraform', 'infrastructure', 'sre', 'reliability',
  ],
  'cybersecurity': [
    'security', 'cyber', 'penetration', 'ethical', 'hacking', 'soc',
    'vulnerability', 'encryption', 'firewall', 'compliance',
  ],
  'management': [
    'manager', 'management', 'lead', 'director', 'vp', 'cto', 'ceo', 'coo',
    'product', 'project', 'scrum', 'agile', 'strategy', 'leadership',
    'head of', 'founder', 'co-founder',
  ],
  'design': [
    'design', 'ui', 'ux', 'figma', 'sketch', 'adobe', 'graphic',
    'user experience', 'user interface', 'interaction', 'prototype',
  ],
  'database': [
    'database', 'sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'redis',
    'firebase', 'firestore', 'dynamodb', 'cassandra',
  ],
  'dsa-algorithms': [
    'dsa', 'algorithm', 'data structure', 'leetcode', 'competitive',
    'problem solving', 'sorting', 'graph', 'tree', 'dynamic programming',
  ],
  'system-design': [
    'system design', 'architecture', 'scalab', 'distributed', 'microservice',
    'api', 'rest', 'graphql', 'design pattern',
  ],
  'blockchain': [
    'blockchain', 'web3', 'smart contract', 'solidity', 'ethereum', 'crypto',
    'defi', 'nft',
  ],
};

// Skill name → domain mapping (maps common skill names to domains)
const SKILL_DOMAIN_MAP: Record<string, string[]> = {
  // Languages & tools
  'react': ['web-development', 'software-engineering'],
  'next.js': ['web-development', 'software-engineering'],
  'nextjs': ['web-development', 'software-engineering'],
  'angular': ['web-development', 'software-engineering'],
  'vue': ['web-development', 'software-engineering'],
  'javascript': ['web-development', 'software-engineering'],
  'typescript': ['web-development', 'software-engineering'],
  'python': ['software-engineering', 'data-science', 'machine-learning'],
  'java': ['software-engineering'],
  'c++': ['software-engineering', 'dsa-algorithms'],
  'c': ['software-engineering'],
  'go': ['software-engineering', 'cloud-devops'],
  'rust': ['software-engineering', 'system-design'],
  'html': ['web-development'],
  'css': ['web-development', 'design'],
  'node.js': ['web-development', 'software-engineering'],
  'nodejs': ['web-development', 'software-engineering'],
  'express': ['web-development', 'software-engineering'],
  'django': ['web-development', 'software-engineering'],
  'flask': ['web-development', 'software-engineering'],
  'spring': ['software-engineering'],
  // Mobile
  'flutter': ['mobile-development'],
  'react native': ['mobile-development', 'web-development'],
  'swift': ['mobile-development'],
  'kotlin': ['mobile-development', 'software-engineering'],
  'android': ['mobile-development'],
  'ios': ['mobile-development'],
  // Data / ML
  'tensorflow': ['machine-learning'],
  'pytorch': ['machine-learning'],
  'pandas': ['data-science'],
  'numpy': ['data-science', 'machine-learning'],
  'scikit-learn': ['machine-learning', 'data-science'],
  'sql': ['database', 'software-engineering'],
  'mongodb': ['database', 'web-development'],
  'postgresql': ['database'],
  'mysql': ['database'],
  'firebase': ['web-development', 'mobile-development', 'database'],
  'redis': ['database', 'system-design'],
  // Cloud / DevOps
  'docker': ['cloud-devops'],
  'kubernetes': ['cloud-devops'],
  'aws': ['cloud-devops'],
  'azure': ['cloud-devops'],
  'gcp': ['cloud-devops'],
  'terraform': ['cloud-devops'],
  'jenkins': ['cloud-devops'],
  'git': ['software-engineering'],
  'linux': ['software-engineering', 'cloud-devops'],
  // Design
  'figma': ['design'],
  'sketch': ['design'],
  'adobe xd': ['design'],
  'photoshop': ['design'],
  // DSA
  'data structures': ['dsa-algorithms'],
  'algorithms': ['dsa-algorithms'],
  'dsa': ['dsa-algorithms'],
  'competitive programming': ['dsa-algorithms'],
  // System Design
  'system design': ['system-design'],
  'microservices': ['system-design', 'cloud-devops'],
  'graphql': ['web-development', 'system-design'],
  'rest api': ['web-development', 'system-design'],
  // Other
  'machine learning': ['machine-learning'],
  'deep learning': ['machine-learning'],
  'nlp': ['machine-learning'],
  'computer vision': ['machine-learning'],
  'blockchain': ['blockchain'],
  'solidity': ['blockchain'],
  'excel': ['data-science'],
  'power bi': ['data-science'],
  'tableau': ['data-science'],
};

// Proficiency weight multiplier
const PROFICIENCY_WEIGHTS: Record<SkillLevel | string, number> = {
  beginner: 0.4,
  intermediate: 0.65,
  advanced: 0.85,
  expert: 1.0,
};

// ---- Core Alignment Engine ----

/**
 * Extract domains from a goal text string
 */
function extractDomainsFromText(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matchedDomains: string[] = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        if (!matchedDomains.includes(domain)) {
          matchedDomains.push(domain);
        }
        break; // One match per domain is enough
      }
    }
  }

  return matchedDomains;
}

/**
 * Get domains a skill belongs to
 */
function getSkillDomains(skillName: string, skillCategory: string): string[] {
  const lowerName = skillName.toLowerCase();
  const lowerCategory = skillCategory.toLowerCase();

  // Direct skill → domain lookup
  const directDomains = SKILL_DOMAIN_MAP[lowerName] || [];

  // Also check category keywords
  const categoryDomains = extractDomainsFromText(lowerCategory);

  // Merge and deduplicate without Set spread
  const allDomains = directDomains.concat(categoryDomains);
  const unique: string[] = [];
  for (const d of allDomains) {
    if (!unique.includes(d)) unique.push(d);
  }

  // Fallback: try partial matching on skill name
  if (unique.length === 0) {
    for (const [mappedSkill, domains] of Object.entries(SKILL_DOMAIN_MAP)) {
      if (lowerName.includes(mappedSkill) || mappedSkill.includes(lowerName)) {
        for (const d of domains) {
          if (!unique.includes(d)) unique.push(d);
        }
        break;
      }
    }
  }

  return unique;
}

/**
 * Calculate relevance of a skill to a goal text.
 * Returns 0-100.
 */
function calculateRelevance(
  skillDomains: string[],
  goalDomains: string[],
  proficiencyWeight: number
): number {
  if (skillDomains.length === 0 || goalDomains.length === 0) return 10; // baseline

  let matchCount = 0;
  for (const sd of skillDomains) {
    if (goalDomains.includes(sd)) matchCount++;
  }

  if (matchCount === 0) return 10; // no overlap → minimal relevance

  // Overlap ratio: how many skill domains match goal domains
  const overlapRatio = matchCount / Math.max(skillDomains.length, goalDomains.length);

  // Raw score: strong match gets high base, weighted by proficiency
  const rawScore = 30 + overlapRatio * 60; // 30-90 base range
  const weighted = rawScore * (0.5 + proficiencyWeight * 0.5); // proficiency boosts 50%-100%

  return Math.min(100, Math.round(weighted));
}

/**
 * Determine strategic tag based on overall impact score
 */
function getStrategicTag(overallImpact: number): StrategicTag {
  if (overallImpact >= 65) return 'Core';
  if (overallImpact >= 35) return 'Support';
  return 'Optional';
}

// ---- Public API ----

/**
 * Compute goal alignment for a single skill
 */
export function computeSkillAlignment(
  skillName: string,
  skillCategory: string,
  skillScore: number,
  goals: CareerGoal
): SkillGoalAlignment {
  const skillDomains = getSkillDomains(skillName, skillCategory);

  // Estimate proficiency level from score
  let profWeight = 0.4;
  if (skillScore >= 90) profWeight = 1.0;
  else if (skillScore >= 70) profWeight = 0.85;
  else if (skillScore >= 45) profWeight = 0.65;
  else profWeight = 0.4;

  // Extract domains from each goal tier + dreamRole
  const shortGoalText = `${goals.shortTerm} ${goals.dreamRole}`;
  const midGoalText = `${goals.midTerm} ${goals.dreamRole}`;
  const longGoalText = `${goals.longTerm} ${goals.dreamRole}`;

  const shortDomains = extractDomainsFromText(shortGoalText);
  const midDomains = extractDomainsFromText(midGoalText);
  const longDomains = extractDomainsFromText(longGoalText);

  const shortTermRelevance = calculateRelevance(skillDomains, shortDomains, profWeight);
  const midTermRelevance = calculateRelevance(skillDomains, midDomains, profWeight);
  const longTermRelevance = calculateRelevance(skillDomains, longDomains, profWeight);

  // Overall impact: weighted combination favoring short-term
  const overallImpact = Math.round(
    shortTermRelevance * 0.45 +
    midTermRelevance * 0.30 +
    longTermRelevance * 0.25
  );

  return {
    shortTermRelevance,
    midTermRelevance,
    longTermRelevance,
    overallImpact,
    strategicTag: getStrategicTag(overallImpact),
  };
}

/**
 * Compute alignments for all skills and return enriched skill array
 */
export function computeAllAlignments(
  skills: TechnicalSkill[],
  goals: CareerGoal
): TechnicalSkill[] {
  return skills.map(skill => ({
    ...skill,
    goalAlignment: computeSkillAlignment(skill.name, skill.category, skill.score, goals),
  }));
}

/**
 * Compute aggregate alignment stats for profile statistics
 */
export function computeAlignmentStats(
  skills: TechnicalSkill[],
  goals: CareerGoal
): GoalAlignmentStats {
  if (skills.length === 0) {
    return {
      totalSkills: 0,
      coreSkills: 0,
      supportSkills: 0,
      optionalSkills: 0,
      skillGoalMatchPercent: 0,
      longTermReadiness: 0,
      shortTermExecution: 0,
    };
  }

  const enriched = computeAllAlignments(skills, goals);

  let coreCount = 0;
  let supportCount = 0;
  let optionalCount = 0;
  let totalOverall = 0;
  let totalLong = 0;
  let totalShort = 0;

  for (const skill of enriched) {
    const a = skill.goalAlignment!;
    if (a.strategicTag === 'Core') coreCount++;
    else if (a.strategicTag === 'Support') supportCount++;
    else optionalCount++;

    totalOverall += a.overallImpact;
    totalLong += a.longTermRelevance;
    totalShort += a.shortTermRelevance;
  }

  const count = enriched.length;

  return {
    totalSkills: count,
    coreSkills: coreCount,
    supportSkills: supportCount,
    optionalSkills: optionalCount,
    skillGoalMatchPercent: Math.round(totalOverall / count),
    longTermReadiness: Math.round(totalLong / count),
    shortTermExecution: Math.round(totalShort / count),
  };
}

// ---- Intelligent Gap Detection ----

/**
 * Detect critical skill gaps based on career goals.
 * Compares goal domains against existing skills to find missing competencies.
 */
export function detectGoalBasedGaps(
  skills: TechnicalSkill[],
  goals: CareerGoal
): SkillGapSuggestion[] {
  const suggestions: SkillGapSuggestion[] = [];

  // Combine all goal text
  const allGoalText = `${goals.shortTerm} ${goals.midTerm} ${goals.longTerm} ${goals.dreamRole}`.toLowerCase();
  const goalDomains = extractDomainsFromText(allGoalText);

  // Get all domains currently covered by user's skills
  const coveredDomains: string[] = [];
  for (const skill of skills) {
    for (const d of getSkillDomains(skill.name, skill.category)) {
      if (!coveredDomains.includes(d)) coveredDomains.push(d);
    }
  }

  // Find uncovered goal domains
  const uncoveredDomains = goalDomains.filter(d => !coveredDomains.includes(d));

  // Domain → suggested skills map
  const DOMAIN_SUGGESTIONS: Record<string, { skill: string; action: string }[]> = {
    'dsa-algorithms': [
      { skill: 'Data Structures & Algorithms', action: 'Practice on LeetCode/CodeForces for 30 min daily' },
    ],
    'system-design': [
      { skill: 'System Design', action: 'Study Designing Data-Intensive Applications book' },
    ],
    'cloud-devops': [
      { skill: 'Cloud & DevOps', action: 'Get AWS/GCP foundational certification' },
    ],
    'machine-learning': [
      { skill: 'Machine Learning', action: 'Complete Andrew Ng\'s ML Specialization' },
    ],
    'data-science': [
      { skill: 'Data Analysis', action: 'Master pandas, SQL, and data visualization' },
    ],
    'web-development': [
      { skill: 'Web Development', action: 'Build full-stack projects with React + Node.js' },
    ],
    'mobile-development': [
      { skill: 'Mobile Development', action: 'Build a Flutter or React Native app' },
    ],
    'management': [
      { skill: 'Leadership & Management', action: 'Lead a team project or open-source initiative' },
    ],
    'cybersecurity': [
      { skill: 'Cybersecurity Fundamentals', action: 'Study CompTIA Security+ or TryHackMe paths' },
    ],
    'design': [
      { skill: 'UI/UX Design', action: 'Learn Figma and complete a design sprint' },
    ],
    'database': [
      { skill: 'Database Engineering', action: 'Master SQL + learn NoSQL patterns' },
    ],
    'software-engineering': [
      { skill: 'Core Software Engineering', action: 'Build production-grade projects and learn clean architecture' },
    ],
    'blockchain': [
      { skill: 'Blockchain Development', action: 'Learn Solidity and build a DApp' },
    ],
  };

  // Generate suggestions for uncovered domains
  for (const domain of uncoveredDomains) {
    const domainSuggestions = DOMAIN_SUGGESTIONS[domain] || [];
    for (const sugg of domainSuggestions) {
      // Determine which goal tier this gap is most relevant to
      const shortDomains = extractDomainsFromText(goals.shortTerm);
      const midDomains = extractDomainsFromText(goals.midTerm);
      const longDomains = extractDomainsFromText(goals.longTerm);

      let relatedGoal: 'short' | 'mid' | 'long' = 'mid';
      let severity: 'critical' | 'important' | 'nice-to-have' = 'important';

      if (shortDomains.includes(domain)) {
        relatedGoal = 'short';
        severity = 'critical';
      } else if (midDomains.includes(domain)) {
        relatedGoal = 'mid';
        severity = 'important';
      } else if (longDomains.includes(domain)) {
        relatedGoal = 'long';
        severity = 'nice-to-have';
      }

      // Check dream role for critical escalation
      const dreamDomains = extractDomainsFromText(goals.dreamRole);
      if (dreamDomains.includes(domain) && severity !== 'critical') {
        severity = 'critical';
      }

      suggestions.push({
        skill: sugg.skill,
        severity,
        reason: `Your ${relatedGoal}-term goal requires ${domain.replace(/-/g, ' ')} skills`,
        relatedGoal,
        priorityAction: sugg.action,
      });
    }
  }

  // Also check for weak skills in covered domains
  for (const skill of skills) {
    const skillDomains = getSkillDomains(skill.name, skill.category);
    const isGoalRelevant = skillDomains.some(d => goalDomains.includes(d));

    if (isGoalRelevant && skill.score < 40) {
      suggestions.push({
        skill: skill.name,
        severity: skill.score < 25 ? 'critical' : 'important',
        reason: `"${skill.name}" is relevant to your goals but proficiency is low (${skill.score}%)`,
        relatedGoal: 'short',
        priorityAction: `Increase ${skill.name} proficiency through focused practice`,
      });
    }
  }

  // Sort: critical first, then important, then nice-to-have
  const severityOrder: Record<string, number> = { critical: 0, important: 1, 'nice-to-have': 2 };
  suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return suggestions;
}

/**
 * Generate priority improvement suggestions based on goals.
 * Returns human-readable action items.
 */
export function generatePrioritySuggestions(
  skills: TechnicalSkill[],
  goals: CareerGoal
): string[] {
  const suggestions: string[] = [];
  const enriched = computeAllAlignments(skills, goals);
  const gaps = detectGoalBasedGaps(skills, goals);

  // Top priority: critical gaps
  for (const gap of gaps.filter(g => g.severity === 'critical').slice(0, 2)) {
    suggestions.push(gap.priorityAction);
  }

  // Suggest improving support skills to become core
  const supportSkills = enriched
    .filter(s => s.goalAlignment?.strategicTag === 'Support' && s.score < 60)
    .slice(0, 2);
  for (const s of supportSkills) {
    suggestions.push(
      `Deepen "${s.name}" (currently ${s.score}%) — it supports your career trajectory`
    );
  }

  // Long-term readiness
  if (goals.longTerm) {
    const longDomains = extractDomainsFromText(goals.longTerm);
    if (longDomains.includes('management') || goals.longTerm.toLowerCase().includes('cto')) {
      suggestions.push(
        'Build leadership experience through team projects for your long-term CTO ambition'
      );
    }
    if (longDomains.includes('system-design')) {
      suggestions.push(
        'Invest in system design knowledge for long-term architecture roles'
      );
    }
  }

  // Remove duplicates and limit
  const unique: string[] = [];
  for (const s of suggestions) {
    if (!unique.some(u => u.toLowerCase() === s.toLowerCase())) unique.push(s);
  }

  return unique.slice(0, 5);
}
