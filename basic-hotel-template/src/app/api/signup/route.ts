import bcrypt from "bcryptjs";
import { prisma } from "@/database/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already registered" },
        { status: 409 },
      );
    }
    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
      },
    });
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully...",
        user: newUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    const typedError = error as Error;
    return NextResponse.json(
      {
        success: false,
        message: "Error registering user",
        error: typedError.message,
      },
      { status: 500 },
    );
  }
}
