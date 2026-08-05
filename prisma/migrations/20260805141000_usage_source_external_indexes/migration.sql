-- CreateIndex
CREATE INDEX "CollectionItem_source_externalId_idx" ON "CollectionItem"("source", "externalId");

-- CreateIndex
CREATE INDEX "ProfileSkill_source_externalId_idx" ON "ProfileSkill"("source", "externalId");

-- CreateIndex
CREATE INDEX "ProfileMcp_source_externalId_idx" ON "ProfileMcp"("source", "externalId");

-- CreateIndex
CREATE INDEX "ProfileDoc_source_externalId_idx" ON "ProfileDoc"("source", "externalId");

-- CreateIndex
CREATE INDEX "ProfileAgent_source_externalId_idx" ON "ProfileAgent"("source", "externalId");
