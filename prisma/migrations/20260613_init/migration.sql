CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'operador',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vereador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "partido" TEXT NOT NULL,
    "legislatura" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vereador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comissao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'permanente',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comissao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComissaoMembro" (
    "id" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "vereadorId" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComissaoMembro_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Analista" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "comissaoId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analista_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Proposicao" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "ementa" TEXT NOT NULL,
    "origemTipo" TEXT NOT NULL,
    "autorVereadorId" TEXT,
    "autorExterno" TEXT,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_tramitacao',
    "dispensaParecer" BOOLEAN NOT NULL DEFAULT false,
    "regimeUrgencia" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proposicao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposicaoComissao" (
    "id" TEXT NOT NULL,
    "proposicaoId" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "analistaId" TEXT,
    "ordem" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando',
    "parecer" TEXT,
    "parecerTexto" TEXT,
    "parecerConjunto" BOOLEAN NOT NULL DEFAULT false,
    "dataEnvio" TIMESTAMP(3),
    "dataVotacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProposicaoComissao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VotoParecerVereador" (
    "id" TEXT NOT NULL,
    "proposicaoComissaoId" TEXT NOT NULL,
    "vereadorId" TEXT NOT NULL,
    "aprovado" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VotoParecerVereador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Emenda" (
    "id" TEXT NOT NULL,
    "proposicaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "autorVereadorId" TEXT,
    "autorNome" TEXT,
    "artigo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Emenda_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" INTEGER,
    "ano" INTEGER,
    "local" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "ata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PautaItem" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "proposicaoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "resultado" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PautaItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "ComissaoMembro_comissaoId_papel_key" ON "ComissaoMembro"("comissaoId", "papel");
CREATE UNIQUE INDEX "Analista_comissaoId_key" ON "Analista"("comissaoId");
CREATE UNIQUE INDEX "VotoParecerVereador_proposicaoComissaoId_vereadorId_key" ON "VotoParecerVereador"("proposicaoComissaoId", "vereadorId");

ALTER TABLE "ComissaoMembro" ADD CONSTRAINT "ComissaoMembro_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "Comissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComissaoMembro" ADD CONSTRAINT "ComissaoMembro_vereadorId_fkey" FOREIGN KEY ("vereadorId") REFERENCES "Vereador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Analista" ADD CONSTRAINT "Analista_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "Comissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Proposicao" ADD CONSTRAINT "Proposicao_autorVereadorId_fkey" FOREIGN KEY ("autorVereadorId") REFERENCES "Vereador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProposicaoComissao" ADD CONSTRAINT "ProposicaoComissao_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "Proposicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposicaoComissao" ADD CONSTRAINT "ProposicaoComissao_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "Comissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProposicaoComissao" ADD CONSTRAINT "ProposicaoComissao_analistaId_fkey" FOREIGN KEY ("analistaId") REFERENCES "Analista"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VotoParecerVereador" ADD CONSTRAINT "VotoParecerVereador_proposicaoComissaoId_fkey" FOREIGN KEY ("proposicaoComissaoId") REFERENCES "ProposicaoComissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VotoParecerVereador" ADD CONSTRAINT "VotoParecerVereador_vereadorId_fkey" FOREIGN KEY ("vereadorId") REFERENCES "Vereador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Emenda" ADD CONSTRAINT "Emenda_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "Proposicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Emenda" ADD CONSTRAINT "Emenda_autorVereadorId_fkey" FOREIGN KEY ("autorVereadorId") REFERENCES "Vereador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PautaItem" ADD CONSTRAINT "PautaItem_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PautaItem" ADD CONSTRAINT "PautaItem_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "Proposicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
