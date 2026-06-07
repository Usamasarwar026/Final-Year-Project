// src/app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

type Ctx = { params: Promise<{ id: string }> };

function serializeCustomer(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phoneNumber: u.phoneNumber ?? null,
    profileImage: u.profileImage ?? null,
    address: u.address ?? null,
    city: u.city ?? null,
    country: u.country ?? null,
    cnic: u.cnic ?? null,
    dateOfBirth: u.dateOfBirth?.toISOString() ?? null,
    createdByAdmin: u.createdByAdmin,
    isVerified: u.isVerified,
    isActive: u.isActive,
    lastLogin: u.lastLogin?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

// GET /api/customers/:id — full profile with stats + recent bookings
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  if (role !== "ADMIN" && role !== "STAFF")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id, role: "CUSTOMER" },
  });
  if (!user)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  // Fetch all bookings for stats
  const bookings = await prisma.booking.findMany({
    where: { user_id: id },
    include: {
      room: {
        select: {
          room_number: true,
          room_type: true,
          floor: true,
          bed_type: true,
          photos: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Compute stats
  const totalBookings = bookings.length;
  const completedStays = bookings.filter(
    (b) => b.status === "CheckedOut"
  ).length;
  const cancelledBookings = bookings.filter(
    (b) => b.status === "Cancelled"
  ).length;
  const activeBookings = bookings.filter((b) =>
    ["Pending", "Confirmed", "CheckedIn"].includes(b.status as string)
  ).length;
  const totalSpent = bookings
    .filter((b) => b.status !== "Cancelled")
    .reduce((sum, b) => sum + Number(b.total_amount), 0);
  const completedNights = bookings
    .filter((b) => b.status === "CheckedOut")
    .reduce((sum, b) => sum + b.total_nights, 0);
  const avgNightsPerStay =
    completedStays > 0
      ? Math.round((completedNights / completedStays) * 10) / 10
      : 0;

  // Serialize recent bookings (latest 10)
  const recentBookings = bookings.slice(0, 10).map((b) => ({
    booking_id: Number(b.booking_id),
    check_in_date: b.check_in_date instanceof Date
      ? b.check_in_date.toISOString().split("T")[0]
      : b.check_in_date,
    check_out_date: b.check_out_date instanceof Date
      ? b.check_out_date.toISOString().split("T")[0]
      : b.check_out_date,
    status: b.status,
    total_nights: b.total_nights,
    total_amount: Number(b.total_amount),
    source: b.source,
    created_at: b.created_at.toISOString(),
    room: b.room
      ? {
          room_number: b.room.room_number,
          room_type: b.room.room_type,
          floor: b.room.floor,
          bed_type: b.room.bed_type,
          photos: Array.isArray(b.room.photos) ? b.room.photos : [],
        }
      : null,
  }));

  return NextResponse.json({
    customer: {
      ...serializeCustomer(user),
      stats: {
        totalBookings,
        completedStays,
        cancelledBookings,
        totalSpent,
        activeBookings,
        avgNightsPerStay,
      },
      recentBookings,
    },
  });
}

// PATCH /api/customers/:id — edit info or suspend/activate
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;
  if (role !== "ADMIN" && role !== "STAFF")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id, role: "CUSTOMER" },
  });
  if (!user)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const body = await req.json();
  const {
    name,
    email,
    phoneNumber,
    address,
    city,
    country,
    cnic,
    dateOfBirth,
    isActive,
    isVerified,
  } = body;

  // Check email uniqueness if changing
  if (email && email !== user.email) {
    const conflict = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (conflict)
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (phoneNumber !== undefined)
    updateData.phoneNumber = phoneNumber?.trim() || null;
  if (address !== undefined) updateData.address = address?.trim() || null;
  if (city !== undefined) updateData.city = city?.trim() || null;
  if (country !== undefined) updateData.country = country?.trim() || null;
  if (cnic !== undefined) updateData.cnic = cnic?.trim() || null;
  if (dateOfBirth !== undefined)
    updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (isVerified !== undefined) updateData.isVerified = isVerified;

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  // Trigger Notifications for Customer Profile Update
  try {
    const { createNotification } = await import("@/services/notificationService");
    
    await createNotification({
      title: "Customer Profile Updated",
      message: `Profile details for guest ${updated.name} have been updated by ${session.user.name || "Admin"}.`,
      type: "customer",
      priority: "Low",
      module: "customer",
      reference_id: id,
      role_target: "ADMIN",
      sender_user_id: session.user.id,
    });

    await createNotification({
      title: "Profile Updated",
      message: `Your guest profile details have been updated.`,
      type: "customer",
      priority: "Low",
      module: "customer",
      reference_id: id,
      recipient_user_id: id,
      sender_user_id: session.user.id,
    });
  } catch (notifErr) {
    console.error("[PATCH /api/customers/[id]] Notification trigger failed:", notifErr);
  }

  return NextResponse.json({ customer: serializeCustomer(updated) });
}

// DELETE /api/customers/:id — admin only
// export async function DELETE(req: NextRequest, { params }: Ctx) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const role = (session.user as any).role as string;
//   if (role !== "ADMIN")
//     return NextResponse.json({ error: "Admin only" }, { status: 403 });

//   const { id } = await params;

//   const user = await prisma.user.findUnique({
//     where: { id, role: "CUSTOMER" },
//   });
//   if (!user)
//     return NextResponse.json({ error: "Customer not found" }, { status: 404 });

//   // Soft delete via deactivation OR hard delete — using hard delete here
//   await prisma.user.delete({ where: { id } });

//   return NextResponse.json({ success: true });
// }