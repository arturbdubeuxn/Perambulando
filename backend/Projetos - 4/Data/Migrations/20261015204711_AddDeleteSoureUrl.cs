using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Projetos___4._4Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDeleteSoureUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SourceUrl",
                table: "Programmings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SourceUrl",
                table: "Programmings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
