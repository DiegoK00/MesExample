namespace Api.Models;

public class BillOfMaterial
{
    public int ParentArticleId { get; set; }
    public int ComponentArticleId { get; set; }
    public decimal Quantity { get; set; }
    public string QuantityType { get; set; } = "PHYSICAL"; // 'PHYSICAL' o 'PERCENTAGE'
    public int UmId { get; set; }

    // Gestione scarto
    public decimal ScrapPercentage { get; set; } = 0; // Es: 5.00 per il 5%
    public decimal ScrapFactor { get; set; } = 0; // Es: 0.05 per il 5%
    public decimal FixedScrap { get; set; } = 0; // Quantità fissa scartata (es: 0.5 kg)

    // Navigation properties
    public Article ParentArticle { get; set; } = null!;
    public Article ComponentArticle { get; set; } = null!;
    public MeasureUnit UM { get; set; } = null!;
}
