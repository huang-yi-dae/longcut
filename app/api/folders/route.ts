import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { withSecurity } from '@/lib/security-middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { formatValidationError } from '@/lib/validation';

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(50, 'Folder name too long')
});

async function handleGET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: folders, error } = await supabase
      .from('favorite_folders')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ folders: folders || [] });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { name } = createFolderSchema.parse(body);

    const { data: folder, error } = await supabase
      .from('favorite_folders')
      .insert({ user_id: user.id, name })
      .select('id, name, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Folder name already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatValidationError(error) },
        { status: 400 }
      );
    }
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

export const GET = withSecurity(handleGET, {
  requireAuth: true,
  rateLimit: RATE_LIMITS.AUTH_GENERATION,
  allowedMethods: ['GET']
});

export const POST = withSecurity(handlePOST, {
  requireAuth: true,
  rateLimit: RATE_LIMITS.AUTH_GENERATION,
  maxBodySize: 1024,
  allowedMethods: ['POST']
});
