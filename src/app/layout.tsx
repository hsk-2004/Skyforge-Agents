// Root layout: wraps every page with global fonts, styles, and the sidebar navigation.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/frontend/Sidebar";

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
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full bg-gray-100">
        {/* Fixed navigation rail (bottom bar on mobile, left column on desktop) */}
        <Sidebar />
        {/* Main scrollable content area; bottom padding on mobile clears the nav bar */}
        <div className="min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">{children}</div>
      </body>
    </html>
  );
}
