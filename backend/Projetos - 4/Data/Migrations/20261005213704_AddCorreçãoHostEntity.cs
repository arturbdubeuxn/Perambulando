using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Projetos___4._4Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCorreçãoHostEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Hosts_users_UserId1",
                table: "Hosts");

            migrationBuilder.DropIndex(
                name: "IX_Hosts_UserId1",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "Hosts");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Hosts",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateIndex(
                name: "IX_Hosts_UserId",
                table: "Hosts",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Hosts_users_UserId",
                table: "Hosts",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Hosts_users_UserId",
                table: "Hosts");

            migrationBuilder.DropIndex(
                name: "IX_Hosts_UserId",
                table: "Hosts");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Hosts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "UserId1",
                table: "Hosts",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Hosts_UserId1",
                table: "Hosts",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Hosts_users_UserId1",
                table: "Hosts",
                column: "UserId1",
                principalTable: "users",
                principalColumn: "Id");
        }
    }
}
