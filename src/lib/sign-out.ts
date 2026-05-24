"use client";

import { signOut, type SignOutParams } from "next-auth/react";
import { useEconomicsStore } from "@/store/economics-store";

/**
 * Sign out and clear all persisted client-side store data.
 * Prevents stale data from being visible to the next user on shared devices.
 */
export async function signOutAndClearStore(options?: SignOutParams<true>) {
  // Clear the persisted Zustand store before signing out
  useEconomicsStore.persist.clearStorage();

  // Sign out with NextAuth
  await signOut(options);
}
