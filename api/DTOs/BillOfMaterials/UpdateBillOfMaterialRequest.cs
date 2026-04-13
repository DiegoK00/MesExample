namespace Api.DTOs.BillOfMaterials;

public class UpdateBillOfMaterialRequest
{
    public decimal Quantity { get; set; }
    public string QuantityType { get; set; } = "PHYSICAL"; // 'PHYSICAL' o 'PERCENTAGE'
    public int UmId { get; set; }

    public decimal ScrapPercentage { get; set; } = 0;
    public decimal ScrapFactor { get; set; } = 0;
    public decimal FixedScrap { get; set; } = 0;
}
