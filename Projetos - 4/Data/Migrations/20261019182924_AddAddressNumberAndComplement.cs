using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Projetos___4._4Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAddressNumberAndComplement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressComplement",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "AddressNumber",
                table: "Programmings");

            migrationBuilder.DropColumn(
                name: "AddressComplement",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "AddressNumber",
                table: "Hosts");
        }
    }
}
