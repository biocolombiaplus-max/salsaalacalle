-- CreateTable
CREATE TABLE "SongRequest" (
    "id" TEXT NOT NULL,
    "cancion" TEXT NOT NULL,
    "artista" TEXT,
    "nombre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SongRequest_createdAt_idx" ON "SongRequest"("createdAt");
