import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-context";
import { PageMotion } from "@/components/home/page-motion";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import "./globals.css";
import { getRuntimeConfig } from "@/services/runtime-config";
import { SITE_ALTERNATE_NAMES, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL } from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const greatVibes = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | Literary & Cultural Community`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: SITE_URL },
  openGraph: { type: "website", siteName: SITE_NAME, title: `${SITE_NAME} | Literary & Cultural Community`, description: SITE_DESCRIPTION, url: SITE_URL },
  twitter: { card: "summary", title: `${SITE_NAME} | Literary & Cultural Community`, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  other: { "alternate-name": SITE_ALTERNATE_NAMES.join(", ") },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await getRuntimeConfig();
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-brand-text-primary">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            alternateName: SITE_ALTERNATE_NAMES,
            url: SITE_URL,
            description: SITE_DESCRIPTION,
          }) }}
        />
        <AuthProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              alternateName: SITE_ALTERNATE_NAMES,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/events?search={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }) }}
          />
          <PageMotion />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
