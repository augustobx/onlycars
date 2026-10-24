import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { resolveTenantByHostname, normalizeHostname } from "@/lib/tenant-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  let tenantName = "OnlyCars";
  try {
    const requestHeaders = await headers();
    const host = normalizeHostname(
      requestHeaders.get("x-forwarded-host") ||
      requestHeaders.get("x-tenant-host") ||
      requestHeaders.get("host") ||
      ""
    );
    const resolved = await resolveTenantByHostname(host);
    if (resolved.success) {
      tenantName = resolved.tenant.settings?.appName || resolved.tenant.name;
    }
  } catch {
    // fallback
  }

  return {
    title: {
      default: tenantName,
      template: `%s | ${tenantName}`,
    },
    description: `Sistema de gestión automotriz - ${tenantName}`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {/* Sin Sidebar ni TopBar. Solo carga las rutas hijas */}
        {children}
      </body>
    </html>
  );
}