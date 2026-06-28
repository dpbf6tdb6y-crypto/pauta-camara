CREATE TABLE "Segov" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ano" INTEGER NOT NULL DEFAULT 2026,
    "tipo" TEXT NOT NULL,
    "ementa" TEXT NOT NULL,
    "vereadorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aguardando',
    "dataEnvio" TIMESTAMP(3),
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Segov_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Segov" ADD CONSTRAINT "Segov_vereadorId_fkey"
    FOREIGN KEY ("vereadorId") REFERENCES "Vereador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
