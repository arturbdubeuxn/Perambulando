-- Somente leitura. Execute no banco utilizado pela aplicação.
-- Uma linha em pg_available_extensions significa que o servidor oferece a extensão.
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'postgis';

-- Uma linha aqui confirma que PostGIS está habilitado neste banco.
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'postgis';

-- Após aplicar a migration, espere duas colunas Location do tipo geography.
SELECT table_name, column_name, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Hosts', 'Programmings')
  AND column_name = 'Location';

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('IX_Hosts_Location', 'IX_Programmings_Location');
