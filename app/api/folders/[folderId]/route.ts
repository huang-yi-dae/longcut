import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { withSecurity } from '@/lib/security-middleware';
import { RATE_LIMITS } from '@/lib/rate-limiter';
import { formatValidationError } from '@/lib/validation';

const renameFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(50, 'Folder name too long')
});

async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const folderId = pathParts[pathParts.length - 1];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('favorite_folders')
      .select('id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (req.method === 'PATCH') {
      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      let validated;
      try {
        validated = renameFolderSchema.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation failed', details: formatValidationError(error) },
            { status: 400 }
          );
        }
        throw error;
      }

      const { name } = validated;
      const { data: folder, error } = await supabase
        .from('favorite_folders')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', folderId)
        .select('id, name, created_at')
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Folder name already exists' }, { status: 409 });
        }
        throw error;
      }

      return NextResponse.json({ folder });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('favorite_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Error handling folder:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export const PATCH = withSecurity(handler, {
  requireAuth: true,
  rateLimit: RATE_LIMITS.AUTH_GENERATION,
  maxBodySize: 1024,
  allowedMethods: ['PATCH']
});

export const DELETE = withSecurity(handler, {
  requireAuth: true,
  rateLimit: RATE_LIMITS.AUTH_GENERATION,
  allowedMethods: ['DELETE']
});
