import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withSecurity, SECURITY_PRESETS } from '@/lib/security-middleware';

interface UpdateResult {
  success: boolean;
  video_id: string | null;
}

async function handler(req: NextRequest) {
  try {
    const {
      videoId,
      summary,
      suggestedQuestions
    } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user (required by SECURITY_PRESETS.AUTHENTICATED)
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Local deployment: update the cached analysis directly (no remote RPC).
    const { data: updated, error: updateError } = await supabase
      .from('video_analyses')
      .update({
        summary: summary ?? null,
        suggested_questions: suggestedQuestions ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('youtube_id', videoId)
      .select('id')
      .maybeSingle();

    const result: UpdateResult | null = updated
      ? { success: true, video_id: (updated as { id: string }).id }
      : null;

    if (updateError) {
      console.error('Error updating video analysis:', updateError);
      return NextResponse.json(
        { error: 'Failed to update video analysis' },
        { status: 500 }
      );
    }

    // Check if update was authorized
    if (!result?.success) {
      return NextResponse.json(
        { error: 'Not authorized to update this video analysis' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      videoId: result.video_id
    });

  } catch (error) {
    console.error('Error in update video analysis:', error);
    return NextResponse.json(
      { error: 'Failed to process update request' },
      { status: 500 }
    );
  }
}

// Require authentication and CSRF protection for state-changing operations
export const POST = withSecurity(handler, SECURITY_PRESETS.AUTHENTICATED);
