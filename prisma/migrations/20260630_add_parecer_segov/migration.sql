ALTER TABLE "Segov" ADD COLUMN "parecerComissao" TEXT;
ALTER TABLE "Segov" ADD COLUMN "parecerConjunto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Segov" ADD COLUMN "proxComissao" TEXT;
ALTER TABLE "Segov" ADD COLUMN "dataParecere" TIMESTAMP(3);
