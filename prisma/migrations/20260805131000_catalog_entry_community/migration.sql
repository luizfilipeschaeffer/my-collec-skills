-- AlterTable
ALTER TABLE "CatalogEntry" ADD COLUMN     "submittedById" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "subcategoryId" TEXT;

-- CreateIndex
CREATE INDEX "CatalogEntry_submittedById_idx" ON "CatalogEntry"("submittedById");

-- CreateIndex
CREATE INDEX "CatalogEntry_categoryId_idx" ON "CatalogEntry"("categoryId");

-- CreateIndex
CREATE INDEX "CatalogEntry_subcategoryId_idx" ON "CatalogEntry"("subcategoryId");

-- AddForeignKey
ALTER TABLE "CatalogEntry" ADD CONSTRAINT "CatalogEntry_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogEntry" ADD CONSTRAINT "CatalogEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogEntry" ADD CONSTRAINT "CatalogEntry_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
