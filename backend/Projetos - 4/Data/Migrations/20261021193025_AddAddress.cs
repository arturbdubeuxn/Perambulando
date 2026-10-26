using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Projetos___4._4Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Confira os dados antes de criar os vínculos ou remover as colunas antigas.
            migrationBuilder.Sql(@"
DO $migration$
DECLARE
    invalid_address RECORD;
BEGIN
    SELECT source.* INTO invalid_address
    FROM (
        SELECT 'Hosts' AS origin, ""Id"" AS id, ""Address"", ""AddressNumber"", ""AddressComplement"", ""Neighborhood"", ""CEP""
        FROM ""Hosts""
        UNION ALL
        SELECT 'Programmings', ""Id"", ""Address"", ""AddressNumber"", ""AddressComplement"", ""Neighborhood"", ""CEP""
        FROM ""Programmings""
    ) AS source
    WHERE length(COALESCE(source.""Address"", '')) > 300
       OR length(COALESCE(source.""AddressNumber"", '')) > 20
       OR length(COALESCE(source.""AddressComplement"", '')) > 200
       OR length(COALESCE(source.""Neighborhood"", '')) > 150
       OR length(replace(COALESCE(source.""CEP"", ''), '-', '')) > 8
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'O endereço de % (ID %) excede os limites de Addresses. Revise os dados antes de continuar; nenhum texto será truncado.',
            invalid_address.origin, invalid_address.id;
    END IF;
END;
$migration$;
");

            migrationBuilder.CreateTable(
                name: "Addresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Street = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Complement = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Neighborhood = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CEP = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Location = table.Column<Point>(type: "geography(Point,4326)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AddWho = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Addresses", x => x.Id);
                });

            migrationBuilder.AddColumn<int>(
                name: "AddressId",
                table: "Hosts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AddressId",
                table: "Programmings",
                type: "integer",
                nullable: true);

            // Cada registro mantém seu endereço e suas coordenadas, inclusive os inativos.
            migrationBuilder.Sql(@"
DO $migration$
DECLARE
    host_record RECORD;
    programming_record RECORD;
    new_address_id integer;
BEGIN
    FOR host_record IN SELECT * FROM ""Hosts"" ORDER BY ""Id""
    LOOP
        INSERT INTO ""Addresses"" (""Street"", ""Number"", ""Complement"", ""Neighborhood"", ""CEP"", ""Location"", ""CreatedAt"", ""AddWho"")
        VALUES (
            COALESCE(host_record.""Address"", ''),
            COALESCE(host_record.""AddressNumber"", ''),
            COALESCE(host_record.""AddressComplement"", ''),
            COALESCE(host_record.""Neighborhood"", ''),
            replace(COALESCE(host_record.""CEP"", ''), '-', ''),
            host_record.""Location"",
            host_record.""CreatedAt"",
            host_record.""UserId""
        )
        RETURNING ""Id"" INTO new_address_id;

        UPDATE ""Hosts"" SET ""AddressId"" = new_address_id WHERE ""Id"" = host_record.""Id"";
    END LOOP;

    FOR programming_record IN
        SELECT programming.*, host.""UserId"" AS ""AddressUserId""
        FROM ""Programmings"" AS programming
        INNER JOIN ""Hosts"" AS host ON host.""Id"" = programming.""HostId""
        ORDER BY programming.""Id""
    LOOP
        INSERT INTO ""Addresses"" (""Street"", ""Number"", ""Complement"", ""Neighborhood"", ""CEP"", ""Location"", ""CreatedAt"", ""AddWho"")
        VALUES (
            COALESCE(programming_record.""Address"", ''),
            COALESCE(programming_record.""AddressNumber"", ''),
            COALESCE(programming_record.""AddressComplement"", ''),
            COALESCE(programming_record.""Neighborhood"", ''),
            replace(COALESCE(programming_record.""CEP"", ''), '-', ''),
            programming_record.""Location"",
            programming_record.""CreatedDate"",
            programming_record.""AddressUserId""
        )
        RETURNING ""Id"" INTO new_address_id;

        UPDATE ""Programmings"" SET ""AddressId"" = new_address_id WHERE ""Id"" = programming_record.""Id"";
    END LOOP;

    IF EXISTS (SELECT 1 FROM ""Hosts"" WHERE ""AddressId"" IS NULL)
        OR EXISTS (SELECT 1 FROM ""Programmings"" WHERE ""AddressId"" IS NULL) THEN
        RAISE EXCEPTION 'Não foi possível vincular todos os endereços. Confira os hosts das programações antes de continuar.';
    END IF;
END;
$migration$;
");

            migrationBuilder.AlterColumn<int>(
                name: "AddressId",
                table: "Hosts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "AddressId",
                table: "Programmings",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Programmings_AddressId",
                table: "Programmings",
                column: "AddressId");

            migrationBuilder.CreateIndex(
                name: "IX_Hosts_AddressId",
                table: "Hosts",
                column: "AddressId");

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_Location",
                table: "Addresses",
                column: "Location")
                .Annotation("Npgsql:IndexMethod", "gist");

            migrationBuilder.AddForeignKey(
                name: "FK_Hosts_Addresses_AddressId",
                table: "Hosts",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Programmings_Addresses_AddressId",
                table: "Programmings",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
            // Os campos antigos só são removidos depois da cópia e da validação das FKs.
            migrationBuilder.DropIndex(
                name: "IX_Programmings_Location",
                table: "Programmings");

            migrationBuilder.DropIndex(
                name: "IX_Hosts_Location",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "AddressComplement",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "AddressNumber",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "CEP",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "Neighborhood",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "AddressComplement",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "AddressNumber",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "CEP",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "Neighborhood",
                table: "Hosts");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1 FROM ""Addresses"" AS address
        WHERE NOT EXISTS (SELECT 1 FROM ""Hosts"" WHERE ""AddressId"" = address.""Id"")
          AND NOT EXISTS (SELECT 1 FROM ""Programmings"" WHERE ""AddressId"" = address.""Id"")
    ) THEN
        RAISE EXCEPTION 'A reversão removeria endereços sem vínculo. Faça backup desses registros e revise a reversão antes de continuar.';
    END IF;
END;
$migration$;
");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Programmings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressComplement",
                table: "Programmings",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressNumber",
                table: "Programmings",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CEP",
                table: "Programmings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Point>(
                name: "Location",
                table: "Programmings",
                type: "geography(Point,4326)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Neighborhood",
                table: "Programmings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Hosts",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressComplement",
                table: "Hosts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressNumber",
                table: "Hosts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CEP",
                table: "Hosts",
                type: "character varying(9)",
                maxLength: 9,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Point>(
                name: "Location",
                table: "Hosts",
                type: "geography(Point,4326)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Neighborhood",
                table: "Hosts",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            // Restaure os endereços antes de remover os vínculos e a tabela compartilhada.
            migrationBuilder.Sql(@"
UPDATE ""Hosts"" AS host
SET ""Address"" = address.""Street"",
    ""AddressNumber"" = address.""Number"",
    ""AddressComplement"" = address.""Complement"",
    ""Neighborhood"" = address.""Neighborhood"",
    ""CEP"" = address.""CEP"",
    ""Location"" = address.""Location""
FROM ""Addresses"" AS address
WHERE host.""AddressId"" = address.""Id"";

UPDATE ""Programmings"" AS programming
SET ""Address"" = address.""Street"",
    ""AddressNumber"" = address.""Number"",
    ""AddressComplement"" = address.""Complement"",
    ""Neighborhood"" = address.""Neighborhood"",
    ""CEP"" = address.""CEP"",
    ""Location"" = address.""Location""
FROM ""Addresses"" AS address
WHERE programming.""AddressId"" = address.""Id"";
");

            migrationBuilder.DropForeignKey(
                name: "FK_Hosts_Addresses_AddressId",
                table: "Hosts");

            migrationBuilder.DropForeignKey(
                name: "FK_Programmings_Addresses_AddressId",
                table: "Programmings");

            migrationBuilder.DropTable(
                name: "Addresses");

            migrationBuilder.DropIndex(
                name: "IX_Programmings_AddressId",
                table: "Programmings");

            migrationBuilder.DropIndex(
                name: "IX_Hosts_AddressId",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "AddressId",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "AddressId",
                table: "Hosts");

            migrationBuilder.CreateIndex(
                name: "IX_Programmings_Location",
                table: "Programmings",
                column: "Location")
                .Annotation("Npgsql:IndexMethod", "gist");

            migrationBuilder.CreateIndex(
                name: "IX_Hosts_Location",
                table: "Hosts",
                column: "Location")
                .Annotation("Npgsql:IndexMethod", "gist");
        }
    }
}
