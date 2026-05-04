/*
  Warnings:

  - You are about to drop the column `bonus` on the `Payroll` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `status` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shiftId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overtimePay` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAbsent` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalLate` to the `Payroll` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'OVERTIME');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "isOvertime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "AttendanceStatus" NOT NULL,
ALTER COLUMN "lateMinutes" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "shiftId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payroll" DROP COLUMN "bonus",
ADD COLUMN     "overtimePay" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalAbsent" INTEGER NOT NULL,
ADD COLUMN     "totalLate" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "lateTolerance" INTEGER NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
