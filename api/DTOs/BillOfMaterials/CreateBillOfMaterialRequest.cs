namespace Api.DTOs.BillOfMaterials;

public class CreateBillOfMaterialRequest
{
    public int ParentArticleId { get; set; }
    public int ComponentArticleId { get; set; }
    public decimal Quantity { get; set; }
    public string QuantityType { get; set; } = "PHYSICAL"; // 'PHYSICAL' o 'PERCENTAGE'
    public int UmId { get; set; }

    public decimal ScrapPercentage { get; set; } = 0;
    public decimal ScrapFactor { get; set; } = 0;
    public decimal FixedScrap { get; set; } = 0;
}
