import type { ReactNode } from "react";
import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";
import type { NavItem } from "@/data/home-page-data";

type SiteLayoutProps = {
  navItems: NavItem[];
  logo: {
    src: string;
    alt: string;
  };
  children: ReactNode;
};

export function SiteLayout({ navItems, logo, children }: SiteLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-brand-text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.18),_transparent_30%),linear-gradient(180deg,#050505_0%,#090909_40%,#040404_100%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <SiteHeader navItems={navItems} logo={logo} />
        {children}
        <SiteFooter />
      </div>
    </main>
  );
}
