// Edge-safe auth config (no Prisma imports) — shared by proxy.ts and auth.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // Custom login page instead of the built-in NextAuth one
  pages: {
    signIn: "/login",
  },
  // Store sessions in a signed JWT cookie (no DB session table needed)
  session: { strategy: "jwt" },
  callbacks: {
    // Runs in the proxy for every matched request: false = redirect to /login
    authorized({ auth }) {
      return !!auth?.user;
    },
    // Copy the user id into the JWT when the user first signs in
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // Expose the user id on the session object for the frontend
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  // Providers are added in auth.ts (they need Prisma, which can't run in the proxy)
  providers: [],
};
