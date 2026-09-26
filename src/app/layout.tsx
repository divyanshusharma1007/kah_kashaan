import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import "./globals.css";

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
  title: "Kah-Kashaan | Event Culture & Community",
  description:
    "Kah-Kashaan is a literary and cultural event platform for mentorship, workshops, open mic, and community gatherings.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-brand-text-primary">
        {children}
      </body>
    </html>
  );
}
