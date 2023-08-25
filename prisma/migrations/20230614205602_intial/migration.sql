/*
  Warnings:

  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char`.
  - You are about to alter the column `first_name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char`.
  - You are about to alter the column `other_name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char`.
  - You are about to alter the column `surname` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char`.
  - You are about to alter the column `phone_number` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char`.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char`.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "image" TEXT,
ALTER COLUMN "email" SET DATA TYPE CHAR,
ALTER COLUMN "first_name" SET DATA TYPE CHAR,
ALTER COLUMN "other_name" SET DATA TYPE CHAR,
ALTER COLUMN "password" SET DATA TYPE CHAR,
ALTER COLUMN "surname" SET DATA TYPE CHAR,
ALTER COLUMN "phone_number" SET DATA TYPE CHAR,
ALTER COLUMN "role" SET DATA TYPE CHAR;

-- DropEnum
DROP TYPE "Role";
