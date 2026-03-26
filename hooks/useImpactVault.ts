'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useProfile } from '@/lib/ProfileContext';
import {
  ImpactVaultRole,
  ImpactVaultData,
  InstitutionMetrics,
  DepartmentMetrics,
  StudentAnalytics,
  PlacementMetrics,
  StudentWithSkillDNA,
} from '@/lib/impactvault/types';
import {
  getUserImpactVaultAccess,
  getInstitutionStudentsWithSkillDNA,
  getAllStudentsWithSkillDNA,
} from '@/lib/impactvault/firestore-service';
import {
  computeInstitutionMetrics,
  computeDepartmentMetrics,
  computeStudentAnalytics,
  computePlacementMetrics,
} from '@/lib/impactvault/analytics-engine';

const EMPTY_INSTITUTION_METRICS: InstitutionMetrics = {
  totalStudents: 0,
  studentsWithSkillDNA: 0,
  avgDynamicSkillScore: 0,
  avgHiringReadiness: 0,
  avgCareerAlignment: 0,
  avgCognitiveScore: 0,
  avgLearningVelocity: 0,
  avgConfidenceIndex: 0,
  topSkills: [],
  skillGapsSummary: [],
  departmentCount: 0,
};

const EMPTY_PLACEMENT_METRICS: PlacementMetrics = {
  overallReadinessScore: 0,
  readyCount: 0,
  developingCount: 0,
  earlyStageCount: 0,
  topCandidates: [],
  readinessDistribution: [],
};

export function useImpactVault() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<ImpactVaultRole>('student');
  const [institution, setInstitution] = useState<string>('');
  const [students, setStudents] = useState<StudentWithSkillDNA[]>([]);
  const [institutionMetrics, setInstitutionMetrics] = useState<InstitutionMetrics>(EMPTY_INSTITUTION_METRICS);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([]);
  const [placementMetrics, setPlacementMetrics] = useState<PlacementMetrics>(EMPTY_PLACEMENT_METRICS);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Check RBAC access
      const access = await getUserImpactVaultAccess(user.uid);
      let userRole: ImpactVaultRole = 'student';
      let userInstitution = '';

      if (access) {
        userRole = access.role;
        userInstitution = access.collegeId || access.institution || '';
      } else if (profile?.collegeId) {
        // Default: student sees own institution by collegeId
        userRole = 'student';
        userInstitution = profile.collegeId;
      }

      setRole(userRole);
      setInstitution(userInstitution);

      // 2. Fetch student data based on role
      let fetchedStudents: StudentWithSkillDNA[] = [];

      if (userRole === 'super_admin') {
        fetchedStudents = await getAllStudentsWithSkillDNA();
      } else if (userInstitution) {
        fetchedStudents = await getInstitutionStudentsWithSkillDNA(userInstitution);
      }

      // Faculty: filter to department only
      if (userRole === 'faculty' && access?.department) {
        fetchedStudents = fetchedStudents.filter(
          (s) => s.profile.branch === access.department
        );
      }

      setStudents(fetchedStudents);

      // 3. Compute all metrics
      const instMetrics = computeInstitutionMetrics(fetchedStudents);
      const deptMetrics = computeDepartmentMetrics(fetchedStudents);
      const studAnalytics = computeStudentAnalytics(fetchedStudents);
      const placMetrics = computePlacementMetrics(fetchedStudents);

      setInstitutionMetrics(instMetrics);
      setDepartmentMetrics(deptMetrics);
      setStudentAnalytics(studAnalytics);
      setPlacementMetrics(placMetrics);
    } catch (err) {
      console.error('ImpactVault data fetch error:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [user, profile?.collegeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    role,
    collegeId: institution,
    institutionMetrics,
    departmentMetrics,
    studentAnalytics,
    placementMetrics,
    students,
    refetch: fetchData,
  };
}
