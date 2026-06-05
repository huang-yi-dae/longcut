'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleFavorite(videoId: string, isFavorite: boolean) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    // First, get the video from video_analyses table using the YouTube ID
    const { data: video, error: videoError } = await supabase
      .from('video_analyses')
      .select('id')
      .eq('youtube_id', videoId)
      .single()

    if (videoError || !video) {
      throw new Error('Video not found')
    }

    // Use upsert to atomically update or insert the favorite status
    const { data, error } = await supabase
      .from('user_videos')
      .upsert({
        user_id: user.id,
        video_id: video.id,
        is_favorite: isFavorite,
        accessed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,video_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, isFavorite: data.is_favorite }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    throw error
  }
}
