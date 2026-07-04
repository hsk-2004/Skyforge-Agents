// Route protection: runs before every matched request and redirects
// unauthenticated visitors to /login (via the authorized callback).
import NextAuth from "next-auth";
import { authConfig } from "@/backend/authConfig";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect everything except auth pages, auth/register APIs, and static assets
  matcher: ["/((?!login|register|api/auth|api/register|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
