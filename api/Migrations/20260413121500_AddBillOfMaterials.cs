using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBillOfMaterials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BillOfMaterials",
                columns: table => new
                {
                    ParentArticleId = table.Column<int>(type: "int", nullable: false),
                    ComponentArticleId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    QuantityType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    UmId = table.Column<int>(type: "int", nullable: false),
                    ScrapPercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false, defaultValue: 0m),
                    ScrapFactor = table.Column<decimal>(type: "decimal(5,4)", nullable: false, defaultValue: 0m),
                    FixedScrap = table.Column<decimal>(type: "decimal(18,4)", nullable: false, defaultValue: 0m)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillOfMaterials", x => new { x.ParentArticleId, x.ComponentArticleId });
                    table.CheckConstraint("CHK_QuantityType", "QuantityType IN ('PHYSICAL', 'PERCENTAGE')");
                    table.ForeignKey(
                        name: "FK_BillOfMaterials_Articles_ComponentArticleId",
                        column: x => x.ComponentArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BillOfMaterials_Articles_ParentArticleId",
                        column: x => x.ParentArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BillOfMaterials_MeasureUnits_UmId",
                        column: x => x.UmId,
                        principalTable: "MeasureUnits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillOfMaterials_ComponentArticleId",
                table: "BillOfMaterials",
                column: "ComponentArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_BillOfMaterials_UmId",
                table: "BillOfMaterials",
                column: "UmId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillOfMaterials");
        }
    }
}
