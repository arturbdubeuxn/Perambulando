using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Projetos___4.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProgrammingInteractions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProgrammingInteractions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProgrammingId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgrammingInteractions", x => x.Id);
                    table.CheckConstraint("CK_ProgrammingInteractions_Type", "\"Type\" BETWEEN 0 AND 3");
                    table.ForeignKey(
                        name: "FK_ProgrammingInteractions_Programmings_ProgrammingId",
                        column: x => x.ProgrammingId,
                        principalTable: "Programmings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProgrammingInteractions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProgrammingInteractions_EventId",
                table: "ProgrammingInteractions",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProgrammingInteractions_ProgrammingId_CreatedAt",
                table: "ProgrammingInteractions",
                columns: new[] { "ProgrammingId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ProgrammingInteractions_UserId",
                table: "ProgrammingInteractions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProgrammingInteractions");
        }
    }
}
