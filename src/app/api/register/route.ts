// API endpoint: POST /api/register — create a new user account
import { NextResponse } from "next/server";
import { registerUser } from "@/backend/usersService";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Basic input validation
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await registerUser(name, email, password);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    // Duplicate email or unexpected failure
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
