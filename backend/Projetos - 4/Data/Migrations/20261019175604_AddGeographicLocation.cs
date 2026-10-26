using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Projetos___4._4Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGeographicLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.AddColumn<Point>(
                name: "Location",
                table: "Programmings",
                type: "geography(Point,4326)",
                nullable: true);

            migrationBuilder.AddColumn<Point>(
                name: "Location",
                table: "Hosts",
                type: "geography(Point,4326)",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Programmings_Location",
                table: "Programmings");

            migrationBuilder.DropIndex(
                name: "IX_Hosts_Location",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Hosts");

            // Preserva o PostGIS: outras tabelas podem estar utilizando a extensão.
        }
    }
}
