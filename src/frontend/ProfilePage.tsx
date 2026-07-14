// Profile page UI: shows the signed-in user's name, email, role, and join date.
"use client";

import { motion } from "framer-motion";

interface ProfileUser {
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

// Small colored badge for the user's role
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isAdmin ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
      }`}
    >
      {isAdmin ? "★ Admin" : "User"}
    </span>
  );
}

export default function ProfilePage({ user }: { user: ProfileUser }) {
  const initial = user.name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <main className="mx-auto max-w-[720px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Header: avatar + name + role */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 text-2xl font-semibold text-white ring-2 ring-indigo-500">
            {initial}
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">{user.name}</div>
            <div className="mt-1">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        {/* Detail rows */}
        <dl className="mt-6 divide-y divide-gray-100 border-t border-gray-100">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="text-sm text-gray-900">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Role</dt>
            <dd className="text-sm text-gray-900 capitalize">{user.role}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm font-medium text-gray-500">Member since</dt>
            <dd className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </motion.div>
    </main>
  );
}
