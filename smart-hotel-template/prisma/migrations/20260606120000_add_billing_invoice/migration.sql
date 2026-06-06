-- CreateTable
CREATE TABLE "billing_invoice" (
    "invoice_id" SERIAL NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "guest_id" TEXT NOT NULL,
    "room_charges" DECIMAL(10,2) NOT NULL,
    "service_charges" DECIMAL(10,2) NOT NULL,
    "food_charges" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_percent" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "balance_due" DECIMAL(10,2) NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'Unpaid',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_invoice_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "payment_id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoice_invoice_number_key" ON "billing_invoice"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoice_booking_id_key" ON "billing_invoice"("booking_id");

-- CreateIndex
CREATE INDEX "billing_invoice_guest_id_idx" ON "billing_invoice"("guest_id");

-- CreateIndex
CREATE INDEX "billing_invoice_booking_id_idx" ON "billing_invoice"("booking_id");

-- CreateIndex
CREATE INDEX "billing_invoice_payment_status_idx" ON "billing_invoice"("payment_status");

-- CreateIndex
CREATE INDEX "invoice_payments_invoice_id_idx" ON "invoice_payments"("invoice_id");

-- AddForeignKey
ALTER TABLE "billing_invoice" ADD CONSTRAINT "billing_invoice_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking_reservation"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoice" ADD CONSTRAINT "billing_invoice_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing_invoice"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;
