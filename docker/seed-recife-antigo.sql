\set ON_ERROR_STOP on

BEGIN;

INSERT INTO "Users" (
    "Id", "IsActive", "UserName", "NormalizedUserName", "Email", "NormalizedEmail",
    "CreatedAt", "Typeofuser", "AccessFailedCount", "LockoutEnabled", "ConcurrencyStamp", "SecurityStamp"
)
VALUES (
    'seed-recife-antigo-2026', true, 'demo_recife_antigo', 'DEMO_RECIFE_ANTIGO',
    'demo.recife.antigo@perambulando.local', 'DEMO.RECIFE.ANTIGO@PERAMBULANDO.LOCAL',
    NOW(), 0, 0, true, 'seed-recife-antigo-concurrency', 'seed-recife-antigo-security'
)
ON CONFLICT ("Id") DO UPDATE SET
    "IsActive" = true,
    "UserName" = EXCLUDED."UserName",
    "NormalizedUserName" = EXCLUDED."NormalizedUserName",
    "Email" = EXCLUDED."Email",
    "NormalizedEmail" = EXCLUDED."NormalizedEmail";

INSERT INTO "Addresses" (
    "Id", "Street", "Number", "Complement", "Neighborhood", "CEP", "Location", "CreatedAt", "AddWho", "City"
)
VALUES
    (900001, 'Praça do Arsenal', '12', 'Térreo', 'Recife', '50030360', ST_SetSRID(ST_MakePoint(-34.87120, -8.06150), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900002, 'Praça Rio Branco', '1', 'Marco Zero', 'Recife', '50030150', ST_SetSRID(ST_MakePoint(-34.87110, -8.06310), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900003, 'Rua do Bom Jesus', '86', 'Casa cultural', 'Recife', '50030270', ST_SetSRID(ST_MakePoint(-34.87100, -8.06100), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900004, 'Cais do Apolo', '222', 'Armazém 2', 'Recife', '50030220', ST_SetSRID(ST_MakePoint(-34.87350, -8.06190), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900005, 'Avenida Alfredo Lisboa', '50', 'Salão principal', 'Recife', '50030150', ST_SetSRID(ST_MakePoint(-34.87220, -8.06400), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900006, 'Rua do Apolo', '161', 'Loja 4', 'Recife', '50030220', ST_SetSRID(ST_MakePoint(-34.87280, -8.06030), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900007, 'Rua da Moeda', '37', 'Pátio interno', 'Recife', '50030280', ST_SetSRID(ST_MakePoint(-34.87310, -8.06430), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900008, 'Rua Madre de Deus', '110', 'Piso 1', 'Recife', '50030110', ST_SetSRID(ST_MakePoint(-34.87620, -8.06580), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900009, 'Rua do Observatório', '14', 'Loja A', 'Recife', '50030230', ST_SetSRID(ST_MakePoint(-34.87060, -8.06170), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900010, 'Praça Tiradentes', '28', 'Galeria', 'Recife', '50030200', ST_SetSRID(ST_MakePoint(-34.87000, -8.06240), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900011, 'Cais da Alfândega', '35', 'Loja 12', 'Recife', '50030100', ST_SetSRID(ST_MakePoint(-34.87460, -8.06500), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife'),
    (900012, 'Rua da Guia', '73', 'Sobrado', 'Recife', '50030210', ST_SetSRID(ST_MakePoint(-34.87165, -8.06065), 4326)::geography, NOW(), 'seed-recife-antigo-2026', 'Recife')
ON CONFLICT ("Id") DO UPDATE SET
    "Street" = EXCLUDED."Street", "Number" = EXCLUDED."Number", "Complement" = EXCLUDED."Complement",
    "Neighborhood" = EXCLUDED."Neighborhood", "CEP" = EXCLUDED."CEP", "Location" = EXCLUDED."Location",
    "AddWho" = EXCLUDED."AddWho", "City" = EXCLUDED."City";

INSERT INTO "Hosts" (
    "Id", "UserId", "Typeofhost", "CNPJ", "LogoUrl", "InstagranUrl", "Phone", "Name", "Description",
    "IsActive", "CreatedAt", "UpdatedAt", "AddressId", "MinPrice", "MaxPrice"
)
VALUES
    (900001, 'seed-recife-antigo-2026', 0, '90000000000184', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600', 'https://instagram.com/perambulando', '(81) 3000-1001', 'Aurora Cultural Recife', 'Produção de encontros de música, dança e cultura popular no Recife Antigo.', true, NOW(), NOW(), 900001, NULL, NULL),
    (900002, 'seed-recife-antigo-2026', 0, '90000000000265', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', 'https://instagram.com/perambulando', '(81) 3000-1002', 'Marco Zero Produções', 'Produtora de festivais urbanos, cinema ao ar livre e grandes encontros culturais.', true, NOW(), NOW(), 900002, NULL, NULL),
    (900003, 'seed-recife-antigo-2026', 0, '90000000000346', 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600', 'https://instagram.com/perambulando', '(81) 3000-1003', 'Ponte Criativa', 'Coletivo dedicado a artes visuais, literatura, tecnologia e economia criativa.', true, NOW(), NOW(), 900003, NULL, NULL),
    (900004, 'seed-recife-antigo-2026', 0, '90000000000427', 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=600', 'https://instagram.com/perambulando', '(81) 3000-1004', 'Armazém das Artes', 'Espaço produtor de teatro, exposições, oficinas e atividades infantis.', true, NOW(), NOW(), 900004, NULL, NULL),
    (900005, 'seed-recife-antigo-2026', 1, '90000000000508', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', 'https://instagram.com/perambulando', '(81) 3000-1005', 'Bistrô Capibaribe', 'Cozinha pernambucana contemporânea com ingredientes locais e vista para o cais.', true, NOW(), NOW(), 900005, 35.00, 120.00),
    (900006, 'seed-recife-antigo-2026', 1, '90000000000699', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', 'https://instagram.com/perambulando', '(81) 3000-1006', 'Café do Arsenal', 'Café, confeitaria regional e pequenos encontros culturais no bairro do Recife.', true, NOW(), NOW(), 900006, 12.00, 55.00),
    (900007, 'seed-recife-antigo-2026', 1, '90000000000770', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', 'https://instagram.com/perambulando', '(81) 3000-1007', 'Sabores do Cais', 'Restaurante de cozinha afetiva, frutos do mar e experiências gastronômicas.', true, NOW(), NOW(), 900007, 28.00, 95.00),
    (900008, 'seed-recife-antigo-2026', 1, '90000000000850', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600', 'https://instagram.com/perambulando', '(81) 3000-1008', 'Cozinha da Alfândega', 'Gastronomia diversa com cardápio vegetariano e produtores pernambucanos.', true, NOW(), NOW(), 900008, 22.00, 85.00),
    (900009, 'seed-recife-antigo-2026', 2, '90000000000931', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', 'https://instagram.com/perambulando', '(81) 3000-1009', 'Loja Rua do Bom Jesus', 'Comércio de design local, lembranças autorais e produtos pernambucanos.', true, NOW(), NOW(), 900009, 15.00, 250.00),
    (900010, 'seed-recife-antigo-2026', 2, '90000000001075', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600', 'https://instagram.com/perambulando', '(81) 3000-1010', 'Ateliê do Recife', 'Ateliê e galeria de artistas, ilustradores e artesãos da cidade.', true, NOW(), NOW(), 900010, 20.00, 480.00),
    (900011, 'seed-recife-antigo-2026', 2, '90000000001156', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600', 'https://instagram.com/perambulando', '(81) 3000-1011', 'Livraria do Porto', 'Livraria independente com literatura pernambucana, infantil e encontros de leitura.', true, NOW(), NOW(), 900011, 18.00, 140.00),
    (900012, 'seed-recife-antigo-2026', 2, '90000000001237', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600', 'https://instagram.com/perambulando', '(81) 3000-1012', 'Mercado Criativo Recife', 'Loja colaborativa de moda, arte, tecnologia e produção independente.', true, NOW(), NOW(), 900012, 10.00, 320.00)
ON CONFLICT ("Id") DO UPDATE SET
    "UserId" = EXCLUDED."UserId", "Typeofhost" = EXCLUDED."Typeofhost", "CNPJ" = EXCLUDED."CNPJ",
    "LogoUrl" = EXCLUDED."LogoUrl", "InstagranUrl" = EXCLUDED."InstagranUrl", "Phone" = EXCLUDED."Phone",
    "Name" = EXCLUDED."Name", "Description" = EXCLUDED."Description", "IsActive" = true,
    "UpdatedAt" = NOW(), "AddressId" = EXCLUDED."AddressId", "MinPrice" = EXCLUDED."MinPrice", "MaxPrice" = EXCLUDED."MaxPrice";

INSERT INTO "Programmings" (
    "Id", "Name", "IsActive", "Description", "StartDate", "EndDate", "IsFree", "ImageUrl", "TicketUrl",
    "InstagranUrl", "HostId", "CreatedDate", "UpdateDate", "MinPrice", "MaxPrice", "AddressId"
)
VALUES
    (910001, 'Noite do Frevo no Arsenal', true, 'Orquestras, passistas e vivências de frevo em uma noite aberta para todas as idades.', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 4 hours', true, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200', '', 'https://instagram.com/perambulando', 900001, NOW(), NOW(), 0, 0, 900001),
    (910002, 'Feira Criativa do Bom Jesus', true, 'Feira de arte, moda autoral, ilustração e produtos de pequenos empreendedores.', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 8 hours', true, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200', '', 'https://instagram.com/perambulando', 900003, NOW(), NOW(), 0, 0, 900003),
    (910003, 'Cinema no Cais', true, 'Sessão de cinema brasileiro ao ar livre seguida de conversa com realizadores locais.', NOW() + INTERVAL '7 days 19 hours', NOW() + INTERVAL '7 days 22 hours', true, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200', '', 'https://instagram.com/perambulando', 900002, NOW(), NOW(), 0, 0, 900002),
    (910004, 'Festival Sabores de Pernambuco', true, 'Circuito gastronômico com pratos regionais, cozinha contemporânea e produtores locais.', NOW() + INTERVAL '9 days 11 hours', NOW() + INTERVAL '9 days 20 hours', false, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200', 'https://example.com/ingressos/sabores-pernambuco', 'https://instagram.com/perambulando', 900005, NOW(), NOW(), 25, 75, 900005),
    (910005, 'Histórias do Recife para Crianças', true, 'Contação de histórias, livros ilustrados e brincadeiras sobre a memória da cidade.', NOW() + INTERVAL '11 days 14 hours', NOW() + INTERVAL '11 days 17 hours', true, 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200', '', 'https://instagram.com/perambulando', 900011, NOW(), NOW(), 0, 0, 900011),
    (910006, 'Recife Digital: Arte e Tecnologia', true, 'Exposição interativa, instalações digitais e conversas sobre cidades criativas.', NOW() + INTERVAL '13 days 10 hours', NOW() + INTERVAL '13 days 19 hours', false, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200', 'https://example.com/ingressos/recife-digital', 'https://instagram.com/perambulando', 900003, NOW(), NOW(), 18, 35, 900003),
    (910007, 'Corrida das Pontes', true, 'Percurso esportivo pelas pontes e paisagens do centro histórico do Recife.', NOW() + INTERVAL '15 days 6 hours', NOW() + INTERVAL '15 days 10 hours', false, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200', 'https://example.com/ingressos/corrida-pontes', 'https://instagram.com/perambulando', 900002, NOW(), NOW(), 45, 65, 900002),
    (910008, 'Mostra de Teatro no Armazém', true, 'Espetáculos curtos de grupos pernambucanos em diferentes espaços do armazém.', NOW() + INTERVAL '17 days 18 hours', NOW() + INTERVAL '17 days 22 hours', false, 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=1200', 'https://example.com/ingressos/mostra-teatro', 'https://instagram.com/perambulando', 900004, NOW(), NOW(), 20, 50, 900004),
    (910009, 'Clube de Leitura do Porto', true, 'Encontro mensal dedicado a autores do Nordeste, com mediação e café.', NOW() + INTERVAL '19 days 16 hours', NOW() + INTERVAL '19 days 18 hours', true, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200', '', 'https://instagram.com/perambulando', 900011, NOW(), NOW(), 0, 0, 900011),
    (910010, 'Jazz na Praça', true, 'Apresentações de jazz e música instrumental pernambucana ao entardecer.', NOW() + INTERVAL '21 days 17 hours', NOW() + INTERVAL '21 days 21 hours', true, 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200', '', 'https://instagram.com/perambulando', 900001, NOW(), NOW(), 0, 0, 900001),
    (910011, 'Oficina de Maracatu', true, 'Vivência de ritmo, dança e história do maracatu com mestres convidados.', NOW() + INTERVAL '23 days 14 hours', NOW() + INTERVAL '23 days 18 hours', false, 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200', 'https://example.com/ingressos/oficina-maracatu', 'https://instagram.com/perambulando', 900001, NOW(), NOW(), 30, 45, 900001),
    (910012, 'Mercado Autoral do Recife', true, 'Encontro de marcas independentes, design, artesanato e economia criativa.', NOW() + INTERVAL '25 days 10 hours', NOW() + INTERVAL '25 days 19 hours', true, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', '', 'https://instagram.com/perambulando', 900012, NOW(), NOW(), 0, 0, 900012),
    (910013, 'Rota dos Cafés do Bairro', true, 'Degustação guiada por cafeterias e cozinhas do Recife Antigo.', NOW() + INTERVAL '27 days 9 hours', NOW() + INTERVAL '27 days 14 hours', false, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200', 'https://example.com/ingressos/rota-cafes', 'https://instagram.com/perambulando', 900006, NOW(), NOW(), 35, 60, 900006),
    (910014, 'Hackathon Patrimônio Vivo', true, 'Desafio colaborativo para criar soluções digitais voltadas ao patrimônio cultural.', NOW() + INTERVAL '29 days 8 hours', NOW() + INTERVAL '30 days 18 hours', true, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200', '', 'https://instagram.com/perambulando', 900003, NOW(), NOW(), 0, 0, 900003),
    (910015, 'Cine Infantil no Armazém', true, 'Curtas de animação, oficina de desenho e atividades para crianças e famílias.', NOW() + INTERVAL '32 days 14 hours', NOW() + INTERVAL '32 days 17 hours', true, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200', '', 'https://instagram.com/perambulando', 900004, NOW(), NOW(), 0, 0, 900004),
    (910016, 'Dança ao Pôr do Sol', true, 'Aulas abertas e apresentações de dança com vista para o encontro dos rios.', NOW() + INTERVAL '35 days 16 hours', NOW() + INTERVAL '35 days 20 hours', true, 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200', '', 'https://instagram.com/perambulando', 900002, NOW(), NOW(), 0, 0, 900002)
ON CONFLICT ("Id") DO UPDATE SET
    "Name" = EXCLUDED."Name", "IsActive" = true, "Description" = EXCLUDED."Description",
    "StartDate" = EXCLUDED."StartDate", "EndDate" = EXCLUDED."EndDate", "IsFree" = EXCLUDED."IsFree",
    "ImageUrl" = EXCLUDED."ImageUrl", "TicketUrl" = EXCLUDED."TicketUrl", "InstagranUrl" = EXCLUDED."InstagranUrl",
    "HostId" = EXCLUDED."HostId", "UpdateDate" = NOW(), "MinPrice" = EXCLUDED."MinPrice",
    "MaxPrice" = EXCLUDED."MaxPrice", "AddressId" = EXCLUDED."AddressId";

DELETE FROM "ProgrammingXCategories" WHERE "ProgrammingId" BETWEEN 910001 AND 910016;

INSERT INTO "ProgrammingXCategories" ("ProgrammingId", "CategoryId")
VALUES
    (910001, 5), (910001, 9), (910001, 10),
    (910002, 4), (910002, 7),
    (910003, 5), (910003, 11),
    (910004, 5), (910004, 8),
    (910005, 1), (910005, 3),
    (910006, 2), (910006, 7),
    (910007, 6),
    (910008, 12),
    (910009, 1),
    (910010, 9),
    (910011, 5), (910011, 9), (910011, 10),
    (910012, 2), (910012, 4), (910012, 7),
    (910013, 8),
    (910014, 2), (910014, 5),
    (910015, 3), (910015, 11),
    (910016, 9), (910016, 10);

COMMIT;

SELECT 'hosts_demo' AS "Metric", COUNT(*) AS "Total"
FROM "Hosts" WHERE "UserId" = 'seed-recife-antigo-2026'
UNION ALL
SELECT 'programmings_demo', COUNT(*)
FROM "Programmings" WHERE "Id" BETWEEN 910001 AND 910016
UNION ALL
SELECT 'categories_covered', COUNT(DISTINCT "CategoryId")
FROM "ProgrammingXCategories" WHERE "ProgrammingId" BETWEEN 910001 AND 910016;
