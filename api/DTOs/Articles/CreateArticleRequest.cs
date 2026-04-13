namespace Api.DTOs.Articles;

public class CreateArticleRequest
{
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public decimal Price { get; set; }
    public int UMId { get; set; }
    public int? UM2Id { get; set; }
    public string? Measures { get; set; }
    public string? Composition { get; set; }
}
