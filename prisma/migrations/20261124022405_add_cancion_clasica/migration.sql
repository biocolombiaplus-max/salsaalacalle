-- CreateTable
CREATE TABLE "CancionClasica" (
    "id" TEXT NOT NULL,
    "cancion" TEXT NOT NULL,
    "artista" TEXT NOT NULL,
    "votos" INTEGER NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CancionClasica_pkey" PRIMARY KEY ("id")
);
