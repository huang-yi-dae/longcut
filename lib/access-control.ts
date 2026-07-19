/**
 * Local single-user deployment: the fixed local user is always allowed
 * unlimited video generation. (Stripe tiers / per-user allow-lists are
 * disabled — see the migration notes.)
 */
export function hasUnlimitedVideoAllowance(_user?: unknown): boolean {
  return true;
}
