// Full Auth.js setup: credentials provider that checks email/password against the DB
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/backend/db";
import { authConfig } from "@/backend/authConfig";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      // Called on login: return the user object if credentials are valid, null otherwise
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        // Look up the user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // Compare the given password against the stored bcrypt hash
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Returned fields end up in the JWT/session
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
