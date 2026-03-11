// ============================================================
// SkillDNA™ AI Engine – OpenRouter Integration
// Production-grade AI analysis using OpenRouter API
// ============================================================

import { 
  AIAnalysisRequest, 
  AIAnalysisResponse, 
  DeltaUpdateRequest, 
  DeltaUpdateResponse,
  OnboardingData,
  SkillDNAProfile
} from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model routing strategy: Use capable model with good cost/performance ratio
// google/gemma-3-27b-it is free-tier on OpenRouter when available
// Fallback to meta-llama/llama-3.1-8b-instruct:free for cost optimization
const PRIMARY_MODEL = 'google/gemma-3-27b-it:free';
const FALLBACK_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ---- Prompt Engineering ----

function buildSystemPrompt(): string {
  return `You are SkillDNA™ AI, an advanced skill profiling engine for an EdTech platform called matriXO.
Your task is to analyze user data and generate a comprehensive, structured skill profile.

CRITICAL RULES:
1. You MUST respond with valid JSON only. No markdown, no explanations, no code blocks.
2. All scores must be realistic and well-calibrated based on the input data.
3. Skill gaps should be actionable and specific to the user's career goals.
4. Learning paths should be practical and time-bound.
5. The persona summary should be insightful and motivating.
6. dynamicSkillScore ranges from 0-1000 and represents overall capability.
7. All other scores range from 0-100.
8. Be honest about gaps - don't inflate scores.
9. Consider the user's past experience, current situation, and future aspirations.
10. Behavioral traits should reflect work style and personality answers.
11. NEVER mirror or parrot the user's exact words or phrases in the persona summary. Reframe everything professionally using your own language — synthesize insights, don't copy input.
12. Persona headline must be a creative professional title, NOT "Aspiring [dreamRole] with [field] Background".
13. Learning path titles should be personalized and creative, not generic (e.g. NOT just "[dreamRole] Mastery Path").
14. Include a "hiringReadiness" field (0-100) indicating how interview-ready the user appears.
15. Include a "confidenceIndex" field (0-100) estimating the reliability of this analysis based on input quality.`;
}

function buildAnalysisPrompt(data: OnboardingData): string {
  return `Analyze this user's data and generate their complete SkillDNA profile.

USER DATA:
- Past Experience: ${data.pastExperience}
- Current Situation: ${data.currentSituation}
- Future Aspiration: ${data.futureAspiration}

Academic Background:
- Degree: ${data.academic.degree} in ${data.academic.field}
- Institution: ${data.academic.institution}
- Year: ${data.academic.year}
${data.academic.gpa ? `- GPA: ${data.academic.gpa}` : ''}
${data.academic.achievements?.length ? `- Achievements: ${data.academic.achievements.join(', ')}` : ''}

Technical Skills:
${data.skills.map(s => `- ${s.name}: ${s.level} (${s.yearsOfExperience} years) [${s.category}]`).join('\n')}

Interests: ${data.interests.join(', ')}

Career Goals:
- Short-term: ${data.careerGoals.shortTerm}
- Mid-term: ${data.careerGoals.midTerm}
- Long-term: ${data.careerGoals.longTerm}
- Dream Role: ${data.careerGoals.dreamRole}
- Target Industries: ${data.careerGoals.targetIndustries.join(', ')}

Self-Rating (1-10):
- Problem Solving: ${data.selfRating.problemSolving}
- Communication: ${data.selfRating.communication}
- Leadership: ${data.selfRating.leadership}
- Creativity: ${data.selfRating.creativity}
- Teamwork: ${data.selfRating.teamwork}
- Adaptability: ${data.selfRating.adaptability}
- Technical Depth: ${data.selfRating.technicalDepth}
- Learning Speed: ${data.selfRating.learningSpeed}

Personality:
- Work Style: ${data.personality.workStyle}
- Stress Response: ${data.personality.stressResponse}
- Decision Making: ${data.personality.decisionMaking}
- Motivation Driver: ${data.personality.motivationDriver}
- Learning Preference: ${data.personality.learningPreference}
- Challenge Approach: ${data.personality.challengeApproach}

Generate a JSON response with EXACTLY this structure:
{
  "technicalSkills": [{"name": "string", "score": 0-100, "category": "string", "trend": "rising|stable|declining"}],
  "cognitiveScore": 0-100,
  "behavioralTraits": [{"name": "string", "score": 0-100, "description": "string"}],
  "skillClusters": [{"name": "string", "skills": ["string"], "strength": 0-100, "description": "string"}],
  "skillGaps": [{"skill": "string", "currentLevel": 0-100, "requiredLevel": 0-100, "priority": "high|medium|low", "suggestedResources": ["string"]}],
  "careerAlignmentScore": 0-100,
  "learningVelocityEstimate": 0-100,
  "dynamicSkillScore": 0-1000,
  "hiringReadiness": 0-100,
  "confidenceIndex": 0-100,
  "learningPaths": [{"title": "string", "description": "string", "steps": ["string"], "estimatedDuration": "string", "difficulty": "beginner|intermediate|advanced|expert", "relatedSkills": ["string"]}],
  "persona": {"headline": "string", "description": "string", "strengths": ["string"], "areasForGrowth": ["string"], "personalityType": "string", "careerFit": ["string"]}
}

IMPORTANT:
- Provide at least 5 technical skills, 4 behavioral traits, 3 skill clusters, 4 skill gaps, and 3 learning paths.
- Do NOT copy the user's raw text in the persona. Synthesize and reframe professionally.
- Learning path titles should be personalized and unique, not generic templates.
- hiringReadiness: How close this person is to being interview-ready (consider skill depth, experience, gaps).
- confidenceIndex: How reliable this analysis is based on the quality/depth of the user's input.
RESPOND WITH JSON ONLY.`;
}

function buildDeltaPrompt(request: DeltaUpdateRequest): string {
  return `A user's SkillDNA profile needs updating based on new activity.

CURRENT PROFILE SUMMARY:
- Dynamic Skill Score: ${request.currentProfile.dynamicSkillScore}/1000
- Cognitive Score: ${request.currentProfile.cognitiveScore}/100
- Learning Velocity: ${request.currentProfile.learningVelocity}/100
- Career Alignment: ${request.currentProfile.careerAlignmentScore}/100
- Top Skills: ${request.currentProfile.technicalSkills.slice(0, 5).map(s => `${s.name}(${s.score})`).join(', ')}

TRIGGER: ${request.trigger}
NEW DATA: ${JSON.stringify(request.newData)}

Generate a JSON response with EXACTLY this structure:
{
  "updatedFields": {
    "dynamicSkillScore": number,
    "cognitiveScore": number,
    "learningVelocity": number,
    "careerAlignmentScore": number
  },
  "newDynamicSkillScore": 0-1000,
  "changelog": ["description of what changed and why"]
}

Be precise. Only adjust scores that are directly affected by the trigger event.
RESPOND WITH JSON ONLY.`;
}

// ---- API Communication ----

async function callOpenRouter(
  messages: OpenRouterMessage[], 
  apiKey: string,
  model: string = PRIMARY_MODEL
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://beta.matrixo.in',
      'X-Title': 'matriXO SkillDNA',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,          // Low temperature for consistent structured output
      max_tokens: 4096,
      top_p: 0.9,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data: OpenRouterResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('Empty response from OpenRouter API');
  }

  return data.choices[0].message.content;
}

// ---- JSON Parsing with Validation ----

function extractJSON(text: string): any {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // continue to next attempt
      }
    }
    
    // Try to find JSON object in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        throw new Error('Failed to parse AI response as JSON');
      }
    }
    
    throw new Error('No JSON found in AI response');
  }
}

function validateAnalysisResponse(data: any): AIAnalysisResponse {
  // Validate required fields exist and have correct types
  const required = [
    'technicalSkills', 'cognitiveScore', 'behavioralTraits', 
    'skillClusters', 'skillGaps', 'careerAlignmentScore',
    'learningVelocityEstimate', 'dynamicSkillScore', 'learningPaths', 'persona'
  ];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Clamp scores to valid ranges
  data.cognitiveScore = clamp(data.cognitiveScore, 0, 100);
  data.careerAlignmentScore = clamp(data.careerAlignmentScore, 0, 100);
  data.learningVelocityEstimate = clamp(data.learningVelocityEstimate, 0, 100);
  data.dynamicSkillScore = clamp(data.dynamicSkillScore, 0, 1000);
  data.hiringReadiness = clamp(data.hiringReadiness ?? 40, 0, 100);
  data.confidenceIndex = clamp(data.confidenceIndex ?? 50, 0, 100);

  // Validate arrays
  if (!Array.isArray(data.technicalSkills)) data.technicalSkills = [];
  if (!Array.isArray(data.behavioralTraits)) data.behavioralTraits = [];
  if (!Array.isArray(data.skillClusters)) data.skillClusters = [];
  if (!Array.isArray(data.skillGaps)) data.skillGaps = [];
  if (!Array.isArray(data.learningPaths)) data.learningPaths = [];

  // Validate technical skills scores
  data.technicalSkills = data.technicalSkills.map((skill: any) => ({
    name: skill.name || 'Unknown',
    score: clamp(skill.score || 0, 0, 100),
    category: skill.category || 'General',
    trend: ['rising', 'stable', 'declining'].includes(skill.trend) ? skill.trend : 'stable',
  }));

  // Validate behavioral traits
  data.behavioralTraits = data.behavioralTraits.map((trait: any) => ({
    name: trait.name || 'Unknown',
    score: clamp(trait.score || 0, 0, 100),
    description: trait.description || '',
  }));

  // Validate persona
  if (!data.persona || typeof data.persona !== 'object') {
    data.persona = {
      headline: 'Aspiring Professional',
      description: 'Profile analysis in progress.',
      strengths: [],
      areasForGrowth: [],
      personalityType: 'Balanced',
      careerFit: [],
    };
  }

  return data as AIAnalysisResponse;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

// ---- Cache Layer (Simple in-memory + localStorage) ----

const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(data: OnboardingData): string {
  const key = JSON.stringify({
    skills: data.skills.map(s => s.name).sort(),
    interests: data.interests.sort(),
    academic: data.academic.field,
    goals: data.careerGoals.dreamRole,
  });
  // Simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `skilldna_${Math.abs(hash)}`;
}

function getFromCache(key: string): any | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  responseCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  responseCache.set(key, { data, timestamp: Date.now() });
}

// ---- Public API ----

/**
 * Analyze user onboarding data and generate initial SkillDNA profile.
 * Uses model routing with fallback strategy.
 */
export async function analyzeUserProfile(
  request: AIAnalysisRequest,
  apiKey: string
): Promise<AIAnalysisResponse> {
  const cacheKey = getCacheKey(request.onboardingData);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildAnalysisPrompt(request.onboardingData) },
  ];

  let rawResponse: string;

  try {
    // Try primary model first
    rawResponse = await callOpenRouter(messages, apiKey, PRIMARY_MODEL);
  } catch (primaryError) {
    console.warn('Primary model failed, trying fallback:', primaryError);
    try {
      // Fallback to secondary model
      rawResponse = await callOpenRouter(messages, apiKey, FALLBACK_MODEL);
    } catch (fallbackError) {
      console.error('Both models failed:', fallbackError);
      // Return mock data as last resort
      return generateMockProfile(request.onboardingData);
    }
  }

  try {
    const parsed = extractJSON(rawResponse);
    const validated = validateAnalysisResponse(parsed);
    setCache(cacheKey, validated);
    return validated;
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    return generateMockProfile(request.onboardingData);
  }
}

/**
 * Perform delta update on existing profile based on new activity.
 */
export async function performDeltaUpdate(
  request: DeltaUpdateRequest,
  apiKey: string
): Promise<DeltaUpdateResponse> {
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildDeltaPrompt(request) },
  ];

  try {
    const rawResponse = await callOpenRouter(messages, apiKey, PRIMARY_MODEL);
    const parsed = extractJSON(rawResponse);
    
    return {
      updatedFields: parsed.updatedFields || {},
      newDynamicSkillScore: clamp(parsed.newDynamicSkillScore || request.currentProfile.dynamicSkillScore, 0, 1000),
      changelog: parsed.changelog || ['Profile updated based on new activity'],
    };
  } catch (error) {
    console.error('Delta update failed:', error);
    // Return minimal update
    return {
      updatedFields: {},
      newDynamicSkillScore: request.currentProfile.dynamicSkillScore,
      changelog: ['Delta update failed - profile unchanged'],
    };
  }
}

// ---- Mock Profile Generator (Fallback) ----

export function generateMockProfile(data: OnboardingData): AIAnalysisResponse {
  const skillNames = data.skills.map(s => s.name);
  const levelScores: Record<string, number> = {
    beginner: 25, intermediate: 50, advanced: 75, expert: 90
  };

  // Professional reframing helpers — never parrot raw user text
  const workStyleLabel = data.personality.workStyle === 'solo' ? 'independent' : data.personality.workStyle === 'team' ? 'collaborative' : 'versatile';
  const motivationLabel = data.personality.motivationDriver === 'impact' ? 'purpose-driven innovation' : data.personality.motivationDriver === 'mastery' ? 'deep technical mastery' : data.personality.motivationDriver === 'autonomy' ? 'self-directed growth' : 'professional excellence';
  const challengeLabel = data.personality.challengeApproach === 'head-on' ? 'Pioneer' : data.personality.challengeApproach === 'systematic' ? 'Strategist' : data.personality.challengeApproach === 'creative' ? 'Innovator' : 'Orchestrator';
  const decisionLabel = data.personality.decisionMaking === 'analytical' ? 'data-informed' : data.personality.decisionMaking === 'intuitive' ? 'intuition-guided' : 'consensus-building';
  const learningLabel = data.personality.learningPreference === 'visual' ? 'visual learning' : data.personality.learningPreference === 'hands-on' ? 'experiential learning' : data.personality.learningPreference === 'reading' ? 'research-based learning' : 'discussion-based learning';

  // Compute hiring readiness from skills depth + experience signals
  const avgSkillScore = data.skills.length > 0
    ? data.skills.reduce((sum, s) => sum + (levelScores[s.level] || 30), 0) / data.skills.length
    : 25;
  const hiringReadiness = Math.min(100, Math.round(avgSkillScore * 0.6 + data.selfRating.technicalDepth * 2 + data.selfRating.communication));
  const confidenceIndex = Math.min(100, Math.round(
    (data.skills.length > 0 ? 20 : 0) +
    (data.pastExperience.length > 20 ? 15 : 5) +
    (data.currentSituation.length > 20 ? 15 : 5) +
    (data.futureAspiration.length > 20 ? 10 : 3) +
    (data.careerGoals.dreamRole ? 15 : 0) +
    (data.academic.degree ? 10 : 0) +
    (data.interests.length > 0 ? 10 : 0)
  ));

  return {
    technicalSkills: data.skills.map(s => ({
      name: s.name,
      score: levelScores[s.level] + Math.floor(Math.random() * 15),
      category: s.category,
      trend: 'stable' as const,
    })),
    cognitiveScore: Math.round(
      (data.selfRating.problemSolving + data.selfRating.creativity + data.selfRating.adaptability) / 3 * 10
    ),
    behavioralTraits: [
      { name: 'Analytical Thinking', score: data.selfRating.problemSolving * 10, description: 'Ability to break down complex problems' },
      { name: 'Communication', score: data.selfRating.communication * 10, description: 'Effective verbal and written communication' },
      { name: 'Leadership', score: data.selfRating.leadership * 10, description: 'Ability to guide and inspire others' },
      { name: 'Adaptability', score: data.selfRating.adaptability * 10, description: 'Flexibility in changing environments' },
    ],
    skillClusters: [
      { name: 'Core Technical', skills: skillNames.slice(0, 3), strength: 65, description: 'Primary technical competencies' },
      { name: 'Soft Skills', skills: ['Communication', 'Teamwork', 'Leadership'], strength: 55, description: 'Interpersonal and professional skills' },
      { name: 'Domain Knowledge', skills: data.interests.slice(0, 3), strength: 50, description: 'Industry and domain expertise' },
    ],
    skillGaps: [
      { skill: 'System Design', currentLevel: 30, requiredLevel: 70, priority: 'high', suggestedResources: ['System Design Primer', 'Designing Data-Intensive Applications'] },
      { skill: 'Data Structures', currentLevel: 40, requiredLevel: 80, priority: 'high', suggestedResources: ['LeetCode', 'Cracking the Coding Interview'] },
      { skill: 'Cloud Architecture', currentLevel: 20, requiredLevel: 60, priority: 'medium', suggestedResources: ['AWS Certified Solutions Architect', 'GCP Fundamentals'] },
      { skill: 'Project Management', currentLevel: 25, requiredLevel: 55, priority: 'low', suggestedResources: ['Agile Methodologies', 'Scrum Guide'] },
    ],
    careerAlignmentScore: 55,
    learningVelocityEstimate: data.selfRating.learningSpeed * 10,
    hiringReadiness,
    confidenceIndex,
    dynamicSkillScore: Math.min(1000, Math.round(
      data.skills.reduce((sum, s) => sum + levelScores[s.level], 0) / Math.max(data.skills.length, 1) * 8 + 
      (data.selfRating.problemSolving + data.selfRating.technicalDepth) * 15
    )),
    learningPaths: [
      {
        title: `From Foundations to ${data.academic.field || 'Tech'} Excellence`,
        description: `A comprehensive roadmap to build professional expertise and career momentum`,
        steps: ['Foundation Assessment', 'Core Skills Development', 'Project-Based Learning', 'Industry Certification', 'Portfolio Building'],
        estimatedDuration: '6 months',
        difficulty: 'intermediate',
        relatedSkills: skillNames.slice(0, 3),
      },
      {
        title: 'Interview Readiness Accelerator',
        description: 'Sharpen problem-solving and technical communication for career opportunities',
        steps: ['Data Structures Review', 'Algorithm Practice', 'System Design Basics', 'Mock Interviews', 'Company-Specific Prep'],
        estimatedDuration: '3 months',
        difficulty: 'advanced',
        relatedSkills: ['Problem Solving', 'Data Structures', 'Algorithms'],
      },
      {
        title: 'Professional Impact Toolkit',
        description: 'Develop the interpersonal and communication skills that accelerate career growth',
        steps: ['Communication Workshop', 'Public Speaking Practice', 'Team Collaboration Projects', 'Leadership Exercises'],
        estimatedDuration: '2 months',
        difficulty: 'beginner',
        relatedSkills: ['Communication', 'Leadership', 'Teamwork'],
      },
    ],
    persona: {
      headline: `${challengeLabel} ${decisionLabel.charAt(0).toUpperCase() + decisionLabel.slice(1)} Professional · ${data.academic.field || 'Technology'} Domain`,
      description: `A ${workStyleLabel} problem-solver driven by ${motivationLabel}, with a strong affinity for ${learningLabel}. Demonstrates a ${decisionLabel} approach to challenges and brings ${data.skills.length} tracked technical competencies to the table.`,
      strengths: [
        `Effective ${learningLabel} approach`,
        `${decisionLabel.charAt(0).toUpperCase() + decisionLabel.slice(1)} decision-making style`,
        `${data.skills.length}+ technical skills across ${Array.from(new Set(data.skills.map(s => s.category))).length} categories`,
      ],
      areasForGrowth: [
        'Broader industry exposure and cross-domain thinking',
        'Advanced system design and architecture patterns',
        'Cross-functional collaboration and stakeholder communication',
      ],
      personalityType: `${workStyleLabel.charAt(0).toUpperCase() + workStyleLabel.slice(1)} ${challengeLabel}`,
      careerFit: data.careerGoals.targetIndustries.slice(0, 4),
    },
  };
}
