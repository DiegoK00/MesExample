namespace Api.DTOs.Articles;

public class ArticleResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public decimal Price { get; set; }
    public int UMId { get; set; }
    public string UMName { get; set; } = null!;
    public int? UM2Id { get; set; }
    public string? UM2Name { get; set; }
    public string? Measures { get; set; }
    public string? Composition { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByUsername { get; set; } = null!;
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByUsername { get; set; }
}
