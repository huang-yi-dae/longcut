import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface PeriodBounds {
  start: Date;
  end: Date;
}

export interface UsageBreakdown {
  counted: number;
  cached: number;
  total: number;
  byTier: Record<string, { counted: number; cached: number }>;
}

type UsageTrackerClient = SupabaseClient<any, string, any>;

interface UsageInPeriodParams {
  userId: string;
  start: Date;
  end: Date;
  client?: UsageTrackerClient;
}

/**
 * Returns the start and end of a rolling 30-day window from the given start date.
 */
export function getPeriodBounds(subStart: Date): PeriodBounds {
  const start = new Date(subStart);
  const end = new Date(start.getTime() + THIRTY_DAYS_MS);
  return { start, end };
}

/**
 * Aggregates usage for a user inside the provided window.
 * Local deployment: queries the SQLite `video_generations` table directly
 * (replaces the former Supabase RPC `get_usage_breakdown`).
 */
export async function fetchUsageBreakdown({
  userId,
  start,
  end,
  client,
}: UsageInPeriodParams): Promise<UsageBreakdown> {
  const breakdown: UsageBreakdown = {
    counted: 0,
    cached: 0,
    total: 0,
    byTier: {},
  };

  try {
    const rows = db
      .prepare(
        `SELECT subscription_tier AS subscription_tier,
                SUM(CASE WHEN counted_toward_limit = 1 THEN 1 ELSE 0 END) AS counted,
                SUM(CASE WHEN counted_toward_limit = 0 THEN 1 ELSE 0 END) AS cached
         FROM video_generations
         WHERE user_id = ? AND created_at >= ? AND created_at < ?
         GROUP BY subscription_tier`
      )
      .all(userId, start.toISOString(), end.toISOString()) as Array<{
      subscription_tier: string | null;
      counted: number;
      cached: number;
    }>;

    for (const row of rows) {
      const tier = row.subscription_tier ?? 'unknown';
      const counted = Number(row.counted ?? 0);
      const cached = Number(row.cached ?? 0);

      breakdown.byTier[tier] = { counted, cached };
      breakdown.counted += counted;
      breakdown.cached += cached;
    }

    breakdown.total = breakdown.counted + breakdown.cached;
  } catch (error) {
    console.error('Failed to compute usage breakdown from local DB:', error);
  }

  return breakdown;
}

interface RemainingCreditParams {
  baseLimit: number;
  countedUsage: number;
  topupCredits: number;
}

export interface RemainingCredits {
  baseRemaining: number;
  topupRemaining: number;
  totalRemaining: number;
}

/**
 * Calculates remaining credits given base usage, base limit, and stored top-up credits.
 */
export function getRemainingCredits({
  baseLimit,
  countedUsage,
  topupCredits,
}: RemainingCreditParams): RemainingCredits {
  const baseRemaining = Math.max(0, baseLimit - countedUsage);
  const topupRemaining = Math.max(0, topupCredits);
  return {
    baseRemaining,
    topupRemaining,
    totalRemaining: baseRemaining + topupRemaining,
  };
}

/**
 * Formats a reset timestamp for display and API responses.
 */
export function formatResetAt(date: Date): string {
  return date.toISOString();
}
