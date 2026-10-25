'use client';
import { createContext, useContext, type ReactNode } from 'react';
const SellerPwa = createContext(true);
export function PwaCapabilities({ sellerEnabled, children }: { sellerEnabled: boolean; children: ReactNode }) {
  return <SellerPwa.Provider value={sellerEnabled}>{children}</SellerPwa.Provider>;
}
export function useSellerPwaEnabled() { return useContext(SellerPwa); }
