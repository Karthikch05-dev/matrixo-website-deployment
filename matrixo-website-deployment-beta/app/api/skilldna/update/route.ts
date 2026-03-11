// ============================================================
// SkillDNA™ Delta Update API Route
// POST /api/skilldna/update
// Performs incremental SkillDNA profile recalculation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { performDeltaUpdate } from '@/lib/skilldna/ai-engine';
import { recalculateAfterAssessment, calculateDynamicSkillScore } from '@/lib/skilldna/scoring';
import { DeltaUpdateRequest, SkillDNAProfile, Assessment } from '@/lib/skilldna/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, currentProfile, trigger, newData } = body;

    if (!userId || !currentProfile || !trigger) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, currentProfile, trigger' },
        { status: 400 }
      );
    }

    let result;

    // For assessment completions, use local scoring first
    if (trigger === 'assessment_completed' && newData?.assessment) {
      const localUpdates = recalculateAfterAssessment(
        currentProfile as SkillDNAProfile,
        newData.assessment as Assessment
      );

      result = {
        updatedFields: localUpdates,
        newDynamicSkillScore: localUpdates.dynamicSkillScore || currentProfile.dynamicSkillScore,
        changelog: ['Profile updated based on assessment results'],
      };
    } else {
      // For other triggers, use AI delta update
      const deltaRequest: DeltaUpdateRequest = {
        userId,
        currentProfile,
        trigger,
        newData: newData || {},
      };

      result = await performDeltaUpdate(deltaRequest, apiKey);
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('SkillDNA Update API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Update failed',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
