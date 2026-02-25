/*
  Warnings:

  - The `status` column on the `notes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "note_status" AS ENUM ('processing', 'transcribed', 'summarized', 'failed');

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "status",
ADD COLUMN     "status" "note_status" NOT NULL DEFAULT 'processing';
