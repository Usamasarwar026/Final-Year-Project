// src/services/billingService.ts

import { prisma } from "@/database/db";
import { Prisma } from "@/generated/prisma/client";

// Generate unique invoice number: INV-YYYYMMDD-XXXX
export function generateInvoiceNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${rand}`;
}

// Service to generate/create invoice
export async function generateInvoice(
  bookingId: number,
  options?: { tax_percent?: number; discount_percent?: number }
) {
  // Fetch booking details
  const booking = await prisma.booking.findUnique({
    where: { booking_id: bookingId },
    include: {
      user: true,
      room: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Fetch guest details
  const guest = booking.user;
  if (!guest) {
    throw new Error("Guest not found for this booking");
  }

  // Fetch room details
  const room = booking.room;
  if (!room) {
    throw new Error("Room not found for this booking");
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.billingInvoice.findUnique({
    where: { booking_id: bookingId },
  });
  if (existingInvoice) {
    return existingInvoice;
  }

  // Calculate room charges: Total Nights × Room Price
  const totalNights = booking.total_nights;
  const pricePerNight = Number(room.price_per_night);
  const roomCharges = totalNights * pricePerNight;

  // Initialize service charges
  let serviceCharges = 0;
  
  {{#if housekeeping}}
  // Housekeeping module: Fetch service charges
  const housekeepingTasks = await prisma.housekeepingTask.findMany({
    where: {
      booking_id: bookingId,
      is_billable: true,
    },
  });
  const housekeepingSum = housekeepingTasks.reduce(
    (sum, task) => sum + Number(task.charge_amount || 0),
    0
  );

  const laundryRecords = await prisma.laundryRecord.findMany({
    where: {
      booking_id: bookingId,
    },
  });
  const laundrySum = laundryRecords.reduce(
    (sum, record) => sum + Number(record.charge_amount || 0),
    0
  );

  serviceCharges = housekeepingSum + laundrySum;
  {{/if}}

  // Initialize food charges
  let foodCharges = 0;
  
  {{#if kitchen}}
  // Kitchen module: Fetch food charges
  const foodOrders = await prisma.foodOrder.findMany({
    where: {
      booking_id: bookingId,
    },
    select: {
      id: true,
      total_amount: true,
    },
  });
  foodCharges = foodOrders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );
  {{/if}}

  // Calculate subtotal
  const subtotal = roomCharges + serviceCharges + foodCharges;

  // Apply tax percentage (default 10% or from option)
  const taxPercent = options?.tax_percent !== undefined ? options.tax_percent : 10;
  if (taxPercent < 0) throw new Error("Tax percent cannot be negative");
  const taxAmount = (subtotal * taxPercent) / 100;

  // Apply discount percentage (default 0% or from option)
  const discountPercent =
    options?.discount_percent !== undefined ? options.discount_percent : 0;
  if (discountPercent < 0) throw new Error("Discount percent cannot be negative");
  const discountAmount = (subtotal * discountPercent) / 100;

  // Generate final amount
  const totalAmount = subtotal + taxAmount - discountAmount;

  // Generate unique invoice number
  let invoiceNumber = generateInvoiceNumber();

  // Ensure unique invoice number in db
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const conflict = await prisma.billingInvoice.findUnique({
      where: { invoice_number: invoiceNumber },
    });
    if (!conflict) {
      isUnique = true;
    } else {
      invoiceNumber = generateInvoiceNumber();
      attempts++;
    }
  }

  // Save invoice
  const amountPaid = 0;
  const balanceDue = totalAmount - amountPaid;
  const paymentStatus = "Unpaid";

  const invoice = await prisma.billingInvoice.create({
    data: {
      invoice_number: invoiceNumber,
      booking_id: bookingId,
      guest_id: guest.id,
      room_charges: new Prisma.Decimal(roomCharges),
      service_charges: new Prisma.Decimal(serviceCharges),
      food_charges: new Prisma.Decimal(foodCharges),
      subtotal: new Prisma.Decimal(subtotal),
      tax_percent: new Prisma.Decimal(taxPercent),
      tax_amount: new Prisma.Decimal(taxAmount),
      discount_percent: new Prisma.Decimal(discountPercent),
      discount_amount: new Prisma.Decimal(discountAmount),
      total_amount: new Prisma.Decimal(totalAmount),
      amount_paid: new Prisma.Decimal(amountPaid),
      balance_due: new Prisma.Decimal(balanceDue),
      payment_status: paymentStatus,
    },
  });

  // Trigger Notification for Guest & Billing Admins
  try {
    const { createNotification } = await import("./notificationService");
    await createNotification({
      title: "Invoice Generated",
      message: `Invoice ${invoiceNumber} for your booking (ID: ${bookingId}) has been generated. Total Amount: $${totalAmount.toFixed(2)}.`,
      type: "billing",
      priority: "Medium",
      module: "billing",
      reference_id: String(invoice.invoice_id),
      recipient_user_id: guest.id,
    });
    await createNotification({
      title: "New Invoice Created",
      message: `Invoice ${invoiceNumber} has been generated for Guest ${guest.name}. Total: $${totalAmount.toFixed(2)}.`,
      type: "billing",
      priority: "Low",
      module: "billing",
      reference_id: String(invoice.invoice_id),
      role_target: "ADMIN",
    });
  } catch (notifErr) {
    console.error("[generateInvoice] Notification trigger failed:", notifErr);
  }

  return invoice;
}

// Service to record payment
export async function recordPayment(
  invoiceId: number,
  amount: number,
  paymentMethod: string,
  notes?: string
) {
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const invoice = await prisma.billingInvoice.findUnique({
    where: { invoice_id: invoiceId },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const currentPaid = Number(invoice.amount_paid);
  const totalAmount = Number(invoice.total_amount);
  const newPaid = currentPaid + amount;

  if (newPaid > totalAmount) {
    throw new Error("Payment cannot exceed total amount");
  }

  const newBalance = totalAmount - newPaid;
  let newStatus = "Unpaid";
  if (newPaid >= totalAmount) {
    newStatus = "Paid";
  } else if (newPaid > 0) {
    newStatus = "Partial";
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.invoicePayment.create({
      data: {
        invoice_id: invoiceId,
        amount_paid: new Prisma.Decimal(amount),
        payment_method: paymentMethod,
        notes: notes || null,
      },
    });

    const updatedInvoice = await tx.billingInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        amount_paid: new Prisma.Decimal(newPaid),
        balance_due: new Prisma.Decimal(newBalance),
        payment_status: newStatus,
      },
    });

    return { payment, invoice: updatedInvoice };
  });

  try {
    const { createNotification } = await import("./notificationService");
    const formattedAmount = amount.toFixed(2);
    const formattedBalance = newBalance.toFixed(2);

    await createNotification({
      title: "Payment Received",
      message: `A payment of $${formattedAmount} has been received for Invoice ${invoice.invoice_number}. Remaining Balance: $${formattedBalance}. Status: ${newStatus}.`,
      type: "billing",
      priority: "Medium",
      module: "billing",
      reference_id: String(invoiceId),
      recipient_user_id: invoice.guest_id,
    });

    await createNotification({
      title: "Payment Recorded",
      message: `Payment of $${formattedAmount} received for Invoice ${invoice.invoice_number}. New Status: ${newStatus}.`,
      type: "billing",
      priority: "Medium",
      module: "billing",
      reference_id: String(invoiceId),
      role_target: "ADMIN",
    });
  } catch (notifErr) {
    console.error("[recordPayment] Notification trigger failed:", notifErr);
  }

  return result;
}

// Service to fetch invoice lists with parameters
export async function getInvoices(params: {
  search?: string;
  payment_status?: string;
  startDate?: string;
  endDate?: string;
  guest_id?: string;
  page?: number;
  limit?: number;
}) {
  const where: any = {};

  if (params.guest_id) {
    where.guest_id = params.guest_id;
  }

  if (params.payment_status && params.payment_status !== "All") {
    where.payment_status = params.payment_status;
  }

  if (params.startDate || params.endDate) {
    where.generated_at = {};
    if (params.startDate) {
      where.generated_at.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      where.generated_at.lte = end;
    }
  }

  if (params.search) {
    const searchVal = params.search.trim();
    where.OR = [
      { invoice_number: { contains: searchVal, mode: "insensitive" } },
      { guest: { name: { contains: searchVal, mode: "insensitive" } } },
      { guest: { email: { contains: searchVal, mode: "insensitive" } } },
    ];

    const bookingIdNum = parseInt(searchVal);
    if (!isNaN(bookingIdNum)) {
      where.OR.push({ booking_id: bookingIdNum });
    }
  }

  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.billingInvoice.findMany({
      where,
      include: {
        guest: { select: { id: true, name: true, email: true, phoneNumber: true } },
        booking: {
          include: {
            room: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { generated_at: "desc" },
    }),
    prisma.billingInvoice.count({ where }),
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

// src/services/billingService.ts - Fix getInvoiceById function

// Fetch complete detail for invoice breakdown
export async function getInvoiceById(id: number) {
  const baseInclude: any = {
    guest: { select: { id: true, name: true, email: true, phoneNumber: true } },
    payments: {
      orderBy: { recorded_at: "desc" },
    },
    booking: {
      include: {
        room: true,
        // Remove payments from here - it doesn't exist on Booking model
      },
    },
  };

  {{#if kitchen}}
  // Add food orders only if kitchen module is enabled
  baseInclude.booking.include.foodOrders = {
    select: {
      id: true,
      total_amount: true,
      order_type: true,
      placed_at: true,
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          subtotal: true,
          foodItem: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  };
  {{/if}}

  {{#if housekeeping}}
  // Add laundry and housekeeping only if housekeeping module is enabled
  baseInclude.booking.include.laundryRecords = true;
  baseInclude.booking.include.housekeepingTasks = {
    where: { is_billable: true },
  };
  {{/if}}

  const invoice = await prisma.billingInvoice.findUnique({
    where: { invoice_id: id },
    include: baseInclude,
  });

  if (!invoice) return null;

  {{#if kitchen}}
  // Map food orders only if kitchen module is enabled
  if (invoice.booking && invoice.booking.foodOrders) {
    (invoice.booking as any).foodOrders = invoice.booking.foodOrders.map((fo: any) => {
      const orderItems = (fo.items || []).map((item: any) => ({
        ...item,
        unit_price: item.price,
        menu_items: item.foodItem,
      }));

      return {
        ...fo,
        order_id: fo.id,
        order_items: orderItems,
      };
    });
  }
  {{/if}}

  return invoice;
}

// Service to get billing summary for dashboard
export async function getBillingSummary(guestId?: string) {
  const where: any = {};
  if (guestId) {
    where.guest_id = guestId;
  }

  const [totalInvoices, paidInvoices, partialInvoices, unpaidInvoices, totalAmount, totalPaid, balanceDue] = await Promise.all([
    prisma.billingInvoice.count({ where }),
    prisma.billingInvoice.count({ where: { ...where, payment_status: "Paid" } }),
    prisma.billingInvoice.count({ where: { ...where, payment_status: "Partial" } }),
    prisma.billingInvoice.count({ where: { ...where, payment_status: "Unpaid" } }),
    prisma.billingInvoice.aggregate({ where, _sum: { total_amount: true } }),
    prisma.billingInvoice.aggregate({ where, _sum: { amount_paid: true } }),
    prisma.billingInvoice.aggregate({ where, _sum: { balance_due: true } }),
  ]);

  return {
    totalInvoices,
    paidInvoices,
    partialInvoices,
    unpaidInvoices,
    totalAmount: Number(totalAmount._sum.total_amount || 0),
    totalPaid: Number(totalPaid._sum.amount_paid || 0),
    balanceDue: Number(balanceDue._sum.balance_due || 0),
  };
}