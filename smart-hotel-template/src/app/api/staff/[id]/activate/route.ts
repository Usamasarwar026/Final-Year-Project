import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

type Params = { params: Promise<{ id: string }> };
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          isActive: true,
        },
      }),

      prisma.staff.updateMany({
        where: {
          user_id: id,
        },
        data: {
          is_active: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Staff activated",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to activate staff" },
      { status: 500 },
    );
  }
}
