/*
  Warnings:

  - You are about to drop the `_ResourceToType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ResourceToType" DROP CONSTRAINT "_ResourceToType_A_fkey";

-- DropForeignKey
ALTER TABLE "_ResourceToType" DROP CONSTRAINT "_ResourceToType_B_fkey";

-- DropTable
DROP TABLE "_ResourceToType";

-- CreateTable
CREATE TABLE "_ResourceTypes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ResourceTypes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ResourceTypes_B_index" ON "_ResourceTypes"("B");

-- AddForeignKey
ALTER TABLE "_ResourceTypes" ADD CONSTRAINT "_ResourceTypes_A_fkey" FOREIGN KEY ("A") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceTypes" ADD CONSTRAINT "_ResourceTypes_B_fkey" FOREIGN KEY ("B") REFERENCES "Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;
