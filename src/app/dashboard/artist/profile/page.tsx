import { ArtistProfile } from "@/components/auth/artist-profile";

export default function ArtistProfileSettingsPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#d9af57]">Artist workspace</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">Profile settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99b7e]">
          Manage the artist information and links that can appear on your public profile.
        </p>
      </header>
      <ArtistProfile />
    </div>
  );
}
