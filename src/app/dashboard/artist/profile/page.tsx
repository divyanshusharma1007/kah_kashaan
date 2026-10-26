import { ArtistProfile } from "@/components/auth/artist-profile";

export default function ArtistProfileSettingsPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">Profile settings</h1>
      </header>
      <ArtistProfile />
    </div>
  );
}
