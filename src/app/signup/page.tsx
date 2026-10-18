import { AuthForm } from "@/components/auth/auth-form";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string; returnTo?: string }>;
}) {
  const { navItems, logo } = await getHomePageData();
  const { authError, returnTo } = await searchParams;
  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <AuthForm authError={authError} mode="signup" returnTo={returnTo} />
    </SiteLayout>
  );
}
