import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        { status: 404 },
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
