'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FavoriteFolder = {
  id: string
  name: string
  created_at: string
}

/** Get all folders for current user */
export async function getFolders(): Promise<FavoriteFolder[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('favorite_folders')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching folders:', error)
    return []
  }
  return data || []
}

/** Create a new folder */
export async function createFolder(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 50) {
    throw new Error('Folder name must be 1-50 characters')
  }

  const { data, error } = await supabase
    .from('favorite_folders')
    .insert({ user_id: user.id, name: trimmed })
    .select('id, name, created_at')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Folder name already exists')
    throw error
  }

  revalidatePath('/my-videos')
  return { folder: data }
}

/** Rename a folder */
export async function renameFolder(folderId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 50) {
    throw new Error('Folder name must be 1-50 characters')
  }

  const { error } = await supabase
    .from('favorite_folders')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', folderId)
    .eq('user_id', user.id)

  if (error) {
    if (error.code === '23505') throw new Error('Folder name already exists')
    throw error
  }

  revalidatePath('/my-videos')
  return { success: true }
}

/** Delete a folder */
export async function deleteFolder(folderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { error } = await supabase
    .from('favorite_folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath('/my-videos')
  return { success: true }
}

/** Move a video to a different folder */
export async function moveToFolder(videoId: string, folderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  // Get video from video_analyses
  const { data: video } = await supabase
    .from('video_analyses')
    .select('id')
    .eq('youtube_id', videoId)
    .single()

  if (!video) throw new Error('Video not found')

  const { error } = await supabase
    .from('user_videos')
    .upsert({
      user_id: user.id,
      video_id: video.id,
      folder_id: folderId,
      is_favorite: true,
      accessed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,video_id'
    })

  if (error) throw error

  revalidatePath('/my-videos')
  return { success: true }
}
