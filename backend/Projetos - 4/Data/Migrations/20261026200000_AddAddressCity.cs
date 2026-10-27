using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Projetos___4.Data.Context;

#nullable disable

namespace Projetos___4._4Data.Migrations;


[Migration("20261026200000_AddAddressCity")]
public partial class AddAddressCity : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "City",
            table: "Addresses",
            type: "character varying(150)",
            maxLength: 150,
            nullable: false,
            defaultValue: "");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "City", table: "Addresses");
    }
}