// ============================================================
// SkillDNA™ Goal Intelligence Engine
// Analyzes career goals against current skills to produce
// per-goal roadmaps with match %, missing skills, priorities,
// and recommended depth levels.
// Pure functions — no side effects, no API calls.
// ============================================================

import {
  TechnicalSkill,
  CareerGoal,
  SkillLevel,
} from '../types';

// ---- Types ----

export type GoalTier = 'shortTerm' | 'midTerm' | 'longTerm';

export type RoadmapDepth = 'Beginner' | 'Intermediate' | 'Advanced';

export type EffortLevel = 'Low' | 'Medium' | 'High';

export type GapStatus = 'strong' | 'developing' | 'critical';

export interface MissingSkillEntry {
  name: string;
  recommendedDepth: RoadmapDepth;
  priority: number;          // 1 = highest
  effort: EffortLevel;
  reason: string;
}

export interface GoalRoadmap {
  tier: GoalTier;
  goalText: string;
  matchPercent: number;       // 0–100
  status: GapStatus;          // derived from matchPercent
  matchedSkills: string[];    // skills user already has that map to goal
  missingSkills: MissingSkillEntry[];
  priorityNextSkill: string | null;
  totalRequired: number;      // total skills the engine deems necessary
  totalOwned: number;         // how many the user already has
}

export interface GoalIntelligenceResult {
  shortTerm: GoalRoadmap;
  midTerm: GoalRoadmap;
  longTerm: GoalRoadmap;
  overallMatchPercent: number; // weighted average across tiers
  overallStatus: GapStatus;
}

// ---- Domain → Required Skills Map ----
// Maps career domains to lists of skills expected at that level.
// Used to determine what's missing.

interface DomainSkillRequirement {
  name: string;
  depth: RoadmapDepth;
  effort: EffortLevel;
}

const DOMAIN_REQUIREMENTS: Record<string, DomainSkillRequirement[]> = {
  'software-engineering': [
    { name: 'Data Structures & Algorithms', depth: 'Intermediate', effort: 'High' },
    { name: 'System Design', depth: 'Intermediate', effort: 'High' },
    { name: 'Git', depth: 'Beginner', effort: 'Low' },
    { name: 'Databases', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Problem Solving', depth: 'Advanced', effort: 'High' },
  ],
  'web-development': [
    { name: 'HTML/CSS', depth: 'Intermediate', effort: 'Low' },
    { name: 'JavaScript', depth: 'Intermediate', effort: 'Medium' },
    { name: 'React', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Node.js', depth: 'Intermediate', effort: 'Medium' },
    { name: 'TypeScript', depth: 'Intermediate', effort: 'Medium' },
    { name: 'REST APIs', depth: 'Intermediate', effort: 'Medium' },
  ],
  'mobile-development': [
    { name: 'Flutter', depth: 'Intermediate', effort: 'Medium' },
    { name: 'React Native', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Mobile UI/UX', depth: 'Beginner', effort: 'Low' },
    { name: 'API Integration', depth: 'Intermediate', effort: 'Medium' },
  ],
  'data-science': [
    { name: 'Python', depth: 'Intermediate', effort: 'Medium' },
    { name: 'SQL', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Statistics', depth: 'Intermediate', effort: 'High' },
    { name: 'Data Visualization', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Pandas', depth: 'Intermediate', effort: 'Medium' },
  ],
  'machine-learning': [
    { name: 'Python', depth: 'Advanced', effort: 'Medium' },
    { name: 'Linear Algebra', depth: 'Intermediate', effort: 'High' },
    { name: 'TensorFlow/PyTorch', depth: 'Intermediate', effort: 'High' },
    { name: 'Statistics', depth: 'Advanced', effort: 'High' },
    { name: 'Neural Networks', depth: 'Intermediate', effort: 'High' },
    { name: 'Data Preprocessing', depth: 'Intermediate', effort: 'Medium' },
  ],
  'cloud-devops': [
    { name: 'Linux', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Docker', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Kubernetes', depth: 'Intermediate', effort: 'High' },
    { name: 'CI/CD', depth: 'Intermediate', effort: 'Medium' },
    { name: 'AWS/Azure/GCP', depth: 'Intermediate', effort: 'High' },
    { name: 'Terraform', depth: 'Intermediate', effort: 'Medium' },
  ],
  'cybersecurity': [
    { name: 'Networking', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Linux', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Ethical Hacking', depth: 'Intermediate', effort: 'High' },
    { name: 'Encryption', depth: 'Intermediate', effort: 'High' },
    { name: 'Security Compliance', depth: 'Beginner', effort: 'Medium' },
  ],
  'management': [
    { name: 'Leadership', depth: 'Advanced', effort: 'High' },
    { name: 'Agile/Scrum', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Communication', depth: 'Advanced', effort: 'Medium' },
    { name: 'Project Management', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Strategic Thinking', depth: 'Advanced', effort: 'High' },
  ],
  'design': [
    { name: 'Figma', depth: 'Intermediate', effort: 'Medium' },
    { name: 'UI Design Principles', depth: 'Intermediate', effort: 'Medium' },
    { name: 'User Research', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Prototyping', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Visual Design', depth: 'Intermediate', effort: 'Medium' },
  ],
  'database': [
    { name: 'SQL', depth: 'Advanced', effort: 'Medium' },
    { name: 'NoSQL', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Database Design', depth: 'Intermediate', effort: 'High' },
    { name: 'Query Optimization', depth: 'Advanced', effort: 'High' },
  ],
  'dsa-algorithms': [
    { name: 'Arrays & Strings', depth: 'Advanced', effort: 'Medium' },
    { name: 'Trees & Graphs', depth: 'Advanced', effort: 'High' },
    { name: 'Dynamic Programming', depth: 'Advanced', effort: 'High' },
    { name: 'Sorting & Searching', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Competitive Programming', depth: 'Advanced', effort: 'High' },
  ],
  'system-design': [
    { name: 'Distributed Systems', depth: 'Advanced', effort: 'High' },
    { name: 'API Design', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Caching', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Load Balancing', depth: 'Intermediate', effort: 'High' },
    { name: 'Microservices', depth: 'Advanced', effort: 'High' },
  ],
  'blockchain': [
    { name: 'Solidity', depth: 'Intermediate', effort: 'High' },
    { name: 'Smart Contracts', depth: 'Intermediate', effort: 'High' },
    { name: 'Web3.js', depth: 'Intermediate', effort: 'Medium' },
    { name: 'Cryptography', depth: 'Intermediate', effort: 'High' },
  ],
};

// ---- Domain keyword extraction (mirrored from goal-alignment-engine) ----

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'software-engineering': [
    'sde', 'software', 'engineer', 'developer', 'dev', 'coding', 'programming',
    'backend', 'frontend', 'fullstack', 'full-stack', 'full stack',
  ],
  'web-development': [
    'web', 'react', 'angular', 'vue', 'nextjs', 'next.js', 'html', 'css',
    'javascript', 'typescript', 'frontend', 'ui developer',
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
    'firebase', 'firestore', 'dynamodb',
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

// Skill name fuzzy matching lookup (lowercase → domain skill names)
const SKILL_NAME_ALIASES: Record<string, string[]> = {
  'react': ['React', 'React.js'],
  'next.js': ['Next.js', 'NextJS'],
  'nextjs': ['Next.js', 'NextJS'],
  'node.js': ['Node.js', 'NodeJS'],
  'nodejs': ['Node.js', 'NodeJS'],
  'javascript': ['JavaScript', 'JS'],
  'typescript': ['TypeScript', 'TS'],
  'python': ['Python'],
  'java': ['Java'],
  'c++': ['C++', 'CPP'],
  'html': ['HTML', 'HTML/CSS'],
  'css': ['CSS', 'HTML/CSS'],
  'html/css': ['HTML/CSS'],
  'sql': ['SQL', 'Databases'],
  'mongodb': ['NoSQL', 'Databases'],
  'postgresql': ['SQL', 'Databases'],
  'mysql': ['SQL', 'Databases'],
  'firebase': ['Databases', 'NoSQL'],
  'docker': ['Docker'],
  'kubernetes': ['Kubernetes'],
  'aws': ['AWS/Azure/GCP'],
  'azure': ['AWS/Azure/GCP'],
  'gcp': ['AWS/Azure/GCP'],
  'terraform': ['Terraform'],
  'git': ['Git'],
  'linux': ['Linux'],
  'figma': ['Figma'],
  'flutter': ['Flutter'],
  'react native': ['React Native'],
  'swift': ['Mobile Development'],
  'kotlin': ['Mobile Development'],
  'tensorflow': ['TensorFlow/PyTorch'],
  'pytorch': ['TensorFlow/PyTorch'],
  'pandas': ['Pandas'],
  'data structures': ['Data Structures & Algorithms', 'Arrays & Strings'],
  'algorithms': ['Data Structures & Algorithms', 'Sorting & Searching'],
  'dsa': ['Data Structures & Algorithms'],
  'machine learning': ['Neural Networks', 'Data Preprocessing'],
  'deep learning': ['Neural Networks'],
  'system design': ['Distributed Systems', 'API Design'],
  'blockchain': ['Smart Contracts'],
  'solidity': ['Solidity'],
  'agile': ['Agile/Scrum'],
  'scrum': ['Agile/Scrum'],
  'leadership': ['Leadership'],
  'communication': ['Communication'],
  'project management': ['Project Management'],
  'competitive programming': ['Competitive Programming'],
  'dynamic programming': ['Dynamic Programming'],
};

// ---- Helpers ----

function extractDomains(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (var domain in DOMAIN_KEYWORDS) {
    if (!DOMAIN_KEYWORDS.hasOwnProperty(domain)) continue;
    var keywords = DOMAIN_KEYWORDS[domain];
    for (var k = 0; k < keywords.length; k++) {
      if (lower.indexOf(keywords[k]) !== -1) {
        if (matched.indexOf(domain) === -1) matched.push(domain);
        break;
      }
    }
  }
  return matched;
}

function getStatusFromMatch(percent: number): GapStatus {
  if (percent >= 65) return 'strong';
  if (percent >= 35) return 'developing';
  return 'critical';
}

/**
 * Check if a user skill "covers" a required skill.
 * Uses fuzzy name matching to handle React -> React.js, etc.
 */
function skillCovers(userSkillName: string, requiredSkillName: string): boolean {
  const uLower = userSkillName.toLowerCase().trim();
  const rLower = requiredSkillName.toLowerCase().trim();

  // Direct match
  if (uLower === rLower) return true;

  // Partial substring match (e.g., "React" covers "React")
  if (uLower.indexOf(rLower) !== -1 || rLower.indexOf(uLower) !== -1) return true;

  // Alias lookup: check if user skill maps to any alias that matches required
  var aliases = SKILL_NAME_ALIASES[uLower];
  if (aliases) {
    for (var a = 0; a < aliases.length; a++) {
      if (aliases[a].toLowerCase() === rLower) return true;
    }
  }

  return false;
}

// ---- Core Engine ----

/**
 * Build a roadmap for a single goal tier.
 */
function buildGoalRoadmap(
  tier: GoalTier,
  goalText: string,
  dreamRole: string,
  userSkills: TechnicalSkill[]
): GoalRoadmap {
  // Combine goal text with dream role for enriched domain extraction
  var combinedGoalText = goalText + ' ' + dreamRole;
  var domains = extractDomains(combinedGoalText);

  if (domains.length === 0 || !goalText.trim()) {
    return {
      tier: tier,
      goalText: goalText,
      matchPercent: 0,
      status: 'critical',
      matchedSkills: [],
      missingSkills: [],
      priorityNextSkill: null,
      totalRequired: 0,
      totalOwned: 0,
    };
  }

  // Collect all required skills from the matched domains (deduplicated)
  var requiredSkills: DomainSkillRequirement[] = [];
  var seenNames: string[] = [];

  for (var d = 0; d < domains.length; d++) {
    var domainReqs = DOMAIN_REQUIREMENTS[domains[d]];
    if (!domainReqs) continue;
    for (var r = 0; r < domainReqs.length; r++) {
      var req = domainReqs[r];
      if (seenNames.indexOf(req.name) === -1) {
        seenNames.push(req.name);
        requiredSkills.push(req);
      }
    }
  }

  if (requiredSkills.length === 0) {
    return {
      tier: tier,
      goalText: goalText,
      matchPercent: 0,
      status: 'critical',
      matchedSkills: [],
      missingSkills: [],
      priorityNextSkill: null,
      totalRequired: 0,
      totalOwned: 0,
    };
  }

  // Determine which required skills the user already has
  var matchedSkills: string[] = [];
  var missingSkills: MissingSkillEntry[] = [];

  for (var i = 0; i < requiredSkills.length; i++) {
    var rSkill = requiredSkills[i];
    var found = false;
    for (var j = 0; j < userSkills.length; j++) {
      if (skillCovers(userSkills[j].name, rSkill.name)) {
        found = true;
        break;
      }
    }

    if (found) {
      matchedSkills.push(rSkill.name);
    } else {
      missingSkills.push({
        name: rSkill.name,
        recommendedDepth: rSkill.depth,
        priority: 0, // will be assigned below
        effort: rSkill.effort,
        reason: 'Required for ' + domains.join(', ').replace(/-/g, ' '),
      });
    }
  }

  // Assign priority 1...N to missing skills (by effort: high-effort last)
  var effortOrder: Record<string, number> = { 'Low': 0, 'Medium': 1, 'High': 2 };
  missingSkills.sort(function(a, b) { return effortOrder[a.effort] - effortOrder[b.effort]; });
  for (var p = 0; p < missingSkills.length; p++) {
    missingSkills[p].priority = p + 1;
  }

  var totalRequired = requiredSkills.length;
  var totalOwned = matchedSkills.length;
  var matchPercent = totalRequired > 0 ? Math.round((totalOwned / totalRequired) * 100) : 0;

  return {
    tier: tier,
    goalText: goalText,
    matchPercent: matchPercent,
    status: getStatusFromMatch(matchPercent),
    matchedSkills: matchedSkills,
    missingSkills: missingSkills,
    priorityNextSkill: missingSkills.length > 0 ? missingSkills[0].name : null,
    totalRequired: totalRequired,
    totalOwned: totalOwned,
  };
}

// ---- Public API ----

/**
 * Analyze all 3 goal tiers and produce a full Goal Intelligence result.
 */
export function analyzeGoalIntelligence(
  skills: TechnicalSkill[],
  goals: CareerGoal
): GoalIntelligenceResult {
  var shortTerm = buildGoalRoadmap('shortTerm', goals.shortTerm, goals.dreamRole, skills);
  var midTerm = buildGoalRoadmap('midTerm', goals.midTerm, goals.dreamRole, skills);
  var longTerm = buildGoalRoadmap('longTerm', goals.longTerm, goals.dreamRole, skills);

  // Weighted overall: short 45%, mid 30%, long 25%
  var overallMatchPercent = Math.round(
    shortTerm.matchPercent * 0.45 +
    midTerm.matchPercent * 0.30 +
    longTerm.matchPercent * 0.25
  );

  return {
    shortTerm: shortTerm,
    midTerm: midTerm,
    longTerm: longTerm,
    overallMatchPercent: overallMatchPercent,
    overallStatus: getStatusFromMatch(overallMatchPercent),
  };
}

/**
 * Get the color class for a gap status.
 */
export function getStatusColor(status: GapStatus): string {
  if (status === 'strong') return 'text-green-400';
  if (status === 'developing') return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Get the background/border color class for a gap status.
 */
export function getStatusBgColor(status: GapStatus): string {
  if (status === 'strong') return 'bg-green-500/10 border-green-500/30';
  if (status === 'developing') return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

/**
 * Get the gradient for the match percent bar.
 */
export function getMatchGradient(status: GapStatus): string {
  if (status === 'strong') return 'from-green-500 to-emerald-500';
  if (status === 'developing') return 'from-yellow-500 to-amber-500';
  return 'from-red-500 to-rose-500';
}

/**
 * Get a human-readable tier label.
 */
export function getTierLabel(tier: GoalTier): string {
  if (tier === 'shortTerm') return 'Short-Term (0-1 Year)';
  if (tier === 'midTerm') return 'Mid-Term (2-3 Years)';
  return 'Long-Term (5+ Years)';
}
