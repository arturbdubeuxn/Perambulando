START TRANSACTION;
ALTER TABLE "Programmings" ADD "AddressComplement" character varying(200) NOT NULL DEFAULT '';

ALTER TABLE "Programmings" ADD "AddressNumber" character varying(20) NOT NULL DEFAULT '';

ALTER TABLE "Hosts" ADD "AddressComplement" character varying(200) NOT NULL DEFAULT '';

ALTER TABLE "Hosts" ADD "AddressNumber" character varying(20) NOT NULL DEFAULT '';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261019182924_AddAddressNumberAndComplement', '10.0.11');

COMMIT;

