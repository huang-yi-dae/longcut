-- Add favorite folders support: users can organize favorites into named folders
--
-- favorite_folders: user-owned folders (each user can create multiple folders)
-- user_videos.folder_id: links a favorited video to a specific folder (nullable = unfiled)

-- 1. Create favorite_folders table
CREATE TABLE IF NOT EXISTS public.favorite_folders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, name)
);

-- 2. Add folder_id to user_videos
ALTER TABLE public.user_videos
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.favorite_folders(id) ON DELETE SET NULL;

-- 3. Default folder: create one for each existing user
INSERT INTO public.favorite_folders (user_id, name)
SELECT id, '默认收藏夹'
FROM auth.users
ON CONFLICT (user_id, name) DO NOTHING;

-- 4. RLS: users can only access their own folders
ALTER TABLE public.favorite_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
    ON public.favorite_folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
    ON public.favorite_folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
    ON public.favorite_folders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
    ON public.favorite_folders FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Grant permissions
GRANT ALL ON public.favorite_folders TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;
