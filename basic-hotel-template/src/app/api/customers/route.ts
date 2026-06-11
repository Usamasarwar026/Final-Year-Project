// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { prisma } from "@/database/db";

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

// GET /api/customers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");

    const customers = await prisma.customer.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  phone_number: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  cnic: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        bookings: {
          select: {
            booking_id: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({ 
      customers: customers.map(serializeCustomer) 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 422 }
      );
    }

    if (!phone_number?.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 422 }
      );
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          { phone_number: phone_number },
          ...(cnic ? [{ cnic }] : []),
        ],
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          error: "Customer already exists with same email, phone number or CNIC",
        },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone_number: phone_number.trim(),
        cnic: cnic?.trim() || null,
        gender: gender || null,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        city: city?.trim() || null,
        country: country?.trim() || null,
        emergency_contact: emergency_contact?.trim() || null,
        notes: notes?.trim() || null,
        is_active: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        customer: serializeCustomer(customer),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/customers]", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}