// ============================================================
// ImpactVault™ Analytics Engine
// Aggregation and computation logic for institutional metrics
// ============================================================

import { SkillDNAProfile } from '@/lib/skilldna/types';
import {
  StudentWithSkillDNA,
  InstitutionMetrics,
  DepartmentMetrics,
  StudentAnalytics,
  SkillFrequency,
  AggregatedSkillGap,
  PlacementMetrics,
  ReadinessBucket,
} from './types';

// ---- Institution-Level Metrics ----

/**
 * Compute aggregated institution metrics from student data
 */
export function computeInstitutionMetrics(
  students: StudentWithSkillDNA[]
): InstitutionMetrics {
  const withSkillDNA = students.filter((s) => s.hasSkillDNA && s.skillDNA);
  const profiles = withSkillDNA.map((s) => s.skillDNA!);

  const departments = new Set(students.map((s) => s.profile.branch).filter(Boolean));

  return {
    totalStudents: students.length,
    studentsWithSkillDNA: withSkillDNA.length,
    avgDynamicSkillScore: safeAvg(profiles.map((p) => p.dynamicSkillScore)),
    avgHiringReadiness: safeAvg(profiles.map((p) => p.hiringReadiness)),
    avgCareerAlignment: safeAvg(profiles.map((p) => p.careerAlignmentScore)),
    avgCognitiveScore: safeAvg(profiles.map((p) => p.cognitiveScore)),
    avgLearningVelocity: safeAvg(profiles.map((p) => p.learningVelocity)),
    avgConfidenceIndex: safeAvg(profiles.map((p) => p.confidenceIndex)),
    topSkills: computeSkillDistribution(profiles).slice(0, 10),
    skillGapsSummary: computeSkillGapAnalysis(profiles).slice(0, 8),
    departmentCount: departments.size,
  };
}

// ---- Department-Level Metrics ----

/**
 * Compute metrics grouped by department (branch)
 */
export function computeDepartmentMetrics(
  students: StudentWithSkillDNA[]
): DepartmentMetrics[] {
  const byDepartment = new Map<string, StudentWithSkillDNA[]>();

  students.forEach((student) => {
    const dept = student.profile.branch || 'Unknown';
    if (!byDepartment.has(dept)) {
      byDepartment.set(dept, []);
    }
    byDepartment.get(dept)!.push(student);
  });

  const metrics: DepartmentMetrics[] = [];

  byDepartment.forEach((deptStudents, department) => {
    const withSkillDNA = deptStudents.filter((s) => s.hasSkillDNA && s.skillDNA);
    const profiles = withSkillDNA.map((s) => s.skillDNA!);

    metrics.push({
      department,
      studentCount: deptStudents.length,
      studentsWithSkillDNA: withSkillDNA.length,
      avgDynamicSkillScore: safeAvg(profiles.map((p) => p.dynamicSkillScore)),
      avgHiringReadiness: safeAvg(profiles.map((p) => p.hiringReadiness)),
      avgCareerAlignment: safeAvg(profiles.map((p) => p.careerAlignmentScore)),
      topSkills: computeSkillDistribution(profiles).slice(0, 5),
    });
  });

  // Sort by average skill score descending
  return metrics.sort((a, b) => b.avgDynamicSkillScore - a.avgDynamicSkillScore);
}

// ---- Student Analytics (Leaderboard) ----

/**
 * Compute individual student analytics for leaderboard/detail views
 */
export function computeStudentAnalytics(
  students: StudentWithSkillDNA[]
): StudentAnalytics[] {
  return students
    .map((student) => {
      const { profile, skillDNA, hasSkillDNA } = student;

      if (!hasSkillDNA || !skillDNA) {
        return {
          uid: profile.uid,
          name: profile.fullName,
          username: profile.username,
          branch: profile.branch || 'Unknown',
          year: profile.year || '',
          dynamicSkillScore: 0,
          hiringReadiness: 0,
          careerAlignmentScore: 0,
          cognitiveScore: 0,
          learningVelocity: 0,
          topSkills: [],
          skillCount: 0,
          skillClusters: [],
          hasSkillDNA: false,
        };
      }

      return {
        uid: profile.uid,
        name: profile.fullName,
        username: profile.username,
        branch: profile.branch || 'Unknown',
        year: profile.year || '',
        dynamicSkillScore: skillDNA.dynamicSkillScore || 0,
        hiringReadiness: skillDNA.hiringReadiness || 0,
        careerAlignmentScore: skillDNA.careerAlignmentScore || 0,
        cognitiveScore: skillDNA.cognitiveScore || 0,
        learningVelocity: skillDNA.learningVelocity || 0,
        topSkills: (skillDNA.technicalSkills || [])
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((s) => s.name),
        skillCount: (skillDNA.technicalSkills || []).length,
        skillClusters: (skillDNA.skillClusters || []).map((c) => c.name),
        hasSkillDNA: true,
      };
    })
    .sort((a, b) => b.dynamicSkillScore - a.dynamicSkillScore);
}

/**
 * Get top N performers by dynamicSkillScore
 */
export function computeTopPerformers(
  students: StudentWithSkillDNA[],
  limit: number = 10
): StudentAnalytics[] {
  return computeStudentAnalytics(students)
    .filter((s) => s.hasSkillDNA)
    .slice(0, limit);
}

// ---- Skill Distribution ----

/**
 * Compute skill frequency distribution across all profiles
 */
export function computeSkillDistribution(
  profiles: SkillDNAProfile[]
): SkillFrequency[] {
  const skillMap = new Map<
    string,
    { count: number; totalScore: number; category: string }
  >();

  profiles.forEach((profile) => {
    (profile.technicalSkills || []).forEach((skill) => {
      const key = skill.name.toLowerCase();
      const existing = skillMap.get(key);
      if (existing) {
        existing.count++;
        existing.totalScore += skill.score;
      } else {
        skillMap.set(key, {
          count: 1,
          totalScore: skill.score,
          category: skill.category,
        });
      }
    });
  });

  const distribution: SkillFrequency[] = [];
  skillMap.forEach((data, skillKey) => {
    distribution.push({
      skill: skillKey.charAt(0).toUpperCase() + skillKey.slice(1),
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count),
      category: data.category,
    });
  });

  return distribution.sort((a, b) => b.count - a.count);
}

// ---- Skill Gap Analysis ----

/**
 * Aggregate skill gaps across all student profiles
 */
export function computeSkillGapAnalysis(
  profiles: SkillDNAProfile[]
): AggregatedSkillGap[] {
  const gapMap = new Map<
    string,
    { count: number; totalGap: number; priorities: string[] }
  >();

  profiles.forEach((profile) => {
    (profile.skillGaps || []).forEach((gap) => {
      const key = gap.skill.toLowerCase();
      const gapSize = gap.requiredLevel - gap.currentLevel;
      const existing = gapMap.get(key);
      if (existing) {
        existing.count++;
        existing.totalGap += gapSize;
        existing.priorities.push(gap.priority);
      } else {
        gapMap.set(key, {
          count: 1,
          totalGap: gapSize,
          priorities: [gap.priority],
        });
      }
    });
  });

  const gaps: AggregatedSkillGap[] = [];
  gapMap.forEach((data, skillKey) => {
    // Determine overall priority based on most common priority
    const priorityCounts = { high: 0, medium: 0, low: 0 };
    data.priorities.forEach((p) => {
      if (p in priorityCounts) priorityCounts[p as keyof typeof priorityCounts]++;
    });
    const overallPriority =
      priorityCounts.high >= priorityCounts.medium
        ? 'high'
        : priorityCounts.medium >= priorityCounts.low
        ? 'medium'
        : 'low';

    gaps.push({
      skill: skillKey.charAt(0).toUpperCase() + skillKey.slice(1),
      studentsAffected: data.count,
      avgGapSize: Math.round(data.totalGap / data.count),
      priority: overallPriority as 'high' | 'medium' | 'low',
    });
  });

  return gaps.sort((a, b) => b.studentsAffected - a.studentsAffected);
}

// ---- Placement Readiness ----

/**
 * Compute placement readiness metrics
 */
export function computePlacementMetrics(
  students: StudentWithSkillDNA[]
): PlacementMetrics {
  const analytics = computeStudentAnalytics(students).filter((s) => s.hasSkillDNA);

  const readyCount = analytics.filter((s) => s.hiringReadiness >= 70).length;
  const developingCount = analytics.filter(
    (s) => s.hiringReadiness >= 40 && s.hiringReadiness < 70
  ).length;
  const earlyStageCount = analytics.filter((s) => s.hiringReadiness < 40).length;

  const overallReadinessScore =
    analytics.length > 0
      ? Math.round(safeAvg(analytics.map((s) => s.hiringReadiness)))
      : 0;

  // Build distribution buckets
  const buckets: ReadinessBucket[] = [
    { range: '0-20', count: 0 },
    { range: '20-40', count: 0 },
    { range: '40-60', count: 0 },
    { range: '60-80', count: 0 },
    { range: '80-100', count: 0 },
  ];

  analytics.forEach((s) => {
    const idx = Math.min(Math.floor(s.hiringReadiness / 20), 4);
    buckets[idx].count++;
  });

  return {
    overallReadinessScore,
    readyCount,
    developingCount,
    earlyStageCount,
    topCandidates: analytics
      .sort((a, b) => b.hiringReadiness - a.hiringReadiness)
      .slice(0, 10),
    readinessDistribution: buckets,
  };
}

// ---- Utility ----

function safeAvg(values: number[]): number {
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((sum, v) => sum + v, 0) / valid.length);
}

// ---- CSV Export ----

/**
 * Generate CSV string from student analytics data
 */
export function generateStudentsCSV(students: StudentAnalytics[]): string {
  const headers = [
    'Name',
    'Branch',
    'Year',
    'Skill Score',
    'Hiring Readiness',
    'Career Alignment',
    'Cognitive Score',
    'Learning Velocity',
    'Top Skills',
    'Skill Count',
  ];

  const rows = students.map((s) => [
    `"${s.name}"`,
    `"${s.branch}"`,
    s.year,
    s.dynamicSkillScore,
    s.hiringReadiness,
    s.careerAlignmentScore,
    s.cognitiveScore,
    s.learningVelocity,
    `"${s.topSkills.join(', ')}"`,
    s.skillCount,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
