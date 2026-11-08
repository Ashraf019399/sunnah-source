"use client";

import type { LiveSaleItem } from "@/lib/services/live-sales";

export type { LiveSaleItem };
export {
  isLiveSalesRestrictedRoute,
  generateRandomSaleItem,
  BUYER_NAMES,
  LOCATIONS,
  RELATIVE_TIMES,
} from "@/lib/services/live-sales";

export function LiveSalesNotification() {
  // Live sales popup is temporarily disabled to prevent any background timers or popups
  return null;
}
