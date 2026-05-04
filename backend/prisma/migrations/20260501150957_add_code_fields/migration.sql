/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Leave` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Payroll` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Position` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Leave` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Payroll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Shift` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "Employee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Leave_code_key" ON "Leave"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_code_key" ON "Payroll"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Position_code_key" ON "Position"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_code_key" ON "Shift"("code");
