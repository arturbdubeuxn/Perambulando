-- Funcionamento semanal fictício; somente gastronomia/comércio do lote.
-- Não altera tipos, horários já existentes, hosts, eventos ou dados reais.
\set ON_ERROR_STOP on
SET client_encoding TO 'UTF8';
BEGIN;
SET LOCAL lock_timeout='10s';
SELECT pg_advisory_xact_lock(25112026,75);
LOCK TABLE "HostOpeningDays","HostOpeningPeriods" IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE hours_targets ON COMMIT DROP AS
SELECT h."Id",CASE
  WHEN h."Typeofhost"=2 THEN 'comercio'
  WHEN h."Name" LIKE 'Café%' OR h."Name" LIKE 'Livraria%' THEN 'cafe'
  WHEN h."Name" LIKE 'Espaço%' OR h."Name" LIKE 'Terraço%' THEN 'noturno'
  ELSE 'restaurante' END profile
FROM "Hosts" h
WHERE h."UserId"='demo-rosarinho-20261125' AND h."Typeofhost" IN (1,2)
AND NOT EXISTS (SELECT 1 FROM "HostOpeningDays" d WHERE d."HostId"=h."Id");

INSERT INTO "HostOpeningDays" ("HostId","DayOfWeek","IsClosed")
SELECT t."Id",g.day,
  CASE WHEN t.profile='comercio' THEN g.day=0
       WHEN t.profile='cafe' THEN false
       ELSE g.day=1 END
FROM hours_targets t CROSS JOIN generate_series(0,6) g(day);

INSERT INTO "HostOpeningPeriods" ("HostOpeningDayId","OpeningTime","ClosingTime","ClosesNextDay")
SELECT d."Id",v.opens::time,v.closes::time,v.next_day
FROM "HostOpeningDays" d JOIN hours_targets t ON t."Id"=d."HostId"
CROSS JOIN LATERAL (
  SELECT '09:00' opens,'12:00' closes,false next_day WHERE t.profile='comercio'
  UNION ALL SELECT '14:00','18:00',false WHERE t.profile='comercio'
  UNION ALL SELECT '08:00',
                   CASE WHEN d."DayOfWeek"=0 THEN '13:00' ELSE '20:00' END,false WHERE t.profile='cafe'
  UNION ALL SELECT CASE WHEN d."DayOfWeek"=0 THEN '16:00' ELSE '18:00' END,
                   CASE WHEN d."DayOfWeek" IN (5,6) THEN '02:00' WHEN d."DayOfWeek"=0 THEN '22:00' ELSE '23:00' END,
                   d."DayOfWeek" IN (5,6) WHERE t.profile='noturno'
  UNION ALL SELECT '11:30','15:00',false WHERE t.profile='restaurante'
  UNION ALL SELECT '18:00','22:00',false WHERE t.profile='restaurante'
) v WHERE NOT d."IsClosed";

DO $check$
BEGIN
 IF (SELECT count(*) FROM "Hosts" WHERE "UserId"='demo-rosarinho-20261125' AND "Typeofhost" IN (1,2))<>50 THEN
   RAISE EXCEPTION 'Lote elegível diferente do esperado.';
 END IF;
 IF EXISTS (
   SELECT h."Id" FROM "Hosts" h LEFT JOIN "HostOpeningDays" d ON d."HostId"=h."Id"
   WHERE h."UserId"='demo-rosarinho-20261125' AND h."Typeofhost" IN (1,2)
   GROUP BY h."Id" HAVING count(d."Id")<>7 OR count(DISTINCT d."DayOfWeek")<>7
 ) THEN RAISE EXCEPTION 'Semana incompleta.'; END IF;
 IF EXISTS (
   SELECT 1 FROM "HostOpeningDays" d JOIN "Hosts" h ON h."Id"=d."HostId"
   WHERE h."UserId"='demo-rosarinho-20261125' AND h."Typeofhost" IN (1,2) AND
     (d."DayOfWeek" NOT BETWEEN 0 AND 6 OR
      d."IsClosed"=EXISTS(SELECT 1 FROM "HostOpeningPeriods" p WHERE p."HostOpeningDayId"=d."Id"))
 ) THEN RAISE EXCEPTION 'Dia fechado com períodos ou aberto sem períodos.'; END IF;
 IF EXISTS (
   SELECT 1 FROM "HostOpeningPeriods" p JOIN "HostOpeningDays" d ON d."Id"=p."HostOpeningDayId"
   JOIN "Hosts" h ON h."Id"=d."HostId"
   WHERE h."UserId"='demo-rosarinho-20261125' AND
     (extract(epoch FROM p."ClosingTime"-p."OpeningTime")+CASE WHEN p."ClosesNextDay" THEN 86400 ELSE 0 END NOT BETWEEN 1 AND 86400)
 ) THEN RAISE EXCEPTION 'Duração inválida.'; END IF;
 IF EXISTS (
   WITH intervals AS (
     SELECT d."HostId",p."Id",d."DayOfWeek"*86400+extract(epoch FROM p."OpeningTime") s,
       d."DayOfWeek"*86400+extract(epoch FROM p."ClosingTime")+CASE WHEN p."ClosesNextDay" THEN 86400 ELSE 0 END e
     FROM "HostOpeningPeriods" p JOIN "HostOpeningDays" d ON d."Id"=p."HostOpeningDayId"
     JOIN "Hosts" h ON h."Id"=d."HostId" WHERE h."UserId"='demo-rosarinho-20261125'
   ) SELECT 1 FROM intervals a JOIN intervals b ON a."HostId"=b."HostId" AND a."Id"<b."Id"
     CROSS JOIN (VALUES (-604800),(0),(604800)) offsets(v)
     WHERE a.s < b.e+offsets.v AND b.s+offsets.v < a.e
 ) THEN RAISE EXCEPTION 'Períodos sobrepostos na semana.'; END IF;
END $check$;
SELECT t.profile,count(DISTINCT d."HostId") hosts,count(DISTINCT d."Id") dias,count(p."Id") periodos
FROM hours_targets t JOIN "HostOpeningDays" d ON d."HostId"=t."Id"
LEFT JOIN "HostOpeningPeriods" p ON p."HostOpeningDayId"=d."Id" GROUP BY t.profile;
COMMIT;
