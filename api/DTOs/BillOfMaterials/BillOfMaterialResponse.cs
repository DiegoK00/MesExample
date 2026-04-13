namespace Api.DTOs.BillOfMaterials;

public class BillOfMaterialResponse
{
    public int ParentArticleId { get; set; }
    public string ParentArticleCode { get; set; } = null!;
    public string ParentArticleName { get; set; } = null!;

    public int ComponentArticleId { get; set; }
    public string ComponentArticleCode { get; set; } = null!;
    public string ComponentArticleName { get; set; } = null!;

    public decimal Quantity { get; set; }
    public string QuantityType { get; set; } = null!; // 'PHYSICAL' o 'PERCENTAGE'
    public int UmId { get; set; }
    public string UmName { get; set; } = null!;

    public decimal ScrapPercentage { get; set; }
    public decimal ScrapFactor { get; set; }
    public decimal FixedScrap { get; set; }
}
