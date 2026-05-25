namespace Api.DTOs.Reports;

public class ProductionKpiResponse
{
    public int TotalArticlesActive { get; set; }
    public int TotalArticlesInactive { get; set; }
    public int TotalBomParents { get; set; }
    public int TotalBomComponents { get; set; }
    public double AvgComponentsPerBom { get; set; }
    public int ArticlesCreatedLast30Days { get; set; }
    public decimal TotalScrapPercentageAvg { get; set; }
    public List<CategoryKpiItem> ArticlesByCategory { get; set; } = [];
    public List<CreationTrendItem> CreationTrend { get; set; } = [];
}

public class CategoryKpiItem
{
    public string CategoryName { get; set; } = null!;
    public int ArticleCount { get; set; }
    public int BomCount { get; set; }
}

public class CreationTrendItem
{
    public string Month { get; set; } = null!;
    public int Count { get; set; }
}
