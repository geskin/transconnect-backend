-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "bio" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "pronouns" DROP NOT NULL;
