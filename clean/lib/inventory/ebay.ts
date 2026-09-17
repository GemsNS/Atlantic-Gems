/**
 * Thin re-export so existing imports from @/lib/inventory/ebay keep working.
 */
export {
  ebayConfigured,
  ebayEnvConfigured,
  ebayConnectionStatus,
  importFromEbay,
  syncEbayStore,
} from "@/lib/integrations/ebay";
