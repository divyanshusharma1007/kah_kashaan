import type { ReactNode } from "react";
import { Dashboard } from "@/components/auth/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, noarchive: true },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Dashboard>{children}</Dashboard>;
}
