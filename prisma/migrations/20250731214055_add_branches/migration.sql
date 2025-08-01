-- CreateEnum
CREATE TYPE "public"."BranchType" AS ENUM ('THEME', 'EMOTION', 'TIME', 'MEMORY', 'MANUAL', 'SEMANTIC');

-- CreateTable
CREATE TABLE "public"."branches" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_sourceId_targetId_key" ON "public"."branches"("sourceId", "targetId");

-- AddForeignKey
ALTER TABLE "public"."branches" ADD CONSTRAINT "branches_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."fragments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branches" ADD CONSTRAINT "branches_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."fragments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
