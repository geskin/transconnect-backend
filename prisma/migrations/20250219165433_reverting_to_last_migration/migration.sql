/*
  Warnings:

  - You are about to drop the `_ResourceTypes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ResourceTypes" DROP CONSTRAINT "_ResourceTypes_A_fkey";

-- DropForeignKey
ALTER TABLE "_ResourceTypes" DROP CONSTRAINT "_ResourceTypes_B_fkey";

-- DropTable
DROP TABLE "_ResourceTypes";

-- CreateTable
CREATE TABLE "_ResourceToType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ResourceToType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ResourceToType_B_index" ON "_ResourceToType"("B");

-- AddForeignKey
ALTER TABLE "_ResourceToType" ADD CONSTRAINT "_ResourceToType_A_fkey" FOREIGN KEY ("A") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceToType" ADD CONSTRAINT "_ResourceToType_B_fkey" FOREIGN KEY ("B") REFERENCES "Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;
