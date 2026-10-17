import { AuthForm } from "@/components/auth/auth-form";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string; verified?: string; verificationError?: string }>;
}) {
  const { navItems, logo } = await getHomePageData();
  const { authError, verified, verificationError } = await searchParams;
  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <AuthForm authError={authError} mode="login" verificationError={verificationError} verified={verified === "1"} />
    </SiteLayout>
  );
}
