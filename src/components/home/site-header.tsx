import Image from "next/image";

import type { NavItem } from "@/data/home-page-data";

type SiteHeaderProps = {
  navItems: NavItem[];
  logo: {
    src: string;
    alt: string;
  };
};

export function SiteHeader({ navItems, logo }: SiteHeaderProps) {
  return (
    <header className="sticky top-4 z-30 mb-8 rounded-full border border-[#d9af57]/30 bg-[#101010]/80 px-5 py-3 shadow-[0_0_30px_rgba(217,175,87,0.1)] backdrop-blur-xl">
      <nav className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-0.5">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={220}
              height={60}
              className="h-10 w-auto max-w-[180px] object-contain sm:h-12"
              style={{ width: "auto", height: "auto" }}
              priority
              sizes="(max-width: 768px) 120px, 180px"
            />
          </div>
        </div>

        <div className="hidden items-center gap-8 text-sm uppercase tracking-[0.2em] text-[#e7d7aa] md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-[#f9e8a0]">
              {item.label}
            </a>
          ))}
        </div>

        <button className="rounded-full border border-[#d9af57] bg-[#d9af57] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#111111] transition hover:bg-[#f3d98c]">
          Reserve Seat
        </button>
      </nav>
    </header>
  );
}
