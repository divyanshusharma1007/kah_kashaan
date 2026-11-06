import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-context";
import { PageMotion } from "@/components/home/page-motion";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import "./globals.css";
import { getRuntimeConfig } from "@/services/runtime-config";
import { absoluteUrl, SITE_ALTERNATE_NAMES, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL } from "@/lib/seo";

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
  title: { default: `${SITE_NAME} Indore | Poetry, Shayari & Cultural Community`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: SITE_URL },
  category: "Literature and culture",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} Indore | Poetry, Shayari & Cultural Community`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/kah-kashaan-logo.png", alt: `${SITE_NAME} logo` }],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} Indore | Poetry, Shayari & Cultural Community`, description: SITE_DESCRIPTION, images: ["/kah-kashaan-logo.png"] },
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
            logo: absoluteUrl("/kah-kashaan-logo.png"),
            areaServed: { "@type": "Place", name: "Indore, Madhya Pradesh, India" },
            knowsAbout: ["Hindi poetry", "shayari", "ghazal", "gazal", "chhand", "doha", "kavi sammelan", "open mic events"],
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
              inLanguage: ["en-IN", "hi-IN"],
            }) }}
          />
          <PageMotion />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
