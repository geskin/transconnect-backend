/*
  Warnings:

  - Made the column `content` on table `Post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bio` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pronouns` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "content" SET NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "bio" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "pronouns" SET NOT NULL;
