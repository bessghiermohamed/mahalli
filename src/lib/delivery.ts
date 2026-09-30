/**
 * Delivery fee resolution — single source of truth for fee precedence.
 * Used by the checkout UI (display) and re-applied authoritatively in the
 * create_order RPC (server-side calculation).
 */
export function resolveDeliveryFee(options: {
  overrideFee: number | null | undefined;
  storeDefaultFee: number | null | undefined;
  wilayaDefaultFee: number | null | undefined;
}): number {
  const { overrideFee, storeDefaultFee, wilayaDefaultFee } = options;
  if (overrideFee !== null && overrideFee !== undefined) return overrideFee;
  if (storeDefaultFee !== null && storeDefaultFee !== undefined) return storeDefaultFee;
  if (wilayaDefaultFee !== null && wilayaDefaultFee !== undefined) return wilayaDefaultFee;
  return 0;
}
