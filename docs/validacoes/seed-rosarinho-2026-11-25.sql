-- Dados sintéticos; não representam empresas, endereços ou eventos reais.
-- Execução atômica e repetível: não duplica o lote e não modifica dados existentes.
\set ON_ERROR_STOP on
SET client_encoding TO 'UTF8';
BEGIN;
SELECT pg_advisory_xact_lock(25112026, 75);
CREATE TEMP TABLE seed_before ON COMMIT DROP AS
SELECT (SELECT count(*) FROM "Hosts") hosts, (SELECT count(*) FROM "Programmings") events;
DO $seed$
DECLARE
 owner_id text := 'demo-rosarinho-20261125';
 marker text := '[DEMO ROSARINHO 2026-11-25]';
 address_id integer;
 host_id integer;
 event_id integer;
 category_id integer;
 role_id text;
 i integer;
 j integer;
 n integer;
 neighborhood text;
 lat double precision;
 lon double precision;
 title text;
 theme text;
 category_name text;
 cnpj_value text;
 cnpj_length integer;
 cnpj_position integer;
 cnpj_sum integer;
 cnpj_weight integer;
 cnpj_remainder integer;
 demo_cnpjs text[] := ARRAY[]::text[];
 event_start timestamptz;
 before_hosts integer;
 before_events integer;
 roots text[] := ARRAY['Casa do Frevo','Café do Quintal','Ateliê das Cores','Bistrô do Bairro','Espaço Maré','Jardim Cultural','Varanda do Som','Galeria Aurora','Cozinha Afetiva','Pátio das Artes','Livraria Horizonte','Estúdio Movimento','Mercado Criativo','Terraço do Encontro','Oficina dos Saberes'];
 themes text[] := ARRAY['Roda de choro','Feira de artesanato','Oficina de aquarela','Sarau de poesia','Festival de sabores','Jazz no quintal','Clube de leitura','Aula aberta de dança','Exposição de fotografia','Encontro de jogos de tabuleiro'];
 cats text[] := ARRAY['Música (demo)','Feiras (demo)','Oficinas (demo)','Literatura (demo)','Gastronomia (demo)','Música (demo)','Literatura (demo)','Dança (demo)','Artes visuais (demo)','Jogos (demo)'];
BEGIN
 IF EXISTS (SELECT 1 FROM "Hosts" WHERE "UserId"=owner_id) THEN
   IF (SELECT count(*) FROM "Hosts" WHERE "UserId"=owner_id) <> 75 OR
      (SELECT count(*) FROM "Programmings" p JOIN "Hosts" h ON h."Id"=p."HostId" WHERE h."UserId"=owner_id) <> 50 THEN
     RAISE EXCEPTION 'Lote existente incompleto: revisar antes de continuar.';
   END IF;
   RAISE NOTICE 'Lote completo já existe: nenhuma inserção realizada.';
   RETURN;
 END IF;
 IF EXISTS (SELECT 1 FROM "Users" WHERE "Id"=owner_id) THEN
   RAISE EXCEPTION 'Usuário técnico já existe sem o lote esperado; revisar.';
 END IF;
 SELECT hosts,events INTO before_hosts,before_events FROM seed_before;
 INSERT INTO "Users" ("Id","UserName","NormalizedUserName","Email","NormalizedEmail","IsActive","CreatedAt","Typeofuser","AccessFailedCount","LockoutEnabled","SecurityStamp","ConcurrencyStamp")
 VALUES (owner_id,'demo.rosarinho@example.invalid','DEMO.ROSARINHO@EXAMPLE.INVALID','demo.rosarinho@example.invalid','DEMO.ROSARINHO@EXAMPLE.INVALID',true,now(),0,0,true,owner_id,owner_id);
 SELECT "Id" INTO role_id FROM "AspNetRoles" WHERE "NormalizedName"='HOST' LIMIT 1;
 IF role_id IS NULL THEN
   RAISE EXCEPTION 'Papel HOST ausente: carga cancelada.';
 END IF;
 INSERT INTO "AspNetUserRoles" ("UserId","RoleId") VALUES (owner_id,role_id);
 FOR i IN 1..10 LOOP
   category_name := cats[i];
   IF NOT EXISTS (SELECT 1 FROM "Categories" WHERE "Name"=category_name AND "IsActive") THEN
     INSERT INTO "Categories" ("Name","IsActive") VALUES (category_name,true);
   END IF;
 END LOOP;
 FOR i IN 1..75 LOOP
   cnpj_value := 'DEMO'||lpad(i::text,8,'0');
   FOR cnpj_length IN 12..13 LOOP
     cnpj_sum := 0;
     cnpj_weight := 2;
     FOR cnpj_position IN REVERSE (cnpj_length-1)..0 LOOP
       cnpj_sum := cnpj_sum + (ascii(substring(cnpj_value FROM cnpj_position+1 FOR 1))-ascii('0'))*cnpj_weight;
       cnpj_weight := CASE WHEN cnpj_weight=9 THEN 2 ELSE cnpj_weight+1 END;
     END LOOP;
     cnpj_remainder := cnpj_sum%11;
     cnpj_value := cnpj_value || (CASE WHEN cnpj_remainder<2 THEN 0 ELSE 11-cnpj_remainder END)::text;
   END LOOP;
   demo_cnpjs := array_append(demo_cnpjs,cnpj_value);
   IF i <= 30 THEN
     neighborhood := 'Rosarinho'; lat := -8.0275; lon := -34.8940;
   ELSE
     n := (i-31)/9;
     neighborhood := (ARRAY['Tamarineira','Encruzilhada','Ponto de Parada','Aflitos','Jaqueira'])[n+1];
     lat := (ARRAY[-8.0215,-8.0325,-8.0235,-8.0350,-8.0340])[n+1];
     lon := (ARRAY[-34.9010,-34.8885,-34.8880,-34.8985,-34.9050])[n+1];
   END IF;
   lat := lat + ((i%5)-2)*0.0003;
   lon := lon + ((i%7)-3)*0.0003;
   INSERT INTO "Addresses" ("City","Street","Number","Complement","Neighborhood","CEP","Location","CreatedAt","AddWho")
   VALUES ('Recife','Rua Fictícia de Demonstração '||lpad(i::text,3,'0'),(100+i)::text,'Endereço sintético; não visitar',neighborhood,'00000000',ST_SetSRID(ST_MakePoint(lon,lat),4326)::geography,now(),owner_id)
   RETURNING "Id" INTO address_id;
   title := roots[((i-1)%15)+1]||' '||lpad(i::text,3,'0')||' — Fictício';
   INSERT INTO "Hosts" ("UserId","Typeofhost","CNPJ","LogoUrl","InstagranUrl","Phone","Name","Description","AddressId","IsActive","CreatedAt","UpdatedAt")
   VALUES (owner_id,(i-1)%3,cnpj_value,'','','',title,marker||' Estabelecimento fictício para testes em '||neighborhood||', Recife. Não é uma empresa real; localização aproximada e CNPJ de demonstração sem validade cadastral.',address_id,true,now(),now())
   RETURNING "Id" INTO host_id;
 END LOOP;
 FOR j IN 1..50 LOOP
   i := ((j-1)*7)%75+1;
   SELECT h."Id",h."AddressId" INTO host_id,address_id FROM "Hosts" h WHERE h."UserId"=owner_id AND h."CNPJ"=demo_cnpjs[i];
   theme := themes[((j-1)%10)+1];
   category_name := cats[((j-1)%10)+1];
   SELECT "Id" INTO category_id FROM "Categories" WHERE "Name"=category_name AND "IsActive" ORDER BY "Id" LIMIT 1;
   event_start := ((date '2026-11-25' + j) + time '18:00') AT TIME ZONE 'America/Recife';
   INSERT INTO "Programmings" ("Name","IsActive","Description","StartDate","EndDate","IsFree","ImageUrl","TicketUrl","InstagranUrl","HostId","AddressId","CreatedDate","UpdateDate","MinPrice","MaxPrice")
   VALUES (theme||' '||lpad(j::text,2,'0')||' — Fictício',true,marker||' Evento fictício de demonstração. Não há realização, venda de ingresso ou reserva real. Endereço e localização são sintéticos.',event_start,event_start+interval '3 hours',j%2=0,'','','',host_id,address_id,now(),now(),CASE WHEN j%2=0 THEN 0 ELSE 15+(j%6)*5 END,CASE WHEN j%2=0 THEN 0 ELSE 35+(j%6)*5 END)
   RETURNING "Id" INTO event_id;
   INSERT INTO "ProgrammingXCategories" ("ProgrammingId","CategoryId") VALUES (event_id,category_id);
 END LOOP;
 IF (SELECT count(*) FROM "Hosts" WHERE "UserId"=owner_id) <> 75 OR
    (SELECT count(*) FROM "Programmings" p JOIN "Hosts" h ON h."Id"=p."HostId" WHERE h."UserId"=owner_id) <> 50 THEN
   RAISE EXCEPTION 'Contagens divergentes: carga revertida.';
 END IF;
 IF (SELECT count(*) FROM "Hosts") <> before_hosts+75 OR (SELECT count(*) FROM "Programmings") <> before_events+50 THEN
   RAISE EXCEPTION 'Alteração concorrente ou contagens inesperadas: carga revertida.';
 END IF;
END $seed$;
SELECT a."Neighborhood",count(DISTINCT h."Id") AS hosts,count(p."Id") AS eventos
FROM "Hosts" h JOIN "Addresses" a ON a."Id"=h."AddressId"
LEFT JOIN "Programmings" p ON p."HostId"=h."Id"
WHERE h."UserId"='demo-rosarinho-20261125'
GROUP BY a."Neighborhood" ORDER BY a."Neighborhood";
COMMIT;

