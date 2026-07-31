-- CreateEnum
CREATE TYPE "CatalogEntryType" AS ENUM ('skill', 'agent', 'mcp', 'doc');

-- CreateTable
CREATE TABLE "CatalogEntry" (
    "id" TEXT NOT NULL,
    "type" "CatalogEntryType" NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "metadata" JSONB,
    "contentHash" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogEntry_type_idx" ON "CatalogEntry"("type");

-- CreateIndex
CREATE INDEX "CatalogEntry_source_idx" ON "CatalogEntry"("source");

-- CreateIndex
CREATE INDEX "CatalogEntry_fetchedAt_idx" ON "CatalogEntry"("fetchedAt");

-- CreateIndex
CREATE INDEX "CatalogEntry_name_idx" ON "CatalogEntry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogEntry_source_externalId_key" ON "CatalogEntry"("source", "externalId");
