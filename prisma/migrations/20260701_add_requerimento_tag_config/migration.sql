-- CreateTable ConfigOpcao
CREATE TABLE "ConfigOpcao" (
    "id"        TEXT NOT NULL,
    "tipo"      TEXT NOT NULL,
    "nome"      TEXT NOT NULL,
    "ativo"     BOOLEAN NOT NULL DEFAULT true,
    "ordem"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigOpcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable Requerimento
CREATE TABLE "Requerimento" (
    "id"            TEXT NOT NULL,
    "referencia"    TEXT NOT NULL,
    "data"          TIMESTAMP(3) NOT NULL,
    "texto"         TEXT NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'Aguardando',
    "relevancia"    TEXT,
    "origem"        TEXT,
    "categoria"     TEXT,
    "secretaria"    TEXT,
    "dataConclusao" TIMESTAMP(3),
    "documentos"    TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Requerimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable Tag
CREATE TABLE "Tag" (
    "id"            TEXT NOT NULL,
    "referencia"    TEXT NOT NULL,
    "data"          TIMESTAMP(3) NOT NULL,
    "pedido"        TEXT NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'Aguardando',
    "relevancia"    TEXT,
    "origem"        TEXT,
    "categoria"     TEXT,
    "secretaria"    TEXT,
    "dataConclusao" TIMESTAMP(3),
    "documentos"    TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfigOpcao_tipo_nome_key" ON "ConfigOpcao"("tipo", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Requerimento_referencia_key" ON "Requerimento"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_referencia_key" ON "Tag"("referencia");
