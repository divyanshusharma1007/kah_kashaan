import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { getArtistRegistrationPoster } from "@/services/artist-directory";
import { downloadArtistPhoto, ArtistPhotoStorageError } from "@/services/artist-photo-storage";
import { isValidEventId } from "@/services/events";

export async function GET(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  const eventId = request.nextUrl.searchParams.get("event") ?? "";
  if (!isValidEventId(eventId)) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  try {
    const reference = await getArtistRegistrationPoster(user.email, eventId);
    if (reference === null) return NextResponse.json({ error: "Poster service is temporarily unavailable." }, { status: 503 });
    if (!reference) return NextResponse.json({ error: "Your artist poster is not ready yet." }, { status: 404 });
    const poster = await downloadArtistPhoto(reference);
    return new Response(poster.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="artist-poster.png"',
        "Content-Type": poster.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ArtistPhotoStorageError) {
      console.error("Could not download an artist poster.", error.message);
    } else {
      console.error("Could not download an artist poster.", error);
    }
    return NextResponse.json({ error: "Your artist poster is temporarily unavailable." }, { status: 503 });
  }
}
