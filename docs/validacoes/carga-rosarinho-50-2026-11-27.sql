-- Endereços de referência da agenda de 27/11/2026, © colaboradores do OpenStreetMap (ODbL).
-- Os hosts e eventos são fictícios e não têm vínculo com os imóveis.
\set ON_ERROR_STOP on
SET client_encoding TO 'UTF8';
BEGIN;
SET LOCAL TIME ZONE 'America/Recife';
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(27112026, 50);

CREATE TEMP TABLE demo_rows (
    seq integer PRIMARY KEY, host_type integer, cnpj text, host_name text,
    event_name text, category text, street text, number text, neighborhood text,
    cep text, latitude double precision, longitude double precision
) ON COMMIT DROP;

INSERT INTO demo_rows VALUES
    (1, 0, 'DEMR0000000105', 'Cena Aberta', 'A Noite em que a Rua Virou Palco', 'Teatro', 'Avenida Santos Dumont', '1181', 'Rosarinho', '', -8.0315898, -34.8956854),
    (2, 0, 'DEMR0000000296', 'Palco Mangaba', 'O Mistério do Bonde das Sete', 'Teatro', 'Rua Amaro Coutinho', '951', 'Rosarinho', '', -8.0326206, -34.8968693),
    (3, 0, 'DEMR0000000377', 'Coletivo Pé de Vento', 'Corrida de Bairro ao Pôr do Sol', 'Esportes', 'Avenida Norte Miguel Arraes de Alencar', '3301', 'Rosarinho', '52041005', -8.0325126, -34.8975046),
    (4, 0, 'DEMR0000000458', 'Quintal das Histórias', 'Contos do Rio e da Ponte', 'Infantil', 'Rua Doutor José Maria', '836', 'Rosarinho', '', -8.0353118, -34.8985232),
    (5, 0, 'DEMR0000000539', 'Companhia Varanda', 'Improviso de Quinta', 'Teatro', 'Rua Doutor José Maria', '848', 'Rosarinho', '', -8.035276, -34.8986348),
    (6, 0, 'DEMR0000000610', 'Roda do Rosarinho', 'Circuito de Passinhos e Frevo', 'Esportes', 'Rua José Carvalheira', '415', 'Tamarineira', '', -8.0285372, -34.9030403),
    (7, 0, 'DEMR0000000709', 'Casa do Mamulengo', 'O Boneco que Perdeu o Chapéu', 'Infantil', 'Avenida Conselheiro Rosa e Silva', '2130', 'Tamarineira', '', -8.0332529, -34.9031651),
    (8, 0, 'DEMR0000000881', 'Palco da Esquina', 'Crônicas da Encruzilhada', 'Teatro', 'Rua Gomes Coutinho', '114', 'Tamarineira', '', -8.0278299, -34.9051925),
    (9, 0, 'DEMR0000000962', 'Movimento Norte', 'Clínica de Vôlei para Iniciantes', 'Esportes', 'Rua Soares Moreno', '187', 'Tamarineira', '', -8.0296078, -34.9052995),
    (10, 0, 'DEMR0000001004', 'Estação Brincante', 'Oficina de Pipas de Papel', 'Infantil', 'Estrada do Arraial', '2501', 'Tamarineira', '52051971', -8.031242, -34.9054239),
    (11, 0, 'DEMR0000001187', 'Cia. Janela Alta', 'A Última Carta do Correio', 'Teatro', 'Rua Padre Roma', '149', 'Tamarineira', '', -8.0343474, -34.9045794),
    (12, 0, 'DEMR0000001268', 'Turma da Quadra', 'Torneio de Futsal em Duplas', 'Esportes', 'Estrada do Arraial', '2.723', 'Tamarineira', '', -8.030993, -34.9073631),
    (13, 0, 'DEMR0000001349', 'Ciranda do Pátio', 'Manhã de Brincadeiras de Rua', 'Infantil', 'Rua Afonso Celso', '203', 'Tamarineira', '52060110', -8.0319083, -34.9073744),
    (14, 0, 'DEMR0000001420', 'Teatro de Bolso da Zona Norte', 'Cenas de um Mercado de Bairro', 'Teatro', 'Rua Rodolfo de Holanda', '248', 'Encruzilhada', '', -8.0324875, -34.8942418),
    (15, 0, 'DEMR0000001500', 'Passo Curto', 'Caminhada Guiada entre Praças', 'Esportes', 'Avenida Beberibe', '541', 'Encruzilhada', '52041230', -8.0326353, -34.8922235),
    (16, 0, 'DEMR0000001691', 'O Mundo no Quintal', 'Contação com Fantoches de Tecido', 'Infantil', 'Rua Octávio de Freitas', '256', 'Encruzilhada', '', -8.0340142, -34.8936338),
    (17, 0, 'DEMR0000001772', 'Coletivo Pano de Fundo', 'Dois Bancos e Uma Praça', 'Teatro', 'Avenida Beberibe', '419', 'Encruzilhada', '', -8.0337372, -34.8919451),
    (18, 0, 'DEMR0000001853', 'Pedal de Domingo', 'Passeio de Bicicleta para Iniciantes', 'Esportes', 'Rua Frederico', '50', 'Encruzilhada', '', -8.0341254, -34.8912072),
    (19, 0, 'DEMR0000001934', 'Laboratório de Faz de Conta', 'Pequenos Inventores: Brinquedos de Papelão', 'Infantil', 'Avenida Beberibe', '174', 'Encruzilhada', '52041430', -8.0358889, -34.891187),
    (20, 0, 'DEMR0000002078', 'Grupo Luz de Cena', 'Uma Comédia no Ponto de Ônibus', 'Teatro', 'Rua Doutor Jose Maria', '379', 'Encruzilhada', '52041970', -8.0368252, -34.8946358),
    (21, 0, 'DEMR0000002159', 'Clube Horizonte em Movimento', 'Treino Aberto de Basquete', 'Esportes', 'Rua Carlos Borromeu', '27', 'Encruzilhada', '', -8.0371016, -34.892871),
    (22, 0, 'DEMR0000002230', 'Trupe Pingo de Gente', 'Caça ao Tesouro Ilustrada', 'Infantil', 'Estrada de Belém', '17', 'Encruzilhada', '52041760', -8.036948, -34.8908895),
    (23, 0, 'DEMR0000002310', 'Cia. Voz do Pátio', 'Leitura Dramática: Vozes da Vizinhança', 'Teatro', 'Rua Lago do Feitosa', '30', 'Encruzilhada', '52030140', -8.0346194, -34.8866007),
    (24, 0, 'DEMR0000002400', 'Escola de Movimento do Norte', 'Aula Aberta de Capoeira', 'Esportes', 'Estrada de Belém', '44', 'Encruzilhada', '', -8.0371084, -34.8903571),
    (25, 0, 'DEMR0000002582', 'Ateliê da Imaginação', 'Teatro de Sombras para Crianças', 'Infantil', 'Avenida João de Barros', '1932', 'Encruzilhada', '52021355', -8.0379699, -34.8913688),
    (26, 1, 'DEMR0000002663', 'Mesa de Xita', 'Degustação de Bolos Pernambucanos', 'Gastronomia', 'Avenida João de Barros', '1912', 'Encruzilhada', '50030230', -8.038038, -34.891522),
    (27, 2, 'DEMR0000002744', 'Ateliê Linha do Norte', 'Feira de Bordado e Costura Criativa', 'Comércio', 'Avenida João de Barros', '1883', 'Encruzilhada', '52021970', -8.0381512, -34.8919742),
    (28, 1, 'DEMR0000002825', 'Café Grão de Rua', 'Café Coado e Bolo de Rolo', 'Gastronomia', 'Rua Castro Alves', '62', 'Encruzilhada', '', -8.0378423, -34.8904089),
    (29, 2, 'DEMR0000002906', 'Prateleira da Praça', 'Troca de Livros Usados', 'Comércio', 'Rua Castro Alves', '143', 'Encruzilhada', '', -8.0376276, -34.8895398),
    (30, 1, 'DEMR0000003040', 'Bistrô Folha Miúda', 'Almoço de Panelas Afetivas', 'Gastronomia', 'Rua Larga do Feitosa', '138', 'Encruzilhada', '', -8.0355126, -34.8860735),
    (31, 2, 'DEMR0000003120', 'Armazém Papel de Rua', 'Mostra de Ilustração e Papelaria', 'Comércio', 'Avenida João de Barros', '1835', 'Encruzilhada', '52021180', -8.0386811, -34.8922433),
    (32, 1, 'DEMR0000003201', 'Cozinha do Cajueiro', 'Oficina de Cuscuz e Recheios', 'Gastronomia', 'Rua Marechal Teodoro', '235', 'Encruzilhada', '', -8.0381002, -34.8861489),
    (33, 2, 'DEMR0000003392', 'Brechó Ponto Firme', 'Garimpo de Roupas dos Anos 90', 'Comércio', 'Rua Professor Othon Paraíso', '375', 'Encruzilhada', '', -8.0375237, -34.8839895),
    (34, 1, 'DEMR0000003473', 'Varanda de Barro', 'Menu de Peixes e Caldos do Recife', 'Gastronomia', 'Rua Augusto Rodrigues', '165', 'Encruzilhada', '', -8.039175, -34.885589),
    (35, 2, 'DEMR0000003554', 'Oficina Grão de Barro', 'Feira de Cerâmica Artesanal', 'Comércio', 'Avenida Beberibe', '1020', 'Ponto de Parada', '', -8.0283687, -34.8925842),
    (36, 1, 'DEMR0000003635', 'Padoca Flor de Sal', 'Oficina de Pães de Fermentação Natural', 'Gastronomia', 'Rua Carneiro Vilela', '324', 'Aflitos', '', -8.039151, -34.894988),
    (37, 2, 'DEMR0000003716', 'Verde na Calçada', 'Feirinha de Mudas e Vasos', 'Comércio', 'Rua Quarenta e Oito', '569', 'Aflitos', '52020060', -8.0414789, -34.8939829),
    (38, 1, 'DEMR0000003805', 'Chapa do Norte', 'Prova de Sanduíches de Carne de Sol', 'Gastronomia', 'Rua Conselheiro Portela', '339', 'Aflitos', '52020030', -8.0423058, -34.8946325),
    (39, 2, 'DEMR0000003988', 'Loja Trama Miúda', 'Mostra de Acessórios Têxteis', 'Comércio', 'Avenida Conselheiro Rosa e Silva', '1767', 'Jaqueira', '52050020', -8.0369601, -34.9018131),
    (40, 1, 'DEMR0000004011', 'Brasa de Quintal', 'Mesa de Petiscos na Brasa', 'Gastronomia', 'Rua do Futuro', '1309', 'Jaqueira', '', -8.034962, -34.9051457),
    (41, 2, 'DEMR0000004100', 'Estante do Beco', 'Feira de Zines e Quadrinhos', 'Comércio', 'Rua do Futuro', '959', 'Jaqueira', '', -8.0374674, -34.9031027),
    (42, 1, 'DEMR0000004283', 'Doce Jangada', 'Oficina de Cartola Pernambucana', 'Gastronomia', 'Avenida Rui Barbosa', '1541', 'Jaqueira', '', -8.0401576, -34.9041919),
    (43, 2, 'DEMR0000004364', 'Ateliê Madeira de Rua', 'Mostra de Marcenaria Criativa', 'Comércio', 'Avenida Beberibe', '1165', 'Arruda', '', -8.0270523, -34.893624),
    (44, 1, 'DEMR0000004445', 'Sabor de Feira', 'Almoço de Raízes e Temperos', 'Gastronomia', 'Avenida Beberibe', '1310', 'Arruda', '', -8.0256319, -34.8931331),
    (45, 2, 'DEMR0000004526', 'Galpão Segunda Volta', 'Bazar de Peças Reaproveitadas', 'Comércio', 'Avenida Professor José dos Anjos', '1775', 'Arruda', '', -8.0272163, -34.8963032),
    (46, 1, 'DEMR0000004607', 'Casa do Caldo', 'Degustação de Caldinhos de Feijão e Sururu', 'Gastronomia', 'Avenida Beberibe', '1435', 'Arruda', '', -8.0247559, -34.8939833),
    (47, 2, 'DEMR0000004798', 'Vitrine Pé de Manga', 'Mostra de Design Autoral', 'Comércio', 'Avenida João de Barros', '1665', 'Espinheiro', '', -8.040233, -34.8922134),
    (48, 1, 'DEMR0000004879', 'Forno da Mangueira', 'Aula de Pizza de Massa Fina', 'Gastronomia', 'Rua Conselheiro Portela', '536', 'Espinheiro', '52020030', -8.0417598, -34.8935151),
    (49, 2, 'DEMR0000004950', 'Armarinho do Pátio', 'Feira de Linhas e Materiais para Bordado', 'Comércio', 'Rua Marques do Parana', '320', 'Espinheiro', '', -8.0411254, -34.8882071),
    (50, 1, 'DEMR0000005093', 'Mesa da Aurora', 'Brunch de Frutas e Queijos Regionais', 'Gastronomia', 'Avenida João de Barros', '1417', 'Espinheiro', '', -8.0421688, -34.8911006);

DO $seed$
DECLARE
    owner_id constant text := 'demo-rosarinho-50-20261127';
    item demo_rows%ROWTYPE;
    role_id text;
    address_id integer;
    host_id integer;
    event_id integer;
    category_id integer;
    free_category_id integer;
    event_start timestamptz;
    event_free boolean;
    base_day date := greatest(current_date, date '2026-11-27');
    price numeric;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Users" WHERE "Id" = owner_id) THEN
        SELECT "Id" INTO STRICT role_id FROM "AspNetRoles" WHERE "NormalizedName" = 'HOST';
        SELECT min("Id") INTO free_category_id FROM "Categories" WHERE "Name" = 'Gratuito' AND "IsActive";
        IF free_category_id IS NULL THEN
            RAISE EXCEPTION 'A categoria Gratuito deve estar ativa.';
        END IF;

        INSERT INTO "Users" ("Id","UserName","NormalizedUserName","Email","IsActive","CreatedAt",
            "Typeofuser","AccessFailedCount","LockoutEnabled","SecurityStamp","ConcurrencyStamp")
        VALUES (owner_id,owner_id,upper(owner_id),owner_id || '@example.invalid',true,now(),
            0,0,true,owner_id,owner_id);
        INSERT INTO "AspNetUserRoles" ("UserId","RoleId") VALUES (owner_id,role_id);

        FOR item IN SELECT * FROM demo_rows ORDER BY seq LOOP
            SELECT min("Id") INTO category_id FROM "Categories" WHERE "Name" = item.category AND "IsActive";
            IF category_id IS NULL THEN
                RAISE EXCEPTION 'Categoria ativa não encontrada: %', item.category;
            END IF;
            INSERT INTO "Addresses" ("City","Street","Number","Complement","Neighborhood","CEP","Location","CreatedAt","AddWho")
            VALUES ('Recife',item.street,item.number,'',item.neighborhood,item.cep,
                ST_SetSRID(ST_MakePoint(item.longitude,item.latitude),4326)::geography,now(),owner_id)
            RETURNING "Id" INTO address_id;
            INSERT INTO "Hosts" ("UserId","Typeofhost","CNPJ","LogoUrl","InstagranUrl","Phone","Name",
                "Description","AddressId","IsActive","CreatedAt","UpdatedAt")
            VALUES (owner_id,item.host_type,item.cnpj,'','','',item.host_name || ' (demo)',
                'Host fictício de ' || CASE item.host_type WHEN 0 THEN 'produção cultural e esportiva'
                    WHEN 1 THEN 'gastronomia' ELSE 'comércio local' END || ' em ' || item.neighborhood ||
                ', Recife. O endereço real é apenas uma referência geográfica.',address_id,true,now(),now())
            RETURNING "Id" INTO host_id;

            event_free := item.host_type = 2 OR (item.host_type = 0 AND item.seq % 3 = 0);
            event_start := (base_day + 1 + (item.seq - 1) / 2) +
                CASE WHEN item.category IN ('Esportes','Infantil') THEN time '09:30'
                     WHEN item.host_type = 2 THEN time '11:00'
                     WHEN item.host_type = 1 AND item.seq % 3 = 0 THEN time '12:30'
                     ELSE time '18:30' END;
            price := CASE WHEN event_free THEN 0 WHEN item.host_type = 1 THEN 35 + 5 * (item.seq % 7)
                          ELSE 15 + 5 * (item.seq % 5) END;
            INSERT INTO "Programmings" ("Name","IsActive","Description","StartDate","EndDate","IsFree","ImageUrl",
                "TicketUrl","InstagranUrl","HostId","AddressId","CreatedDate","UpdateDate","MinPrice","MaxPrice")
            VALUES (item.event_name || ' (demo)',true,item.event_name || ', por ' || item.host_name || ', em ' ||
                item.neighborhood || '. Programação fictícia para demonstração, sem realização ou reservas.',
                event_start,event_start + CASE WHEN item.host_type = 2 THEN interval '4 hours'
                                               WHEN item.category = 'Infantil' THEN interval '90 minutes'
                                               ELSE interval '2 hours' END,event_free,'','','',host_id,address_id,
                now(),now(),price,price)
            RETURNING "Id" INTO event_id;
            INSERT INTO "ProgrammingXCategories" ("ProgrammingId","CategoryId") VALUES (event_id,category_id);
            IF event_free THEN
                INSERT INTO "ProgrammingXCategories" ("ProgrammingId","CategoryId") VALUES (event_id,free_category_id);
            END IF;
        END LOOP;
    END IF;

    IF (SELECT count(*) FROM "Hosts" WHERE "UserId" = owner_id) <> 50 OR
       (SELECT count(*) FROM "Programmings" p JOIN "Hosts" h ON h."Id" = p."HostId"
        WHERE h."UserId" = owner_id) <> 50 OR
       EXISTS (SELECT 1 FROM demo_rows d LEFT JOIN "Hosts" h
           ON h."UserId" = owner_id AND h."CNPJ" = d.cnpj AND h."Typeofhost" = d.host_type
           LEFT JOIN "Programmings" p ON p."HostId" = h."Id"
           GROUP BY d.seq HAVING count(p."Id") <> 1) THEN
        RAISE EXCEPTION 'O lote está incompleto ou diverge da distribuição esperada.';
    END IF;
END $seed$;

SELECT h."Typeofhost", count(DISTINCT h."Id") hosts, count(p."Id") programacoes
FROM "Hosts" h JOIN "Programmings" p ON p."HostId" = h."Id"
WHERE h."UserId" = 'demo-rosarinho-50-20261127'
GROUP BY h."Typeofhost" ORDER BY h."Typeofhost";
COMMIT;
