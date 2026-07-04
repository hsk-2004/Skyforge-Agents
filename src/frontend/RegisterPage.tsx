// Register page UI: matches the login page design; auto signs in after signup
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Create the account, then log the user straight in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Registration failed");
        return;
      }
      // Auto sign-in with the new credentials
      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-100 px-4">
      {/* Soft decorative blobs in the brand colors */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl" />

      {/* Card animates in with a fade + slide up */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-indigo-100 sm:p-8"
      >
        {/* Logo badge */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
          {/* "S" lettermark matching the favicon */}
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <path
              d="M44 20c-3-4-10-6-16-4c-6 2-8 8-4 12c3 3 9 3 14 5c6 2 8 8 4 12c-4 4-13 4-18-1"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="49" cy="13" r="6" fill="#F97316" />
          </svg>
        </div>

        <h1 className="mt-5 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Get started with <span className="font-semibold text-indigo-600">Skyforge Agents</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {/* Error banner */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Full name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Password
            </label>
            {/* Password field with show/hide toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-16 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Primary CTA button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">Already have an account?</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Link back to login for existing users */}
        <Link
          href="/login"
          className="mt-4 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Sign in instead
        </Link>
      </motion.div>
    </main>
  );
}
