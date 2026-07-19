'use server'

import { createClient } from '@/lib/supabase/server'
import { LOCAL_USER_ID } from '@/lib/local-user'

export interface UpdateProfileResult {
  success: boolean
  error?: string
}

/**
 * Persists profile edits (full name) to the local SQLite backend.
 * Local deployment has a single fixed user, so we write against LOCAL_USER_ID.
 */
export async function updateProfileAction(fullName: string): Promise<UpdateProfileResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', LOCAL_USER_ID)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
