import { AuthForm } from "@/components/auth/auth-form";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function LoginPage() {
  const { navItems, logo } = await getHomePageData();
  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <AuthForm mode="login" />
    </SiteLayout>
  );
}
