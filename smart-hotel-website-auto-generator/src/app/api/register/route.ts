import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/sendEmail";
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
    const verifyToken = uuidv4();
    const verifyTokenExp = new Date(Date.now() + 1000 * 60 * 60);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
        verifyToken,
        verifyTokenExp,
      },
    });
    const verifyLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verifyToken}`;

    await sendEmail({
      to: email,
      subject: "Verify Your Email",
      html: `
        <div style="font-family:sans-serif">
          <h2>Welcome to HotelGen</h2>
          <p>
            Click below to verify your email:
          </p>
          <a href="${verifyLink}">
            Verify Email
          </a>
        </div>`,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "User registered successfully please verify your email to login",
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
