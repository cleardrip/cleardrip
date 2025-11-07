/*
  Warnings:

  - Added the required column `email` to the `OTPSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OTPSession" ADD COLUMN     "email" TEXT NOT NULL;
