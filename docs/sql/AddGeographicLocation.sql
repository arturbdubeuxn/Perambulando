START TRANSACTION;
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "Programmings" ADD "Location" geography(Point,4326);

ALTER TABLE "Hosts" ADD "Location" geography(Point,4326);

CREATE INDEX "IX_Programmings_Location" ON "Programmings" USING gist ("Location");

CREATE INDEX "IX_Hosts_Location" ON "Hosts" USING gist ("Location");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261019175604_AddGeographicLocation', '10.0.11');

COMMIT;

