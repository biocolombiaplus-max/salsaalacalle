-- Agrega el número de cédula a los registros, exigiendo que sea único
-- (a diferencia del correo, que sí puede repetirse) para evitar que una
-- misma persona se registre más de una vez.
--
-- Se agrega primero como columna opcional, se rellenan las filas
-- existentes (si las hay) con un valor único de respaldo derivado del id,
-- y solo entonces se exige NOT NULL + UNIQUE. Esto evita que la migración
-- falle si ya existen registros sin cédula en producción.

ALTER TABLE "Registration" ADD COLUMN "cedula" TEXT;

UPDATE "Registration" SET "cedula" = 'SIN-CEDULA-' || "id" WHERE "cedula" IS NULL;

ALTER TABLE "Registration" ALTER COLUMN "cedula" SET NOT NULL;

CREATE UNIQUE INDEX "Registration_cedula_key" ON "Registration"("cedula");
