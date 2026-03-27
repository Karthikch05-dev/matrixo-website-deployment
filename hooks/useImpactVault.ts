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
  const { profile, loading: profileLoading } = useProfile();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<ImpactVaultRole>('student');
  const [institution, setInstitution] = useState<string>('');
  const [students, setStudents] = useState<StudentWithSkillDNA[]>([]);
  const [institutionMetrics, setInstitutionMetrics] = useState<InstitutionMetrics>(EMPTY_INSTITUTION_METRICS);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([]);
  const [placementMetrics, setPlacementMetrics] = useState<PlacementMetrics>(EMPTY_PLACEMENT_METRICS);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const fetchData = useCallback(async () => {
    // Wait for auth
    if (!user) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    // Don't fetch if profile is still loading (prevents race condition)
    if (profileLoading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCurrentUserUid(user.uid);

      // Debug logging
      const debugData: string[] = [];
      debugData.push(`User UID: ${user.uid}`);
      debugData.push(`Profile collegeId: ${profile?.collegeId || 'NOT SET'}`);
      debugData.push(`Profile college (legacy): ${profile?.college || 'NOT SET'}`);

      // 1. Check RBAC access
      const access = await getUserImpactVaultAccess(user.uid);
      let userRole: ImpactVaultRole = 'student';
      let userCollegeId = '';
      let userCollegeName = '';

      if (access) {
        userRole = access.role;
        userCollegeId = access.collegeId || '';
        userCollegeName = access.institution || '';
        debugData.push(`RBAC: role=${userRole}, collegeId=${userCollegeId}`);
      } else {
        debugData.push('No RBAC access, using profile data');
        userRole = 'student';
        
        if (profile?.collegeId) {
          userCollegeId = profile.collegeId;
          debugData.push(`Using profile.collegeId: ${userCollegeId}`);
        }
        
        if (profile?.college) {
          userCollegeName = profile.college;
          debugData.push(`Using profile.college (legacy): ${userCollegeName}`);
        }
      }

      setRole(userRole);
      setInstitution(userCollegeName || userCollegeId);

      // 2. Fetch student data based on role
      let fetchedStudents: StudentWithSkillDNA[] = [];

      if (userRole === 'super_admin') {
        debugData.push('Fetching ALL students (super_admin)');
        fetchedStudents = await getAllStudentsWithSkillDNA();
      } else if (userCollegeId || userCollegeName) {
        debugData.push(`Fetching: collegeId="${userCollegeId}", collegeName="${userCollegeName}"`);
        fetchedStudents = await getInstitutionStudentsWithSkillDNA(userCollegeId, userCollegeName);
      } else {
        debugData.push('WARNING: No college identifier available');
      }

      debugData.push(`Total students: ${fetchedStudents.length}`);
      debugData.push(`With SkillDNA: ${fetchedStudents.filter(s => s.hasSkillDNA).length}`);

      // Faculty: filter to department only
      if (userRole === 'faculty' && access?.department) {
        const before = fetchedStudents.length;
        fetchedStudents = fetchedStudents.filter(
          (s) => s.profile.branch === access.department
        );
        debugData.push(`Faculty filter: ${before} → ${fetchedStudents.length}`);
      }

      setStudents(fetchedStudents);
      setDebugInfo(debugData.join('\n'));
      console.log('[ImpactVault]', debugData.join(' | '));

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
  }, [user, profile?.collegeId, profile?.college, profileLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading: loading || profileLoading,
    error,
    role,
    institution,
    institutionMetrics,
    departmentMetrics,
    studentAnalytics,
    placementMetrics,
    students,
    currentUserUid,
    debugInfo,
    refetch: fetchData,
  };
}
