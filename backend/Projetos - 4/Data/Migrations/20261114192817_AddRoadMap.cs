using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Projetos___4._4Data.Migrations
{
    public partial class AddRoadMap : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Roadmaps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roadmaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Roadmaps_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RoadmapProgrammings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoadmapId = table.Column<int>(type: "integer", nullable: false),
                    ProgrammingId = table.Column<int>(type: "integer", nullable: true),
                    HostId = table.Column<int>(type: "integer", nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoadmapProgrammings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoadmapProgrammings_Hosts_HostId",
                        column: x => x.HostId,
                        principalTable: "Hosts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RoadmapProgrammings_Programmings_ProgrammingId",
                        column: x => x.ProgrammingId,
                        principalTable: "Programmings",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RoadmapProgrammings_Roadmaps_RoadmapId",
                        column: x => x.RoadmapId,
                        principalTable: "Roadmaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Roadmaps_UserId",
                table: "Roadmaps",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapProgrammings_HostId",
                table: "RoadmapProgrammings",
                column: "HostId");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapProgrammings_ProgrammingId",
                table: "RoadmapProgrammings",
                column: "ProgrammingId");

            migrationBuilder.CreateIndex(
                name: "IX_RoadmapProgrammings_RoadmapId",
                table: "RoadmapProgrammings",
                column: "RoadmapId");

        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RoadmapProgrammings");
            migrationBuilder.DropTable(name: "Roadmaps");
        }
    }
}
