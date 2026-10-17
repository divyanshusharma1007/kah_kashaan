import { Dashboard } from "@/components/auth/dashboard";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function DashboardPage() {
  const { navItems, logo } = await getHomePageData();
  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <Dashboard />
    </SiteLayout>
  );
}
