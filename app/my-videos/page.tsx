import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VideoGrid } from './video-grid';

// Render per-request (local single-user app; avoids build-time DB queries).
export const dynamic = 'force-dynamic';

export default async function MyVideosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch user's video history, then the related video details. The local
  // SQLite shim does not support Supabase's embedded relationship selects
  // (e.g. `video:video_analyses(*)`), so we join in JS instead.
  const { data: userVideosRaw, error } = await supabase
    .from('user_videos')
    .select('*')
    .eq('user_id', user.id)
    .order('accessed_at', { ascending: false });

  if (error) {
    console.error('Error fetching user videos:', JSON.stringify(error, null, 2));
    console.error('Error details:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
  }

  const rawList: any[] = userVideosRaw ?? [];
  const videoIds = rawList.map((uv: any) => uv.video_id).filter(Boolean);
  const videoMap: Record<string, any> = {};
  if (videoIds.length > 0) {
    const { data: videos } = await supabase
      .from('video_analyses')
      .select('*')
      .in('id', videoIds);
    for (const v of videos ?? []) videoMap[v.id] = v;
  }
  const userVideos = rawList.map((uv: any) => ({ ...uv, video: videoMap[uv.video_id] ?? null }));

  // Fetch user's favorite folders
  const { data: folders } = await supabase
    .from('favorite_folders')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Videos</h1>
        <p className="text-muted-foreground">
          Your analyzed videos are saved here. Click on any video to continue where you left off.
        </p>
      </div>

      {userVideos && userVideos.length > 0 ? (
        <VideoGrid videos={userVideos} folders={folders || []} />
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            You haven&apos;t analyzed any videos yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Analyze Your First Video
          </Link>
        </div>
      )}
    </div>
  );
}
