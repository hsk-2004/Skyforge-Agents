// Route "/profile" — shows the signed-in user's details and role
import { auth } from "@/backend/auth";
import { prisma } from "@/backend/db";
import { redirect } from "next/navigation";
import ProfilePage from "@/frontend/ProfilePage";

export default async function Profile() {
  // Require a signed-in user
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  // Load the user's profile fields (including role) from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, role: true, createdAt: true },
  });
  if (!user) redirect("/login");

  return <ProfilePage user={user} />;
}
