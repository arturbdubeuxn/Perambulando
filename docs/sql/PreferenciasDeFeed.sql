BEGIN;

LOCK TABLE "Categories" IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
    category_name text;
    category_id integer;
BEGIN
    FOREACH category_name IN ARRAY ARRAY['Gastronomia', 'Teatro', 'Esportes', 'Infantil', 'Gratuito', 'Comércio']
    LOOP
        SELECT "Id" INTO category_id
        FROM "Categories"
        WHERE translate(lower(btrim("Name")), 'é', 'e') = translate(lower(category_name), 'é', 'e')
        ORDER BY "IsActive" DESC, "Id"
        LIMIT 1;

        IF category_id IS NULL THEN
            INSERT INTO "Categories" ("Name", "IsActive") VALUES (category_name, true);
        ELSE
            UPDATE "Categories" SET "IsActive" = true WHERE "Id" = category_id AND NOT "IsActive";
        END IF;
    END LOOP;
END $$;

COMMIT;
