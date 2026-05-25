namespace Api.DTOs.Reports;

public class TopArticleResponse
{
    public int ArticleId { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string CategoryName { get; set; } = null!;
    public int UsageCount { get; set; }
    public decimal TotalQuantity { get; set; }
    public string UMName { get; set; } = null!;
}
