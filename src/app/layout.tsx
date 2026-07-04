// Root layout: wraps every page with global fonts, styles, and the sidebar navigation.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/frontend/Sidebar";
import { auth } from "@/backend/auth";

// Primary sans-serif font, exposed as a CSS variable for Tailwind to use.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Monospace font (code/numbers), also exposed as a CSS variable.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Page metadata used for the browser tab title and SEO description.
export const metadata: Metadata = {
  title: "Skyforge Agents",
  description: "Which agent do you need today?",
};

// Layout component: renders the sidebar on the left and the active page content on the right.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the session server-side so the sidebar can show who is signed in
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full bg-gray-100">
        {/* Fixed navigation rail (bottom bar on mobile, left column on desktop) */}
        <Sidebar userName={session?.user?.name} />
        {/* Main scrollable content area; bottom padding on mobile clears the nav bar + safe area */}
        <div className="min-w-0 flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      </body>
    </html>
  );
}
