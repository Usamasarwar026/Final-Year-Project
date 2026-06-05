-- CreateEnum
CREATE TYPE "Department" AS ENUM ('Reception', 'Housekeeping', 'Kitchen', 'Management', 'Security', 'Other');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('Morning', 'Evening', 'Night', 'Flexible');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('Present', 'Absent', 'HalfDay', 'Leave');

-- CreateTable
CREATE TABLE "staff" (
    "staff_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "cnic" TEXT,
    "department" "Department" NOT NULL,
    "designation" TEXT NOT NULL,
    "shift" "ShiftType" NOT NULL DEFAULT 'Morning',
    "joining_date" DATE,
    "basic_salary" DECIMAL(10,2),
    "attendance_status" "AttendanceStatus",
    "performance_notes" TEXT,
    "is_on_duty" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("staff_id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" SERIAL NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "hours" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_cnic_key" ON "staff"("cnic");

-- CreateIndex
CREATE INDEX "staff_department_idx" ON "staff"("department");

-- CreateIndex
CREATE INDEX "staff_is_active_idx" ON "staff"("is_active");

-- CreateIndex
CREATE INDEX "staff_is_on_duty_idx" ON "staff"("is_on_duty");

-- CreateIndex
CREATE INDEX "attendance_logs_date_idx" ON "attendance_logs"("date");

-- CreateIndex
CREATE INDEX "attendance_logs_staff_id_idx" ON "attendance_logs"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_staff_id_date_key" ON "attendance_logs"("staff_id", "date");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("staff_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
