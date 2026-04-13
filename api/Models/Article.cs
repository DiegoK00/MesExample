namespace Api.Models;

public class Article
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public decimal Price { get; set; }
    public int UMId { get; set; }
    public int? UM2Id { get; set; }
    public string? Measures { get; set; }
    public string? Composition { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public int CreatedFrom { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int? DeletedFrom { get; set; }

    public Category Category { get; set; } = null!;
    public MeasureUnit UM { get; set; } = null!;
    public MeasureUnit? UM2 { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public User? DeletedByUser { get; set; }

    // BillOfMaterials (articoli che usano questo come padre o componente)
    public ICollection<BillOfMaterial> AsParentArticle { get; set; } = [];
    public ICollection<BillOfMaterial> AsComponentArticle { get; set; } = [];
}
