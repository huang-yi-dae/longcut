'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleFavorite(videoId: string, isFavorite: boolean, folderId?: string | null) {
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

    // Build upsert payload
    const upsertPayload: Record<string, unknown> = {
      user_id: user.id,
      video_id: video.id,
      is_favorite: isFavorite,
      accessed_at: new Date().toISOString()
    }

    // When favoriting: set folder_id (default folder if not specified)
    if (isFavorite) {
      if (folderId) {
        upsertPayload.folder_id = folderId
      } else {
        const { data: defaultFolder } = await supabase
          .from('favorite_folders')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', '默认收藏夹')
          .single()
        if (defaultFolder) {
          upsertPayload.folder_id = defaultFolder.id
        }
      }
    } else {
      upsertPayload.folder_id = null
    }

    const { data, error } = await supabase
      .from('user_videos')
      .upsert(upsertPayload, {
        onConflict: 'user_id,video_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, isFavorite: data.is_favorite, folderId: data.folder_id }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    throw error
  }
}
