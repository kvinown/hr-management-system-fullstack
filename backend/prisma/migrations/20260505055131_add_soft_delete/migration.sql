-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
