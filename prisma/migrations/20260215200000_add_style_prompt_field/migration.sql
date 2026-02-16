-- AlterTable
ALTER TABLE "Style" ADD COLUMN "prompt" TEXT NOT NULL DEFAULT '';

-- Copy existing description (prompt modifier text) into the new prompt column
UPDATE "Style" SET "prompt" = "description";
