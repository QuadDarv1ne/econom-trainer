import 'server-only'

import { MAX_XP_DELTA, MAX_FIRST_SYNC_XP } from './constants'

/**
 * Merges client-reported XP with the server-authoritative value.
 * Prevents XP inflation attacks by capping client XP at server + MAX_XP_DELTA.
 * For first-ever syncs, caps at MAX_FIRST_SYNC_XP.
 *
 * @param clientXP - XP reported by the client (can be undefined if not provided)
 * @param serverXP - Current server XP (undefined if no progress record exists yet)
 * @returns The merged XP value trusted by the server
 */
export function mergeXP(
  clientXP: number | undefined,
  serverXP: number | undefined,
): number {
  if (clientXP === undefined) return serverXP ?? 0

  if (serverXP !== undefined) {
    if (clientXP >= serverXP && clientXP <= serverXP + MAX_XP_DELTA) {
      return clientXP
    }
    if (clientXP > serverXP + MAX_XP_DELTA) {
      return serverXP + MAX_XP_DELTA
    }
    return serverXP
  }

  return clientXP <= MAX_FIRST_SYNC_XP ? clientXP : MAX_FIRST_SYNC_XP
}
