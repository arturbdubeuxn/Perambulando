-- Fotos ilustrativas externas: não representam os locais fictícios do lote.
-- Preenche apenas imagens vazias do usuário técnico; preserva dados reais.
\set ON_ERROR_STOP on
SET client_encoding TO 'UTF8';
BEGIN;
SELECT pg_advisory_xact_lock(25112026, 75);
DO $check$
BEGIN
  IF (SELECT count(*) FROM "Hosts" WHERE "UserId"='demo-rosarinho-20261125') <> 75 OR
     (SELECT count(*) FROM "Programmings" p JOIN "Hosts" h ON h."Id"=p."HostId" WHERE h."UserId"='demo-rosarinho-20261125') <> 50 THEN
    RAISE EXCEPTION 'Lote esperado de 75 hosts/50 eventos não encontrado: nenhuma imagem alterada.';
  END IF;
END $check$;

UPDATE "Hosts" SET "LogoUrl" = 'https://images.unsplash.com/photo-' ||
  CASE
    WHEN "Name" LIKE 'Café%' THEN '1501339847302-ac426a4a7cbb'
    WHEN "Name" LIKE 'Bistrô%' OR "Name" LIKE 'Cozinha%' THEN '1517248135467-4c7edcad34c4'
    WHEN "Name" LIKE 'Ateliê%' OR "Name" LIKE 'Galeria%' OR "Name" LIKE 'Oficina%' THEN '1513364776144-60967b0f800f'
    WHEN "Name" LIKE 'Livraria%' THEN '1507842217343-583bb7270b66'
    WHEN "Name" LIKE 'Casa do Frevo%' OR "Name" LIKE 'Varanda%' OR "Name" LIKE 'Estúdio%' THEN '1511379938547-c1f69419868d'
    WHEN "Name" LIKE 'Mercado%' THEN '1504674900247-0877df9cc836'
    WHEN "Name" LIKE 'Jardim%' OR "Name" LIKE 'Pátio%' THEN '1492684223066-81342ee5ff30'
    ELSE '1511795409834-ef04bbd61622'
  END || '?auto=format&fit=crop&w=960&q=80', "UpdatedAt"=now()
WHERE "UserId"='demo-rosarinho-20261125' AND btrim("LogoUrl")='';

UPDATE "Programmings" p SET "ImageUrl" = 'https://images.unsplash.com/photo-' ||
  CASE
    WHEN p."Name" LIKE 'Roda de choro%' OR p."Name" LIKE 'Jazz%' THEN '1514525253161-7a46d19cd819'
    WHEN p."Name" LIKE 'Oficina%' OR p."Name" LIKE 'Exposição%' THEN '1513364776144-60967b0f800f'
    WHEN p."Name" LIKE 'Sarau%' OR p."Name" LIKE 'Clube de leitura%' THEN '1507842217343-583bb7270b66'
    WHEN p."Name" LIKE 'Festival de sabores%' THEN '1504674900247-0877df9cc836'
    WHEN p."Name" LIKE 'Aula aberta%' THEN '1513151233558-d860c5398176'
    WHEN p."Name" LIKE 'Feira%' THEN '1492684223066-81342ee5ff30'
    ELSE '1511795409834-ef04bbd61622'
  END || '?auto=format&fit=crop&w=960&q=80', "UpdateDate"=now()
FROM "Hosts" h
WHERE h."Id"=p."HostId" AND h."UserId"='demo-rosarinho-20261125' AND btrim(p."ImageUrl")='';

DO $check$
BEGIN
  IF EXISTS (SELECT 1 FROM "Hosts" WHERE "UserId"='demo-rosarinho-20261125' AND btrim("LogoUrl")='') OR
     EXISTS (SELECT 1 FROM "Programmings" p JOIN "Hosts" h ON h."Id"=p."HostId" WHERE h."UserId"='demo-rosarinho-20261125' AND btrim(p."ImageUrl")='') THEN
    RAISE EXCEPTION 'Há imagens ausentes: transação revertida.';
  END IF;
END $check$;
SELECT 'hosts com imagem' AS item,count(*) FROM "Hosts" WHERE "UserId"='demo-rosarinho-20261125' AND "LogoUrl"<>''
UNION ALL
SELECT 'eventos com imagem',count(*) FROM "Programmings" p JOIN "Hosts" h ON h."Id"=p."HostId" WHERE h."UserId"='demo-rosarinho-20261125' AND p."ImageUrl"<>'';
COMMIT;
