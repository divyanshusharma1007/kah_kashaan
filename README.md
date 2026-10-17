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

- Artist accounts can be created at `/signup` or while registering for an event at `/reserve`.
- Sign in at `/login`; password credentials and Google accounts are checked against the MongoDB `users` collection by email. Unknown Google emails are redirected to signup rather than being created during login.
- Email/password signup and Google signup create MongoDB `users` entries with the `artist` role and save the artist's name and email. After Google consent, the account is created automatically and the user is signed in to the dashboard. Account signup does not request or store a phone number; Google OAuth provides the verified email and account name, not a phone number. Set an existing user's `role` to `admin` or `artist`; `/dashboard` displays the matching view after server verification.
- Passwords are stored as salted PBKDF2 hashes; account sessions use signed, HTTP-only cookies. Event registration data and the separate demo admin preview still use browser local storage.
- The login page includes a one-click demo admin dashboard for previewing all registrations.

### Google sign-in configuration

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and a random `AUTH_SECRET` of at least 32 characters in the server environment. Add the exact `GOOGLE_REDIRECT_URI` value to the OAuth client's authorized redirect URIs in Google Cloud Console. MongoDB must be configured through `MONGODB_URI` or `MONGODB_PASSWORD`; set `MONGODB_DB` if the connection URI does not name the database. The selected database must have (or allow creation of) a `users` collection with `email` and `role` fields. New accounts save `email`, `emailNormalized`, `name`, and `role`; Google accounts also save `provider` and `googleId`, while password accounts store salted password hashes. Existing `artist` and `admin` roles are honored at login.

The demo admin button is not a protected admin sign-in. Only use Google accounts and database roles for actual admin access; protect any future admin APIs with the verified server-side session as well.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
