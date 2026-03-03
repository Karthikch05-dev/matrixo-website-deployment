// ============================================================
// SkillDNA™ Core Type Definitions
// Production-grade type system for the AI skill genome engine
// ============================================================

// ---- Enums & Constants ----

export type UserRole = 'student' | 'admin' | 'corporate';

export type OnboardingStep = 
  | 'welcome'
  | 'academic'
  | 'skills'
  | 'interests'
  | 'career-goals'
  | 'self-rating'
  | 'resume'
  | 'personality'
  | 'analyzing'
  | 'complete';

export type AssessmentCategory = 
  | 'technical'
  | 'cognitive'
  | 'behavioral'
  | 'domain'
  | 'soft-skills';

export type ActivityType = 
  | 'assessment_completed'
  | 'skill_added'
  | 'module_completed'
  | 'mentor_feedback'
  | 'profile_updated'
  | 'resume_uploaded'
  | 'goal_updated';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// ---- Onboarding Data ----

export interface AcademicBackground {
  degree: string;
  field: string;
  institution: string;
  year: string;
  gpa?: string;
  achievements?: string[];
}

export interface SkillEntry {
  name: string;
  level: SkillLevel;
  yearsOfExperience: number;
  category: string;
}

export interface CareerGoal {
  shortTerm: string;    // What you're doing now / next 1 year
  midTerm: string;      // 2-3 years plan
  longTerm: string;     // 5+ year vision
  dreamRole: string;
  targetIndustries: string[];
}

export interface SelfRating {
  problemSolving: number;     // 1-10
  communication: number;      // 1-10
  leadership: number;         // 1-10
  creativity: number;         // 1-10
  teamwork: number;           // 1-10
  adaptability: number;       // 1-10
  technicalDepth: number;     // 1-10
  learningSpeed: number;      // 1-10
}

export interface PersonalityAnswers {
  workStyle: string;          // solo | team | hybrid
  stressResponse: string;     // thrive | manage | avoid
  decisionMaking: string;     // analytical | intuitive | collaborative
  motivationDriver: string;   // impact | mastery | autonomy | recognition
  learningPreference: string; // visual | hands-on | reading | discussion
  challengeApproach: string;  // head-on | systematic | creative | delegate
}

export interface OnboardingData {
  academic: AcademicBackground;
  skills: SkillEntry[];
  interests: string[];
  careerGoals: CareerGoal;
  selfRating: SelfRating;
  personality: PersonalityAnswers;
  resumeUrl?: string;
  pastExperience: string;      // What they did (past)
  currentSituation: string;    // What they're doing (present)
  futureAspiration: string;    // What they want to become (future)
}

// ---- SkillDNA Profile ----

export interface TechnicalSkill {
  name: string;
  score: number;       // 0-100
  category: string;
  trend: 'rising' | 'stable' | 'declining';
  lastAssessed?: string;
  goalAlignment?: SkillGoalAlignment;   // computed alignment to career goals
}

// ---- Goal Alignment Intelligence ----

export type StrategicTag = 'Core' | 'Support' | 'Optional';

export interface SkillGoalAlignment {
  shortTermRelevance: number;     // 0-100
  midTermRelevance: number;       // 0-100
  longTermRelevance: number;      // 0-100
  overallImpact: number;          // 0-100
  strategicTag: StrategicTag;
}

export interface GoalAlignmentStats {
  totalSkills: number;
  coreSkills: number;             // high goal alignment
  supportSkills: number;
  optionalSkills: number;
  skillGoalMatchPercent: number;  // 0-100
  longTermReadiness: number;      // 0-100
  shortTermExecution: number;     // 0-100
}

export interface SkillGapSuggestion {
  skill: string;
  severity: 'critical' | 'important' | 'nice-to-have';
  reason: string;
  relatedGoal: 'short' | 'mid' | 'long';
  priorityAction: string;
}

export interface BehavioralTrait {
  name: string;
  score: number;       // 0-100
  description: string;
}

export interface SkillCluster {
  name: string;
  skills: string[];
  strength: number;    // 0-100
  description: string;
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  priority: 'high' | 'medium' | 'low';
  suggestedResources: string[];
}

export interface LearningPath {
  title: string;
  description: string;
  steps: string[];
  estimatedDuration: string;
  difficulty: SkillLevel;
  relatedSkills: string[];
}

export interface AIPersonaSummary {
  headline: string;
  description: string;
  strengths: string[];
  areasForGrowth: string[];
  personalityType: string;
  careerFit: string[];
}

export interface SkillDNAProfile {
  technicalSkills: TechnicalSkill[];
  cognitiveScore: number;          // 0-100
  behavioralTraits: BehavioralTrait[];
  learningVelocity: number;        // 0-100
  careerAlignmentScore: number;    // 0-100
  dynamicSkillScore: number;       // 0-1000
  hiringReadiness: number;         // 0-100 — interview readiness indicator
  confidenceIndex: number;         // 0-100 — analysis reliability score
  skillClusters: SkillCluster[];
  skillGaps: SkillGap[];
  learningPaths: LearningPath[];
  persona: AIPersonaSummary;
  lastUpdated: string;
  version: number;
}

// ---- Assessment ----

export interface Assessment {
  id: string;
  userId: string;
  category: AssessmentCategory;
  score: number;
  maxScore: number;
  questions: number;
  correctAnswers: number;
  duration: number;         // in seconds
  completedAt: string;
  metadata?: Record<string, any>;
}

// ---- Activity Log ----

export interface ActivityLogEntry {
  id: string;
  userId: string;
  type: ActivityType;
  metadata: Record<string, any>;
  timestamp: string;
}

// ---- Version History ----

export interface SkillDNAVersion {
  versionId: string;
  snapshot: SkillDNAProfile;
  timestamp: string;
  trigger: string;          // What caused this version
}

// ---- Firestore User Document ----

export interface SkillDNAUserDocument {
  profile: {
    name: string;
    email: string;
    education: AcademicBackground;
    interests: string[];
    goals: CareerGoal;
    role: UserRole;
    createdAt: string;
    onboardingComplete: boolean;
    skillDNAVersion?: number;      // Tracks which version of onboarding schema was completed
  };
  onboardingData?: OnboardingData;
  skillDNA?: SkillDNAProfile;
  assessments?: Record<string, Assessment>;
  activityLog?: Record<string, ActivityLogEntry>;
}

// ---- AI Request/Response ----

export interface AIAnalysisRequest {
  onboardingData: OnboardingData;
  existingProfile?: SkillDNAProfile;
  assessmentHistory?: Assessment[];
}

export interface AIAnalysisResponse {
  technicalSkills: TechnicalSkill[];
  cognitiveScore: number;
  behavioralTraits: BehavioralTrait[];
  skillClusters: SkillCluster[];
  skillGaps: SkillGap[];
  careerAlignmentScore: number;
  learningVelocityEstimate: number;
  dynamicSkillScore: number;
  hiringReadiness: number;          // 0-100 — how interview-ready the user appears
  confidenceIndex: number;          // 0-100 — reliability of this analysis
  learningPaths: LearningPath[];
  persona: AIPersonaSummary;
}

// ---- Delta Update (for incremental re-calculations) ----

export interface DeltaUpdateRequest {
  userId: string;
  currentProfile: SkillDNAProfile;
  trigger: ActivityType;
  newData: Record<string, any>;
}

export interface DeltaUpdateResponse {
  updatedFields: Partial<SkillDNAProfile>;
  newDynamicSkillScore: number;
  changelog: string[];
}
