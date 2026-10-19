import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/services/auth-session";
import { getMongoClient } from "@/services/mongodb";

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Sign in with an administrator account to manage events." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const user = verifySessionToken(token);
    if (!user) {
      return NextResponse.json({ error: "Your session has expired. Please sign in again." }, {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Administrator access is required." }, {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
    const client = await getMongoClient();
    if (!client) {
      return NextResponse.json({ error: "Administrator access could not be verified." }, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
    const databaseName = process.env.MONGODB_DB?.trim();
    const currentAccount = await client
      .db(databaseName || undefined)
      .collection<{ role?: string; emailVerified?: boolean }>("users")
      .findOne(
        {
          role: "admin",
          emailVerified: { $ne: false },
          $or: [{ emailNormalized: user.email.toLowerCase() }, { email: user.email.toLowerCase() }],
        },
        { projection: { _id: 1 }, collation: { locale: "en", strength: 2 } },
      );
    if (!currentAccount) {
      return NextResponse.json({ error: "Administrator access has been revoked. Sign in again with an active account." }, {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
  } catch (error) {
    console.error("Could not verify administrator access.", error);
    return NextResponse.json({ error: "Administrator access is temporarily unavailable." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return null;
}
