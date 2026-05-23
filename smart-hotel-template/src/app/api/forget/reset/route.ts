import { NextResponse } from "next/server";
import { prisma } from "@/database/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    console.log("token and password", token, password);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 },
      );
    }
    if (!password) {
      return NextResponse.json(
        { success: false, message: "password is required" },
        { status: 400 },
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    let errorMessage = "Error processing request";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      {
        success: false,
        message: "Error resetting password",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
