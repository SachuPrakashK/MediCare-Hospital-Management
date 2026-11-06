ALTER TABLE "Admission" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Admission_deletedAt_idx" ON "Admission"("deletedAt");
