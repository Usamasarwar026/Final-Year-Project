// src/app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

type Ctx = { params: Promise<{ id: string }> };

function serializeCustomer(customer: any) {
  return {
    customer_id: customer.customer_id,
    name: customer.name,
    email: customer.email ?? null,
    phone_number: customer.phone_number,
    cnic: customer.cnic ?? null,
    gender: customer.gender ?? null,
    date_of_birth: customer.date_of_birth?.toISOString() ?? null,
    city: customer.city ?? null,
    country: customer.country ?? null,
    emergency_contact: customer.emergency_contact ?? null,
    notes: customer.notes ?? null,
    is_active: customer.is_active,
    created_at: customer.created_at.toISOString(),
    updated_at: customer.updated_at.toISOString(),
  };
}

// GET /api/customers/:id — full profile with stats + recent bookings
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const customerId = parseInt(id);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { customer_id: customerId },
  });
  
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Fetch all bookings for stats
  const bookings = await prisma.booking.findMany({
    where: { customer_id: customerId },
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
    ["Pending", "Confirmed", "CheckedIn"].includes(b.status)
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
    booking_id: b.booking_id,
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
      ...serializeCustomer(customer),
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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const customerId = parseInt(id);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { customer_id: customerId },
  });
  
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    name,
    email,
    phone_number,
    cnic,
    gender,
    date_of_birth,
    city,
    country,
    emergency_contact,
    notes,
    is_active,
  } = body;

  // Check email uniqueness if changing
  if (email && email !== customer.email) {
    const conflict = await prisma.customer.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        customer_id: { not: customerId },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
  }

  // Check phone uniqueness if changing
  if (phone_number && phone_number !== customer.phone_number) {
    const conflict = await prisma.customer.findFirst({
      where: {
        phone_number: phone_number.trim(),
        customer_id: { not: customerId },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Phone number already in use" },
        { status: 409 }
      );
    }
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email.trim().toLowerCase() || null;
  if (phone_number !== undefined) updateData.phone_number = phone_number.trim();
  if (cnic !== undefined) updateData.cnic = cnic?.trim() || null;
  if (gender !== undefined) updateData.gender = gender || null;
  if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth ? new Date(date_of_birth) : null;
  if (city !== undefined) updateData.city = city?.trim() || null;
  if (country !== undefined) updateData.country = country?.trim() || null;
  if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact?.trim() || null;
  if (notes !== undefined) updateData.notes = notes?.trim() || null;
  if (is_active !== undefined) updateData.is_active = is_active;

  const updated = await prisma.customer.update({
    where: { customer_id: customerId },
    data: updateData,
  });

  return NextResponse.json({ customer: serializeCustomer(updated) });
}