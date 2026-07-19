import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import type { SubscriptionTier, UserSubscription } from '@/lib/subscription-manager';
import { getUserSubscriptionStatus } from '@/lib/subscription-manager';

export interface ImageUsageStats {
  tier: SubscriptionTier;
  baseLimit: number;
  counted: number;
  baseRemaining: number;
  periodStart: Date;
  periodEnd: Date;
  resetAt: string;
}

export interface ImageGenerationDecision {
  allowed: boolean;
  reason: 'OK' | 'LIMIT_REACHED' | 'SUBSCRIPTION_INACTIVE' | 'NO_SUBSCRIPTION';
  subscription?: UserSubscription | null;
  stats?: ImageUsageStats | null;
}

type DatabaseClient = SupabaseClient<any, string, any>;

export const IMAGE_TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  pro: 100,
};

const BILLING_PERIOD_DAYS = 30;
const THIRTY_DAYS_MS = BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000;

function resolveBillingPeriod(subscription: UserSubscription, now: Date): { start: Date; end: Date } {
  // Pro users: prefer Stripe billing window
  if (
    subscription.tier === 'pro' &&
    subscription.currentPeriodStart &&
    subscription.currentPeriodEnd
  ) {
    return {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    };
  }

  // Free users: rolling 30-day windows anchored to signup
  if (subscription.userCreatedAt) {
    const signupTime = subscription.userCreatedAt.getTime();
    const elapsedMs = now.getTime() - signupTime;
    const cycleNumber = Math.floor(elapsedMs / THIRTY_DAYS_MS);
    const periodStartMs = signupTime + (cycleNumber * THIRTY_DAYS_MS);
    const periodEndMs = periodStartMs + THIRTY_DAYS_MS;
    return {
      start: new Date(periodStartMs),
      end: new Date(periodEndMs),
    };
  }

  // Fallback: rolling 30 days
  const end = now;
  const start = new Date(end.getTime() - THIRTY_DAYS_MS);
  return { start, end };
}

async function fetchImageUsageInPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  options?: { client?: DatabaseClient }
): Promise<number> {
  try {
    const rows = db
      .prepare(
        `SELECT SUM(CASE WHEN counted_toward_limit = 1 THEN 1 ELSE 0 END) AS counted
         FROM image_generations
         WHERE user_id = ? AND created_at >= ? AND created_at < ?
         GROUP BY subscription_tier`
      )
      .all(userId, periodStart.toISOString(), periodEnd.toISOString()) as Array<{ counted: number }>;

    return rows.reduce((sum, row) => sum + Number(row.counted ?? 0), 0);
  } catch (error) {
    console.error('Failed to fetch image usage from local DB:', error);
    return 0;
  }
}

export async function getImageUsageStats(
  userId: string,
  options?: { client?: DatabaseClient; now?: Date }
): Promise<ImageUsageStats | null> {
  const supabase = options?.client ?? (await createClient());
  const subscription = await getUserSubscriptionStatus(userId, { client: supabase });

  if (!subscription) {
    return null;
  }

  const now = options?.now ?? new Date();
  const { start, end } = resolveBillingPeriod(subscription, now);
  const baseLimit = IMAGE_TIER_LIMITS[subscription.tier];

  const counted = await fetchImageUsageInPeriod(userId, start, end, { client: supabase });
  const baseRemaining = Math.max(0, baseLimit - counted);

  return {
    tier: subscription.tier,
    baseLimit,
    counted,
    baseRemaining,
    periodStart: start,
    periodEnd: end,
    resetAt: end.toISOString(),
  };
}

export async function canGenerateImage(
  userId: string,
  options?: { client?: DatabaseClient; now?: Date }
): Promise<ImageGenerationDecision> {
  const supabase = options?.client ?? (await createClient());
  const now = options?.now ?? new Date();
  const subscription = await getUserSubscriptionStatus(userId, { client: supabase });

  if (!subscription) {
    return { allowed: false, reason: 'NO_SUBSCRIPTION' };
  }

  const stats = await getImageUsageStats(userId, { client: supabase, now });

  if (!stats) {
    return {
      allowed: false,
      reason: 'NO_SUBSCRIPTION',
      subscription,
      stats: null,
    };
  }

  // Pro users must be active/trialing/past_due; otherwise block
  if (
    subscription.tier === 'pro' &&
    subscription.status &&
    !['active', 'trialing', 'past_due'].includes(subscription.status)
  ) {
    return {
      allowed: false,
      reason: 'SUBSCRIPTION_INACTIVE',
      subscription,
      stats,
    };
  }

  if (stats.baseRemaining <= 0) {
    return {
      allowed: false,
      reason: 'LIMIT_REACHED',
      subscription,
      stats,
    };
  }

  return {
    allowed: true,
    reason: 'OK',
    subscription,
    stats,
  };
}

export async function consumeImageCreditAtomic({
  userId,
  youtubeId,
  subscription,
  statsSnapshot,
  videoAnalysisId,
  counted = true,
  client,
}: {
  userId: string;
  youtubeId: string;
  subscription: UserSubscription;
  statsSnapshot: ImageUsageStats;
  videoAnalysisId?: string | null;
  counted?: boolean;
  client?: DatabaseClient;
}): Promise<{ success: boolean; generationId?: string; error?: string }> {
  const supabase = client ?? (await createClient());

  const { data, error } = await supabase
    .from('image_generations')
    .insert({
      user_id: userId,
      youtube_id: youtubeId,
      video_id: videoAnalysisId ?? null,
      counted_toward_limit: counted,
      subscription_tier: subscription.tier,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();

  if (error || !data) {
    console.error('Failed to record image generation:', error);
    return { success: false, error: 'FAILED_TO_RECORD_GENERATION' };
  }

  return { success: true, generationId: (data as { id: string }).id };
}
