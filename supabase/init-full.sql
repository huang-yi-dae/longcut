-- ============================================================================
-- LongCut Full Database Initialization
-- ============================================================================
-- Combines all migrations in order + fixes the missing auth trigger
-- Run this in Supabase SQL Editor on a fresh database
-- ============================================================================


-- ============================================================================
-- PART 1: Initial Schema (from 20241107000000_initial_schema.sql)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    free_generations_used integer DEFAULT 0 NOT NULL,
    topic_generation_mode text DEFAULT 'smart'::text NOT NULL,
    stripe_customer_id text,
    subscription_tier text DEFAULT 'free'::text NOT NULL,
    stripe_subscription_id text,
    subscription_status text,
    subscription_current_period_start timestamp with time zone,
    subscription_current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    topup_credits integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT profiles_topic_generation_mode_check CHECK (topic_generation_mode IN ('smart', 'fast')),
    CONSTRAINT profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'basic', 'premium')),
    CONSTRAINT profiles_topup_credits_check CHECK (topup_credits >= 0)
);

-- Table: video_analyses
CREATE TABLE IF NOT EXISTS public.video_analyses (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    youtube_id text UNIQUE NOT NULL,
    title text NOT NULL,
    author text,
    duration integer NOT NULL,
    thumbnail_url text,
    transcript jsonb NOT NULL,
    topics jsonb,
    summary jsonb,
    suggested_questions jsonb,
    model_used text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: user_videos
CREATE TABLE IF NOT EXISTS public.user_videos (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_id uuid NOT NULL REFERENCES public.video_analyses(id) ON DELETE CASCADE,
    accessed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_favorite boolean DEFAULT false NOT NULL,
    notes text,
    CONSTRAINT user_videos_user_video_unique UNIQUE (user_id, video_id)
);

-- Table: user_notes
CREATE TABLE IF NOT EXISTS public.user_notes (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id uuid NOT NULL REFERENCES public.video_analyses(id) ON DELETE CASCADE,
    source text NOT NULL,
    source_id text,
    note_text text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_notes_source_check CHECK (source IN ('chat', 'takeaways', 'transcript', 'custom'))
);

-- Table: rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    key text NOT NULL,
    identifier text NOT NULL,
    timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: video_generations
CREATE TABLE IF NOT EXISTS public.video_generations (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    identifier text NOT NULL,
    youtube_id text NOT NULL,
    video_id uuid REFERENCES public.video_analyses(id) ON DELETE SET NULL,
    counted_toward_limit boolean DEFAULT true NOT NULL,
    subscription_tier text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    resource_type text,
    resource_id text,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: topup_purchases
CREATE TABLE IF NOT EXISTS public.topup_purchases (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id text UNIQUE NOT NULL,
    credits_purchased integer NOT NULL,
    amount_paid integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: stripe_events
CREATE TABLE IF NOT EXISTS public.stripe_events (
    event_id text PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_video_analyses_youtube_id ON public.video_analyses(youtube_id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_created_at ON public.video_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_user_videos_user_id ON public.user_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_video_id ON public.user_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_is_favorite ON public.user_videos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_videos_accessed_at ON public.user_videos(accessed_at);
CREATE INDEX IF NOT EXISTS user_notes_user_video_idx ON public.user_notes(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON public.user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_video_id ON public.user_notes(video_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_source ON public.user_notes(source);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON public.rate_limits(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_timestamp ON public.rate_limits(key, timestamp);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON public.video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_identifier ON public.video_generations(identifier);
CREATE INDEX IF NOT EXISTS idx_video_generations_youtube_id ON public.video_generations(youtube_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_created_at ON public.video_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_created ON public.video_generations(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_topup_purchases_user_id ON public.topup_purchases(user_id);

-- Functions: updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = timezone('utc'::text, now()); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_set_user_notes_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = timezone('utc'::text, now()); RETURN NEW; END;
$$;

-- Function: cleanup_old_rate_limits
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM public.rate_limits WHERE timestamp < (now() - interval '24 hours'); END;
$$;

-- Function: handle_new_user (auto-create profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

-- Function: consume_topup_credit (updated version from Phase 4)
CREATE OR REPLACE FUNCTION public.consume_topup_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated integer;
BEGIN
  UPDATE public.profiles SET topup_credits = topup_credits - 1
  WHERE id = p_user_id AND topup_credits > 0;
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_topup_credit(uuid) TO authenticated, service_role;

-- Function: increment_topup_credits (updated version from Phase 4)
CREATE OR REPLACE FUNCTION public.increment_topup_credits(
  p_user_id uuid, p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE NOTICE 'increment_topup_credits called with non-positive amount: %', p_amount;
    RETURN;
  END IF;
  UPDATE public.profiles SET topup_credits = GREATEST(topup_credits + p_amount, 0)
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_topup_credits(uuid, integer) TO authenticated, service_role;

-- Function: get_usage_breakdown (updated version from Phase 4)
CREATE OR REPLACE FUNCTION public.get_usage_breakdown(
  p_user_id uuid, p_start timestamptz, p_end timestamptz
)
RETURNS TABLE (subscription_tier text, counted integer, cached integer)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT subscription_tier,
    COUNT(*) FILTER (WHERE counted_toward_limit) AS counted,
    COUNT(*) FILTER (WHERE NOT counted_toward_limit) AS cached
  FROM public.video_generations
  WHERE user_id = p_user_id AND created_at >= p_start AND created_at < p_end
  GROUP BY subscription_tier;
$$;

GRANT EXECUTE ON FUNCTION public.get_usage_breakdown(uuid, timestamptz, timestamptz) TO authenticated, service_role;

-- Function: upsert_video_analysis_with_user_link (will be updated later by language migration)
CREATE OR REPLACE FUNCTION public.upsert_video_analysis_with_user_link(
    p_youtube_id text, p_title text, p_author text, p_duration integer,
    p_thumbnail_url text, p_transcript jsonb, p_topics jsonb, p_summary jsonb,
    p_suggested_questions jsonb, p_model_used text, p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_video_id uuid;
BEGIN
    INSERT INTO public.video_analyses (
        youtube_id, title, author, duration, thumbnail_url,
        transcript, topics, summary, suggested_questions, model_used
    ) VALUES (
        p_youtube_id, p_title, p_author, p_duration, p_thumbnail_url,
        p_transcript, p_topics, p_summary, p_suggested_questions, p_model_used
    )
    ON CONFLICT (youtube_id) DO UPDATE SET
        topics = COALESCE(EXCLUDED.topics, video_analyses.topics),
        summary = COALESCE(EXCLUDED.summary, video_analyses.summary),
        suggested_questions = COALESCE(EXCLUDED.suggested_questions, video_analyses.suggested_questions),
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_video_id;

    IF p_user_id IS NOT NULL THEN
        INSERT INTO public.user_videos (user_id, video_id, accessed_at)
        VALUES (p_user_id, v_video_id, timezone('utc'::text, now()))
        ON CONFLICT (user_id, video_id) DO UPDATE SET
            accessed_at = timezone('utc'::text, now());
    END IF;
    RETURN v_video_id;
END;
$$;

-- Triggers (on public tables)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_analyses_updated_at ON public.video_analyses;
CREATE TRIGGER update_video_analyses_updated_at
    BEFORE UPDATE ON public.video_analyses FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_user_notes_updated_at ON public.user_notes;
CREATE TRIGGER set_user_notes_updated_at
    BEFORE UPDATE ON public.user_notes FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_user_notes_updated_at();

-- *** THE MISSING TRIGGER - This was commented out in the original migration! ***
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS: Enable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- RLS: profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access to profiles" ON public.profiles FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS: video_analyses
CREATE POLICY "Anyone can view video analyses" ON public.video_analyses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert video analyses" ON public.video_analyses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update video analyses" ON public.video_analyses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Service role full access to video_analyses" ON public.video_analyses FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS: user_videos
CREATE POLICY "Users can view own video history" ON public.user_videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own video history" ON public.user_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own video history" ON public.user_videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own video history" ON public.user_videos FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to user_videos" ON public.user_videos FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS: user_notes
CREATE POLICY "Users can view own notes" ON public.user_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.user_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.user_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.user_notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to user_notes" ON public.user_notes FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS: rate_limits
CREATE POLICY "Anyone can read rate limits" ON public.rate_limits FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rate limits" ON public.rate_limits FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can delete rate limits" ON public.rate_limits FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

-- RLS: video_generations (service role only from initial, user policies added by Phase 4 below)
CREATE POLICY "Service role full access to video_generations" ON public.video_generations FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS: audit_logs
CREATE POLICY "Service role full access to audit_logs" ON public.audit_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS: topup_purchases
CREATE POLICY "Service role full access to topup_purchases" ON public.topup_purchases FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS: stripe_events
CREATE POLICY "Service role full access to stripe_events" ON public.stripe_events FOR ALL USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- PART 2: Phase 4 Backend Updates (20251101120000)
-- Adds user-level RLS policies for video_generations and topup_purchases
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_generations' AND policyname = 'video_generations_select_own') THEN
    CREATE POLICY video_generations_select_own ON public.video_generations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_generations' AND policyname = 'video_generations_insert_own') THEN
    CREATE POLICY video_generations_insert_own ON public.video_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_generations' AND policyname = 'video_generations_update_own') THEN
    CREATE POLICY video_generations_update_own ON public.video_generations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'topup_purchases' AND policyname = 'topup_purchases_select_own') THEN
    CREATE POLICY topup_purchases_select_own ON public.topup_purchases FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Additional indexes from Phase 4
CREATE INDEX IF NOT EXISTS idx_stripe_events_created_at ON public.stripe_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_generations_user_created_at ON public.video_generations(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_video_generations_identifier_created_at ON public.video_generations(identifier, created_at);
CREATE INDEX IF NOT EXISTS idx_topup_purchases_user_created_at ON public.topup_purchases(user_id, created_at);


-- ============================================================================
-- PART 3: Atomic Credit Consumption (20251101120002)
-- ============================================================================

CREATE OR REPLACE FUNCTION consume_video_credit_atomically(
  p_user_id uuid, p_youtube_id text, p_identifier text, p_subscription_tier text,
  p_base_limit integer, p_period_start timestamptz, p_period_end timestamptz,
  p_video_id uuid DEFAULT NULL, p_counted boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_counted_usage integer; v_topup_credits integer; v_base_remaining integer;
  v_total_remaining integer; v_generation_id uuid; v_used_topup boolean := false;
  v_existing_generation_id uuid;
BEGIN
  SELECT topup_credits INTO v_topup_credits FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'NO_SUBSCRIPTION', 'error', 'Profile not found');
  END IF;

  IF p_counted THEN
    SELECT id INTO v_existing_generation_id FROM video_generations
    WHERE user_id = p_user_id AND youtube_id = p_youtube_id
      AND created_at >= p_period_start AND created_at <= p_period_end AND counted_toward_limit = true
    LIMIT 1;
    IF v_existing_generation_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_counted_usage FROM video_generations
      WHERE user_id = p_user_id AND created_at >= p_period_start AND created_at <= p_period_end AND counted_toward_limit = true;
      v_base_remaining := GREATEST(0, p_base_limit - v_counted_usage);
      v_total_remaining := v_base_remaining + v_topup_credits;
      RETURN jsonb_build_object('allowed', true, 'reason', 'ALREADY_COUNTED', 'generation_id', v_existing_generation_id, 'used_topup', false, 'deduplicated', true, 'base_remaining', v_base_remaining, 'topup_remaining', v_topup_credits, 'total_remaining', v_total_remaining);
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_counted_usage FROM video_generations
  WHERE user_id = p_user_id AND created_at >= p_period_start AND created_at <= p_period_end AND counted_toward_limit = true;
  v_base_remaining := GREATEST(0, p_base_limit - v_counted_usage);
  v_total_remaining := v_base_remaining + v_topup_credits;

  IF p_counted AND v_total_remaining <= 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'LIMIT_REACHED', 'base_remaining', v_base_remaining, 'topup_remaining', v_topup_credits, 'total_remaining', v_total_remaining);
  END IF;

  INSERT INTO video_generations (user_id, identifier, youtube_id, video_id, counted_toward_limit, subscription_tier)
  VALUES (p_user_id, p_identifier, p_youtube_id, p_video_id, p_counted, p_subscription_tier)
  RETURNING id INTO v_generation_id;

  IF p_counted THEN
    IF v_base_remaining <= 0 AND v_topup_credits > 0 THEN
      UPDATE profiles SET topup_credits = topup_credits - 1 WHERE id = p_user_id AND topup_credits > 0;
      IF FOUND THEN v_used_topup := true; v_topup_credits := v_topup_credits - 1; END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'reason', 'OK', 'generation_id', v_generation_id, 'used_topup', v_used_topup, 'deduplicated', false, 'base_remaining', GREATEST(0, v_base_remaining - (CASE WHEN p_counted AND NOT v_used_topup THEN 1 ELSE 0 END)), 'topup_remaining', v_topup_credits, 'total_remaining', v_total_remaining - (CASE WHEN p_counted THEN 1 ELSE 0 END));
END;
$$;

GRANT EXECUTE ON FUNCTION consume_video_credit_atomically TO authenticated, service_role;

CREATE OR REPLACE FUNCTION check_video_generation_allowed(
  p_user_id uuid, p_base_limit integer, p_period_start timestamptz, p_period_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_counted_usage integer; v_topup_credits integer; v_base_remaining integer; v_total_remaining integer; v_will_consume_topup boolean;
BEGIN
  SELECT topup_credits INTO v_topup_credits FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('allowed', false, 'reason', 'NO_SUBSCRIPTION'); END IF;
  SELECT COUNT(*) INTO v_counted_usage FROM video_generations
  WHERE user_id = p_user_id AND created_at >= p_period_start AND created_at <= p_period_end AND counted_toward_limit = true;
  v_base_remaining := GREATEST(0, p_base_limit - v_counted_usage);
  v_total_remaining := v_base_remaining + v_topup_credits;
  v_will_consume_topup := (v_base_remaining <= 0 AND v_topup_credits > 0);
  RETURN jsonb_build_object('allowed', v_total_remaining > 0, 'reason', CASE WHEN v_total_remaining > 0 THEN 'OK' ELSE 'LIMIT_REACHED' END, 'base_remaining', v_base_remaining, 'topup_remaining', v_topup_credits, 'total_remaining', v_total_remaining, 'will_consume_topup', v_will_consume_topup);
END;
$$;

GRANT EXECUTE ON FUNCTION check_video_generation_allowed TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_video_generations_user_youtube_period ON video_generations(user_id, youtube_id, created_at) WHERE counted_toward_limit = true;


-- ============================================================================
-- PART 4: Image Generation Limits (20251123090000)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.image_generations (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_id text NOT NULL,
  video_id uuid REFERENCES public.video_analyses(id) ON DELETE SET NULL,
  counted_toward_limit boolean DEFAULT true NOT NULL,
  subscription_tier text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON public.image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_youtube_id ON public.image_generations(youtube_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_created_at ON public.image_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_generations_user_created ON public.image_generations(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.consume_image_credit_atomically(
  p_user_id uuid, p_youtube_id text, p_subscription_tier text, p_base_limit integer,
  p_period_start timestamptz, p_period_end timestamptz, p_video_id uuid DEFAULT NULL, p_counted boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_counted_usage integer; v_base_remaining integer; v_generation_id uuid;
BEGIN
  PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('allowed', false, 'reason', 'NO_SUBSCRIPTION', 'error', 'Profile not found'); END IF;
  SELECT COUNT(*) INTO v_counted_usage FROM image_generations
  WHERE user_id = p_user_id AND created_at >= p_period_start AND created_at < p_period_end AND counted_toward_limit = true;
  v_base_remaining := GREATEST(0, p_base_limit - v_counted_usage);
  IF p_counted AND v_base_remaining <= 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'LIMIT_REACHED', 'base_remaining', v_base_remaining);
  END IF;
  INSERT INTO image_generations (user_id, youtube_id, video_id, counted_toward_limit, subscription_tier)
  VALUES (p_user_id, p_youtube_id, p_video_id, p_counted, p_subscription_tier) RETURNING id INTO v_generation_id;
  RETURN jsonb_build_object('allowed', true, 'reason', 'OK', 'generation_id', v_generation_id, 'base_remaining', CASE WHEN p_counted THEN GREATEST(0, v_base_remaining - 1) ELSE v_base_remaining END);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_image_credit_atomically(uuid, text, text, integer, timestamptz, timestamptz, uuid, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_image_generation_allowed(
  p_user_id uuid, p_base_limit integer, p_period_start timestamptz, p_period_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_counted_usage integer; v_base_remaining integer;
BEGIN
  SELECT COUNT(*) INTO v_counted_usage FROM image_generations
  WHERE user_id = p_user_id AND created_at >= p_period_start AND created_at < p_period_end AND counted_toward_limit = true;
  v_base_remaining := GREATEST(0, p_base_limit - v_counted_usage);
  RETURN jsonb_build_object('allowed', v_base_remaining > 0, 'reason', CASE WHEN v_base_remaining > 0 THEN 'OK' ELSE 'LIMIT_REACHED' END, 'base_remaining', v_base_remaining);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_image_generation_allowed(uuid, integer, timestamptz, timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_image_usage_breakdown(p_user_id uuid, p_start timestamptz, p_end timestamptz)
RETURNS TABLE (subscription_tier text, counted integer)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT subscription_tier, COUNT(*) FILTER (WHERE counted_toward_limit) AS counted
  FROM image_generations WHERE user_id = p_user_id AND created_at >= p_start AND created_at < p_end GROUP BY subscription_tier;
$$;

GRANT EXECUTE ON FUNCTION public.get_image_usage_breakdown(uuid, timestamptz, timestamptz) TO authenticated, service_role;

ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'image_generations' AND policyname = 'image_generations_select_own') THEN
    CREATE POLICY image_generations_select_own ON public.image_generations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'image_generations' AND policyname = 'image_generations_insert_own') THEN
    CREATE POLICY image_generations_insert_own ON public.image_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;


-- ============================================================================
-- PART 5: Analytics Dashboard (20251202120000)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_summary AS
WITH user_daily_activity AS (
  SELECT user_id, DATE(accessed_at) as activity_date, COUNT(*) as video_accesses FROM user_videos WHERE user_id IS NOT NULL AND accessed_at IS NOT NULL GROUP BY user_id, DATE(accessed_at)
  UNION ALL
  SELECT user_id, DATE(created_at) as activity_date, COUNT(*) as generations FROM video_generations WHERE user_id IS NOT NULL GROUP BY user_id, DATE(created_at)
  UNION ALL
  SELECT user_id, DATE(created_at) as activity_date, COUNT(*) as notes_created FROM user_notes WHERE user_id IS NOT NULL GROUP BY user_id, DATE(created_at)
  UNION ALL
  SELECT user_id, DATE(created_at) as activity_date, COUNT(*) as actions FROM audit_logs WHERE user_id IS NOT NULL GROUP BY user_id, DATE(created_at)
)
SELECT user_id, activity_date, SUM(video_accesses) as total_activity_count, MAX(activity_date) as last_active_date FROM user_daily_activity GROUP BY user_id, activity_date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_summary_user_date ON user_activity_summary(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_summary_date ON user_activity_summary(activity_date);

CREATE MATERIALIZED VIEW IF NOT EXISTS user_growth_metrics AS
WITH daily_signups AS (SELECT DATE(created_at) as signup_date, COUNT(*) as new_users, COUNT(*) FILTER (WHERE subscription_tier = 'free') as new_free_users, COUNT(*) FILTER (WHERE subscription_tier = 'pro') as new_pro_users FROM profiles WHERE created_at IS NOT NULL GROUP BY DATE(created_at)),
cumulative_totals AS (SELECT signup_date, new_users, new_free_users, new_pro_users, SUM(new_users) OVER (ORDER BY signup_date) as total_users, SUM(new_free_users) OVER (ORDER BY signup_date) as total_free_users, SUM(new_pro_users) OVER (ORDER BY signup_date) as total_pro_users FROM daily_signups)
SELECT signup_date as date, new_users, new_free_users, new_pro_users, total_users, total_free_users, total_pro_users, CASE WHEN total_users > 0 THEN (new_pro_users::numeric / new_users::numeric) * 100 ELSE 0 END as daily_conversion_rate FROM cumulative_totals ORDER BY signup_date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_growth_metrics_date ON user_growth_metrics(date);

CREATE MATERIALIZED VIEW IF NOT EXISTS revenue_metrics AS
WITH daily_subscriptions AS (SELECT DATE(COALESCE(subscription_current_period_start, created_at)) as date, COUNT(*) FILTER (WHERE subscription_status = 'active' AND subscription_tier = 'pro') as active_pro_subscriptions, COUNT(*) FILTER (WHERE subscription_status = 'canceled' AND subscription_tier = 'pro') as canceled_subscriptions, COUNT(*) FILTER (WHERE subscription_status = 'past_due') as past_due_subscriptions FROM profiles WHERE subscription_current_period_start IS NOT NULL OR (subscription_tier = 'pro' AND created_at IS NOT NULL) GROUP BY DATE(COALESCE(subscription_current_period_start, created_at))),
daily_topups AS (SELECT DATE(created_at) as date, COUNT(*) as topup_count, SUM(amount_paid) as topup_revenue_cents, SUM(credits_purchased) as credits_sold FROM topup_purchases GROUP BY DATE(created_at)),
subscription_prices AS (SELECT 1000 as pro_price_cents)
SELECT COALESCE(s.date, t.date) as date, COALESCE(s.active_pro_subscriptions, 0) as active_subscriptions, COALESCE(s.canceled_subscriptions, 0) as canceled_subscriptions, COALESCE(s.past_due_subscriptions, 0) as past_due_subscriptions, COALESCE(s.active_pro_subscriptions, 0) * sp.pro_price_cents as mrr_cents, COALESCE(t.topup_count, 0) as topup_count, COALESCE(t.topup_revenue_cents, 0) as topup_revenue_cents, COALESCE(t.credits_sold, 0) as credits_sold, (COALESCE(s.active_pro_subscriptions, 0) * sp.pro_price_cents + COALESCE(t.topup_revenue_cents, 0)) as total_revenue_cents FROM daily_subscriptions s FULL OUTER JOIN daily_topups t ON s.date = t.date CROSS JOIN subscription_prices sp ORDER BY COALESCE(s.date, t.date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_metrics_date ON revenue_metrics(date);

CREATE MATERIALIZED VIEW IF NOT EXISTS video_usage_metrics AS
WITH daily_generations AS (SELECT DATE(created_at) as date, COUNT(*) as total_generations, COUNT(DISTINCT user_id) as unique_users, COUNT(*) FILTER (WHERE counted_toward_limit = true) as counted_generations, COUNT(*) FILTER (WHERE counted_toward_limit = false) as cached_generations, COUNT(*) FILTER (WHERE subscription_tier = 'free') as free_tier_generations, COUNT(*) FILTER (WHERE subscription_tier = 'pro') as pro_tier_generations FROM video_generations GROUP BY DATE(created_at)),
popular_videos AS (SELECT vg.youtube_id, COUNT(*) as generation_count, va.title, va.author, va.duration FROM video_generations vg LEFT JOIN video_analyses va ON vg.video_id = va.id GROUP BY vg.youtube_id, va.title, va.author, va.duration ORDER BY generation_count DESC LIMIT 100)
SELECT dg.*, (SELECT json_agg(pv.* ORDER BY pv.generation_count DESC) FROM popular_videos pv) as popular_videos_json FROM daily_generations dg ORDER BY dg.date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_usage_metrics_date ON video_usage_metrics(date);

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_growth_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY revenue_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY video_usage_metrics;
  RAISE NOTICE 'All analytics materialized views refreshed successfully at %', NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO authenticated;


-- ============================================================================
-- PART 6: Language Columns (20251210120000)
-- ============================================================================

ALTER TABLE public.video_analyses ADD COLUMN IF NOT EXISTS language text;
ALTER TABLE public.video_analyses ADD COLUMN IF NOT EXISTS available_languages jsonb;
CREATE INDEX IF NOT EXISTS idx_video_analyses_language ON public.video_analyses(language);

-- Replace upsert function with language support
CREATE OR REPLACE FUNCTION public.upsert_video_analysis_with_user_link(
    p_youtube_id text, p_title text, p_author text, p_duration integer,
    p_thumbnail_url text, p_transcript jsonb, p_topics jsonb, p_summary jsonb,
    p_suggested_questions jsonb, p_model_used text, p_user_id uuid DEFAULT NULL,
    p_language text DEFAULT NULL, p_available_languages jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_video_id uuid;
BEGIN
    INSERT INTO public.video_analyses (
        youtube_id, title, author, duration, thumbnail_url,
        transcript, topics, summary, suggested_questions, model_used,
        language, available_languages
    ) VALUES (
        p_youtube_id, p_title, p_author, p_duration, p_thumbnail_url,
        p_transcript, p_topics, p_summary, p_suggested_questions, p_model_used,
        p_language, p_available_languages
    )
    ON CONFLICT (youtube_id) DO UPDATE SET
        transcript = COALESCE(EXCLUDED.transcript, video_analyses.transcript),
        topics = COALESCE(EXCLUDED.topics, video_analyses.topics),
        summary = COALESCE(EXCLUDED.summary, video_analyses.summary),
        suggested_questions = COALESCE(EXCLUDED.suggested_questions, video_analyses.suggested_questions),
        language = COALESCE(EXCLUDED.language, video_analyses.language),
        available_languages = COALESCE(EXCLUDED.available_languages, video_analyses.available_languages),
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_video_id;

    IF p_user_id IS NOT NULL THEN
        INSERT INTO public.user_videos (user_id, video_id, accessed_at)
        VALUES (p_user_id, v_video_id, timezone('utc'::text, now()))
        ON CONFLICT (user_id, video_id) DO UPDATE SET accessed_at = timezone('utc'::text, now());
    END IF;
    RETURN v_video_id;
END;
$$;


-- ============================================================================
-- PART 7: Newsletter Subscription (20251211185543)
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT true;
UPDATE public.profiles SET newsletter_subscribed = true WHERE newsletter_subscribed IS NULL;


-- ============================================================================
-- PART 8: Security Ownership (20251214185226)
-- ============================================================================

ALTER TABLE public.video_analyses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_created_by ON public.video_analyses(created_by);

-- insert_video_analysis_server (latest version with exception handling from 20260221120000)
CREATE OR REPLACE FUNCTION public.insert_video_analysis_server(
    p_youtube_id text, p_title text, p_author text, p_duration integer,
    p_thumbnail_url text, p_transcript jsonb, p_topics jsonb,
    p_summary jsonb DEFAULT NULL, p_suggested_questions jsonb DEFAULT NULL,
    p_model_used text DEFAULT NULL, p_user_id uuid DEFAULT NULL,
    p_language text DEFAULT NULL, p_available_languages jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_video_id uuid; v_existing_id uuid;
BEGIN
    SELECT id INTO v_existing_id FROM public.video_analyses WHERE youtube_id = p_youtube_id;
    IF v_existing_id IS NULL THEN
        INSERT INTO public.video_analyses (
            youtube_id, title, author, duration, thumbnail_url,
            transcript, topics, summary, suggested_questions, model_used,
            language, available_languages, created_by
        ) VALUES (
            p_youtube_id, p_title, p_author, p_duration, p_thumbnail_url,
            p_transcript, p_topics, p_summary, p_suggested_questions, p_model_used,
            p_language, p_available_languages, p_user_id
        ) RETURNING id INTO v_video_id;
    ELSE
        UPDATE public.video_analyses SET
            transcript = COALESCE(p_transcript, transcript),
            topics = COALESCE(p_topics, topics),
            summary = COALESCE(p_summary, summary),
            suggested_questions = COALESCE(p_suggested_questions, suggested_questions),
            language = COALESCE(p_language, language),
            available_languages = COALESCE(p_available_languages, available_languages),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_existing_id;
        v_video_id := v_existing_id;
    END IF;

    IF p_user_id IS NOT NULL THEN
        BEGIN
            INSERT INTO public.user_videos (user_id, video_id, accessed_at)
            VALUES (p_user_id, v_video_id, timezone('utc'::text, now()))
            ON CONFLICT (user_id, video_id) DO UPDATE SET accessed_at = timezone('utc'::text, now());
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE WARNING 'user_videos FK failed for user % on video % — skipping link', p_user_id, v_video_id;
        END;
    END IF;
    RETURN v_video_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_video_analysis_server TO authenticated, anon;

-- update_video_analysis_secure (fixed version from 20260116120000)
DROP FUNCTION IF EXISTS public.update_video_analysis_secure(text, uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.update_video_analysis_secure(text, uuid, jsonb, jsonb, jsonb, jsonb, text);

CREATE OR REPLACE FUNCTION public.update_video_analysis_secure(
    p_youtube_id text, p_user_id uuid, p_summary jsonb DEFAULT NULL, p_suggested_questions jsonb DEFAULT NULL
)
RETURNS TABLE (success boolean, video_id uuid)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_video_id uuid; v_created_by uuid;
BEGIN
    SELECT id, created_by INTO v_video_id, v_created_by FROM public.video_analyses WHERE youtube_id = p_youtube_id;
    IF v_video_id IS NULL THEN RETURN QUERY SELECT false::boolean, NULL::uuid; RETURN; END IF;
    IF v_created_by IS NOT NULL AND v_created_by != p_user_id THEN
        RETURN QUERY SELECT false::boolean, v_video_id; RETURN;
    END IF;
    UPDATE public.video_analyses SET
        summary = COALESCE(p_summary, summary),
        suggested_questions = COALESCE(p_suggested_questions, suggested_questions),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_video_id;
    RETURN QUERY SELECT true::boolean, v_video_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_video_analysis_secure TO authenticated;


-- ============================================================================
-- PART 9: Welcome Email System (20260110120000)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pending_welcome_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    send_at timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 3,
    last_attempt_at timestamp with time zone,
    last_error text,
    http_request_id bigint,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT pending_welcome_emails_status_check CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    CONSTRAINT pending_welcome_emails_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_welcome_emails_status_send_at ON public.pending_welcome_emails(status, send_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pending_welcome_emails_processing ON public.pending_welcome_emails(status, http_request_id) WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS idx_pending_welcome_emails_user_id ON public.pending_welcome_emails(user_id);

CREATE OR REPLACE FUNCTION public.queue_welcome_email()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        INSERT INTO public.pending_welcome_emails (user_id, email, full_name, send_at)
        VALUES (NEW.id, NEW.email, NEW.full_name, timezone('utc'::text, now()) + interval '5 minutes')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_queue_welcome_email ON public.profiles;
CREATE TRIGGER on_profile_created_queue_welcome_email
    AFTER INSERT ON public.profiles FOR EACH ROW
    EXECUTE FUNCTION public.queue_welcome_email();

CREATE OR REPLACE FUNCTION public.process_welcome_emails()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE email_record RECORD; api_url text; api_key text; request_id bigint;
BEGIN
    SELECT decrypted_secret INTO api_url FROM vault.decrypted_secrets WHERE name = 'app_url';
    SELECT decrypted_secret INTO api_key FROM vault.decrypted_secrets WHERE name = 'internal_api_key';
    IF api_url IS NULL OR api_key IS NULL THEN
        RAISE WARNING 'Welcome email config missing: app_url or internal_api_key not found in vault';
        RETURN;
    END IF;
    FOR email_record IN
        SELECT id, user_id, email, full_name FROM public.pending_welcome_emails
        WHERE status = 'pending' AND send_at <= timezone('utc'::text, now()) AND attempts < max_attempts
        ORDER BY send_at ASC LIMIT 10 FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE public.pending_welcome_emails SET status = 'processing', attempts = attempts + 1, last_attempt_at = timezone('utc'::text, now()), updated_at = timezone('utc'::text, now()) WHERE id = email_record.id;
        SELECT net.http_post(
            url := api_url || '/api/email/send-welcome',
            headers := jsonb_build_object('Content-Type', 'application/json', 'X-Internal-API-Key', api_key),
            body := jsonb_build_object('emailId', email_record.id, 'userId', email_record.user_id, 'email', email_record.email, 'fullName', email_record.full_name),
            timeout_milliseconds := 30000
        ) INTO request_id;
        UPDATE public.pending_welcome_emails SET http_request_id = request_id, updated_at = timezone('utc'::text, now()) WHERE id = email_record.id;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_welcome_email_responses()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE response_record RECORD; email_record RECORD; response_body jsonb;
BEGIN
    FOR email_record IN
        SELECT pwe.id, pwe.http_request_id, pwe.attempts, pwe.max_attempts
        FROM public.pending_welcome_emails pwe
        WHERE pwe.status = 'processing' AND pwe.http_request_id IS NOT NULL
    LOOP
        SELECT * INTO response_record FROM net._http_response WHERE id = email_record.http_request_id;
        IF response_record IS NULL THEN
            IF EXISTS (SELECT 1 FROM public.pending_welcome_emails WHERE id = email_record.id AND last_attempt_at < timezone('utc'::text, now()) - interval '2 minutes') THEN
                IF email_record.attempts >= email_record.max_attempts THEN
                    UPDATE public.pending_welcome_emails SET status = 'failed', last_error = 'Request timeout after 2 minutes', updated_at = timezone('utc'::text, now()) WHERE id = email_record.id;
                ELSE
                    UPDATE public.pending_welcome_emails SET status = 'pending', last_error = 'Request timeout - will retry', http_request_id = NULL, updated_at = timezone('utc'::text, now()) WHERE id = email_record.id;
                END IF;
            END IF;
            CONTINUE;
        END IF;
        IF response_record.status_code = 200 THEN
            UPDATE public.pending_welcome_emails SET status = 'sent', updated_at = timezone('utc'::text, now()) WHERE id = email_record.id;
        ELSE
            BEGIN response_body := response_record.content::jsonb; EXCEPTION WHEN OTHERS THEN response_body := jsonb_build_object('error', response_record.content); END;
            IF email_record.attempts >= email_record.max_attempts THEN
                UPDATE public.pending_welcome_emails SET status = 'failed', last_error = COALESCE(response_body->>'error', 'HTTP ' || response_record.status_code::text), updated_at = timezone('utc'::text, now()) WHERE id = email_record.id;
            ELSE
                UPDATE public.pending_welcome_emails SET status = 'pending', send_at = timezone('utc'::text, now()) + (interval '1 minute' * attempts), last_error = COALESCE(response_body->>'error', 'HTTP ' || response_record.status_code::text), http_request_id = NULL, updated_at = timezone('utc'::text, now()) WHERE id = email_record.id;
            END IF;
        END IF;
        DELETE FROM net._http_response WHERE id = email_record.http_request_id;
    END LOOP;
END;
$$;

-- Cron jobs (will silently fail if pg_cron extension not available, that's OK)
DO $cron_block$
BEGIN
    PERFORM cron.schedule('process-welcome-emails', '* * * * *', 'SELECT public.process_welcome_emails();');
    PERFORM cron.schedule('handle-welcome-email-responses', '* * * * *', 'SELECT public.handle_welcome_email_responses();');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available, skipping welcome email cron jobs';
END;
$cron_block$;

ALTER TABLE public.pending_welcome_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to pending_welcome_emails" ON public.pending_welcome_emails FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE OR REPLACE FUNCTION public.cleanup_old_welcome_emails()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.pending_welcome_emails WHERE status = 'sent' AND updated_at < timezone('utc'::text, now()) - interval '30 days';
    DELETE FROM public.pending_welcome_emails WHERE status = 'failed' AND updated_at < timezone('utc'::text, now()) - interval '90 days';
END;
$$;

DO $cron_block2$
BEGIN
    PERFORM cron.schedule('cleanup-welcome-emails', '0 3 * * 0', 'SELECT public.cleanup_old_welcome_emails();');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available, skipping cleanup cron job';
END;
$cron_block2$;


-- ============================================================================
-- PART 10: Backfill existing auth.users → profiles
-- ============================================================================

INSERT INTO public.profiles (id, email)
SELECT u.id, u.email
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);


-- ============================================================================
-- DONE! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- ============================================================================
