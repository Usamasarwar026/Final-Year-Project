-- AlterTable
ALTER TABLE "kitchen_tasks" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "started_at" TIMESTAMP(3);

-- DropEnum
DROP TYPE "Department";

-- DropEnum
DROP TYPE "ShiftType";
