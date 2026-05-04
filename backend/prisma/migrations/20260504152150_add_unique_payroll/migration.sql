/*
  Warnings:

  - You are about to drop the column `code` on the `Payroll` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId,month,year]` on the table `Payroll` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Payroll_code_key";

-- AlterTable
ALTER TABLE "Payroll" DROP COLUMN "code";

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_employeeId_month_year_key" ON "Payroll"("employeeId", "month", "year");
