using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Projetos___4.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueHostCnpj : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                LOCK TABLE "Hosts" IN SHARE ROW EXCLUSIVE MODE;

                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM "Hosts"
                        WHERE upper(replace(replace(replace(btrim("CNPJ"), '.', ''), '/', ''), '-', ''))
                            !~ '^[A-Z0-9]{12}[0-9]{2}$'
                    ) THEN
                        RAISE EXCEPTION 'Existem hosts com CNPJ em formato inválido. Corrija os registros antes de aplicar a migration.';
                    END IF;

                    IF EXISTS (
                        SELECT 1 FROM "Hosts"
                        GROUP BY upper(replace(replace(replace(btrim("CNPJ"), '.', ''), '/', ''), '-', ''))
                        HAVING count(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'Existem hosts com CNPJ repetido. Audite os registros antes de aplicar a migration.';
                    END IF;
                END $$;

                UPDATE "Hosts"
                SET "CNPJ" = upper(replace(replace(replace(btrim("CNPJ"), '.', ''), '/', ''), '-', ''))
                WHERE "CNPJ" <> upper(replace(replace(replace(btrim("CNPJ"), '.', ''), '/', ''), '-', ''));
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Hosts_CNPJ",
                table: "Hosts",
                column: "CNPJ",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Hosts_CNPJ_Normalized",
                table: "Hosts",
                sql: "\"CNPJ\" ~ '^[A-Z0-9]{12}[0-9]{2}$'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Hosts_CNPJ",
                table: "Hosts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Hosts_CNPJ_Normalized",
                table: "Hosts");
        }
    }
}
