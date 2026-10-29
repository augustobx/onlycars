import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { resolveTenantByHostname, normalizeHostname } from "@/lib/tenant-context";
import AnnouncementModal from "@/components/theme/AnnouncementModal";
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
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('nl-theme') || 'light';
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <AnnouncementModal />
      </body>
    </html>
  );
}
