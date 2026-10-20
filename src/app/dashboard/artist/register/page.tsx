import { connection } from "next/server";
import { ArtistRegistrationPage } from "@/components/auth/artist-registration-page";

export default async function ArtistRegistrationRoute() {
  await connection();
  return <ArtistRegistrationPage />;
}
