// Backend service for user accounts (registration)
import bcrypt from "bcryptjs";
import { prisma } from "@/backend/db";

// Create a new user with a hashed password; throws if the email is taken
export async function registerUser(name: string, email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Reject duplicate accounts
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new Error("An account with this email already exists");

  // Hash the password (never store it in plain text)
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, password: hashed },
  });

  // Return only safe fields (no password hash)
  return { id: user.id, name: user.name, email: user.email };
}
