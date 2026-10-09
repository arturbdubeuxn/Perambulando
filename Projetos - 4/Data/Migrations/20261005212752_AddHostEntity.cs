using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Projetos___4._4Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHostEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "users");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "Typeofuser",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "isPro",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "Typeofuser",
                table: "users");

            migrationBuilder.DropColumn(
                name: "isPro",
                table: "users");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
