-- Somente o lote fictício demo-rosarinho-20261125; fazer backup antes.
-- Referências geográficas © colaboradores do OpenStreetMap, ODbL:
-- https://www.openstreetmap.org/copyright
-- Bairros conferidos pelos polígonos públicos da Prefeitura do Recife.
-- Nomes, programação, preços e funcionamento continuam fictícios e sem vínculo com os locais reais.
\set ON_ERROR_STOP on
SET client_encoding TO 'UTF8';
BEGIN;
SET LOCAL TIME ZONE 'America/Recife';
SET LOCAL lock_timeout='10s';
SELECT pg_advisory_xact_lock(25112026,75);
LOCK TABLE "Hosts", "Addresses", "Programmings", "ProgrammingXCategories" IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE agenda_targets ON COMMIT DROP AS
SELECT h."Id", h."AddressId", h."Typeofhost", row_number() OVER (ORDER BY h."Id")::int seq
FROM "Hosts" h WHERE h."UserId"='demo-rosarinho-20261125';
CREATE TEMP TABLE agenda_protected ON COMMIT DROP AS
SELECT 'Hosts' kind, h."Id", to_jsonb(h) content FROM "Hosts" h WHERE h."UserId"<>'demo-rosarinho-20261125'
UNION ALL SELECT 'Programmings',p."Id",to_jsonb(p) FROM "Programmings" p WHERE NOT EXISTS (SELECT 1 FROM agenda_targets t WHERE t."Id"=p."HostId")
UNION ALL SELECT 'Addresses',a."Id",to_jsonb(a) FROM "Addresses" a WHERE NOT EXISTS (SELECT 1 FROM agenda_targets t WHERE t."AddressId"=a."Id");
CREATE TEMP TABLE agenda_original_events ON COMMIT DROP AS
SELECT p."Id",p."HostId",p."Name",p."StartDate",p."EndDate",p."ImageUrl",p."MinPrice",p."MaxPrice"
FROM "Programmings" p JOIN agenda_targets t ON t."Id"=p."HostId";

DO $check$
BEGIN
  IF (SELECT count(*) FROM agenda_targets)<>75 OR (SELECT count(DISTINCT "AddressId") FROM agenda_targets)<>75 THEN
    RAISE EXCEPTION 'Lote de 75 hosts e endereços distintos não encontrado.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Hosts" h JOIN agenda_targets t ON t."AddressId"=h."AddressId" WHERE h."UserId"<>'demo-rosarinho-20261125') OR
     EXISTS (SELECT 1 FROM "Programmings" p JOIN agenda_targets t ON t."AddressId"=p."AddressId" WHERE NOT EXISTS (SELECT 1 FROM agenda_targets own WHERE own."Id"=p."HostId")) THEN
    RAISE EXCEPTION 'Endereço do lote compartilhado com registro externo; revisar antes de alterar.';
  END IF;
END $check$;

CREATE TEMP TABLE agenda_references ON COMMIT DROP AS
SELECT ordinality::int seq, value reference
FROM jsonb_array_elements($refs$[
  {
    "osmType": "way",
    "osmId": 1395793330,
    "street": "Avenida Santos Dumont",
    "number": "1181",
    "neighborhood": "Rosarinho",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0315898,
    "longitude": -34.8956854
  },
  {
    "osmType": "node",
    "osmId": 2638519621,
    "street": "Rua Amaro Coutinho",
    "number": "951",
    "neighborhood": "Rosarinho",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0326206,
    "longitude": -34.8968693
  },
  {
    "osmType": "way",
    "osmId": 1286099801,
    "street": "Avenida Norte Miguel Arraes de Alencar",
    "number": "3301",
    "neighborhood": "Rosarinho",
    "city": "Recife",
    "cep": "52041005",
    "latitude": -8.0325126,
    "longitude": -34.8975046
  },
  {
    "osmType": "node",
    "osmId": 4752703924,
    "street": "Rua Doutor José Maria",
    "number": "836",
    "neighborhood": "Rosarinho",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0353118,
    "longitude": -34.8985232
  },
  {
    "osmType": "node",
    "osmId": 5730762889,
    "street": "Rua Doutor José Maria",
    "number": "848",
    "neighborhood": "Rosarinho",
    "city": "Recife",
    "cep": "",
    "latitude": -8.035276,
    "longitude": -34.8986348
  },
  {
    "osmType": "way",
    "osmId": 655189731,
    "street": "Rua José Carvalheira",
    "number": "415",
    "neighborhood": "Tamarineira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0285372,
    "longitude": -34.9030403
  },
  {
    "osmType": "way",
    "osmId": 678445597,
    "street": "Avenida Conselheiro Rosa e Silva",
    "number": "2130",
    "neighborhood": "Tamarineira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0332529,
    "longitude": -34.9031651
  },
  {
    "osmType": "way",
    "osmId": 655236010,
    "street": "Rua Gomes Coutinho",
    "number": "114",
    "neighborhood": "Tamarineira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0278299,
    "longitude": -34.9051925
  },
  {
    "osmType": "way",
    "osmId": 557017894,
    "street": "Rua Soares Moreno",
    "number": "187",
    "neighborhood": "Tamarineira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0296078,
    "longitude": -34.9052995
  },
  {
    "osmType": "way",
    "osmId": 777831646,
    "street": "Estrada do Arraial",
    "number": "2501",
    "neighborhood": "Tamarineira",
    "city": "Recife",
    "cep": "52051971",
    "latitude": -8.031242,
    "longitude": -34.9054239
  },
  {
    "osmType": "way",
    "osmId": 583073745,
    "street": "Rua Padre Roma",
    "number": "149",
    "neighborhood": "Tamarineira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0343474,
    "longitude": -34.9045794
  },
  {
    "osmType": "way",
    "osmId": 678445595,
    "street": "Estrada do Arraial",
    "number": "2.723",
    "neighborhood": "Tamarineira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.030993,
    "longitude": -34.9073631
  },
  {
    "osmType": "node",
    "osmId": 13885420052,
    "street": "Rua Afonso Celso",
    "number": "203",
    "neighborhood": "Tamarineira",
    "city": "Recife",
    "cep": "52060110",
    "latitude": -8.0319083,
    "longitude": -34.9073744
  },
  {
    "osmType": "way",
    "osmId": 254532346,
    "street": "Rua Rodolfo de Holanda",
    "number": "248",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0324875,
    "longitude": -34.8942418
  },
  {
    "osmType": "way",
    "osmId": 666485683,
    "street": "Avenida Beberibe",
    "number": "541",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "52041230",
    "latitude": -8.0326353,
    "longitude": -34.8922235
  },
  {
    "osmType": "node",
    "osmId": 13518380501,
    "street": "Rua Octávio de Freitas",
    "number": "256",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0340142,
    "longitude": -34.8936338
  },
  {
    "osmType": "way",
    "osmId": 655188589,
    "street": "Avenida Beberibe",
    "number": "419",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0337372,
    "longitude": -34.8919451
  },
  {
    "osmType": "node",
    "osmId": 2665035646,
    "street": "Rua Frederico",
    "number": "50",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0341254,
    "longitude": -34.8912072
  },
  {
    "osmType": "node",
    "osmId": 4802799925,
    "street": "Avenida Beberibe",
    "number": "174",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "52041430",
    "latitude": -8.0358889,
    "longitude": -34.891187
  },
  {
    "osmType": "node",
    "osmId": 4741387622,
    "street": "Rua Doutor Jose Maria",
    "number": "379",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "52041970",
    "latitude": -8.0368252,
    "longitude": -34.8946358
  },
  {
    "osmType": "node",
    "osmId": 5740125953,
    "street": "Rua Carlos Borromeu",
    "number": "27",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0371016,
    "longitude": -34.892871
  },
  {
    "osmType": "way",
    "osmId": 821123746,
    "street": "Estrada de Belém",
    "number": "17",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "52041760",
    "latitude": -8.036948,
    "longitude": -34.8908895
  },
  {
    "osmType": "way",
    "osmId": 666625883,
    "street": "Avenida Beberibe",
    "number": "1020",
    "neighborhood": "Ponto de Parada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0283687,
    "longitude": -34.8925842
  },
  {
    "osmType": "node",
    "osmId": 2639497584,
    "street": "Rua Carneiro Vilela",
    "number": "324",
    "neighborhood": "Aflitos",
    "city": "Recife",
    "cep": "",
    "latitude": -8.039151,
    "longitude": -34.894988
  },
  {
    "osmType": "node",
    "osmId": 4921453424,
    "street": "Rua Quarenta e Oito",
    "number": "569",
    "neighborhood": "Aflitos",
    "city": "Recife",
    "cep": "52020060",
    "latitude": -8.0414789,
    "longitude": -34.8939829
  },
  {
    "osmType": "node",
    "osmId": 4921455424,
    "street": "Rua Conselheiro Portela",
    "number": "339",
    "neighborhood": "Aflitos",
    "city": "Recife",
    "cep": "52020030",
    "latitude": -8.0423058,
    "longitude": -34.8946325
  },
  {
    "osmType": "node",
    "osmId": 3106377714,
    "street": "Avenida Conselheiro Rosa e Silva",
    "number": "1767",
    "neighborhood": "Jaqueira",
    "city": "Recife",
    "cep": "52050020",
    "latitude": -8.0369601,
    "longitude": -34.9018131
  },
  {
    "osmType": "way",
    "osmId": 379239256,
    "street": "Rua do Futuro",
    "number": "1309",
    "neighborhood": "Jaqueira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.034962,
    "longitude": -34.9051457
  },
  {
    "osmType": "node",
    "osmId": 5736986912,
    "street": "Rua do Futuro",
    "number": "959",
    "neighborhood": "Jaqueira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0374674,
    "longitude": -34.9031027
  },
  {
    "osmType": "way",
    "osmId": 384933569,
    "street": "Avenida Rui Barbosa",
    "number": "1541",
    "neighborhood": "Jaqueira",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0401576,
    "longitude": -34.9041919
  },
  {
    "osmType": "way",
    "osmId": 587561912,
    "street": "Avenida Beberibe",
    "number": "1165",
    "neighborhood": "Arruda",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0270523,
    "longitude": -34.893624
  },
  {
    "osmType": "way",
    "osmId": 666348433,
    "street": "Avenida Beberibe",
    "number": "1310",
    "neighborhood": "Arruda",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0256319,
    "longitude": -34.8931331
  },
  {
    "osmType": "way",
    "osmId": 666634893,
    "street": "Avenida Professor José dos Anjos",
    "number": "1775",
    "neighborhood": "Arruda",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0272163,
    "longitude": -34.8963032
  },
  {
    "osmType": "node",
    "osmId": 7354095344,
    "street": "Avenida Beberibe",
    "number": "1435",
    "neighborhood": "Arruda",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0247559,
    "longitude": -34.8939833
  },
  {
    "osmType": "way",
    "osmId": 666484985,
    "street": "Avenida Beberibe",
    "number": "1501",
    "neighborhood": "Arruda",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0239826,
    "longitude": -34.8941061
  },
  {
    "osmType": "way",
    "osmId": 663778507,
    "street": "Rua Pedro de Melo Pedrosa",
    "number": "151",
    "neighborhood": "Arruda",
    "city": "Recife",
    "cep": "52120350",
    "latitude": -8.0244913,
    "longitude": -34.8863581
  },
  {
    "osmType": "node",
    "osmId": 5220796821,
    "street": "Rua Lago do Feitosa",
    "number": "30",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "52030140",
    "latitude": -8.0346194,
    "longitude": -34.8866007
  },
  {
    "osmType": "node",
    "osmId": 4741372426,
    "street": "Estrada de Belém",
    "number": "44",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0371084,
    "longitude": -34.8903571
  },
  {
    "osmType": "node",
    "osmId": 9951259247,
    "street": "Rua Capitão Sampaio Xavier",
    "number": "332",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050210",
    "latitude": -8.0367064,
    "longitude": -34.8995807
  },
  {
    "osmType": "node",
    "osmId": 4806360622,
    "street": "Avenida João de Barros",
    "number": "1932",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "52021355",
    "latitude": -8.0379699,
    "longitude": -34.8913688
  },
  {
    "osmType": "node",
    "osmId": 4908626394,
    "street": "Avenida João de Barros",
    "number": "1912",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "50030230",
    "latitude": -8.038038,
    "longitude": -34.891522
  },
  {
    "osmType": "node",
    "osmId": 4741372427,
    "street": "Avenida João de Barros",
    "number": "1883",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "52021970",
    "latitude": -8.0381512,
    "longitude": -34.8919742
  },
  {
    "osmType": "way",
    "osmId": 666485522,
    "street": "Rua Castro Alves",
    "number": "62",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0378423,
    "longitude": -34.8904089
  },
  {
    "osmType": "way",
    "osmId": 655158069,
    "street": "Rua Castro Alves",
    "number": "143",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0376276,
    "longitude": -34.8895398
  },
  {
    "osmType": "way",
    "osmId": 384933364,
    "street": "Rua Capitão Sampaio Xavier",
    "number": "290",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0369964,
    "longitude": -34.8999358
  },
  {
    "osmType": "node",
    "osmId": 5740120907,
    "street": "Rua Larga do Feitosa",
    "number": "138",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0355126,
    "longitude": -34.8860735
  },
  {
    "osmType": "node",
    "osmId": 4331469906,
    "street": "Avenida João de Barros",
    "number": "1835",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "52021180",
    "latitude": -8.0386811,
    "longitude": -34.8922433
  },
  {
    "osmType": "node",
    "osmId": 5782886616,
    "street": "Avenida Conselheiro Rosa e Silva",
    "number": "1460",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050020",
    "latitude": -8.038554,
    "longitude": -34.8995092
  },
  {
    "osmType": "way",
    "osmId": 384933260,
    "street": "Avenida Conselheiro Rosa e Silva",
    "number": "1687",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0375556,
    "longitude": -34.9013761
  },
  {
    "osmType": "node",
    "osmId": 7293556913,
    "street": "Avenida Conselheiro Rosa e Silva",
    "number": "1492",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0386624,
    "longitude": -34.8998932
  },
  {
    "osmType": "way",
    "osmId": 384933290,
    "street": "Avenida Conselheiro Rosa e Silva",
    "number": "599",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0381193,
    "longitude": -34.900877
  },
  {
    "osmType": "node",
    "osmId": 5758791091,
    "street": "Rua Jose Clementino",
    "number": "106",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050970",
    "latitude": -8.037868,
    "longitude": -34.9013642
  },
  {
    "osmType": "way",
    "osmId": 384933664,
    "street": "Rua José Clementino",
    "number": "96",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050070",
    "latitude": -8.0379456,
    "longitude": -34.9014671
  },
  {
    "osmType": "way",
    "osmId": 785661414,
    "street": "Avenida João de Barros",
    "number": "1665",
    "neighborhood": "Espinheiro",
    "city": "Recife",
    "cep": "",
    "latitude": -8.040233,
    "longitude": -34.8922134
  },
  {
    "osmType": "way",
    "osmId": 384933184,
    "street": "Avenida Conselheiro Rosa e Silva",
    "number": "1489",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0390652,
    "longitude": -34.9002673
  },
  {
    "osmType": "way",
    "osmId": 655157670,
    "street": "Rua Marechal Teodoro",
    "number": "235",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0381002,
    "longitude": -34.8861489
  },
  {
    "osmType": "node",
    "osmId": 5730763149,
    "street": "Rua do Futuro",
    "number": "913",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050005",
    "latitude": -8.0376515,
    "longitude": -34.9028545
  },
  {
    "osmType": "node",
    "osmId": 13603276201,
    "street": "Rua Xavier Marquês",
    "number": "134",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050230",
    "latitude": -8.0392104,
    "longitude": -34.9011601
  },
  {
    "osmType": "node",
    "osmId": 9386411839,
    "street": "Rua do Futuro",
    "number": "634",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050005",
    "latitude": -8.0394271,
    "longitude": -34.9010269
  },
  {
    "osmType": "node",
    "osmId": 12830941899,
    "street": "Rua do Futuro",
    "number": "564",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050005",
    "latitude": -8.0398597,
    "longitude": -34.9005439
  },
  {
    "osmType": "way",
    "osmId": 254532158,
    "street": "Rua Professor Othon Paraíso",
    "number": "375",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0375237,
    "longitude": -34.8839895
  },
  {
    "osmType": "node",
    "osmId": 4936271922,
    "street": "Rua Conselheiro Portela",
    "number": "536",
    "neighborhood": "Espinheiro",
    "city": "Recife",
    "cep": "52020030",
    "latitude": -8.0417598,
    "longitude": -34.8935151
  },
  {
    "osmType": "way",
    "osmId": 655157671,
    "street": "Rua Augusto Rodrigues",
    "number": "165",
    "neighborhood": "Encruzilhada",
    "city": "Recife",
    "cep": "",
    "latitude": -8.039175,
    "longitude": -34.885589
  },
  {
    "osmType": "node",
    "osmId": 9386411840,
    "street": "Rua do Futuro",
    "number": "479",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050005",
    "latitude": -8.0406799,
    "longitude": -34.9003521
  },
  {
    "osmType": "way",
    "osmId": 254532179,
    "street": "Rua Marques do Parana",
    "number": "320",
    "neighborhood": "Espinheiro",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0411254,
    "longitude": -34.8882071
  },
  {
    "osmType": "node",
    "osmId": 9386411837,
    "street": "Rua do Futuro",
    "number": "386",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050005",
    "latitude": -8.0412094,
    "longitude": -34.8996117
  },
  {
    "osmType": "node",
    "osmId": 5740124399,
    "street": "Rua Padre Miguelinho",
    "number": "90",
    "neighborhood": "Torreão",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0392091,
    "longitude": -34.8848865
  },
  {
    "osmType": "node",
    "osmId": 9386411838,
    "street": "Rua do Futuro",
    "number": "425",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "52050005",
    "latitude": -8.0411024,
    "longitude": -34.9000031
  },
  {
    "osmType": "node",
    "osmId": 4109132289,
    "street": "Avenida João de Barros",
    "number": "1417",
    "neighborhood": "Espinheiro",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0421688,
    "longitude": -34.8911006
  },
  {
    "osmType": "way",
    "osmId": 384933660,
    "street": "Rua Deputado Pedro Pires Ferreira",
    "number": "405",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0385748,
    "longitude": -34.9045937
  },
  {
    "osmType": "node",
    "osmId": 4843820524,
    "street": "Rua Conselheiro Portela",
    "number": "210",
    "neighborhood": "Espinheiro",
    "city": "Recife",
    "cep": "52020030",
    "latitude": -8.0431484,
    "longitude": -34.8955828
  },
  {
    "osmType": "relation",
    "osmId": 10891078,
    "street": "Avenida Conselheiro Rosa e Silva",
    "number": "975",
    "neighborhood": "Graças",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0428579,
    "longitude": -34.8980998
  },
  {
    "osmType": "node",
    "osmId": 9965051689,
    "street": "Rua Djalma Farias",
    "number": "170",
    "neighborhood": "Torreão",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0405315,
    "longitude": -34.8847314
  },
  {
    "osmType": "way",
    "osmId": 557017892,
    "street": "Rua Desembargador Mota Júnior",
    "number": "120",
    "neighborhood": "Casa Amarela",
    "city": "Recife",
    "cep": "",
    "latitude": -8.0265701,
    "longitude": -34.9103942
  },
  {
    "osmType": "way",
    "osmId": 680911986,
    "street": "Rua Ferreira Lopes",
    "number": "142",
    "neighborhood": "Casa Amarela",
    "city": "Recife",
    "cep": "52051380",
    "latitude": -8.0288302,
    "longitude": -34.910764
  }
]
$refs$::jsonb) WITH ORDINALITY;
DO $check$
BEGIN
  IF (SELECT count(*) FROM agenda_references)<>75 THEN
    RAISE EXCEPTION 'Quantidade de referências inválida.';
  END IF;
END $check$;

UPDATE "Addresses" a SET
  "City"=r.reference->>'city', "Street"=r.reference->>'street', "Number"=r.reference->>'number',
  "Neighborhood"=r.reference->>'neighborhood', "CEP"=r.reference->>'cep', "Complement"='',
  "Location"=ST_SetSRID(ST_MakePoint((r.reference->>'longitude')::float8,(r.reference->>'latitude')::float8),4326)::geography
FROM agenda_targets t JOIN agenda_references r ON r.seq=t.seq WHERE a."Id"=t."AddressId";

UPDATE "Hosts" h SET "Description"='[DEMO ROSARINHO 2026-11-25] Espaço fictício de '||
  CASE h."Typeofhost" WHEN 1 THEN 'gastronomia e encontros' WHEN 2 THEN 'comércio e experiências locais' ELSE 'produção cultural' END||
  ', com agenda de música, arte e convivência no bairro. Endereço real usado somente como referência geográfica; este perfil e sua programação não representam nem possuem vínculo com o local real.', "UpdatedAt"=now()
WHERE h."UserId"='demo-rosarinho-20261125';

UPDATE "Programmings" p SET "AddressId"=h."AddressId",
  "Description"='[DEMO ROSARINHO 2026-11-25] Programação fictícia de cultura, sabores e encontros no bairro. O público pode conhecer apresentações, atividades criativas e experiências de convivência. Não há realização, venda de ingresso ou reserva real. Endereço real usado apenas como referência geográfica, sem vínculo com o local.',
  "UpdateDate"=now()
FROM "Hosts" h WHERE h."Id"=p."HostId" AND h."UserId"='demo-rosarinho-20261125' AND p."Name" NOT LIKE '%— Demonstração';

CREATE TEMP TABLE agenda_slots ON COMMIT DROP AS
SELECT t.*, s.slot, (ARRAY[
  'Encontro de música e sabores — Edição anterior — Demonstração',
  'Feira criativa do bairro — Edição anterior — Demonstração',
  'Noite cultural do bairro — Próxima edição — Demonstração',
  'Oficina de arte e encontros — Próxima edição — Demonstração'
])[s.slot] title,
CASE s.slot
  WHEN 1 THEN ((current_date-14-t.seq%3)+time '18:00') AT TIME ZONE 'America/Recife'
  WHEN 2 THEN ((current_date-7-t.seq%3)+time '14:00') AT TIME ZONE 'America/Recife'
  WHEN 3 THEN ((current_date+1+t.seq%7)+time '18:00') AT TIME ZONE 'America/Recife'
  WHEN 4 THEN ((current_date+10+t.seq%11)+time '14:00') AT TIME ZONE 'America/Recife'
END starts
FROM agenda_targets t CROSS JOIN generate_series(1,4) s(slot)
UNION ALL
SELECT active.*,5,'Encontro cultural — Em andamento — Demonstração',now()-interval '30 minutes'
FROM (SELECT t.*,row_number() OVER (ORDER BY t."Id") active_seq FROM agenda_targets t WHERE t."Typeofhost" IN (1,2)) active_base
CROSS JOIN LATERAL (SELECT active_base."Id",active_base."AddressId",active_base."Typeofhost",active_base.seq) active
WHERE active_base.active_seq%10=1;

INSERT INTO "Programmings" ("Name","IsActive","Description","StartDate","EndDate","IsFree","ImageUrl","TicketUrl","InstagranUrl","HostId","AddressId","CreatedDate","UpdateDate","MinPrice","MaxPrice")
SELECT s.title,true,
  '[DEMO ROSARINHO 2026-11-25] '||CASE s.slot
    WHEN 1 THEN 'Uma noite de apresentações musicais e experiências gastronômicas que compõe o histórico ilustrativo deste espaço.'
    WHEN 2 THEN 'Uma edição de feira com produtos criativos, arte local e encontros que compõe o histórico ilustrativo deste espaço.'
    WHEN 3 THEN 'Uma próxima edição com apresentações musicais, sabores do bairro e momentos para conhecer novas pessoas.'
    WHEN 4 THEN 'Uma próxima oficina com atividades artísticas, troca de experiências e convivência para todos os públicos.'
    ELSE 'Uma experiência cultural de demonstração no horário atual, para visualizar o local durante um evento.' END||
  ' Evento fictício: não haverá realização, cobrança ou reserva real. O endereço real serve apenas como referência geográfica, sem vínculo com o local.',
  s.starts,s.starts+interval '3 hours',s.slot IN (2,4,5),
  'https://images.unsplash.com/photo-'||CASE WHEN s.slot=2 THEN '1492684223066-81342ee5ff30' WHEN s.slot=4 THEN '1513364776144-60967b0f800f' ELSE '1514525253161-7a46d19cd819' END||'?auto=format&fit=crop&w=960&q=80',
  '','',s."Id",s."AddressId",now(),now(),CASE WHEN s.slot IN (2,4,5) THEN 0 ELSE 20 END,CASE WHEN s.slot IN (2,4,5) THEN 0 ELSE 40 END
FROM agenda_slots s
WHERE NOT EXISTS (SELECT 1 FROM "Programmings" p WHERE p."HostId"=s."Id" AND p."Name"=s.title);

UPDATE "Programmings" p SET "Description"='[DEMO ROSARINHO 2026-11-25] '||CASE s.slot
  WHEN 1 THEN 'Uma noite de apresentações musicais e experiências gastronômicas que compõe o histórico ilustrativo deste espaço.'
  WHEN 2 THEN 'Uma edição de feira com produtos criativos, arte local e encontros que compõe o histórico ilustrativo deste espaço.'
  WHEN 3 THEN 'Uma próxima edição com apresentações musicais, sabores do bairro e momentos para conhecer novas pessoas.'
  WHEN 4 THEN 'Uma próxima oficina com atividades artísticas, troca de experiências e convivência para todos os públicos.'
  ELSE 'Uma experiência cultural de demonstração no horário atual, para visualizar o local durante um evento.' END||
  ' Evento fictício: não haverá realização, cobrança ou reserva real. O endereço real serve apenas como referência geográfica, sem vínculo com o local.'
FROM agenda_slots s WHERE p."HostId"=s."Id" AND p."Name"=s.title;

INSERT INTO "ProgrammingXCategories" ("ProgrammingId","CategoryId")
SELECT p."Id", c."Id"
FROM agenda_slots s JOIN "Programmings" p ON p."HostId"=s."Id" AND p."Name"=s.title
JOIN "Categories" c ON c."Name"=CASE s.slot WHEN 2 THEN 'Feiras (demo)' WHEN 4 THEN 'Oficinas (demo)' ELSE 'Música (demo)' END AND c."IsActive"
WHERE NOT EXISTS (SELECT 1 FROM "ProgrammingXCategories" l WHERE l."ProgrammingId"=p."Id" AND l."CategoryId"=c."Id");

DO $check$
BEGIN
  IF EXISTS (
    SELECT 1 FROM agenda_targets t WHERE
    (SELECT count(*) FROM "Programmings" p WHERE p."HostId"=t."Id" AND p."IsActive" AND p."EndDate"<=now())<2 OR
    (SELECT count(*) FROM "Programmings" p WHERE p."HostId"=t."Id" AND p."IsActive" AND p."StartDate">now())<2
  ) THEN RAISE EXCEPTION 'Há host sem dois eventos passados e dois futuros.'; END IF;
  IF EXISTS (SELECT 1 FROM "Programmings" p JOIN agenda_targets t ON t."Id"=p."HostId" WHERE p."AddressId"<>t."AddressId" OR p."EndDate"<=p."StartDate" OR p."MinPrice">p."MaxPrice" OR btrim(p."ImageUrl")='') THEN
    RAISE EXCEPTION 'Evento com endereço, datas, preço ou imagem inconsistente.';
  END IF;
  IF EXISTS (SELECT 1 FROM agenda_targets t JOIN "Addresses" a ON a."Id"=t."AddressId" WHERE a."Location" IS NULL OR ST_SRID(a."Location"::geometry)<>4326 OR a."Street" LIKE 'Rua Fictícia%') THEN
    RAISE EXCEPTION 'Endereço ou coordenada inconsistente.';
  END IF;
  IF EXISTS (
    SELECT 'Hosts',h."Id",to_jsonb(h) FROM "Hosts" h WHERE h."UserId"<>'demo-rosarinho-20261125'
    UNION ALL SELECT 'Programmings',p."Id",to_jsonb(p) FROM "Programmings" p WHERE NOT EXISTS (SELECT 1 FROM agenda_targets t WHERE t."Id"=p."HostId")
    UNION ALL SELECT 'Addresses',a."Id",to_jsonb(a) FROM "Addresses" a WHERE NOT EXISTS (SELECT 1 FROM agenda_targets t WHERE t."AddressId"=a."Id")
    EXCEPT SELECT kind,"Id",content FROM agenda_protected
  ) THEN RAISE EXCEPTION 'Registro externo ao lote foi alterado.'; END IF;
  IF EXISTS (SELECT 1 FROM agenda_original_events old LEFT JOIN "Programmings" p ON p."Id"=old."Id" WHERE p."Id" IS NULL OR
    (p."HostId",p."Name",p."StartDate",p."EndDate",p."ImageUrl",p."MinPrice",p."MaxPrice") IS DISTINCT FROM
    (old."HostId",old."Name",old."StartDate",old."EndDate",old."ImageUrl",old."MinPrice",old."MaxPrice")) THEN
    RAISE EXCEPTION 'Eventos anteriores não foram preservados.';
  END IF;
END $check$;

SELECT count(DISTINCT h."Id") hosts,count(*) eventos,
  count(*) FILTER (WHERE p."EndDate"<=now()) passados,
  count(*) FILTER (WHERE p."StartDate">now()) futuros,
  count(*) FILTER (WHERE p."StartDate"<=now() AND p."EndDate">now()) em_andamento
FROM "Programmings" p JOIN "Hosts" h ON h."Id"=p."HostId" WHERE h."UserId"='demo-rosarinho-20261125';
COMMIT;
