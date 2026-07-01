-- AlterTable Requerimento: add vereadorId
ALTER TABLE "Requerimento" ADD COLUMN "vereadorId" TEXT;

-- AlterTable Tag: add vereadorId
ALTER TABLE "Tag" ADD COLUMN "vereadorId" TEXT;

-- AddForeignKey Requerimento -> Vereador
ALTER TABLE "Requerimento" ADD CONSTRAINT "Requerimento_vereadorId_fkey"
    FOREIGN KEY ("vereadorId") REFERENCES "Vereador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Tag -> Vereador
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_vereadorId_fkey"
    FOREIGN KEY ("vereadorId") REFERENCES "Vereador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
