import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const wastageId = parseInt(id);
    const wastage = await prisma.wastageRecord.findUnique({ where: { id: wastageId }, include: { item: true } });
    
    if (wastage) {
      await prisma.wastageRecord.delete({ where: { id: wastageId } });
      
      try {
        const { createNotification } = await import("@/services/notificationService");
        await createNotification({
          title: "Wastage Record Deleted",
          message: `Wastage record for ${wastage.quantity} of "${wastage.item.name}" was deleted.`,
          type: "inventory",
          priority: "Low",
          module: "inventory",
          reference_id: String(wastageId),
          role_target: "ADMIN",
        });
      } catch (notifErr) {
        console.error("[DELETE /api/inventory/wastage/[id]] Notification trigger failed:", notifErr);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    console.error("[DELETE /api/inventory/wastage/[id]]", err);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}