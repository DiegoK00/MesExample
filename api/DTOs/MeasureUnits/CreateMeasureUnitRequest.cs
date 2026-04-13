namespace Api.DTOs.MeasureUnits;

public class CreateMeasureUnitRequest
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}
