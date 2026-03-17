// ============================================================
// ImpactVault™ Core Type Definitions
// Institutional Intelligence Dashboard type system
// ============================================================

import { SkillDNAProfile, SkillGap, TechnicalSkill } from '../skilldna/types';
import { UserProfile } from '../ProfileContext';

// ---- RBAC ----

export type ImpactVaultRole = 'super_admin' | 'institution_admin' | 'faculty' | 'student';

export interface ImpactVaultAccess {
  userId: string;
  role: ImpactVaultRole;
  institution: string;       // college name (empty for super_admin)
  department?: string;       // branch (only for faculty)
  grantedBy: string;
  grantedAt: string;
}

// ---- Time Range ----

export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

// ---- Dashboard Tab ----

export type DashboardTab = 'overview' | 'students' | 'departments' | 'placement';

// ---- Student with combined data ----

export interface StudentWithSkillDNA {
  profile: UserProfile;
  skillDNA: SkillDNAProfile | null;
  hasSkillDNA: boolean;
}

// ---- Institution Metrics ----

export interface InstitutionMetrics {
  totalStudents: number;
  studentsWithSkillDNA: number;
  avgDynamicSkillScore: number;      // 0-1000
  avgHiringReadiness: number;        // 0-100
  avgCareerAlignment: number;        // 0-100
  avgCognitiveScore: number;         // 0-100
  avgLearningVelocity: number;       // 0-100
  avgConfidenceIndex: number;        // 0-100
  topSkills: SkillFrequency[];
  skillGapsSummary: AggregatedSkillGap[];
  departmentCount: number;
}

// ---- Department Metrics ----

export interface DepartmentMetrics {
  department: string;                // branch name
  studentCount: number;
  studentsWithSkillDNA: number;
  avgDynamicSkillScore: number;
  avgHiringReadiness: number;
  avgCareerAlignment: number;
  topSkills: SkillFrequency[];
}

// ---- Student Analytics (for leaderboard/detail) ----

export interface StudentAnalytics {
  uid: string;
  name: string;
  username?: string;
  branch: string;
  year: string;
  dynamicSkillScore: number;
  hiringReadiness: number;
  careerAlignmentScore: number;
  cognitiveScore: number;
  learningVelocity: number;
  topSkills: string[];
  skillCount: number;
  skillClusters: string[];
  hasSkillDNA: boolean;
}

// ---- Skill Distribution ----

export interface SkillFrequency {
  skill: string;
  count: number;
  avgScore: number;
  category: string;
}

// ---- Aggregated Skill Gap ----

export interface AggregatedSkillGap {
  skill: string;
  studentsAffected: number;
  avgGapSize: number;           // requiredLevel - currentLevel
  priority: 'high' | 'medium' | 'low';
}

// ---- Placement Readiness ----

export interface PlacementMetrics {
  overallReadinessScore: number;     // 0-100
  readyCount: number;               // hiringReadiness >= 70
  developingCount: number;           // hiringReadiness 40-69
  earlyStageCount: number;           // hiringReadiness < 40
  topCandidates: StudentAnalytics[];
  readinessDistribution: ReadinessBucket[];
}

export interface ReadinessBucket {
  range: string;       // e.g., "0-20", "20-40"
  count: number;
}

// ---- Activity Timeline ----

export interface ActivityDataPoint {
  date: string;
  count: number;
  label: string;
}

// ---- Dashboard Data (complete) ----

export interface ImpactVaultData {
  institutionMetrics: InstitutionMetrics;
  departmentMetrics: DepartmentMetrics[];
  studentAnalytics: StudentAnalytics[];
  placementMetrics: PlacementMetrics;
  loading: boolean;
  error: string | null;
  institution: string;
  role: ImpactVaultRole;
}
