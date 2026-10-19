This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Account and event-registration demo

- Artist accounts can be created at `/signup`. The `/reserve` form saves event registrations in MongoDB and creates a browser-local demo session; it does not create a server account.
- Sign in at `/login`; password credentials and Google accounts are checked against the MongoDB `users` collection by email. Unknown Google emails are redirected to signup rather than being created during login.
- Email/password signup creates a pending MongoDB `users` entry and sends a single-use email verification link that expires after 24 hours. Clicking the link verifies the address and redirects to `/login`; the user can then sign in. Unverified accounts cannot log in. Google signup relies on Google's verified email claim and signs the user in immediately. Account signup does not request or store a phone number. Set an existing user's `role` to `admin` or `artist`; `/dashboard` displays the matching view after server verification.
- Passwords are stored as salted PBKDF2 hashes; account sessions use signed, HTTP-only cookies. Event registration form submissions are stored in MongoDB and grouped into the admin artist directory; browser registrations also remain available for demo artist accounts.
- Admins can view website statistics at `/dashboard`, manage events at `/dashboard/events`, and create events separately at `/dashboard/events/new`. Events are stored in the MongoDB `events` collection; published upcoming events appear on the home page, `/events`, and the event registration selector. Drafts remain private.

The admin artist directory at `/dashboard/artists` supports profile/event search, role and feature-status filters, and sorting. Administrators can promote artists, revoke admin access, manage artist sign-in, and approve or remove public artist features. Revoking the final verified admin or your own admin access is prevented; role changes take effect for existing sessions as well. Artist and event lists include search/filter/sort controls, and selecting an event opens its admin overview.

Artists can request a public feature from `/dashboard/artist/featured`. Admin approval publishes their profile in the public `/artists` directory and at `/artists/[id]`. Only name, location (city/state), bio, selected skills, and profile photo are public; email, phone, and street address remain private. Administrators manage pending feature requests in the artist directory.

### Admin event management

Use an existing account in the MongoDB `users` collection and set its `role` to `admin` to enable the protected admin dashboard. The dashboard sidebar links to the overview, event manager, artist directory, and a one-click switch to the account's artist view; artists cannot access the admin views. The admin APIs verify the signed server-side session and require the event database to be available. Create events separately from the overview at `/dashboard/events/new`; the form includes a title, description, type, date and time, location, ticket price, optional capacity and organizer, and a visibility setting. New events are published by default; choose “Save as draft” to keep an event off the public website. Changes to published events are reflected on the next page request.

The overview displays user, admin, artist, and event counts alongside estimated registration income and recent activity. User counts exclude accounts awaiting email verification; the system does not track currently online users or last-active timestamps. Admins can open each event overview from the event list to see artist registrations and registration-fee totals, mark an artist as not performing, and choose event-specific skills. Artist accounts can be taken offline from the artist directory; offline artists are prevented from logging in and active sessions are checked periodically. Artist records show profile details and event history. Registration history is treated as performing by default unless an admin marks the artist as not performing.

Event registrations are validated against published upcoming events and saved in the MongoDB `artistRegistrations` collection, including the ticket price at registration time. Admins can see registrant names, email addresses, phone numbers, and chosen events in the protected artist directory and recent-activity dashboard. Signed-in artists can see their own server-saved registrations; the separate browser demo registration state is still local to that browser. Admin daily, monthly, and event-level income figures are estimates based on saved registration fees, not verified payments; payment processing is not configured. Skills can be edited but not deleted.

### Google sign-in configuration

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and a random `AUTH_SECRET` of at least 32 characters in the server environment. Set `APP_URL` to the app's public base URL so successful sign-ins return to the public site rather than an internal proxy address; when it is omitted, Google sign-in uses the origin of `GOOGLE_REDIRECT_URI`. Add the exact `GOOGLE_REDIRECT_URI` value to the OAuth client's authorized redirect URIs in Google Cloud Console. MongoDB must be configured through `MONGODB_URI` or `MONGODB_PASSWORD`; set `MONGODB_DB` if the connection URI does not name the database. The selected database must have (or allow creation of) a `users` collection with `email` and `role` fields. New accounts save `email`, `emailNormalized`, `name`, and `role`; Google accounts also save `provider` and `googleId`, while password accounts store salted password hashes. Existing `artist` and `admin` roles are honored at login.

### Private artist photos in ImageKit and Cloudinary

Artist profile photos are uploaded privately to ImageKit first and fall back to Cloudinary if ImageKit is not configured or an ImageKit upload fails. Photos are served through the app only to the signed-in artist or an administrator; the provider keys and direct private URLs are never sent to the browser. Configure `IMAGEKIT_PRIVATE_KEY` and `IMAGEKIT_URL_ENDPOINT` in the server environment. The ImageKit URL endpoint is available in the ImageKit dashboard; the private key is in Developer Options. For fallback uploads, set `CLOUDINARY_URL` from the Cloudinary console, or set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` separately. Keep both providers' private keys and secrets private; never use `NEXT_PUBLIC_` variables for them. Photo uploads accept JPEG, PNG, or WebP images up to 5 MB. Existing Cloudinary photos remain available; existing photos stored by the previous provider must be uploaded again.

### Email verification configuration

In development (`NODE_ENV=development`), email/password signup writes the verification link to the server console instead of sending an email. Open that link to verify the account; `APP_URL` can point to the local app and defaults to `http://localhost:3000`. Outside development, verification messages are sent through the Resend API. Configure `APP_URL` as the absolute public site URL (HTTPS outside localhost), `RESEND_API_KEY` with a Resend API key, and `EMAIL_FROM` with a sender address authorized for your Resend account. Pending users can submit the signup form again to resend the link (once per minute). Do not enable password signup in a deployed environment until these mail settings and the sender domain are configured.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
