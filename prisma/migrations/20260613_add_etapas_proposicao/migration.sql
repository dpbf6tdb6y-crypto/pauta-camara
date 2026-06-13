ALTER TABLE "Proposicao" ADD COLUMN "dispensaIntersticio" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Proposicao" ADD COLUMN "numVotacoes" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Proposicao" ADD COLUMN "etapaAtual" TEXT NOT NULL DEFAULT 'protocolado';
