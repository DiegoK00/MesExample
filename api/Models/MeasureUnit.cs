namespace Api.Models;

public class MeasureUnit
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }

    public ICollection<Article> ArticlesUM { get; set; } = [];
    public ICollection<Article> ArticlesUM2 { get; set; } = [];
    public ICollection<BillOfMaterial> BillOfMaterials { get; set; } = [];
}
