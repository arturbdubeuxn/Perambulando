using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Projetos___4._4Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProgrammingXCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProgrammingXCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProgrammingId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgrammingXCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgrammingXCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProgrammingXCategories_Programmings_ProgrammingId",
                        column: x => x.ProgrammingId,
                        principalTable: "Programmings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProgrammingXCategories_CategoryId",
                table: "ProgrammingXCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgrammingXCategories_ProgrammingId",
                table: "ProgrammingXCategories",
                column: "ProgrammingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProgrammingXCategories");
        }
    }
}
